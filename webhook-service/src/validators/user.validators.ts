import { z } from 'zod';

// Registration validation schema
export const registerUserValidator = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name must be at most 100 characters long'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z
    .string()
    // Kenyan phone format
    .regex(/^(?:\+254|254|0)(7\d{8})$/, 'Invalid Kenyan phone number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password must be at most 100 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
  role: z.enum(['user', 'admin']).optional().default('user'),
});

// Login validation schema
export const loginUserValidator = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});
