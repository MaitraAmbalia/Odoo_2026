import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { useMaintenanceRequests, useCreateMaintenanceRequest, useUpdateMaintenanceStatus } from '../../hooks/useMaintenance';
import { useAssets } from '../../hooks/useAssets';
import { Wrench, Plus, ArrowRight, UserPlus, Play, CheckCircle, Ban } from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';

const columns = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'TECHNICIAN_ASSIGNED', label: 'Technician Assigned' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'RESOLVED', label: 'Resolved' }
];

export const Maintenance: React.FC = () => {
  const { toast } = useToast();
  const { data: requests, isLoading } = useMaintenanceRequests();
  const { data: assets } = useAssets({});

  const createRequestMutation = useCreateMaintenanceRequest();
  const updateStatusMutation = useUpdateMaintenanceStatus();

  // Modal open states
  const [isOpen, setIsOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);

  // Form states
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  // Request transitions helpers
  const [currentRequest, setCurrentRequest] = useState<any>(null);
  const [technicianName, setTechnicianName] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !issueDescription) return;

    createRequestMutation.mutate({
      assetId: selectedAssetId,
      issueDescription,
      priority
    }, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Maintenance request created successfully.' });
        setIsOpen(false);
        setSelectedAssetId('');
        setIssueDescription('');
        setPriority('MEDIUM');
      }
    });
  };

  const handleStatusChange = (req: any, targetStatus: string) => {
    if (targetStatus === 'TECHNICIAN_ASSIGNED') {
      setCurrentRequest(req);
      setIsAssignOpen(true);
    } else if (targetStatus === 'RESOLVED') {
      setCurrentRequest(req);
      setIsResolveOpen(true);
    } else {
      updateStatusMutation.mutate({
        id: req.id,
        status: targetStatus
      }, {
        onSuccess: () => {
          toast({ title: 'Success', description: `Request transitioned to ${targetStatus}` });
        }
      });
    }
  };

  const handleAssignTechnician = () => {
    if (!currentRequest || !technicianName) return;

    updateStatusMutation.mutate({
      id: currentRequest.id,
      status: 'TECHNICIAN_ASSIGNED',
      technicianName
    }, {
      onSuccess: () => {
        toast({ title: 'Success', description: `Technician ${technicianName} assigned.` });
        setIsAssignOpen(false);
        setTechnicianName('');
      }
    });
  };

  const handleResolveRequest = () => {
    if (!currentRequest || !resolutionNotes) return;

    updateStatusMutation.mutate({
      id: currentRequest.id,
      status: 'RESOLVED',
      resolutionNotes
    }, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Maintenance issue resolved.' });
        setIsResolveOpen(false);
        setResolutionNotes('');
      }
    });
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Maintenance Requests</h1>
        <Button onClick={() => setIsOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Raise Request
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {columns.map((col) => (
          <div key={col.id} className="bg-surface border border-border rounded-xl p-3 space-y-4 min-h-[500px]">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{col.label}</span>
              <span className="text-xs bg-surface-raised px-2 py-0.5 rounded text-muted-foreground font-mono">
                {requests?.filter(r => r.status === col.id).length || 0}
              </span>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
              ) : requests?.filter(r => r.status === col.id).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed border-border/30 rounded-lg">Empty</p>
              ) : (
                requests?.filter(r => r.status === col.id).map((req) => (
                  <div key={req.id} className="p-3 bg-background border border-border rounded-lg space-y-3 hover:border-border/80 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-semibold text-foreground">{req.asset?.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{req.asset?.assetTag}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${getPriorityColor(req.priority)}`} />
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase">{req.priority}</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-normal line-clamp-2">{req.issueDescription}</p>

                    {req.technicianName && (
                      <div className="text-[10px] bg-surface-raised text-foreground px-2 py-0.5 rounded font-medium inline-block">
                        Tech: {req.technicianName}
                      </div>
                    )}

                    {/* Operational Action buttons depending on state */}
                    <div className="pt-2 border-t border-border/40 flex justify-between gap-1">
                      {req.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="ghost" className="text-destructive h-6 text-[10px] hover:bg-destructive/10" onClick={() => handleStatusChange(req, 'REJECTED')}>
                            <Ban className="w-3 h-3 mr-1" /> Reject
                          </Button>
                          <Button size="sm" variant="outline" className="border-border text-foreground h-6 text-[10px]" onClick={() => handleStatusChange(req, 'APPROVED')}>
                            <ArrowRight className="w-3 h-3 mr-1" /> Approve
                          </Button>
                        </>
                      )}
                      {req.status === 'APPROVED' && (
                        <Button size="sm" variant="outline" className="border-border text-foreground h-6 text-[10px] w-full" onClick={() => handleStatusChange(req, 'TECHNICIAN_ASSIGNED')}>
                          <UserPlus className="w-3.5 h-3.5 mr-1" /> Assign Tech
                        </Button>
                      )}
                      {req.status === 'TECHNICIAN_ASSIGNED' && (
                        <Button size="sm" variant="outline" className="border-border text-foreground h-6 text-[10px] w-full" onClick={() => handleStatusChange(req, 'IN_PROGRESS')}>
                          <Play className="w-3.5 h-3.5 mr-1" /> Start Work
                        </Button>
                      )}
                      {req.status === 'IN_PROGRESS' && (
                        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 h-6 text-[10px] w-full" onClick={() => handleStatusChange(req, 'RESOLVED')}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Resolved
                        </Button>
                      )}
                      {req.status === 'RESOLVED' && (
                        <div className="text-[9px] text-success font-medium w-full text-center">Resolved</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground pt-4 border-t border-border">
        * persistent helper: <span className="font-semibold text-foreground">Approving a card moves the asset to Under Maintenance; resolving returns it to Available.</span>
      </div>

      {/* Raise Request Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-surface border-border sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Raise Maintenance Request</DialogTitle>
            <DialogDescription className="text-muted-foreground">Report hardware problems to start review.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRequest} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Affected Asset</Label>
              <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Choose asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets?.items.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({a.assetTag})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="desc">Issue Description</Label>
              <Input 
                id="desc" 
                value={issueDescription} 
                onChange={(e) => setIssueDescription(e.target.value)} 
                placeholder="Describe the issue you're facing..." 
                className="bg-background border-border" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label>Priority Level</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-border">Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Raise Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Technician Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="bg-surface border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Assign Technician</DialogTitle>
            <DialogDescription className="text-muted-foreground">Appoint technician to address the issue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tech-name">Technician Name</Label>
              <Input 
                id="tech-name" 
                value={technicianName} 
                onChange={(e) => setTechnicianName(e.target.value)} 
                className="bg-background border-border" 
                placeholder="e.g. Mike Tech" 
                required 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleAssignTechnician} className="bg-primary text-primary-foreground hover:bg-primary/90">Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Issue Dialog */}
      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent className="bg-surface border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Resolve Request</DialogTitle>
            <DialogDescription className="text-muted-foreground">Document resolution details and close request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Resolution Notes</Label>
              <Input 
                id="notes" 
                value={resolutionNotes} 
                onChange={(e) => setResolutionNotes(e.target.value)} 
                className="bg-background border-border" 
                placeholder="e.g. Replaced display cable, verified fix" 
                required 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleResolveRequest} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">Complete Resolution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
