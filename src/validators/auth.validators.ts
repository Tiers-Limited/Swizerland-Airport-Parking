import { z } from 'zod';
import { UserRole } from '../types/roles';

// Base schemas
const emailSchema = z.email('Invalid email address').max(255);
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );
const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(255);
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

const swissIbanSchema = z
  .string()
  .trim()
  .regex(/^CH\d{2}(?:\s?[A-Z0-9]){15,30}$/, 'Invalid Swiss IBAN format')
  .optional()
  .or(z.literal(''));

const swissMwstSchema = z
  .string()
  .trim()
  .regex(/^(?:CHE-)?\d{3}\.\d{3}\.\d{3}(?:\s?(?:MWST|TVA|IVA))?$/i, 'Invalid MWST number format')
  .optional()
  .or(z.literal(''));

// Auth Schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: phoneSchema,
  role: z.enum(UserRole).optional().default(UserRole.CUSTOMER),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// User Management Schemas
export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  emailVerified: z.boolean().optional(),
  role: z.enum(UserRole).optional(),
  status: z.enum(['active', 'suspended', 'deleted', 'pending_verification']).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended']),
  reason: z.string().max(500).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(UserRole),
});

// Host Registration Schema
export const registerHostSchema = z.object({
  companyName: z.string().min(2, 'Company name is required').max(255),
  contactPerson: z.string().max(255).optional(),
  phoneNumber: z.string().max(50).optional(),
  taxId: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  bankIban: swissIbanSchema,
  mwstNumber: swissMwstSchema,
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  facilityOptions: z.union([z.array(z.string()), z.record(z.string(), z.boolean())]).optional(),
  transferService: z.record(z.string(), z.unknown()).optional(),
  photos: z.array(z.string()).max(3).optional(),
  website: z.url().max(255).optional().or(z.literal('')),
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// UUID validation
export const uuidSchema = z.uuid('Invalid ID format');

// Query filters for user listing
export const userListFiltersSchema = paginationSchema.extend({
  role: z.enum(UserRole).optional(),
  status: z.enum(['active', 'suspended', 'deleted', 'pending_verification']).optional(),
  search: z.string().max(255).optional(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type RegisterHostInput = z.infer<typeof registerHostSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type UserListFiltersInput = z.infer<typeof userListFiltersSchema>;
