const { z } = require('zod');

const tenantSlugSchema = z
  .string()
  .trim()
  .min(3, 'tenantSlug must be at least 3 characters long')
  .max(100, 'tenantSlug must be 100 characters or fewer')
  .regex(/^[a-z0-9-]+$/, 'tenantSlug may only contain lowercase letters, numbers, and hyphens');

const passwordSchema = z
  .string()
  .min(8, 'password must be at least 8 characters long')
  .max(128, 'password must be 128 characters or fewer');

const registerSchema = z.object({
  tenantName: z
    .string()
    .trim()
    .min(2, 'tenantName must be at least 2 characters long')
    .max(150, 'tenantName must be 150 characters or fewer'),
  tenantSlug: tenantSlugSchema,
  fullName: z
    .string()
    .trim()
    .min(2, 'fullName must be at least 2 characters long')
    .max(150, 'fullName must be 150 characters or fewer'),
  email: z.email('email must be a valid email address').transform((value) => value.trim().toLowerCase()),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.email('email must be a valid email address').transform((value) => value.trim().toLowerCase()),
  password: passwordSchema,
  tenantSlug: tenantSlugSchema,
});

module.exports = {
  registerSchema,
  loginSchema,
};
