const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const config = require('../config');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validation/authSchemas');

const router = express.Router();

function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '1d',
  });
}

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const membership = await db('memberships')
      .join('users', 'memberships.user_id', 'users.id')
      .join('tenants', 'memberships.tenant_id', 'tenants.id')
      .where('memberships.user_id', req.user.userId)
      .andWhere('memberships.tenant_id', req.user.tenantId)
      .select(
        'users.id as user_id',
        'users.email',
        'users.full_name',
        'users.is_active',
        'tenants.id as tenant_id',
        'tenants.name as tenant_name',
        'tenants.slug as tenant_slug',
        'tenants.status as tenant_status',
        'memberships.role'
      )
      .first();

    if (!membership || !membership.is_active || membership.tenant_status !== 'active') {
      return res.status(401).json({ error: 'Session is no longer valid' });
    }

    return res.json({
      user: {
        id: membership.user_id,
        email: membership.email,
        fullName: membership.full_name,
      },
      tenant: {
        id: membership.tenant_id,
        name: membership.tenant_name,
        slug: membership.tenant_slug,
        status: membership.tenant_status,
      },
      role: membership.role,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  const { tenantName, tenantSlug, fullName, email, password } = req.body;

  try {
    const result = await db.transaction(async (trx) => {
      const passwordHash = await bcrypt.hash(password, 12);

      const [tenant] = await trx('tenants')
        .insert({
          name: tenantName.trim(),
          slug: tenantSlug,
        })
        .returning(['id', 'name', 'slug', 'status']);

      const [user] = await trx('users')
        .insert({
          email,
          password_hash: passwordHash,
          full_name: fullName.trim(),
        })
        .returning(['id', 'email', 'full_name', 'is_active']);

      const [membership] = await trx('memberships')
        .insert({
          tenant_id: tenant.id,
          user_id: user.id,
          role: 'owner',
        })
        .returning(['role']);

      const token = signToken({
        userId: user.id,
        tenantId: tenant.id,
        role: membership.role,
      });

      return {
        token,
        tenant,
        user,
        role: membership.role,
      };
    });

    return res.status(201).json(result);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Tenant slug or user email already exists' });
    }

    return next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  const { email, password, tenantSlug } = req.body;

  try {
    const membership = await db('memberships')
      .join('users', 'memberships.user_id', 'users.id')
      .join('tenants', 'memberships.tenant_id', 'tenants.id')
      .where('users.email', email)
      .andWhere('tenants.slug', tenantSlug)
      .select(
        'users.id as user_id',
        'users.email',
        'users.full_name',
        'users.password_hash',
        'users.is_active',
        'tenants.id as tenant_id',
        'tenants.name as tenant_name',
        'tenants.slug as tenant_slug',
        'memberships.role'
      )
      .first();

    if (!membership || !membership.is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, membership.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({
      userId: membership.user_id,
      tenantId: membership.tenant_id,
      role: membership.role,
    });

    return res.json({
      token,
      tenant: {
        id: membership.tenant_id,
        name: membership.tenant_name,
        slug: membership.tenant_slug,
      },
      user: {
        id: membership.user_id,
        email: membership.email,
        fullName: membership.full_name,
      },
      role: membership.role,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
