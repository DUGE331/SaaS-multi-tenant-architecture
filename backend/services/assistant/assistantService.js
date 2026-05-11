const config = require('../../config');
const db = require('../../db');
const { logger } = require('../../logger');
const { BedrockAssistantProvider } = require('./providers/bedrockProvider');

const suspiciousPromptPatterns = [
  /ignore (all|any|previous|prior) instructions/i,
  /reveal (the )?(system|hidden|developer) prompt/i,
  /show .*environment variables/i,
  /print .*secret/i,
  /show .*api key/i,
  /show .*token/i,
  /list .*other tenants?/i,
  /bypass .*security/i,
];

async function recordUsageEvent({
  tenantId,
  userId,
  conversationId = null,
  provider = config.ai.provider || null,
  modelId = config.ai.bedrockModelId || null,
  status,
  errorCode = null,
  requestCharCount = 0,
  responseCharCount = 0,
}) {
  try {
    await db('assistant_usage_events').insert({
      tenant_id: tenantId,
      user_id: userId,
      conversation_id: conversationId,
      provider,
      model_id: modelId,
      status,
      error_code: errorCode,
      request_char_count: requestCharCount,
      response_char_count: responseCharCount,
    });
  } catch (error) {
    logger.warn(
      {
        err: {
          message: error.message,
          name: error.name,
        },
        tenantId,
        userId,
        status,
      },
      'Assistant usage event persistence failed'
    );
  }
}

function buildConversationTitle(message) {
  const normalized = message.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return 'New conversation';
  }

  return normalized.length > 80 ? `${normalized.slice(0, 77)}...` : normalized;
}

function buildAuthorizedContext({ tenantName, knowledgeEntries, projects }) {
  const knowledgeSection = knowledgeEntries.length
    ? knowledgeEntries
        .map((entry, index) => `${index + 1}. ${entry.title}\n${entry.content}`)
        .join('\n\n')
    : 'No curated tenant knowledge entries are available.';

  const projectSection = projects.length
    ? projects
        .map((project, index) => `${index + 1}. ${project.name}${project.description ? ` - ${project.description}` : ''}`)
        .join('\n')
    : 'No active projects were found for this tenant.';

  return [
    `Tenant name: ${tenantName}`,
    '',
    'Curated workspace knowledge:',
    knowledgeSection,
    '',
    'Current tenant projects:',
    projectSection,
  ].join('\n');
}

function getAssistantProvider() {
  try {
    switch (config.ai.provider) {
      case 'bedrock':
        return new BedrockAssistantProvider();
      default: {
        const error = new Error(`Unsupported AI provider: ${config.ai.provider}`);
        error.statusCode = 503;
        throw error;
      }
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 503;
    }

    throw error;
  }
}

function assertPromptLooksSafe(message) {
  const matchedPattern = suspiciousPromptPatterns.find((pattern) => pattern.test(message));

  if (!matchedPattern) {
    return;
  }

  const error = new Error(
    'The assistant cannot process requests that attempt to override instructions or access restricted system data.'
  );
  error.statusCode = 400;
  throw error;
}

async function enforceTenantDailyUsageLimit(tenantId) {
  const result = await db('assistant_messages')
    .where({
      tenant_id: tenantId,
      role: 'user',
    })
    .andWhere('created_at', '>=', db.raw("date_trunc('day', now())"))
    .count('* as total')
    .first();

  const totalRequestsToday = Number(result?.total || 0);

  if (totalRequestsToday < config.ai.maxTenantRequestsPerDay) {
    return;
  }

  const error = new Error(
    'This tenant has reached its daily assistant usage limit. Please try again tomorrow or raise the quota intentionally.'
  );
  error.statusCode = 429;
  throw error;
}

async function getConversationForUser(conversationId, tenantId, userId) {
  const conversation = await db('assistant_conversations')
    .where({
      id: conversationId,
      tenant_id: tenantId,
      created_by_user_id: userId,
    })
    .first();

  if (!conversation) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    throw error;
  }

  return conversation;
}

