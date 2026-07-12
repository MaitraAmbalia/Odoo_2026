import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Login } from '../features/auth/Login';
import { Dashboard } from '../features/dashboard/Dashboard';
import { AssetTable } from '../features/assets/AssetTable';
import { OrgSetup } from '../features/org-setup/OrgSetup';
import { Allocations } from '../features/allocations/Allocations';
import { Bookings } from '../features/bookings/Bookings';
import { Maintenance } from '../features/maintenance/Maintenance';
import { Audits } from '../features/audits/Audits';
import { Reports } from '../features/reports/Reports';
import { Notifications } from '../features/notifications/Notifications';
import { useAuthStore } from '../store/useAuthStore';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <AppShell />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'org-setup',
        element: <OrgSetup />,
      },
      {
        path: 'assets',
        element: <AssetTable />,
      },
      {
        path: 'allocations',
        element: <Allocations />,
      },
      {
        path: 'bookings',
        element: <Bookings />,
      },
      {
        path: 'maintenance',
        element: <Maintenance />,
      },
      {
        path: 'audits',
        element: <Audits />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'notifications',
        element: <Notifications />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
]);
