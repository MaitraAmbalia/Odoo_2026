import { z } from 'zod';

export const SignupSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    departmentId: z.string().uuid().optional(),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const ForgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const ResetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export type SignupInput = z.infer<typeof SignupSchema>['body'];
export type LoginInput = z.infer<typeof LoginSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>['body'];