async function getTenantContext(tenantId) {
  const [tenant, knowledgeEntries, projects] = await Promise.all([
    db('tenants').where({ id: tenantId }).select('id', 'name').first(),
    db('assistant_knowledge_entries')
      .where({ tenant_id: tenantId, status: 'active' })
      .select('id', 'title', 'content', 'updated_at')
      .orderBy('updated_at', 'desc')
      .limit(config.ai.maxKnowledgeItems),
    db('projects')
      .where({ tenant_id: tenantId, status: 'active' })
      .select('id', 'name', 'description', 'updated_at')
      .orderBy('updated_at', 'desc')
      .limit(10),
  ]);

  if (!tenant) {
    const error = new Error('Tenant not found');
    error.statusCode = 404;
    throw error;
  }

  return buildAuthorizedContext({
    tenantName: tenant.name,
    knowledgeEntries,
    projects,
  });
}

async function listConversations(tenantId, userId) {
  return db('assistant_conversations')
    .where({
      tenant_id: tenantId,
      created_by_user_id: userId,
    })
    .select('id', 'title', 'last_message_at', 'created_at', 'updated_at')
    .orderBy('last_message_at', 'desc');
}

async function listMessages(conversationId, tenantId, userId) {
  await getConversationForUser(conversationId, tenantId, userId);

  return db('assistant_messages')
    .where({
      conversation_id: conversationId,
      tenant_id: tenantId,
    })
    .select('id', 'role', 'content', 'provider', 'model_id', 'created_at')
    .orderBy('created_at', 'asc');
}

