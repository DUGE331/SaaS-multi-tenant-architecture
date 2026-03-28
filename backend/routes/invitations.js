const crypto = require('crypto');

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const config = require('../config');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { createInvitationSchema, acceptInvitationSchema } = require('../validation/invitationSchemas');

const router = express.Router();

function buildInvitationLink(token) {
  const frontendUrl = config.frontendUrl;
  return `${frontendUrl.replace(/\/$/, '')}/accept-invite?token=${token}`;
}

function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '1d',
  });
}

router.get('/token/:token', async (req, res, next) => {
  try {
    const invitation = await db('invitations')
      .join('tenants', 'invitations.tenant_id', 'tenants.id')
      .where('invitations.token', req.params.token)
      .select(
        'invitations.id',
        'invitations.email',
        'invitations.full_name',
        'invitations.role',
        'invitations.expires_at',
        'invitations.accepted_at',
        'tenants.id as tenant_id',
        'tenants.name as tenant_name',
        'tenants.slug as tenant_slug'
      )
      .first();

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.accepted_at) {
      return res.status(410).json({ error: 'Invitation has already been accepted' });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Invitation has expired' });
    }

    return res.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        fullName: invitation.full_name,
        role: invitation.role,
        expiresAt: invitation.expires_at,
      },
      tenant: {
        id: invitation.tenant_id,
        name: invitation.tenant_name,
        slug: invitation.tenant_slug,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/accept', validate(acceptInvitationSchema), async (req, res, next) => {
  const { token: invitationToken, fullName, password } = req.body;

  try {
    const result = await db.transaction(async (trx) => {
      const invitation = await trx('invitations')
        .join('tenants', 'invitations.tenant_id', 'tenants.id')
        .where('invitations.token', invitationToken)
        .select(
          'invitations.id',
          'invitations.tenant_id',
          'invitations.email',
          'invitations.role',
          'invitations.expires_at',
          'invitations.accepted_at',
          'tenants.name as tenant_name',
          'tenants.slug as tenant_slug'
        )
        .first();

      if (!invitation) {
        const error = new Error('Invitation not found');
        error.statusCode = 404;
        throw error;
      }

      if (invitation.accepted_at) {
        const error = new Error('Invitation has already been accepted');
        error.statusCode = 410;
        throw error;
      }

      if (new Date(invitation.expires_at) < new Date()) {
        const error = new Error('Invitation has expired');
        error.statusCode = 410;
        throw error;
      }

      let user = await trx('users').where({ email: invitation.email }).first();

      if (!user) {
        const passwordHash = await bcrypt.hash(password, 12);

        [user] = await trx('users')
          .insert({
            email: invitation.email,
            password_hash: passwordHash,
            full_name: fullName,
          })
          .returning(['id', 'email', 'full_name', 'is_active']);
      } else {
        await trx('users')
          .where({ id: user.id })
          .update({
            full_name: fullName,
            password_hash: await bcrypt.hash(password, 12),
            updated_at: trx.fn.now(),
          });

        user = await trx('users').where({ id: user.id }).first();
      }

      const existingMembership = await trx('memberships')
        .where({
          tenant_id: invitation.tenant_id,
          user_id: user.id,
        })
        .first();

      if (existingMembership) {
        const error = new Error('User already belongs to this tenant');
        error.statusCode = 409;
        throw error;
      }

      const [membership] = await trx('memberships')
        .insert({
          tenant_id: invitation.tenant_id,
          user_id: user.id,
          role: invitation.role,
        })
        .returning(['role']);

      await trx('invitations')
        .where({ id: invitation.id })
        .update({
          accepted_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        });

      return {
        user,
        tenant: {
          id: invitation.tenant_id,
          name: invitation.tenant_name,
          slug: invitation.tenant_slug,
        },
        role: membership.role,
      };
    });

    const authToken = signToken({
      userId: result.user.id,
      tenantId: result.tenant.id,
      role: result.role,
    });

    return res.status(201).json({
      token: authToken,
      ...result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return next(error);
  }
});

router.use(requireAuth);
router.use(requireRole(['owner', 'admin']));

router.get('/', async (req, res, next) => {
  try {
    const invitations = await db('invitations')
      .where('tenant_id', req.user.tenantId)
      .select('id', 'email', 'full_name', 'role', 'token', 'expires_at', 'accepted_at', 'created_at')
      .orderBy('created_at', 'desc');

    return res.json(
      invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        full_name: invitation.full_name,
        role: invitation.role,
        expires_at: invitation.expires_at,
        accepted_at: invitation.accepted_at,
        created_at: invitation.created_at,
        invitation_link: buildInvitationLink(invitation.token),
      }))
    );
  } catch (error) {
    return next(error);
  }
});

router.post('/', validate(createInvitationSchema), async (req, res, next) => {
  const { fullName, email, role } = req.body;

  try {
    const existingMembership = await db('memberships')
      .join('users', 'memberships.user_id', 'users.id')
      .where('memberships.tenant_id', req.user.tenantId)
      .andWhere('users.email', email)
      .first();

    if (existingMembership) {
      return res.status(409).json({ error: 'This user already belongs to the tenant' });
    }

    const activeInvitation = await db('invitations')
      .where({
        tenant_id: req.user.tenantId,
        email,
      })
      .whereNull('accepted_at')
      .andWhere('expires_at', '>', db.fn.now())
      .first();

    if (activeInvitation) {
      return res.status(409).json({ error: 'An active invitation already exists for this email' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const [invitation] = await db('invitations')
      .insert({
        tenant_id: req.user.tenantId,
        invited_by_user_id: req.user.userId,
        email,
        full_name: fullName || null,
        role,
        token,
        expires_at: expiresAt,
      })
      .returning(['id', 'email', 'full_name', 'role', 'expires_at', 'accepted_at', 'created_at']);

    return res.status(201).json({
      ...invitation,
      invitation_link: buildInvitationLink(token),
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:invitationId', async (req, res, next) => {
  try {
    const invitation = await db('invitations')
      .where({
        id: req.params.invitationId,
        tenant_id: req.user.tenantId,
      })
      .first();

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.accepted_at) {
      return res.status(400).json({ error: 'Accepted invitations cannot be revoked' });
    }

    await db('invitations')
      .where({
        id: req.params.invitationId,
        tenant_id: req.user.tenantId,
      })
      .del();

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
