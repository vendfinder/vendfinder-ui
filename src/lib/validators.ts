import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('validation.emailInvalid'),
  password: z.string().min(6, 'validation.passwordMin6'),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, 'validation.nameMin2'),
    email: z.string().email('validation.emailInvalid'),
    password: z.string().min(8, 'validation.passwordMin8'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordsDontMatch',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