async function sendMessage({ tenantId, userId, message, conversationId }) {
  if (!config.ai.enabled) {
    await recordUsageEvent({
      tenantId,
      userId,
      conversationId,
      status: 'blocked_disabled',
      errorCode: 'assistant_disabled',
      requestCharCount: message.length,
    });

    const error = new Error('The internal AI assistant is not enabled in this environment');
    error.statusCode = 503;
    throw error;
  }

  try {
    assertPromptLooksSafe(message);
  } catch (error) {
    await recordUsageEvent({
      tenantId,
      userId,
      conversationId,
      status: 'blocked_prompt',
      errorCode: 'prompt_rejected',
      requestCharCount: message.length,
    });
    throw error;
  }

  try {
    await enforceTenantDailyUsageLimit(tenantId);
  } catch (error) {
    await recordUsageEvent({
      tenantId,
      userId,
      conversationId,
      status: 'blocked_quota',
      errorCode: 'tenant_daily_limit',
      requestCharCount: message.length,
    });
    throw error;
  }

  const provider = getAssistantProvider();
  const authorizedContext = await getTenantContext(tenantId);
  let persistedConversationId = conversationId || null;

  const result = await db.transaction(async (trx) => {
    let conversation;

    if (conversationId) {
      conversation = await trx('assistant_conversations')
        .where({
          id: conversationId,
          tenant_id: tenantId,
          created_by_user_id: userId,
        })
        .first();

      if (!conversation) {
        await recordUsageEvent({
          tenantId,
          userId,
          conversationId,
          status: 'blocked_not_found',
          errorCode: 'conversation_not_found',
          requestCharCount: message.length,
        });
        const error = new Error('Conversation not found');
        error.statusCode = 404;
        throw error;
      }
    } else {
      [conversation] = await trx('assistant_conversations')
        .insert({
          tenant_id: tenantId,
          created_by_user_id: userId,
          title: buildConversationTitle(message),
        })
        .returning(['id', 'tenant_id', 'created_by_user_id', 'title', 'last_message_at', 'created_at', 'updated_at']);
    }

    persistedConversationId = conversation.id;

    const existingMessages = await trx('assistant_messages')
      .where({
        conversation_id: conversation.id,
        tenant_id: tenantId,
      })
      .select('role', 'content', 'created_at')
      .orderBy('created_at', 'asc')
      .limit(config.ai.maxInputMessages);

    const [userMessageRecord] = await trx('assistant_messages')
      .insert({
        conversation_id: conversation.id,
        tenant_id: tenantId,
        created_by_user_id: userId,
        role: 'user',
        content: message,
      })
      .returning(['id', 'role', 'content', 'provider', 'model_id', 'created_at']);

    let providerReply;

    try {
      providerReply = await provider.generateReply({
        authorizedContext,
        conversationHistory: existingMessages,
        userMessage: message,
      });
    } catch (error) {
      logger.error(
        {
          err: {
            message: error.message,
            name: error.name,
          },
          provider: config.ai.provider,
          tenantId,
          userId,
        },
        'Assistant provider request failed'
      );

      await recordUsageEvent({
        tenantId,
        userId,
        conversationId: conversation.id,
        status: 'provider_error',
        errorCode: 'provider_failed',
        requestCharCount: message.length,
      });

      const wrappedError = new Error('The assistant could not generate a response');
      wrappedError.statusCode = 502;
      throw wrappedError;
    }

    const [assistantMessageRecord] = await trx('assistant_messages')
      .insert({
        conversation_id: conversation.id,
        tenant_id: tenantId,
        role: 'assistant',
        content: providerReply.content,
        provider: providerReply.provider,
        model_id: providerReply.modelId,
      })
      .returning(['id', 'role', 'content', 'provider', 'model_id', 'created_at']);

    const [updatedConversation] = await trx('assistant_conversations')
      .where({ id: conversation.id })
      .update({
        last_message_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning(['id', 'title', 'last_message_at', 'created_at', 'updated_at']);

    return {
      conversation: updatedConversation,
      userMessage: userMessageRecord,
      assistantMessage: assistantMessageRecord,
    };
  });

  await recordUsageEvent({
    tenantId,
    userId,
    conversationId: persistedConversationId,
    provider: result.assistantMessage.provider,
    modelId: result.assistantMessage.model_id,
    status: 'success',
    requestCharCount: message.length,
    responseCharCount: result.assistantMessage.content.length,
  });

  return result;
}

async function listKnowledgeEntries(tenantId) {
  return db('assistant_knowledge_entries')
    .join('users', 'assistant_knowledge_entries.created_by_user_id', 'users.id')
    .where('assistant_knowledge_entries.tenant_id', tenantId)
    .select(
      'assistant_knowledge_entries.id',
      'assistant_knowledge_entries.title',
      'assistant_knowledge_entries.content',
      'assistant_knowledge_entries.status',
      'assistant_knowledge_entries.created_at',
      'assistant_knowledge_entries.updated_at',
      'users.full_name as created_by_name'
    )
    .orderBy('assistant_knowledge_entries.updated_at', 'desc');
}

async function createKnowledgeEntry({ tenantId, userId, title, content }) {
  const [entry] = await db('assistant_knowledge_entries')
    .insert({
      tenant_id: tenantId,
      created_by_user_id: userId,
      title,
      content,
    })
    .returning(['id', 'title', 'content', 'status', 'created_at', 'updated_at']);

  return entry;
}

async function updateKnowledgeEntry({ tenantId, entryId, title, content, status }) {
  const existingEntry = await db('assistant_knowledge_entries')
    .where({
      id: entryId,
      tenant_id: tenantId,
    })
    .first();

  if (!existingEntry) {
    const error = new Error('Knowledge entry not found');
    error.statusCode = 404;
    throw error;
  }

  const [entry] = await db('assistant_knowledge_entries')
    .where({
      id: entryId,
      tenant_id: tenantId,
    })
    .update({
      title,
      content,
      status,
      updated_at: db.fn.now(),
    })
    .returning(['id', 'title', 'content', 'status', 'created_at', 'updated_at']);

  return entry;
}

async function deleteKnowledgeEntry({ tenantId, entryId }) {
  const deletedCount = await db('assistant_knowledge_entries')
    .where({
      id: entryId,
      tenant_id: tenantId,
    })
    .del();

  if (!deletedCount) {
    const error = new Error('Knowledge entry not found');
    error.statusCode = 404;
    throw error;
  }
}

module.exports = {
  createKnowledgeEntry,
  deleteKnowledgeEntry,
  listConversations,
  listKnowledgeEntries,
  listMessages,
  sendMessage,
  updateKnowledgeEntry,
};
