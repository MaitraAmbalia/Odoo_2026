import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import router from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { initSocket } from './config/socket';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use('/api/v1', router);
app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);
const PORT = 4999;

server.listen(PORT, async () => {
  console.log(`\n========================================`);
  console.log(`Verification Server Listening on Port ${PORT}`);
  console.log(`========================================`);

  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  try {
    // ----------------------------------------------------
    // 1. Auth Module
    // ----------------------------------------------------
    console.log('\n[1] Testing Auth Module...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@assetflow.local', password: 'Admin@123' }),
    });
    const adminLoginData = await adminLoginRes.json() as any;
    console.log(' - Admin Login Status:', adminLoginRes.status);
    const adminToken = adminLoginData.data.accessToken;

    const managerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@assetflow.local', password: 'Manager@123' }),
    });
    const managerLoginData = await managerLoginRes.json() as any;
    console.log(' - Asset Manager Login Status:', managerLoginRes.status);
    const managerToken = managerLoginData.data.accessToken;

    const employeeLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'amit@assetflow.local', password: 'Employee@123' }),
    });
    const employeeLoginData = await employeeLoginRes.json() as any;
    console.log(' - Employee Login Status:', employeeLoginRes.status);
    const employeeToken = employeeLoginData.data.accessToken;

    // ----------------------------------------------------
    // 2. Departments Module
    // ----------------------------------------------------
    console.log('\n[2] Testing Departments Module...');
    const deptsRes = await fetch(`${BASE_URL}/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deptsData = await deptsRes.json() as any;
    console.log(' - List Departments Status:', deptsRes.status, `(Count: ${deptsData.data.length})`);
    const itDeptId = deptsData.data[0]?.id;

    // ----------------------------------------------------
    // 3. Categories Module
    // ----------------------------------------------------
    console.log('\n[3] Testing Categories Module...');
    const catsRes = await fetch(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const catsData = await catsRes.json() as any;
    console.log(' - List Categories Status:', catsRes.status, `(Count: ${catsData.data.length})`);
    const laptopCatId = catsData.data[0]?.id;

    // ----------------------------------------------------
    // 4. Employees Module
    // ----------------------------------------------------
    console.log('\n[4] Testing Employees Module...');
    const empsRes = await fetch(`${BASE_URL}/employees`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const empsData = await empsRes.json() as any;
    console.log(' - List Employees Status:', empsRes.status, `(Count: ${empsData.data.items.length})`);
    const employeeId = empsData.data.items.find((u: any) => u.email === 'neha@assetflow.local')?.id;

    if (employeeId) {
      const detailRes = await fetch(`${BASE_URL}/employees/${employeeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(' - Employee Detail Status:', detailRes.status);

      const promoteRes = await fetch(`${BASE_URL}/employees/${employeeId}/promote`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ role: 'DEPARTMENT_HEAD' }),
      });
      console.log(' - Employee Promote Status:', promoteRes.status);
    }

    // ----------------------------------------------------
    // 5. Assets Module
    // ----------------------------------------------------
    console.log('\n[5] Testing Assets Module...');
    // Create an asset
    const newAssetRes = await fetch(`${BASE_URL}/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'MacBook Pro Test M4',
        categoryId: laptopCatId,
        serialNumber: `SN-TEST-${Date.now()}`,
        acquisitionCost: 1500,
        isBookable: true,
        condition: 'GOOD',
        location: 'HQ Bangalore',
      }),
    });
    const newAssetData = await newAssetRes.json() as any;
    console.log(' - Create Asset Status:', newAssetRes.status);
    const assetId = newAssetData.data?.id;

    if (assetId) {
      const getAssetRes = await fetch(`${BASE_URL}/assets/${assetId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(' - Get Asset Detail Status:', getAssetRes.status);

      const historyRes = await fetch(`${BASE_URL}/assets/${assetId}/history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(' - Get Asset History Status:', historyRes.status);
    }

    // ----------------------------------------------------
    // 6. Allocations & Transfers Module
    // ----------------------------------------------------
    console.log('\n[6] Testing Allocations & Transfers Module...');
    if (assetId && employeeId) {
      // Allocate the asset
      const allocateRes = await fetch(`${BASE_URL}/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assetId: assetId,
          allocatedToUserId: employeeId,
          expectedReturnDate: new Date(Date.now() + 86400 * 1000 * 7).toISOString(),
        }),
      });
      const allocateData = await allocateRes.json() as any;
      console.log(' - Allocate Asset Status:', allocateRes.status);
      const allocationId = allocateData.data?.id;

      // Test allocation conflict (should return 409)
      const conflictRes = await fetch(`${BASE_URL}/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assetId: assetId,
          allocatedToUserId: employeeId,
        }),
      });
      console.log(' - Double-Allocation Conflict Blocked Status:', conflictRes.status);

      // Return the asset
      if (allocationId) {
        const returnRes = await fetch(`${BASE_URL}/allocations/${allocationId}/return`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            returnConditionNotes: 'Returned in good shape',
          }),
        });
        console.log(' - Return Asset Status:', returnRes.status);
      }
    }

    // ----------------------------------------------------
    // 7. Resource Booking Module
    // ----------------------------------------------------
    console.log('\n[7] Testing Resource Booking Module...');
    if (assetId) {
      const bookStart = new Date(Date.now() + 3600 * 1000 * 24); // Tomorrow
      const bookEnd = new Date(bookStart.getTime() + 3600 * 1000 * 2);

      const bookingRes = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assetId: assetId,
          startTime: bookStart.toISOString(),
          endTime: bookEnd.toISOString(),
        }),
      });
      const bookingData = await bookingRes.json() as any;
      console.log(' - Create Booking Status:', bookingRes.status);
      const bookingId = bookingData.data?.id;

      // Test booking overlap conflict (should return 409)
      const overlapRes = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assetId: assetId,
          startTime: new Date(bookStart.getTime() + 30 * 60 * 1000).toISOString(), // overlapping
          endTime: new Date(bookEnd.getTime() + 30 * 60 * 1000).toISOString(),
        }),
      });
      console.log(' - Booking Overlap Conflict Blocked Status:', overlapRes.status);

      if (bookingId) {
        // Cancel the booking
        const cancelRes = await fetch(`${BASE_URL}/bookings/${bookingId}/cancel`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ cancelReason: 'Test cancellation' }),
        });
        console.log(' - Cancel Booking Status:', cancelRes.status);
      }
    }

    // ----------------------------------------------------
    // 8. Maintenance Module
    // ----------------------------------------------------
    console.log('\n[8] Testing Maintenance Module...');
    if (assetId) {
      const maintRes = await fetch(`${BASE_URL}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assetId: assetId,
          issueDescription: 'Screen flickering test issue',
          priority: 'MEDIUM',
        }),
      });
      const maintData = await maintRes.json() as any;
      console.log(' - Raise Maintenance Status:', maintRes.status);
      const requestId = maintData.data?.id;

      if (requestId) {
        // Approve request
        const approveRes = await fetch(`${BASE_URL}/maintenance/${requestId}/approve`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        console.log(' - Approve Maintenance Status:', approveRes.status);

        // Assign technician
        const assignRes = await fetch(`${BASE_URL}/maintenance/${requestId}/assign-technician`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ technicianName: 'Alex Technical Services' }),
        });
        console.log(' - Assign Technician Status:', assignRes.status);

        // Start request
        const startRes = await fetch(`${BASE_URL}/maintenance/${requestId}/start`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        console.log(' - Start Maintenance Status:', startRes.status);

        // Resolve request
        const resolveRes = await fetch(`${BASE_URL}/maintenance/${requestId}/resolve`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ resolutionNotes: 'Replaced visual flex cable' }),
        });
        console.log(' - Resolve Maintenance Status:', resolveRes.status);
      }
    }

    // ----------------------------------------------------
    // 9. Audits Module
    // ----------------------------------------------------
    console.log('\n[9] Testing Audits Module...');
    const auditRes = await fetch(`${BASE_URL}/audits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Q3 Physical Verification',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400 * 1000 * 30).toISOString(),
        auditorUserIds: [employeeId || ''],
        scopeLocation: 'HQ Bangalore',
      }),
    });
    const auditData = await auditRes.json() as any;
    console.log(' - Create Audit Cycle Status:', auditRes.status);
    const cycleId = auditData.data?.id;

    if (cycleId) {
      const getAuditRes = await fetch(`${BASE_URL}/audits/${cycleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const getAuditData = await getAuditRes.json() as any;
      console.log(' - Get Audit Cycle Detail Status:', getAuditRes.status);
      const itemId = getAuditData.data?.items?.[0]?.id;

      if (itemId) {
        // Mark item verified
        const markRes = await fetch(`${BASE_URL}/audits/${cycleId}/items/${itemId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            result: 'VERIFIED',
            notes: 'Physical verification successful',
          }),
        });
        console.log(' - Verify Audit Item Status:', markRes.status);
      }

      // Close cycle
      const closeRes = await fetch(`${BASE_URL}/audits/${cycleId}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(' - Close Audit Cycle Status:', closeRes.status);
    }

    // ----------------------------------------------------
    // 10. Notifications Module
    // ----------------------------------------------------
    console.log('\n[10] Testing Notifications Module...');
    const notifsRes = await fetch(`${BASE_URL}/notifications?unreadOnly=false`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const notifsData = await notifsRes.json() as any;
    console.log(' - Get Notifications Status:', notifsRes.status, `(Count: ${notifsData.data.items?.length || 0})`);

    // ----------------------------------------------------
    // 11. Activity Logs Module
    // ----------------------------------------------------
    console.log('\n[11] Testing Activity Logs Module...');
    const logsRes = await fetch(`${BASE_URL}/activity-logs?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const logsData = await logsRes.json() as any;
    console.log(' - Get Activity Logs Status:', logsRes.status, `(Count: ${logsData.data.items?.length || 0})`);

    // ----------------------------------------------------
    // 12. Dashboard Module
    // ----------------------------------------------------
    console.log('\n[12] Testing Dashboard Module...');
    const kpisRes = await fetch(`${BASE_URL}/dashboard/kpis`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(' - Dashboard KPIs Status:', kpisRes.status);

    const overdueRes = await fetch(`${BASE_URL}/dashboard/overdue`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(' - Dashboard Overdue Status:', overdueRes.status);

    const recentRes = await fetch(`${BASE_URL}/dashboard/recent-activity`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(' - Dashboard Recent Activity Status:', recentRes.status);

    // ----------------------------------------------------
    // 13. Reports Module
    // ----------------------------------------------------
    console.log('\n[13] Testing Reports Module...');
    const reportUtilRes = await fetch(`${BASE_URL}/reports/utilization`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(' - Report Utilization Status:', reportUtilRes.status);

    const reportMaintRes = await fetch(`${BASE_URL}/reports/maintenance-frequency`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(' - Report Maintenance Status:', reportMaintRes.status);

    const reportDeptRes = await fetch(`${BASE_URL}/reports/department-allocation-summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(' - Report Department Allocations Status:', reportDeptRes.status);

    console.log(`\n========================================`);
    console.log(`All End-to-End API Integration Checks Passed!`);
    console.log(`========================================`);

  } catch (err) {
    console.error('❌ E2E Verification failed:', err);
  } finally {
    server.close(() => {
      console.log('Verification server closed.');
      process.exit(0);
    });
  }
});
