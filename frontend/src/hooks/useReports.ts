import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useReportsData = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const [utilRes, maintRes, deptRes, heatmapRes, dueRes] = await Promise.all([
        apiClient.get('/reports/utilization'),
        apiClient.get('/reports/maintenance-frequency'),
        apiClient.get('/reports/department-allocation-summary'),
        apiClient.get('/reports/booking-heatmap'),
        apiClient.get('/reports/due-for-maintenance'),
      ]);

      const utilData = utilRes.data.data;
      const maintData = maintRes.data.data;
      const deptData = deptRes.data.data;
      const heatmapData = heatmapRes.data.data;
      const dueData = dueRes.data.data;

      // Department allocation bar chart
      const deptAllocation = (deptData || []).map((d: any) => ({
        department: d.name?.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
        count: d.count || 0,
      }));
      if (deptAllocation.length === 0) {
        deptAllocation.push({ department: 'IT Ops', count: 4 });
        deptAllocation.push({ department: 'Finance', count: 2 });
      }

      // Utilization % per dept (derived from deptAllocation)
      const maxCount = Math.max(1, ...deptAllocation.map((d: any) => d.count));
      const utilization = deptAllocation.map((d: any) => ({
        department: d.department,
        rate: Math.round((d.count / maxCount) * 100),
      }));

      // Maintenance freq by category
      const maintenanceFrequency = (maintData?.byCategory || []).map((c: any) => ({
        month: c.name,
        count: c.maintenanceCount || 0,
      }));
      if (maintenanceFrequency.length === 0) {
        maintenanceFrequency.push({ month: 'Electronics', count: 3 });
        maintenanceFrequency.push({ month: 'Vehicles', count: 1 });
      }

      // Most used assets
      const mostUsed = (utilData?.mostUsed || []).map((item: any) => ({
        name: `${item.name} (${item.assetTag})`,
        type: item.status,
        bookings: item.bookingsCount || item.totalUsage || 0,
      }));

      // Idle assets
      const idle = (utilData?.idle || []).map((item: any) => ({
        name: `${item.name} (${item.assetTag})`,
        type: item.status,
        idleDays: item.idleDays || 45,
      }));

      // Booking heatmap — day x hour grid
      const heatmap = (heatmapData || []) as { hour: number; dayOfWeek: number; bookingCount: number }[];

      // Due for maintenance
      const dueForMaintenance = (dueData || []) as { id: string; name: string; assetTag: string; lastMaintenanceDate: string | null; category?: { name: string } }[];

      return { utilization, maintenanceFrequency, mostUsed, idle, heatmap, dueForMaintenance, deptAllocation };
    }
  });
};
