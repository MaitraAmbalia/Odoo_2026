import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useNotifications, useMarkRead, useMarkAllRead } from '../../hooks/useNotifications';
import { Bell, Check, Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Notifications: React.FC = () => {
  const { data: notifications, isLoading } = useNotifications();
  const markReadMutation = useMarkRead();
  const markAllReadMutation = useMarkAllRead();

  const [filter, setFilter] = useState<'ALL' | 'ALERTS' | 'APPROVALS' | 'BOOKINGS'>('ALL');

  const filterMap: Record<string, 'ALERTS' | 'APPROVALS' | 'BOOKINGS'> = {
    ASSET_ASSIGNED: 'APPROVALS',
    TRANSFER_APPROVED: 'APPROVALS',
    OVERDUE_RETURN: 'ALERTS',
    AUDIT_DISCREPANCY: 'ALERTS',
    MAINTENANCE_APPROVED: 'ALERTS',
    MAINTENANCE_REJECTED: 'ALERTS',
    BOOKING_CONFIRMED: 'BOOKINGS',
    BOOKING_CANCELLED: 'BOOKINGS',
    BOOKING_REMINDER: 'BOOKINGS',
    ROLE_CHANGED: 'ALERTS'
  };

  const filteredNotifs = notifications?.filter(n => {
    if (filter === 'ALL') return true;
    return filterMap[n.type] === filter;
  }) || [];

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const getNotificationColor = (type: string) => {
    const category = filterMap[type];
    switch (category) {
      case 'ALERTS': return 'bg-destructive border-destructive';
      case 'APPROVALS': return 'bg-primary border-primary';
      case 'BOOKINGS': return 'bg-info border-info';
      default: return 'bg-muted border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
          <p className="text-xs text-muted-foreground mt-1">Review operational logs, alerts, and system updates.</p>
        </div>
        {notifications && notifications.some(n => !n.isRead) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => markAllReadMutation.mutate()}
            className="border-border hover:bg-surface-raised text-xs"
          >
            <Check className="w-3.5 h-3.5 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {/* Filter Options */}
      <div className="flex gap-2">
        {(['ALL', 'ALERTS', 'APPROVALS', 'BOOKINGS'] as const).map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className={cn(
              "text-xs px-3 rounded-full border",
              filter === f 
                ? 'bg-primary text-primary-foreground border-transparent hover:bg-primary/95'
                : 'border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-raised'
            )}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {/* Main Feed */}
      <Card className="bg-surface border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Loading feed...</div>
          ) : filteredNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Inbox className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p className="text-sm">Inbox is empty</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifs.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  className={cn(
                    "flex items-start justify-between gap-4 p-4 hover:bg-surface-raised/40 transition-colors cursor-pointer",
                    !n.isRead && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Read / Unread Status Dot Indicator */}
                    <div className="pt-1.5">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full border",
                        n.isRead 
                          ? "bg-transparent border-muted-foreground/45" 
                          : getNotificationColor(n.type)
                      )} />
                    </div>

                    <div className="space-y-1">
                      <p className={cn(
                        "text-xs leading-normal",
                        n.isRead ? "text-muted-foreground" : "text-foreground font-medium"
                      )}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {!n.isRead && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(n.id);
                      }}
                      className="text-xs text-primary hover:bg-primary/10 h-8 px-2"
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
