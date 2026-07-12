import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useToast } from '../../hooks/use-toast';
import { useAssets } from '../../hooks/useAssets';
import { useBookings, useCreateBooking, useCancelBooking } from '../../hooks/useBookings';
import { CalendarDays, AlertTriangle, Clock, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';

export const Bookings: React.FC = () => {
  const { toast } = useToast();
  const { data: assets } = useAssets({});
  
  const bookableAssets = assets?.items.filter(a => a.isBookable) || [];
  
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (bookableAssets.length > 0 && !selectedAssetId) {
      setSelectedAssetId(bookableAssets[0].id);
    }
  }, [bookableAssets, selectedAssetId]);
  const { data: bookings, isLoading: loadingBookings } = useBookings(selectedAssetId);

  const createBookingMutation = useCreateBooking();
  const cancelBookingMutation = useCancelBooking();

  const [isOpen, setIsOpen] = useState(false);
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('10:30');
  const [purpose, setPurpose] = useState('');

  const [conflictOverlay, setConflictOverlay] = useState<{
    start: string;
    end: string;
    msg: string;
  } | null>(null);

  // Date navigation helpers
  const navigateDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;
    setConflictOverlay(null);
    const fullStart = `${selectedDate}T${startTime}:00`;
    const fullEnd = `${selectedDate}T${endTime}:00`;

    createBookingMutation.mutate({
      assetId: selectedAssetId,
      startTime: fullStart,
      endTime: fullEnd,
      purpose
    }, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Booking confirmed successfully' });
        setIsOpen(false);
        setPurpose('');
      },
      onError: (err: any) => {
        if (err.response?.status === 409) {
          const details = err.response.data.data;
          setConflictOverlay({
            start: startTime,
            end: endTime,
            msg: `Requested ${startTime}-${endTime} — conflict, slot unavailable`
          });
          toast({
            title: 'Booking Conflict',
            description: err.response.data.message,
            variant: 'destructive'
          });
        } else {
          toast({ title: 'Error', description: 'Failed to create booking', variant: 'destructive' });
        }
      }
    });
  };

  const handleCancel = (id: string) => {
    cancelBookingMutation.mutate({ id, assetId: selectedAssetId }, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Booking cancelled successfully' });
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || 'Failed to cancel booking';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    });
  };

  // Timeline hours from 8 AM to 8 PM (20:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  const getPositionStyles = (timeStr: string) => {
    const time = new Date(timeStr);
    const hour = time.getHours();
    const minutes = time.getMinutes();
    
    // 8 AM is 0%, 8 PM (20:00) is 100%
    const totalMinutesInWorkday = 12 * 60; // 8am to 8pm
    const minutesFromStart = (hour - 8) * 60 + minutes;
    const percentage = (minutesFromStart / totalMinutesInWorkday) * 100;
    return `${Math.max(0, Math.min(100, percentage))}%`;
  };

  const getHeightStyles = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = diffMs / (1000 * 60);
    const totalMinutesInWorkday = 12 * 60;
    const percentage = (diffMins / totalMinutesInWorkday) * 100;
    return `${Math.max(5, Math.min(100, percentage))}%`;
  };

  const getOverlayPositionStyles = (timeStr: string) => {
    const [hourStr, minStr] = timeStr.split(':');
    const hour = parseInt(hourStr);
    const minutes = parseInt(minStr);
    const totalMinutesInWorkday = 12 * 60;
    const minutesFromStart = (hour - 8) * 60 + minutes;
    const percentage = (minutesFromStart / totalMinutesInWorkday) * 100;
    return `${Math.max(0, Math.min(100, percentage))}%`;
  };

  const getOverlayHeightStyles = (startStr: string, endStr: string) => {
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    const diffMins = (endH - startH) * 60 + (endM - startM);
    const totalMinutesInWorkday = 12 * 60;
    const percentage = (diffMins / totalMinutesInWorkday) * 100;
    return `${Math.max(5, Math.min(100, percentage))}%`;
  };


  // Filter bookings for selected date
  const allActiveBookings = bookings?.filter((b: any) => b.status !== 'CANCELLED') || [];
  const activeBookings = allActiveBookings.filter((b: any) => {
    const bookingDate = new Date(b.startTime).toISOString().split('T')[0];
    return bookingDate === selectedDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Resource Booking</h1>
        <Button onClick={() => { setConflictOverlay(null); setIsOpen(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Book a Slot
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: Picker & list */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-sm">Select Resource</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                <SelectTrigger className="bg-background border-border w-full">
                  <SelectValue placeholder="Choose resource" />
                </SelectTrigger>
                <SelectContent>
                  {bookableAssets.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({a.assetTag})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-sm">Today's Bookings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingBookings ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : activeBookings.length === 0 ? (
                <p className="text-xs text-muted-foreground">No bookings scheduled today.</p>
              ) : (
                activeBookings.map((b: any) => (
                  <div key={b.id} className="p-3 rounded-lg bg-background border border-border flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-foreground">
                        {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-muted-foreground">Booked by: {b.bookedBy?.name}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleCancel(b.id)}
                      className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar View timeline */}
        <div className="lg:col-span-3">
          <Card className="bg-surface border-border h-[650px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-base flex flex-wrap items-center justify-between gap-2">
                <span>Calendar — {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigateDate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
                  <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-background border-border text-xs h-7 w-[150px] px-2" />
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigateDate(1)}><ChevronRight className="w-4 h-4" /></Button>
                  {!isToday && <Button variant="outline" size="sm" className="h-7 text-xs border-border" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>Today</Button>}
                </div>
              </CardTitle>
              <CardDescription className="text-muted-foreground">8:00 AM — 8:00 PM. Blue = confirmed. Red dashed = conflict.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 relative flex">
              {/* Hour Grid Markers on the left */}
              <div className="w-16 flex flex-col justify-between text-right pr-4 text-xs text-muted-foreground h-[500px]">
                {hours.map(h => (
                  <div key={h} className="h-0 flex items-center justify-end">
                    {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                  </div>
                ))}
              </div>

              {/* Day column container */}
              <div className="flex-1 bg-background rounded-xl border border-border relative h-[500px]">
                {/* Horizontal lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {hours.map(h => (
                    <div key={h} className="border-b border-border/40 w-full h-0" />
                  ))}
                </div>

                {/* Confirmed bookings mapping */}
                {!loadingBookings && activeBookings.map((b: any) => (
                  <div
                    key={b.id}
                    style={{
                      top: getPositionStyles(b.startTime),
                      height: getHeightStyles(b.startTime, b.endTime)
                    }}
                    className="absolute left-4 right-4 rounded-lg bg-info/10 border border-info/30 text-info p-2.5 flex flex-col justify-between text-xs z-10 hover:bg-info/15 transition-colors"
                  >
                    <div className="font-semibold">{b.bookedBy?.name}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}

                {/* Conflict Overlay rendering */}
                {conflictOverlay && (
                  <div
                    style={{
                      top: getOverlayPositionStyles(conflictOverlay.start),
                      height: getOverlayHeightStyles(conflictOverlay.start, conflictOverlay.end)
                    }}
                    className="absolute left-6 right-6 rounded-lg bg-destructive/10 border-2 border-dashed border-destructive text-destructive-foreground p-3 flex flex-col justify-center items-center text-xs z-20"
                  >
                    <AlertTriangle className="w-5 h-5 text-destructive mb-1" />
                    <span className="font-semibold text-center text-[10px] leading-tight">{conflictOverlay.msg}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Form Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-surface border-border sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Book Resource Slot</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select time slot for the selected resource. Conflicts are highlighted visually.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBook} className="space-y-4 py-4">
            {conflictOverlay && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive-foreground">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Conflict Detected</AlertTitle>
                <AlertDescription className="text-xs">
                  The requested slot overlaps with an existing booking. Adjust your times below to resolve.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input 
                  id="start-time" 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  className="bg-background border-border" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input 
                  id="end-time" 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  className="bg-background border-border" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose / Details</Label>
              <Input 
                id="purpose" 
                value={purpose} 
                onChange={(e) => setPurpose(e.target.value)} 
                className="bg-background border-border" 
                placeholder="e.g. Weekly sync, Client demo" 
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={createBookingMutation.isPending}>
                {createBookingMutation.isPending ? 'Confirming...' : 'Book Slot'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
