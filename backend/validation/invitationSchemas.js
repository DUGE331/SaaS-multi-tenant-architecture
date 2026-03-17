const { z } = require('zod');

const invitationRoleSchema = z.enum(['admin', 'member'], {
  error: 'role must be admin or member',
});

const createInvitationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'fullName must be at least 2 characters long')
    .max(150, 'fullName must be 150 characters or fewer')
    .optional()
    .or(z.literal('')),
  email: z.email('email must be a valid email address').transform((value) => value.trim().toLowerCase()),
  role: invitationRoleSchema,
});

const acceptInvitationSchema = z.object({
  token: z.string().trim().min(20, 'token is required'),
  fullName: z
    .string()
    .trim()
    .min(2, 'fullName must be at least 2 characters long')
    .max(150, 'fullName must be 150 characters or fewer'),
  password: z
    .string()
    .min(8, 'password must be at least 8 characters long')
    .max(128, 'password must be 128 characters or fewer'),
});

module.exports = {
  createInvitationSchema,
  acceptInvitationSchema,
};
