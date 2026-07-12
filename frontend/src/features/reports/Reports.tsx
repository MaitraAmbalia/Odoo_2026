import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useReportsData } from '../../hooks/useReports';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Download, Loader2, ArrowUpRight, ArrowDownRight, TrendingUp, Clock, AlertTriangle, Calendar, Layers } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { apiClient } from '../../api/client';

export const Reports: React.FC = () => {
  const { toast } = useToast();
  const { data, isLoading } = useReportsData();
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState<string>('utilization');

  const reportOptions = [
    { value: 'utilization', label: 'Asset Utilization' },
    { value: 'maintenance-frequency', label: 'Maintenance Frequency' },
    { value: 'due-for-maintenance', label: 'Due for Maintenance' },
    { value: 'department-allocation-summary', label: 'Dept Allocation Summary' },
    { value: 'booking-heatmap', label: 'Booking Heatmap' }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get('/reports/export', {
        params: {
          type: reportType,
          format: 'csv'
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `AssetFlow_${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: 'Export Complete', description: `${reportOptions.find(o => o.value === reportType)?.label} CSV downloaded successfully.` });
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.response?.data?.message || err.message || 'Failed to export report',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">Loading reports...</div>;
  }

  // Days and Hours for Heatmap
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hoursOfDay = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  // Helper to get heat intensity class
  const getHeatIntensity = (dayIdx: number, hour: number) => {
    const match = data?.heatmap?.find((h: any) => h.dayOfWeek === dayIdx && h.hour === hour);
    const count = match ? match.bookingCount : 0;
    if (count === 0) return 'bg-background hover:bg-surface-raised';
    if (count < 2) return 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold';
    if (count < 5) return 'bg-emerald-500/50 hover:bg-emerald-500/60 text-emerald-100 font-bold';
    return 'bg-emerald-500 hover:bg-emerald-600 text-background font-bold';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reports & Analytics</h1>
          <p className="text-xs text-muted-foreground mt-1">Export organizational insights, monitor audit details, and track performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="bg-background border-border w-[220px]">
              <SelectValue placeholder="Select Report Type" />
            </SelectTrigger>
            <SelectContent>
              {reportOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExport} className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0" disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" /> Export
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Utilization Chart */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Utilization by Department
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">Tracks active allocation percentage per department pool.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.utilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="department" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#222', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="rate" fill="#1e6b45" radius={[4, 4, 0, 0]} name="Utilization Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Maintenance Frequency Chart */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-info" />
              Maintenance Frequency by Category
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">Total maintenance tickets processed per category.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.maintenanceFrequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="month" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#222', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Ticket Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Allocation Summary */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Department Allocation Summary
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">Total count of assets allocated across departments.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.deptAllocation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="department" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#222', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Allocated Assets" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Due for Maintenance Section */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Assets Nearing Maintenance / Retirement
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">Assets requiring scheduled safety inspections or nearing replacement.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto pt-2 space-y-3">
            {(!data?.dueForMaintenance || data.dueForMaintenance.length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-10">No assets currently due for maintenance or nearing retirement.</p>
            ) : (
              data.dueForMaintenance.map((asset: any) => (
                <div key={asset.id} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{asset.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{asset.assetTag} • {asset.category?.name || 'Uncategorized'}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">
                      Due Soon
                    </span>
                    <div className="text-[9px] text-muted-foreground mt-1">
                      Last: {asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Heatmap Grid */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-info" />
            Resource Booking Heatmap (Peak Usage Windows)
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">Highlights peak usage windows across days and hours.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[800px] py-2">
            <div className="grid grid-cols-8 gap-1.5 text-center text-xs">
              {/* Top-left corner spacer */}
              <div className="text-muted-foreground text-[10px] flex items-center justify-end pr-2 font-medium">Time / Day</div>
              {daysOfWeek.map(d => (
                <div key={d} className="font-semibold text-foreground text-[11px] pb-2 border-b border-border">{d}</div>
              ))}
            </div>

            <div className="space-y-1.5 mt-2">
              {hoursOfDay.map(hour => (
                <div key={hour} className="grid grid-cols-8 gap-1.5 items-center">
                  <div className="text-right pr-3 text-[10px] font-semibold text-muted-foreground">
                    {hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`}
                  </div>
                  {daysOfWeek.map((_, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`h-9 rounded-lg border border-border/40 transition-colors flex items-center justify-center text-[10px] ${getHeatIntensity(dayIdx, hour)}`}
                      title={`${daysOfWeek[dayIdx]} at ${hour > 12 ? `${hour - 12} PM` : `${hour} AM`}`}
                    >
                      {/* Optional numeric count placeholder inside block */}
                      {(() => {
                        const match = data?.heatmap?.find((h: any) => h.dayOfWeek === dayIdx && h.hour === hour);
                        return match && match.bookingCount > 0 ? match.bookingCount : '';
                      })()}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-end gap-4 mt-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-background border border-border/40" /> 0 Bookings</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/20" /> Low Usage</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/50" /> Medium Usage</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Peak Usage</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lists Row: Most Used & Idle Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Assets */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-sm">Most Used Assets</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">Top bookable assets based on total hours reserved.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(!data?.mostUsed || data.mostUsed.length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-6">No usage statistics available yet.</p>
            ) : (
              data.mostUsed.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{item.type}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>{item.bookings} bookings</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Idle Assets */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-sm">Idle Assets</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">Assets marked available without active allocation/booking.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(!data?.idle || data.idle.length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-6">No idle assets found.</p>
            ) : (
              data.idle.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{item.type}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-warning font-medium">
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Unused {item.idleDays} days</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
