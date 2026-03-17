const { z } = require('zod');

const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'name is required')
    .max(150, 'name must be 150 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(2000, 'description must be 2000 characters or fewer')
    .optional()
    .nullable(),
});

module.exports = {
  createProjectSchema,
};
