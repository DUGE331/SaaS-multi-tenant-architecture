exports.up = async function up(knex) {
  await knex.schema.createTable('assistant_knowledge_entries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('tenant_id')
      .notNullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');
    table
      .uuid('created_by_user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('title', 160).notNullable();
    table.text('content').notNullable();
    table.string('status', 30).notNullable().defaultTo('active');
    table.timestamps(true, true);

    table.index(['tenant_id']);
    table.index(['tenant_id', 'status']);
  });

  await knex.schema.createTable('assistant_conversations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('tenant_id')
      .notNullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');
    table
      .uuid('created_by_user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('title', 160).notNullable();
    table.timestamp('last_message_at').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.index(['tenant_id']);
    table.index(['tenant_id', 'created_by_user_id']);
    table.index(['tenant_id', 'last_message_at']);
  });

  await knex.schema.createTable('assistant_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('conversation_id')
      .notNullable()
      .references('id')
      .inTable('assistant_conversations')
      .onDelete('CASCADE');
    table
      .uuid('tenant_id')
      .notNullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');
    table
      .uuid('created_by_user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.enu('role', ['user', 'assistant']).notNullable();
    table.text('content').notNullable();
    table.string('provider', 30);
    table.string('model_id', 160);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['conversation_id']);
    table.index(['tenant_id', 'conversation_id']);
    table.index(['tenant_id', 'created_at']);
  });

  await knex.schema.createTable('assistant_usage_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('tenant_id')
      .notNullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');
    table
      .uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .uuid('conversation_id')
      .references('id')
      .inTable('assistant_conversations')
      .onDelete('SET NULL');
    table.string('provider', 30);
    table.string('model_id', 160);
    table.string('status', 30).notNullable();
    table.string('error_code', 80);
    table.integer('request_char_count').notNullable().defaultTo(0);
    table.integer('response_char_count').notNullable().defaultTo(0);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['tenant_id', 'created_at']);
    table.index(['tenant_id', 'status']);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('assistant_usage_events');
  await knex.schema.dropTableIfExists('assistant_messages');
  await knex.schema.dropTableIfExists('assistant_conversations');
  await knex.schema.dropTableIfExists('assistant_knowledge_entries');
};
