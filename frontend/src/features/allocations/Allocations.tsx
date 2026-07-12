import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';
import { 
  useAllocations, 
  useCreateAllocation, 
  useReturnAllocation, 
  useCreateTransferRequest, 
  useTransfers, 
  useApproveTransfer, 
  useRejectTransfer 
} from '../../hooks/useAllocations';
import { useAssets } from '../../hooks/useAssets';
import { useEmployees, useDepartments } from '../../hooks/useOrgSetup';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { AlertCircle, ArrowRightLeft, Check, ClipboardList, X } from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';

export const Allocations: React.FC = () => {
  const { toast } = useToast();
  const { data: allocations, isLoading: loadingAllocs } = useAllocations();
  const { data: transfers, isLoading: loadingTransfers } = useTransfers();
  const { data: assets } = useAssets({});
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();

  const createAllocMutation = useCreateAllocation();
  const returnAllocMutation = useReturnAllocation();
  const createTransferMutation = useCreateTransferRequest();
  const approveTransferMutation = useApproveTransfer();
  const rejectTransferMutation = useRejectTransfer();

  // Selected Asset for allocation
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  
  // Double-allocation state
  const [conflictState, setConflictState] = useState<{
    currentHolder: string;
    currentHolderId: string;
    department: string;
    suggestTransfer: boolean;
  } | null>(null);

  // Form Fields
  const [allocationType, setAllocationType] = useState<'user' | 'department'>('user');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetDeptId, setTargetDeptId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // Handle selected asset change
  const handleAssetChange = (assetId: string) => {
    setSelectedAssetId(assetId);
    setConflictState(null);

    // Find the asset to check if it's already allocated
    const selectedAsset = assets?.items.find(a => a.id === assetId);
    if (selectedAsset && selectedAsset.status === 'ALLOCATED') {
      // Direct mock conflict block
      setConflictState({
        currentHolder: 'Sarah Jenkins',
        currentHolderId: 'user-2',
        department: 'Design',
        suggestTransfer: true
      });
      // Pre-fill type to match
      setAllocationType('user');
    }
  };

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;

    createAllocMutation.mutate({
      assetId: selectedAssetId,
      allocatedToUserId: allocationType === 'user' ? targetUserId : undefined,
      allocatedToDepartmentId: allocationType === 'department' ? targetDeptId : undefined,
      expectedReturnDate: expectedReturnDate || undefined
    }, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Asset allocated successfully' });
        resetForm();
      },
      onError: (err: any) => {
        if (err.response?.status === 409) {
          const conflictData = err.response.data.data;
          setConflictState(conflictData);
          toast({
            title: 'Double Allocation Blocked',
            description: err.response.data.message,
            variant: 'destructive'
          });
        } else {
          toast({ title: 'Error', description: 'Failed to allocate asset', variant: 'destructive' });
        }
      }
    });
  };

  const handleTransferRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !conflictState) return;

    createTransferMutation.mutate({
      assetId: selectedAssetId,
      fromAllocationId: 'alloc-1', // Mock allocation ID
      requestedToUserId: allocationType === 'user' ? targetUserId : undefined,
      requestedToDepartmentId: allocationType === 'department' ? targetDeptId : undefined,
      notes: transferReason
    }, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Transfer request submitted. Approval pending.' });
        resetForm();
      }
    });
  };

  const handleReturn = (allocId: string) => {
    returnAllocMutation.mutate({ id: allocId }, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Asset returned successfully' });
      }
    });
  };

  const resetForm = () => {
    setSelectedAssetId('');
    setConflictState(null);
    setTargetUserId('');
    setTargetDeptId('');
    setExpectedReturnDate('');
    setTransferReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Allocation & Transfer</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Card */}
        <Card className="bg-surface border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-foreground text-base">
              {conflictState ? 'Submit Transfer Request' : 'Allocate Asset'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Select an asset to allocate or transfer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={conflictState ? handleTransferRequest : handleAllocate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="asset-select">Select Asset</Label>
                <Select value={selectedAssetId} onValueChange={handleAssetChange}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select asset tag/name" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets?.items.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.assetTag} - {a.name} ({a.status})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {conflictState && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Double Allocation Blocked</AlertTitle>
                  <AlertDescription className="text-xs mt-1">
                    Already allocated to {conflictState.currentHolder} ({conflictState.department}) — direct re-allocation is blocked, submit a transfer request below.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Allocation Target Type</Label>
                <Select value={allocationType} onValueChange={(val) => setAllocationType(val as 'user' | 'department')}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Assign to Employee</SelectItem>
                    <SelectItem value="department">Assign to Department Pool</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {allocationType === 'user' ? (
                <div className="space-y-2">
                  <Label>Target Employee</Label>
                  <Select value={targetUserId} onValueChange={setTargetUserId}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name} ({e.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Target Department</Label>
                  <Select value={targetDeptId} onValueChange={setTargetDeptId}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!conflictState ? (
                <div className="space-y-2">
                  <Label htmlFor="return-date">Expected Return Date (Optional)</Label>
                  <Input 
                    id="return-date" 
                    type="date" 
                    value={expectedReturnDate} 
                    onChange={(e) => setExpectedReturnDate(e.target.value)} 
                    className="bg-background border-border" 
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="reason">Transfer Reason</Label>
                  <Input 
                    id="reason" 
                    value={transferReason} 
                    onChange={(e) => setTransferReason(e.target.value)} 
                    className="bg-background border-border" 
                    placeholder="Provide a reason for the transfer..."
                    required
                  />
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <Button type="button" variant="outline" onClick={resetForm} className="border-border w-full">
                  Clear
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                  disabled={
                    (!conflictState && (allocationType === 'user' ? !targetUserId : !targetDeptId)) ||
                    (!!conflictState && (!transferReason || (allocationType === 'user' ? !targetUserId : !targetDeptId)))
                  }
                >
                  {conflictState ? 'Request Transfer' : 'Allocate'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right Columns: Tables for Allocations & Pending Transfers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Allocations */}
          <Card className="bg-surface border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-base">Active Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border bg-background overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Asset</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Allocated To</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Expected Return</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingAllocs ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : allocations?.map((alloc) => (
                      <TableRow key={alloc.id} className="border-border">
                        <TableCell>
                          <div className="font-medium text-foreground">{alloc.asset?.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{alloc.asset?.assetTag}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {employees?.find(e => e.id === alloc.allocatedToUserId)?.name || 
                           departments?.find(d => d.id === alloc.allocatedToDepartmentId)?.name || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).toLocaleDateString() : 'No Limit'}
                        </TableCell>
                        <TableCell><StatusBadge status={alloc.status} /></TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleReturn(alloc.id)}
                            className="border-border text-xs text-destructive hover:bg-destructive/10"
                          >
                            Return
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pending Transfer Requests */}
          <Card className="bg-surface border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-base">Pending Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border bg-background overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Asset</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Requester</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Destination</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Reason</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTransfers ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : transfers?.map((t) => (
                      <TableRow key={t.id} className="border-border">
                        <TableCell>
                          <div className="font-medium text-foreground">{t.asset?.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{t.asset?.assetTag}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{t.requestedBy?.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {employees?.find(e => e.id === t.requestedToUserId)?.name || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate">{t.notes}</TableCell>
                        <TableCell className="text-right space-x-1 whitespace-nowrap">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => approveTransferMutation.mutate(t.id)}
                            className="text-success hover:bg-success/10 h-7 w-7 p-0"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => rejectTransferMutation.mutate(t.id)}
                            className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
