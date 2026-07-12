import React, { useState } from 'react';
import { useAssets } from '../../hooks/useAssets';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { AssetDrawer } from './AssetDrawer';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Search } from 'lucide-react';

export const AssetTable: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data, isLoading } = useAssets({ search, status: statusFilter !== 'ALL' ? statusFilter : undefined });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Assets</h1>
        <Button onClick={() => setIsDrawerOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Register Asset
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by tag, name, or serial..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-border w-full max-w-sm"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-background border-border">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="ALLOCATED">Allocated</SelectItem>
            <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
            <SelectItem value="LOST">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tag</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex flex-col items-center">
                    <Package className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-foreground font-medium">No assets match your filters</p>
                    <Button variant="link" onClick={() => { setSearch(''); setStatusFilter('ALL'); }} className="text-primary mt-2">
                      Clear filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((asset) => (
                <TableRow key={asset.id} className="border-border hover:bg-surface-raised cursor-pointer transition-colors">
                  <TableCell className="font-mono text-xs">{asset.assetTag}</TableCell>
                  <TableCell className="font-medium text-foreground">{asset.name}</TableCell>
                  <TableCell className="text-muted-foreground">{asset.category?.name || 'Unknown'}</TableCell>
                  <TableCell className="text-muted-foreground">{asset.location || '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={asset.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AssetDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
    </div>
  );
};
// Quick import addition for Package icon missing above
import { Package } from 'lucide-react';
