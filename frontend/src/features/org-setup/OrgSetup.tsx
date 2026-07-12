import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';
import { 
  useDepartments, 
  useCreateDepartment, 
  useCategories, 
  useCreateCategory, 
  useEmployees, 
  usePromoteEmployee 
} from '../../hooks/useOrgSetup';
import { Plus, Settings, ShieldAlert, Users } from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';

export const OrgSetup: React.FC = () => {
  const { toast } = useToast();
  const { data: depts, isLoading: loadingDepts } = useDepartments();
  const { data: cats, isLoading: loadingCats } = useCategories();
  const { data: employees, isLoading: loadingEmployees } = useEmployees();

  const createDeptMutation = useCreateDepartment();
  const createCatMutation = useCreateCategory();
  const promoteMutation = usePromoteEmployee();

  // Active tab state to drive "+ Add" button behavior
  const [activeTab, setActiveTab] = useState('departments');

  // Dialog open states
  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  
  // Selected employee for promotion
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'DEPARTMENT_HEAD' | 'ASSET_MANAGER'>('DEPARTMENT_HEAD');

  // Form states
  const [deptName, setDeptName] = useState('');
  const [deptParent, setDeptParent] = useState<string | null>(null);
  const [deptHead, setDeptHead] = useState<string | null>(null);

  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [customFields, setCustomFields] = useState<{ key: string; type: string; label: string }[]>([]);

  const handleAddDept = () => {
    if (!deptName) return;
    createDeptMutation.mutate({
      name: deptName,
      parentDepartmentId: deptParent === 'none' ? null : deptParent,
      headUserId: deptHead === 'none' ? null : deptHead
    }, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Department created successfully' });
        setIsDeptDialogOpen(false);
        setDeptName('');
        setDeptParent(null);
        setDeptHead(null);
      }
    });
  };

  const handleAddCat = () => {
    if (!catName) return;
    createCatMutation.mutate({
      name: catName,
      description: catDesc,
      customFieldsSchema: customFields
    }, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Category created successfully' });
        setIsCatDialogOpen(false);
        setCatName('');
        setCatDesc('');
        setCustomFields([]);
      }
    });
  };

  const handlePromote = () => {
    if (!selectedEmployeeId) return;
    promoteMutation.mutate({
      employeeId: selectedEmployeeId,
      role: selectedRole
    }, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Employee promoted successfully' });
        setIsPromoteDialogOpen(false);
        setSelectedEmployeeId(null);
      }
    });
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: `field_${Date.now()}`, type: 'text', label: '' }]);
  };

  const updateCustomField = (index: number, field: string, value: string) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-generate key if label changes
    if (field === 'label') {
      updated[index].key = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    setCustomFields(updated);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Organization Setup</h1>
        
        {activeTab === 'departments' && (
          <Button onClick={() => setIsDeptDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Add Department
          </Button>
        )}
        {activeTab === 'categories' && (
          <Button onClick={() => setIsCatDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
        )}
      </div>

      <Tabs defaultValue="departments" onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-surface border border-border p-1 rounded-xl">
          <TabsTrigger value="departments" className="data-[state=active]:bg-surface-raised data-[state=active]:text-foreground rounded-lg">Departments</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-surface-raised data-[state=active]:text-foreground rounded-lg">Categories</TabsTrigger>
          <TabsTrigger value="employees" className="data-[state=active]:bg-surface-raised data-[state=active]:text-foreground rounded-lg">Employee Directory</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-4">
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Departments Directory</CardTitle>
              <CardDescription className="text-muted-foreground">Manage organization structure and reporting hierarchies.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border bg-background overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Department Name</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Head of Department</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Parent Department</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDepts ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : depts?.map((dept) => (
                      <TableRow key={dept.id} className="border-border hover:bg-surface-raised/40">
                        <TableCell className="font-medium text-foreground">{dept.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {employees?.find(e => e.id === dept.headUserId)?.name || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {depts.find(d => d.id === dept.parentDepartmentId)?.name || '—'}
                        </TableCell>
                        <TableCell><StatusBadge status={dept.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Asset Categories</CardTitle>
              <CardDescription className="text-muted-foreground">Define asset categories and custom metadata attributes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border bg-background overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Category Name</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Description</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Custom Fields Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCats ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : cats?.map((cat) => (
                      <TableRow key={cat.id} className="border-border hover:bg-surface-raised/40">
                        <TableCell className="font-medium text-foreground">{cat.name}</TableCell>
                        <TableCell className="text-muted-foreground">{cat.description || '—'}</TableCell>
                        <TableCell className="text-foreground">{cat.customFieldsSchema?.length || 0} fields</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Employee Roster</CardTitle>
              <CardDescription className="text-muted-foreground">Directory of employees. Promote roles or manage account statuses.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border bg-background overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Name</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Email</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Department</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Role</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingEmployees ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : employees?.map((emp) => (
                      <TableRow key={emp.id} className="border-border hover:bg-surface-raised/40">
                        <TableCell className="font-medium text-foreground">{emp.name}</TableCell>
                        <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {depts?.find(d => d.id === emp.departmentId)?.name || '—'}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono bg-surface-raised px-2 py-1 rounded text-foreground">{emp.role}</span>
                        </TableCell>
                        <TableCell><StatusBadge status={emp.status} /></TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-border hover:bg-surface-raised text-xs"
                            onClick={() => {
                              setSelectedEmployeeId(emp.id);
                              setIsPromoteDialogOpen(true);
                            }}
                          >
                            Manage Role
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE DEPARTMENT DIALOG */}
      <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
        <DialogContent className="bg-surface border-border sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Department</DialogTitle>
            <DialogDescription className="text-muted-foreground">Configure new organizational department hierarchy.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Department Name</Label>
              <Input id="dept-name" value={deptName} onChange={(e) => setDeptName(e.target.value)} className="bg-background border-border" placeholder="e.g. Quality Assurance" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-dept">Parent Department (Prevent cycles)</Label>
              <Select onValueChange={(val) => setDeptParent(val === 'none' ? null : val)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select parent department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {depts?.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-head">Department Head</Label>
              <Select onValueChange={(val) => setDeptHead(val === 'none' ? null : val)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select head of department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None Assigned</SelectItem>
                  {employees?.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeptDialogOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleAddDept} className="bg-primary text-primary-foreground hover:bg-primary/90">Save Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE CATEGORY DIALOG */}
      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent className="bg-surface border-border sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Category</DialogTitle>
            <DialogDescription className="text-muted-foreground">Add new category and design custom schemas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input id="cat-name" value={catName} onChange={(e) => setCatName(e.target.value)} className="bg-background border-border" placeholder="e.g. Accessories" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Input id="cat-desc" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} className="bg-background border-border" placeholder="e.g. Keyboards, Mice, Cables" />
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-foreground">Custom Field Schema</span>
                <Button size="sm" variant="outline" onClick={addCustomField} className="border-border text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Add Field</Button>
              </div>
              {customFields.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No custom fields added yet.</p>
              )}
              {customFields.map((field, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-2">
                  <Input 
                    value={field.label} 
                    onChange={(e) => updateCustomField(idx, 'label', e.target.value)} 
                    className="bg-background border-border text-xs flex-1" 
                    placeholder="Field Label (e.g. Warranty)" 
                  />
                  <Select value={field.type} onValueChange={(val) => updateCustomField(idx, 'type', val)}>
                    <SelectTrigger className="w-[100px] bg-background border-border text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => removeCustomField(idx)} className="text-destructive hover:bg-destructive/10">✕</Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCatDialogOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleAddCat} className="bg-primary text-primary-foreground hover:bg-primary/90">Save Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MANAGE ROLE / PROMOTIONS DIALOG */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent className="bg-surface border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-warning" />
              Promote Role
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">Adjust system permissions for employee.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Role</Label>
              <Select 
                value={selectedRole} 
                onValueChange={(val) => setSelectedRole(val as 'DEPARTMENT_HEAD' | 'ASSET_MANAGER')}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select target role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEPARTMENT_HEAD">Department Head</SelectItem>
                  <SelectItem value="ASSET_MANAGER">Asset Manager</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Caution: Role promotion assigns high operational permissions immediately. Department heads manage departmental requests and allocations.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handlePromote} className="bg-primary text-primary-foreground hover:bg-primary/90">Confirm Promotion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
