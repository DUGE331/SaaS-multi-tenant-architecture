const express = require('express');

const {
  assistantTenantRateLimit,
  assistantUserRateLimit,
} = require('../middleware/assistantRateLimit');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const assistantService = require('../services/assistant/assistantService');
const {
  createKnowledgeEntrySchema,
  sendAssistantMessageSchema,
  updateKnowledgeEntrySchema,
} = require('../validation/assistantSchemas');

const router = express.Router();

router.use(requireAuth);

router.get('/conversations', async (req, res, next) => {
  try {
    const conversations = await assistantService.listConversations(req.user.tenantId, req.user.userId);
    return res.json(conversations);
  } catch (error) {
    return next(error);
  }
});

router.get('/conversations/:conversationId/messages', async (req, res, next) => {
  try {
    const messages = await assistantService.listMessages(
      req.params.conversationId,
      req.user.tenantId,
      req.user.userId
    );

    return res.json(messages);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return next(error);
  }
});

router.post(
  '/chat',
  assistantTenantRateLimit,
  assistantUserRateLimit,
  validate(sendAssistantMessageSchema),
  async (req, res, next) => {
  try {
    const response = await assistantService.sendMessage({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      message: req.body.message,
      conversationId: req.body.conversationId,
    });

    return res.status(201).json(response);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return next(error);
  }
}
);

router.get('/knowledge', requireRole(['owner', 'admin']), async (req, res, next) => {
  try {
    const entries = await assistantService.listKnowledgeEntries(req.user.tenantId);
    return res.json(entries);
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/knowledge',
  requireRole(['owner', 'admin']),
  validate(createKnowledgeEntrySchema),
  async (req, res, next) => {
    try {
      const entry = await assistantService.createKnowledgeEntry({
        tenantId: req.user.tenantId,
        userId: req.user.userId,
        title: req.body.title,
        content: req.body.content,
      });

      return res.status(201).json(entry);
    } catch (error) {
      return next(error);
    }
  }
);

router.patch(
  '/knowledge/:entryId',
  requireRole(['owner', 'admin']),
  validate(updateKnowledgeEntrySchema),
  async (req, res, next) => {
    try {
      const entry = await assistantService.updateKnowledgeEntry({
        tenantId: req.user.tenantId,
        entryId: req.params.entryId,
        title: req.body.title,
        content: req.body.content,
        status: req.body.status,
      });

      return res.json(entry);
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      return next(error);
    }
  }
);

router.delete('/knowledge/:entryId', requireRole(['owner', 'admin']), async (req, res, next) => {
  try {
    await assistantService.deleteKnowledgeEntry({
      tenantId: req.user.tenantId,
      entryId: req.params.entryId,
    });

    return res.status(204).send();
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return next(error);
  }
});

module.exports = router;
