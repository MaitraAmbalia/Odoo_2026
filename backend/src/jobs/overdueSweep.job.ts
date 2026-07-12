import cron from 'node-cron';
import prisma from '../config/prisma';
import { notificationsService } from '../modules/notifications/notifications.service';

export function startOverdueSweepCron() {
  // Runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Running background overdue & bookings sweep...');
    try {
      const now = new Date();

      // 1. Overdue Allocations
      const overdueAllocations = await prisma.assetAllocation.findMany({
        where: {
          status: 'ACTIVE',
          expectedReturnDate: { lt: now },
        },
        include: {
          allocatedToDepartment: true,
          asset: true,
        },
      });

      for (const allocation of overdueAllocations) {
        // Update status to OVERDUE
        await prisma.assetAllocation.update({
          where: { id: allocation.id },
          data: { status: 'OVERDUE' },
        });

        // Notify holder
        const assetName = allocation.asset?.name || 'Asset';
        const assetTag = allocation.asset?.assetTag || '';
        const returnDateStr = allocation.expectedReturnDate
          ? new Date(allocation.expectedReturnDate).toLocaleString()
          : '';
        const msg = `Your allocation for Asset "${assetName}" (${assetTag}) is overdue since ${returnDateStr}.`;

        if (allocation.allocatedToUserId) {
          await notificationsService.createNotification({
            userId: allocation.allocatedToUserId,
            type: 'OVERDUE_RETURN',
            message: msg,
            relatedEntityType: 'AssetAllocation',
            relatedEntityId: allocation.id,
          });
        } else if (allocation.allocatedToDepartmentId && allocation.allocatedToDepartment?.headUserId) {
          await notificationsService.createNotification({
            userId: allocation.allocatedToDepartment.headUserId,
            type: 'OVERDUE_RETURN',
            message: `Department allocation for Asset "${assetName}" (${assetTag}) is overdue since ${returnDateStr}.`,
            relatedEntityType: 'AssetAllocation',
            relatedEntityId: allocation.id,
          });
        }

        // Notify Asset Managers
        try {
          const managers = await prisma.user.findMany({
            where: { role: 'ASSET_MANAGER', status: 'ACTIVE' },
          });
          for (const manager of managers) {
            await notificationsService.createNotification({
              userId: manager.id,
              type: 'OVERDUE_RETURN',
              message: `Allocation #${allocation.id} for Asset "${assetName}" is overdue.`,
              relatedEntityType: 'AssetAllocation',
              relatedEntityId: allocation.id,
            });
          }
        } catch (err) {
          console.error('Failed to notify managers of overdue allocation:', err);
        }
      }

      // 2. Booking Reminders (starting in the next 15 minutes)
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
      const upcomingBookings = await prisma.booking.findMany({
        where: {
          status: 'UPCOMING',
          startTime: {
            gte: now,
            lte: fifteenMinutesFromNow,
          },
        },
        include: {
          asset: true,
        },
      });

      for (const booking of upcomingBookings) {
        // Check if reminder was already sent
        const alreadySent = await prisma.notification.findFirst({
          where: {
            userId: booking.bookedById,
            type: 'BOOKING_REMINDER',
            relatedEntityType: 'Booking',
            relatedEntityId: booking.id,
          },
        });

        if (!alreadySent) {
          const assetName = booking.asset?.name || 'Asset';
          const startTimeStr = new Date(booking.startTime).toLocaleString();
          await notificationsService.createNotification({
            userId: booking.bookedById,
            type: 'BOOKING_REMINDER',
            message: `Reminder: Your booking for Asset "${assetName}" starts soon at ${startTimeStr}.`,
            relatedEntityType: 'Booking',
            relatedEntityId: booking.id,
          });
        }
      }

      // 3. Completed Bookings (endTime < now)
      const completedBookings = await prisma.booking.findMany({
        where: {
          status: { in: ['UPCOMING', 'ONGOING'] },
          endTime: { lt: now },
        },
      });

      for (const booking of completedBookings) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'COMPLETED' },
        });
      }
    } catch (error) {
      console.error('❌ Error during background cron sweep:', error);
    }
  });
}
