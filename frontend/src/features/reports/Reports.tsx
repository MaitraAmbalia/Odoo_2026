import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useReportsData } from '../../hooks/useReports';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Loader2, ArrowUpRight, ArrowDownRight, TrendingUp, Clock } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reports & Analytics</h1>
          <p className="text-xs text-muted-foreground mt-1">Export organizational insights and audit history.</p>
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
                <Bar dataKey="rate" fill="#1e6b45" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Maintenance Frequency Chart */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-info" />
              Maintenance Frequency
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">Monthly aggregation of raised maintenance tickets.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.maintenanceFrequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="month" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#222', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lists Row: Most Used & Idle Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Assets */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-sm">Most Used Assets</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">Top bookable assets based on total hours reserved.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.mostUsed.map((item: any, idx: number) => (
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
            ))}
          </CardContent>
        </Card>
 
        {/* Idle Assets */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-sm">Idle Assets</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">Assets marked available without active allocation/booking.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.idle.map((item: any, idx: number) => (
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
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
import { Clock as ClockIcon } from 'lucide-react';
