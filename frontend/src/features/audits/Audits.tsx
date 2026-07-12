import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';
import { 
  useAuditCycles, 
  useAuditItems, 
  useVerifyAuditItem, 
  useCloseAuditCycle, 
  useCreateAuditCycle 
} from '../../hooks/useAudits';
import { useDepartments, useEmployees } from '../../hooks/useOrgSetup';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Check, ClipboardCheck, AlertTriangle, Play, Settings, Plus } from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';

export const Audits: React.FC = () => {
  const { toast } = useToast();
  const { data: cycles, isLoading: loadingCycles } = useAuditCycles();
  const { data: departments } = useDepartments();
  const { data: employees } = useEmployees();

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const activeCycleId = selectedCycleId || cycles?.[0]?.id || '';
  const { data: items, isLoading: loadingItems } = useAuditItems(activeCycleId);

  const verifyItemMutation = useVerifyAuditItem();
  const closeCycleMutation = useCloseAuditCycle();
  const createCycleMutation = useCreateAuditCycle();

  // Create cycle states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cycleName, setCycleName] = useState('');
  const [scopeDept, setScopeDept] = useState('');
  const [scopeLoc, setScopeLoc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAuditors, setSelectedAuditors] = useState<string[]>([]);

  // Item verification note dialog states
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);

  const activeCycle = cycles?.find(c => c.id === activeCycleId);

  // Check discrepancies (Missing or Damaged items)
  const discrepancies = items?.filter(item => item.result === 'MISSING' || item.result === 'DAMAGED') || [];

  const handleCreateCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName || !startDate || !endDate) return;

    // Ensure at least one auditor is selected
    const auditorIds = selectedAuditors.length > 0 ? selectedAuditors : employees?.slice(0,1).map(e => e.id) || [];

    createCycleMutation.mutate({
      name: cycleName,
      // Don't send 'all' as UUID
      scopeDepartmentId: (scopeDept && scopeDept !== 'all') ? scopeDept : undefined,
      scopeLocation: scopeLoc || undefined,
      startDate,
      endDate,
      auditorUserIds: auditorIds
    }, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'New audit cycle launched.' });
        setIsCreateOpen(false);
        resetForm();
      }
    });
  };

  const handleVerifyItem = (itemId: string, result: string) => {
    setSelectedItemId(itemId);
    setSelectedResult(result);
    setNotes('');
    setIsVerifyOpen(true);
  };

  const submitVerification = () => {
    if (!selectedItemId) return;
    verifyItemMutation.mutate({
      cycleId: activeCycleId,
      itemId: selectedItemId,
      result: selectedResult,
      notes
    }, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Asset verification updated.' });
        setIsVerifyOpen(false);
        setSelectedItemId(null);
      }
    });
  };

  const handleCloseCycle = () => {
    if (!activeCycleId) return;
    closeCycleMutation.mutate(activeCycleId, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Audit cycle locked and closed successfully.' });
      }
    });
  };

  const resetForm = () => {
    setCycleName('');
    setScopeDept('');
    setScopeLoc('');
    setStartDate('');
    setEndDate('');
    setSelectedAuditors([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Audit Cycles</h1>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> New Audit Cycle
        </Button>
      </div>

      {discrepancies.length > 0 && (
        <Alert variant="destructive" className="bg-destructive/15 border-destructive/30 text-destructive-foreground">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle>Discrepancies Flagged</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed">
            {discrepancies.length} assets flagged (Missing/Damaged) — discrepancy report generated automatically.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Cycles list */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-sm">Select Active Cycle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingCycles ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : (
                cycles?.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCycleId(c.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-colors flex flex-col gap-1 ${
                      activeCycleId === c.id
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="font-semibold text-foreground">{c.name}</span>
                    <span className="text-[10px]">Ends: {new Date(c.endDate).toLocaleDateString()}</span>
                    <div className="mt-1">
                      <StatusBadge status={c.status} className="text-[9px] px-1.5 py-0" />
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Audit Checklist */}
        <div className="lg:col-span-3 space-y-4">
          {activeCycle && (
            <Card className="bg-surface border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-foreground text-base">{activeCycle.name}</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Scope: {departments?.find(d => d.id === activeCycle.scopeDepartmentId)?.name || 'All'}
                  </CardDescription>
                </div>
                {activeCycle.status === 'IN_PROGRESS' && (
                  <Button 
                    onClick={handleCloseCycle} 
                    className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs px-3 h-8"
                  >
                    Close Cycle
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border bg-background overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Asset</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Expected Location</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Verification</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingItems ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Loading items...</TableCell></TableRow>
                      ) : items?.map((item) => (
                        <TableRow key={item.id} className="border-border">
                          <TableCell>
                            <div className="font-medium text-foreground">{item.asset?.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{item.asset?.assetTag}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{item.asset?.location || 'HQ'}</TableCell>
                          <TableCell>
                            <Select 
                              value={item.result} 
                              onValueChange={(val) => handleVerifyItem(item.id, val)}
                              disabled={activeCycle.status === 'CLOSED'}
                            >
                              <SelectTrigger className="w-[120px] bg-background border-border text-xs h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="VERIFIED">Verified</SelectItem>
                                <SelectItem value="MISSING">Missing</SelectItem>
                                <SelectItem value="DAMAGED">Damaged</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate">
                            {item.notes || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Launch New Audit Cycle Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-surface border-border sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">New Audit Cycle</DialogTitle>
            <DialogDescription className="text-muted-foreground">Define scope and appoint auditors.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCycle} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="audit-name">Cycle Name</Label>
              <Input 
                id="audit-name" 
                value={cycleName} 
                onChange={(e) => setCycleName(e.target.value)} 
                placeholder="e.g. Q4 Asset Verification" 
                className="bg-background border-border" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Department Scope</Label>
              <Select value={scopeDept} onValueChange={setScopeDept}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loc-scope">Location Scope</Label>
              <Input 
                id="loc-scope" 
                value={scopeLoc} 
                onChange={(e) => setScopeLoc(e.target.value)} 
                placeholder="e.g. HQ Building" 
                className="bg-background border-border" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Date</Label>
                <Input 
                  id="start" 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-background border-border text-xs" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End Date</Label>
                <Input 
                  id="end" 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="bg-background border-border text-xs" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign Auditors</Label>
              <div className="rounded-lg border border-border bg-background p-3 max-h-[140px] overflow-y-auto space-y-1.5">
                {employees?.length === 0 && (
                  <p className="text-xs text-muted-foreground">No employees found.</p>
                )}
                {employees?.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:text-primary">
                    <input
                      type="checkbox"
                      value={emp.id}
                      checked={selectedAuditors.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAuditors(prev => [...prev, emp.id]);
                        } else {
                          setSelectedAuditors(prev => prev.filter(id => id !== emp.id));
                        }
                      }}
                      className="accent-primary"
                    />
                    {emp.name} <span className="text-muted-foreground font-mono text-[10px]">({emp.role})</span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">Select at least one auditor for this cycle.</p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-border">Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Launch Cycle</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item Verification Notes Dialog */}
      <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
        <DialogContent className="bg-surface border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Verification Notes
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">Document verification details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verify-notes">Auditor Notes</Label>
              <Input 
                id="verify-notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="bg-background border-border" 
                placeholder="Provide notes (e.g., asset condition, discrepancies)..." 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={submitVerification} className="bg-primary text-primary-foreground hover:bg-primary/90">Save Verification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
