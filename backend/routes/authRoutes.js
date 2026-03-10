const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../db');

const router = express.Router();

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret-change-me', {
    expiresIn: '1d',
  });
}

router.post('/register', async (req, res, next) => {
  const { tenantName, tenantSlug, fullName, email, password } = req.body;

  if (!tenantName || !tenantSlug || !fullName || !email || !password) {
    return res.status(400).json({
      error: 'tenantName, tenantSlug, fullName, email, and password are required',
    });
  }

  try {
    const result = await db.transaction(async (trx) => {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedSlug = tenantSlug.trim().toLowerCase();
      const passwordHash = await bcrypt.hash(password, 12);

      const [tenant] = await trx('tenants')
        .insert({
          name: tenantName.trim(),
          slug: normalizedSlug,
        })
        .returning(['id', 'name', 'slug', 'status']);

      const [user] = await trx('users')
        .insert({
          email: normalizedEmail,
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

router.post('/login', async (req, res, next) => {
  const { email, password, tenantSlug } = req.body;

  if (!email || !password || !tenantSlug) {
    return res.status(400).json({ error: 'email, password, and tenantSlug are required' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedSlug = tenantSlug.trim().toLowerCase();

    const membership = await db('memberships')
      .join('users', 'memberships.user_id', 'users.id')
      .join('tenants', 'memberships.tenant_id', 'tenants.id')
      .where('users.email', normalizedEmail)
      .andWhere('tenants.slug', normalizedSlug)
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
