import { z } from 'zod';

const CustomFieldItemSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric or snake_case'),
  type: z.enum(['text', 'number', 'date', 'boolean']),
  label: z.string().min(1, 'Label is required'),
  required: z.boolean(),
});

export const CreateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    customFieldsSchema: z.array(CustomFieldItemSchema)
      .refine((fields: any[]) => {
        const keys = fields.map((f: any) => f.key);
        return new Set(keys).size === keys.length;
      }, { message: 'Custom field keys must be unique' })
      .optional(),
  }),
});

export const UpdateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    description: z.string().optional(),
    customFieldsSchema: z.array(CustomFieldItemSchema)
      .refine((fields: any[]) => {
        const keys = fields.map((f: any) => f.key);
        return new Set(keys).size === keys.length;
      }, { message: 'Custom field keys must be unique' })
      .optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>['body'];
export type CustomFieldItem = z.infer<typeof CustomFieldItemSchema>;
