import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Package, 
  ArrowRightLeft, 
  CalendarDays, 
  Wrench, 
  AlertTriangle,
  ArrowUpRight,
  Play,
  Pause,
  Square,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { 
  useDashboardKPIs, 
  useDashboardOverdue, 
  useDashboardRecentActivity 
} from '../../hooks/useDashboard';
import { cn } from '../../lib/utils';

export const Dashboard: React.FC = () => {
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: overdue, isLoading: overdueLoading } = useDashboardOverdue();
  const { data: recentActivity, isLoading: activityLoading } = useDashboardRecentActivity();

  // Time tracker state for Donezo stopwatch widget
  const [time, setTime] = useState(5048); // Start at 01:24:08 (in seconds)
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const overviewKPIs = [
    { title: 'Available', value: kpis?.assetsAvailable ?? 0, type: 'primary', description: 'Ready for allocation' },
    { title: 'Allocated', value: kpis?.assetsAllocated ?? 0, type: 'surface', description: 'Assigned to employees/depts' },
    { title: 'Under Maintenance', value: kpis?.maintenanceToday ?? 0, type: 'surface', description: 'Currently in repair queue' },
    { title: 'Active Bookings', value: kpis?.activeBookings ?? 0, type: 'surface', description: 'Reservations scheduled today' },
    { title: 'Pending Transfers', value: kpis?.pendingTransfers ?? 0, type: 'surface', description: 'Awaiting manager approval' },
    { title: 'Upcoming Returns', value: kpis?.upcomingReturns ?? 0, type: 'surface', description: 'Expected within 48 hours' },
  ];

  const overdueCount = (overdue?.allocations?.length || 0) + (overdue?.bookings?.length || 0);

  const getActivityIcon = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('asset') || lower.includes('create')) {
      return {
        icon: <Package className="w-4 h-4" />,
        bg: 'bg-primary/10 text-primary'
      };
    }
    if (lower.includes('allocate') || lower.includes('return')) {
      return {
        icon: <CheckCircle2 className="w-4 h-4" />,
        bg: 'bg-success/10 text-success'
      };
    }
    if (lower.includes('book')) {
      return {
        icon: <CalendarDays className="w-4 h-4" />,
        bg: 'bg-info/10 text-info'
      };
    }
    if (lower.includes('maintenance')) {
      return {
        icon: <Wrench className="w-4 h-4" />,
        bg: 'bg-warning/10 text-warning'
      };
    }
    return {
      icon: <AlertCircle className="w-4 h-4" />,
      bg: 'bg-surface-raised text-muted-foreground'
    };
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      {/* Header Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Today's Overview</h1>
        <p className="text-xs text-muted-foreground mt-1">Real-time resource logs and operational directory metrics.</p>
      </div>

      {/* 6 Grid Cards (Today's Overview) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {kpisLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="bg-surface border-border p-6 h-[140px] animate-pulse" />
          ))
        ) : (
          overviewKPIs.map((kpi, idx) => {
            const isPrimary = kpi.type === 'primary';
            return (
              <Card 
                key={idx} 
                className={cn(
                  "rounded-2xl p-6 transition-all duration-200 border shadow-sm relative overflow-hidden",
                  isPrimary 
                    ? "bg-primary text-primary-foreground border-transparent shadow-lg shadow-primary/10" 
                    : "bg-surface border-border text-foreground hover:border-border/80"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider",
                      isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {kpi.title}
                    </span>
                    <h3 className="text-3xl font-bold mt-2 tracking-tight">{kpi.value}</h3>
                  </div>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs",
                    isPrimary ? "bg-white/10 text-primary-foreground" : "bg-surface-raised text-muted-foreground"
                  )}>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <p className={cn(
                  "text-[10px] mt-4 font-medium",
                  isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {kpi.description}
                </p>
              </Card>
            );
          })
        )}
      </div>

      {/* Red Alert Banner: assets overdue for return */}
      {!overdueLoading && overdueCount > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground px-5 py-3.5 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
          <span className="text-xs font-semibold tracking-wide">
            {overdueCount} assets overdue for return - flagged for follow-up
          </span>
        </div>
      )}

      {/* Donezo Style 3 Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button className="bg-primary hover:bg-primary/95 text-primary-foreground rounded-full py-5 text-xs font-semibold shadow-md shadow-primary/10 transition-all duration-200">
          <Plus className="w-4.5 h-4.5 mr-1.5" /> + register asset
        </Button>
        <Button variant="outline" className="border-border text-foreground hover:bg-surface-raised rounded-full py-5 text-xs font-semibold transition-all duration-200">
          <CalendarDays className="w-4.5 h-4.5 mr-1.5 text-primary" /> Book resource
        </Button>
        <Button variant="outline" className="border-border text-foreground hover:bg-surface-raised rounded-full py-5 text-xs font-semibold transition-all duration-200">
          <Wrench className="w-4.5 h-4.5 mr-1.5 text-primary" /> Raise requests
        </Button>
      </div>

      {/* Bottom Row: Recent Activity & Time Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left Column: Recent Activity list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Recent Activity</h2>
          <Card className="bg-surface border-border rounded-2xl p-6 shadow-sm divide-y divide-border/60">
            {activityLoading ? (
              <div className="text-xs text-muted-foreground py-4 text-center">Loading activity feed...</div>
            ) : recentActivity && recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((log: any) => {
                const badge = getActivityIcon(log.action);
                return (
                  <div key={log.id} className="py-4.5 first:pt-0 last:pb-0 flex items-start gap-3.5">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mt-0.5", badge.bg)}>
                      {badge.icon}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-foreground leading-normal">
                        {log.details}
                      </p>
                      <span className="text-[10px] text-muted-foreground block">
                        {timeAgo(log.createdAt)} • by {log.user?.name || 'System'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground py-6 text-center">No recent activities logged.</div>
            )}
          </Card>
        </div>

        {/* Right Column: Time Tracker (Stopwatch) */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Time Tracker</h2>
          <Card className="bg-[#0b1712] border border-primary/20 rounded-2xl p-6 shadow-sm text-white flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-primary-foreground/80 tracking-wide uppercase">Active Task Timer</span>
              <Clock className="w-4 h-4 text-primary" />
            </div>
            
            <div className="text-center my-4">
              <span className="text-4xl font-mono font-bold tracking-wider text-primary-foreground">
                {formatTime(time)}
              </span>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button 
                size="icon" 
                onClick={() => setIsRunning(!isRunning)}
                className="w-10 h-10 rounded-full bg-white text-black hover:bg-white/90 flex items-center justify-center shadow-lg"
              >
                {isRunning ? <Pause className="w-4.5 h-4.5" /> : <Play className="w-4.5 h-4.5 ml-0.5" />}
              </Button>
              <Button 
                size="icon" 
                onClick={() => { setIsRunning(false); setTime(0); }}
                className="w-10 h-10 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center shadow-lg"
              >
                <Square className="w-4.5 h-4.5" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
