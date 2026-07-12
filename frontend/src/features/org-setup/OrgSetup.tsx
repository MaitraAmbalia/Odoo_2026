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
  useDepartments, useCreateDepartment, useUpdateDepartment, useUpdateDepartmentStatus,
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  useEmployees, usePromoteEmployee, useUpdateEmployeeStatus,
} from '../../hooks/useOrgSetup';
import { Plus, Pencil, Trash2, ShieldAlert, Power, PowerOff } from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';

export const OrgSetup: React.FC = () => {
  const { toast } = useToast();
  const { data: depts, isLoading: loadingDepts } = useDepartments();
  const { data: cats, isLoading: loadingCats } = useCategories();
  const { data: employees, isLoading: loadingEmployees } = useEmployees();

  const createDeptMutation = useCreateDepartment();
  const updateDeptMutation = useUpdateDepartment();
  const updateDeptStatusMutation = useUpdateDepartmentStatus();
  const createCatMutation = useCreateCategory();
  const updateCatMutation = useUpdateCategory();
  const deleteCatMutation = useDeleteCategory();
  const promoteMutation = usePromoteEmployee();
  const updateEmpStatusMutation = useUpdateEmployeeStatus();

  const [activeTab, setActiveTab] = useState('departments');

  // Dept dialog
  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptName, setDeptName] = useState('');
  const [deptParent, setDeptParent] = useState<string | null>(null);
  const [deptHead, setDeptHead] = useState<string | null>(null);

  // Cat dialog
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [customFields, setCustomFields] = useState<{ key: string; type: string; label: string; required: boolean }[]>([]);

  // Employee dialogs
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<'DEPARTMENT_HEAD' | 'ASSET_MANAGER' | 'EMPLOYEE'>('EMPLOYEE');

  // ---- Dept handlers ----
  const openCreateDept = () => {
    setEditingDept(null);
    setDeptName(''); setDeptParent(null); setDeptHead(null);
    setIsDeptDialogOpen(true);
  };

  const openEditDept = (dept: any) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptParent(dept.parentDepartmentId || null);
    setDeptHead(dept.headUserId || null);
    setIsDeptDialogOpen(true);
  };

  const handleSaveDept = () => {
    if (!deptName.trim()) return;
    const payload = {
      name: deptName,
      parentDepartmentId: deptParent === 'none' || !deptParent ? null : deptParent,
      headUserId: deptHead === 'none' || !deptHead ? null : deptHead,
    };
    const mutation = editingDept
      ? updateDeptMutation.mutate({ id: editingDept.id, ...payload } as any, {
          onSuccess: () => { toast({ title: 'Updated', description: 'Department updated.' }); setIsDeptDialogOpen(false); },
          onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
        })
      : createDeptMutation.mutate(payload, {
          onSuccess: () => { toast({ title: 'Created', description: 'Department created.' }); setIsDeptDialogOpen(false); },
          onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
        });
    void mutation;
  };

  const handleToggleDeptStatus = (dept: any) => {
    const newStatus = dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateDeptStatusMutation.mutate({ id: dept.id, status: newStatus }, {
      onSuccess: () => toast({ title: 'Updated', description: `Department ${newStatus.toLowerCase()}.` }),
      onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
    });
  };

  // ---- Cat handlers ----
  const openCreateCat = () => {
    setEditingCat(null);
    setCatName(''); setCatDesc(''); setCustomFields([]);
    setIsCatDialogOpen(true);
  };

  const openEditCat = (cat: any) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCustomFields(cat.customFieldsSchema || []);
    setIsCatDialogOpen(true);
  };

  const handleSaveCat = () => {
    if (!catName.trim()) return;
    const payload = { name: catName, description: catDesc || undefined, customFieldsSchema: customFields.length > 0 ? customFields : undefined };
    const mutation = editingCat
      ? updateCatMutation.mutate({ id: editingCat.id, ...payload }, {
          onSuccess: () => { toast({ title: 'Updated', description: 'Category updated.' }); setIsCatDialogOpen(false); },
          onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
        })
      : createCatMutation.mutate(payload, {
          onSuccess: () => { toast({ title: 'Created', description: 'Category created.' }); setIsCatDialogOpen(false); },
          onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
        });
    void mutation;
  };

  const handleDeleteCat = (cat: any) => {
    if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    deleteCatMutation.mutate(cat.id, {
      onSuccess: () => toast({ title: 'Deleted', description: 'Category removed.' }),
      onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
    });
  };

  const addCustomField = () => setCustomFields([...customFields, { key: `field_${Date.now()}`, type: 'text', label: '', required: false }]);
  const updateCustomField = (index: number, field: string, value: any) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'label') updated[index].key = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setCustomFields(updated);
  };
  const removeCustomField = (index: number) => setCustomFields(customFields.filter((_, i) => i !== index));

  // ---- Employee handlers ----
  const handlePromote = () => {
    if (!selectedEmployee) return;
    promoteMutation.mutate({ employeeId: selectedEmployee.id, role: selectedRole }, {
      onSuccess: () => { toast({ title: 'Updated', description: 'Role updated.' }); setIsPromoteDialogOpen(false); },
      onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
    });
  };

  const handleToggleEmpStatus = (emp: any) => {
    const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateEmpStatusMutation.mutate({ employeeId: emp.id, status: newStatus }, {
      onSuccess: () => toast({ title: 'Updated', description: `Employee ${newStatus.toLowerCase()}.` }),
      onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Organization Setup</h1>
        {activeTab === 'departments' && (
          <Button onClick={openCreateDept} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Add Department
          </Button>
        )}
        {activeTab === 'categories' && (
          <Button onClick={openCreateCat} className="bg-primary hover:bg-primary/90 text-primary-foreground">
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

        {/* TAB A — DEPARTMENTS */}
        <TabsContent value="departments">
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Departments Directory</CardTitle>
              <CardDescription className="text-muted-foreground">Create, edit, or deactivate departments.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border bg-background overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Name</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Head</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Parent</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDepts ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : depts?.map((dept) => (
                      <TableRow key={dept.id} className="border-border hover:bg-surface-raised/40">
                        <TableCell className="font-medium text-foreground">{dept.name}</TableCell>
                        <TableCell className="text-muted-foreground">{employees?.find(e => e.id === dept.headUserId)?.name || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{depts?.find(d => d.id === dept.parentDepartmentId)?.name || '—'}</TableCell>
                        <TableCell><StatusBadge status={dept.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEditDept(dept)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              className={`h-7 px-2 ${dept.status === 'ACTIVE' ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'}`}
                              onClick={() => handleToggleDeptStatus(dept)}
                            >
                              {dept.status === 'ACTIVE' ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB B — CATEGORIES */}
        <TabsContent value="categories">
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
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Name</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Description</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Custom Fields</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCats ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : cats?.map((cat) => (
                      <TableRow key={cat.id} className="border-border hover:bg-surface-raised/40">
                        <TableCell className="font-medium text-foreground">{cat.name}</TableCell>
                        <TableCell className="text-muted-foreground">{cat.description || '—'}</TableCell>
                        <TableCell className="text-foreground">{(cat.customFieldsSchema as any[])?.length || 0} fields</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEditCat(cat)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCat(cat)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB C — EMPLOYEES */}
        <TabsContent value="employees">
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Employee Roster</CardTitle>
              <CardDescription className="text-muted-foreground">Manage roles and account statuses. Only Admin can promote roles.</CardDescription>
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
                        <TableCell className="text-muted-foreground">{depts?.find(d => d.id === emp.departmentId)?.name || '—'}</TableCell>
                        <TableCell>
                          <span className="text-xs font-mono bg-surface-raised px-2 py-1 rounded text-foreground">{emp.role}</span>
                        </TableCell>
                        <TableCell><StatusBadge status={emp.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="sm" className="border-border hover:bg-surface-raised text-xs h-7 px-2"
                              onClick={() => { setSelectedEmployee(emp); setSelectedRole(emp.role as any || 'EMPLOYEE'); setIsPromoteDialogOpen(true); }}>
                              <ShieldAlert className="w-3 h-3 mr-1" /> Role
                            </Button>
                            <Button variant="ghost" size="sm"
                              className={`h-7 px-2 ${emp.status === 'ACTIVE' ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'}`}
                              onClick={() => handleToggleEmpStatus(emp)}>
                              {emp.status === 'ACTIVE' ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                            </Button>
                          </div>
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

      {/* DEPT CREATE/EDIT DIALOG */}
      <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
        <DialogContent className="bg-surface border-border sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Configure department hierarchy and leadership.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Department Name</Label>
              <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} className="bg-background border-border" placeholder="e.g. Quality Assurance" />
            </div>
            <div className="space-y-2">
              <Label>Parent Department</Label>
              <Select value={deptParent || 'none'} onValueChange={(v) => setDeptParent(v === 'none' ? null : v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="None (Top Level)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {depts?.filter(d => d.id !== editingDept?.id).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department Head</Label>
              <Select value={deptHead || 'none'} onValueChange={(v) => setDeptHead(v === 'none' ? null : v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="None Assigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None Assigned</SelectItem>
                  {employees?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeptDialogOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleSaveDept} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CATEGORY CREATE/EDIT DIALOG */}
      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent className="bg-surface border-border sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingCat ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Manage category and custom field schema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input value={catName} onChange={(e) => setCatName(e.target.value)} className="bg-background border-border" placeholder="e.g. Electronics" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={catDesc} onChange={(e) => setCatDesc(e.target.value)} className="bg-background border-border" placeholder="e.g. Laptops, Monitors, Cables" />
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-foreground">Custom Fields</span>
                <Button size="sm" variant="outline" onClick={addCustomField} className="border-border text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Add Field</Button>
              </div>
              {customFields.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No custom fields.</p>}
              {customFields.map((field, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-2">
                  <Input value={field.label} onChange={(e) => updateCustomField(idx, 'label', e.target.value)} className="bg-background border-border text-xs flex-1" placeholder="Field Label" />
                  <Select value={field.type} onValueChange={(v) => updateCustomField(idx, 'type', v)}>
                    <SelectTrigger className="w-[90px] bg-background border-border text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap cursor-pointer">
                    <input type="checkbox" checked={field.required} onChange={(e) => updateCustomField(idx, 'required', e.target.checked)} className="accent-primary" />
                    Req.
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => removeCustomField(idx)} className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0">✕</Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCatDialogOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleSaveCat} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editingCat ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PROMOTE ROLE DIALOG */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent className="bg-surface border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-warning" /> Manage Role
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Adjust system role for <strong>{selectedEmployee?.name}</strong>. Current: <span className="font-mono">{selectedEmployee?.role}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as any)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee (Default)</SelectItem>
                  <SelectItem value="DEPARTMENT_HEAD">Department Head</SelectItem>
                  <SelectItem value="ASSET_MANAGER">Asset Manager</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground leading-relaxed">Role promotion assigns operational permissions immediately.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handlePromote} className="bg-primary text-primary-foreground hover:bg-primary/90">Apply Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
