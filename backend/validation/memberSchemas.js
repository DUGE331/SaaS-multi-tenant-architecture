const { z } = require('zod');

const memberRoleSchema = z.enum(['owner', 'admin', 'member'], {
  error: 'role must be owner, admin, or member',
});

const createMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'fullName must be at least 2 characters long')
    .max(150, 'fullName must be 150 characters or fewer'),
  email: z.email('email must be a valid email address').transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(8, 'password must be at least 8 characters long')
    .max(128, 'password must be 128 characters or fewer'),
  role: memberRoleSchema,
});

const updateMemberRoleSchema = z.object({
  role: memberRoleSchema,
});

module.exports = {
  createMemberSchema,
  updateMemberRoleSchema,
};
