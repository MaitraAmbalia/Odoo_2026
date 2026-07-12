import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
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
import { useTheme } from '../../components/shared/ThemeContext';
import { StatusBadge } from '../../components/shared/StatusBadge';

export const Dashboard: React.FC = () => {
  const { theme } = useTheme();

  // Mock data for dashboard cards matching Today's Overview
  const overviewKPIs = [
    { title: 'Available', value: 128, type: 'primary', description: 'Ready for allocation' },
    { title: 'Allocated', value: 76, type: 'surface', description: 'Assigned to employees/depts' },
    { title: 'Under Maintenance', value: 4, type: 'surface', description: 'Currently in repair queue' },
    { title: 'Active Bookings', value: 9, type: 'surface', description: 'Reservations scheduled today' },
    { title: 'Pending Transfers', value: 3, type: 'surface', description: 'Awaiting manager approval' },
    { title: 'Upcoming Returns', value: 12, type: 'surface', description: 'Expected within 48 hours' },
  ];

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
                    ? "bg-gradient-to-br from-[#0e623b] to-[#1b7a4d] dark:from-[#159c5e] dark:to-[#0e623b] text-white border-transparent shadow-lg shadow-primary/10" 
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
                    isPrimary ? "bg-white/20 text-white" : "bg-surface-raised text-muted-foreground"
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

      {/* Red Alert Banner: 3 assets overdue for return - flagged for follow-up */}
      <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground px-5 py-3.5 rounded-2xl flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
        <span className="text-xs font-semibold tracking-wide">
          3 assets overdue for return - flagged for follow-up
        </span>
      </div>

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
            <div className="pb-4.5 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground leading-normal">
                  Laptop <span className="font-mono text-primary font-bold">AF-0114</span> - allocated to <span className="font-semibold">Priya Shah</span> - IT dept
                </p>
                <span className="text-[10px] text-muted-foreground block">10 minutes ago</span>
              </div>
            </div>

            <div className="py-4.5 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center text-info mt-0.5">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground leading-normal">
                  Room <span className="font-mono text-info font-bold">B2</span> - booking confirmed - <span className="font-semibold">2:00 to 3:00 PM</span>
                </p>
                <span className="text-[10px] text-muted-foreground block">1 hour ago</span>
              </div>
            </div>

            <div className="pt-4.5 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success mt-0.5">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground leading-normal">
                  Projector <span className="font-mono text-success font-bold">AF-0062</span> - maintenance resolved
                </p>
                <span className="text-[10px] text-muted-foreground block">3 hours ago</span>
              </div>
            </div>
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

import { cn } from '../../lib/utils';
