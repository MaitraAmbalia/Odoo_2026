import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useRegisterAsset } from '../../hooks/useAssets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const assetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  serialNumber: z.string().optional(),
  acquisitionCost: z.coerce.number().optional(),
  condition: z.string().default("GOOD"),
  location: z.string().optional(),
  isBookable: z.boolean().default(false),
});

type AssetFormValues = z.infer<typeof assetSchema>;

interface AssetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AssetDrawer: React.FC<AssetDrawerProps> = ({ open, onOpenChange }) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: { condition: 'GOOD', isBookable: false }
  });

  const registerMutation = useRegisterAsset();

  const onSubmit = (data: any) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    // For files, we would append them here
    registerMutation.mutate(formData, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-surface border-border overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-foreground">Register Asset</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Add a new asset to the inventory. Asset Tag is auto-generated.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Asset Name</Label>
            <Input id="name" {...register('name')} className="bg-background border-border" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select onValueChange={(val) => setValue('categoryId', val)}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cat1">Laptops</SelectItem>
                <SelectItem value="cat2">Monitors</SelectItem>
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="serialNumber">Serial Number</Label>
            <Input id="serialNumber" {...register('serialNumber')} className="bg-background border-border" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select onValueChange={(val) => setValue('condition', val)} defaultValue="GOOD">
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="GOOD">Good</SelectItem>
                <SelectItem value="FAIR">Fair</SelectItem>
                <SelectItem value="POOR">Poor</SelectItem>
                <SelectItem value="DAMAGED">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register('location')} className="bg-background border-border" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acquisitionCost">Acquisition Cost</Label>
            <Input id="acquisitionCost" type="number" {...register('acquisitionCost')} className="bg-background border-border" />
            <p className="text-xs text-muted-foreground">For reporting only, not linked to accounting</p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox" 
              id="isBookable" 
              {...register('isBookable')} 
              className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
            />
            <Label htmlFor="isBookable" className="font-normal cursor-pointer">
              Shared / Bookable Resource
            </Label>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border">
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Saving...' : 'Register'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
