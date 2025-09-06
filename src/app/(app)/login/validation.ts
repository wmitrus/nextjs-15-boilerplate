import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .email()
    .min(1, 'Email is required')
    .max(254, 'Email cannot exceed 254 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z
    .object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
    })
    .optional(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
