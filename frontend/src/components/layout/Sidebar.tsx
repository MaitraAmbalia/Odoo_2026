import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  Package, 
  ArrowRightLeft, 
  CalendarDays, 
  Wrench, 
  ClipboardCheck, 
  BarChart3, 
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { RoleGate } from './RoleGate';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../hooks/useTheme';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/org-setup', label: 'Organization Setup', icon: Settings, roles: ['ADMIN'] },
  { path: '/assets', label: 'Assets', icon: Package },
  { path: '/allocations', label: 'Allocation & Transfer', icon: ArrowRightLeft },
  { path: '/bookings', label: 'Resource Booking', icon: CalendarDays },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench },
  { path: '/audits', label: 'Audit', icon: ClipboardCheck, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'] },
  { path: '/notifications', label: 'Notifications', icon: Bell },
];

export const Sidebar: React.FC = () => {
  const role = useAuthStore(state => state.role);
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-surface border-r border-border flex flex-col z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
          AF
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">AssetFlow</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          if (item.roles && role && !item.roles.includes(role)) {
            return null;
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-raised border border-transparent"
                )
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
              {item.path === '/notifications' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-primary"></span>
              )}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-raised rounded-md transition-colors"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 text-primary" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
        <button 
          onClick={() => useAuthStore.getState().logout()}
          className="w-full text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-raised rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};
