const { z } = require('zod');

const knowledgeStatusSchema = z.enum(['active', 'archived']);

const createKnowledgeEntrySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'title is required')
    .max(160, 'title must be 160 characters or fewer'),
  content: z
    .string()
    .trim()
    .min(1, 'content is required')
    .max(8000, 'content must be 8000 characters or fewer'),
});

const updateKnowledgeEntrySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'title is required')
    .max(160, 'title must be 160 characters or fewer'),
  content: z
    .string()
    .trim()
    .min(1, 'content is required')
    .max(8000, 'content must be 8000 characters or fewer'),
  status: knowledgeStatusSchema,
});

const sendAssistantMessageSchema = z.object({
  conversationId: z.string().uuid('conversationId must be a valid UUID').optional(),
  message: z
    .string()
    .trim()
    .min(1, 'message is required')
    .max(4000, 'message must be 4000 characters or fewer'),
});

module.exports = {
  createKnowledgeEntrySchema,
  sendAssistantMessageSchema,
  updateKnowledgeEntrySchema,
};
