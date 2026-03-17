const express = require('express');
const bcrypt = require('bcryptjs');

const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { createMemberSchema, updateMemberRoleSchema } = require('../validation/memberSchemas');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['owner', 'admin']));

router.get('/', async (req, res, next) => {
  try {
    const members = await db('memberships')
      .join('users', 'memberships.user_id', 'users.id')
      .where('memberships.tenant_id', req.user.tenantId)
      .select(
        'memberships.id',
        'memberships.role',
        'memberships.created_at',
        'users.id as user_id',
        'users.full_name',
        'users.email',
        'users.is_active'
      )
      .orderBy('memberships.created_at', 'asc');

    return res.json(members);
  } catch (error) {
    return next(error);
  }
});

router.post('/', validate(createMemberSchema), async (req, res, next) => {
  const { fullName, email, password, role } = req.body;

  try {
    if (req.user.role !== 'owner' && role === 'owner') {
      return res.status(403).json({ error: 'Only owners can assign the owner role' });
    }

    const createdMember = await db.transaction(async (trx) => {
      const existingUser = await trx('users').where({ email }).first();

      if (existingUser) {
        const existingMembership = await trx('memberships')
          .where({
            tenant_id: req.user.tenantId,
            user_id: existingUser.id,
          })
          .first();

        if (existingMembership) {
          const conflictError = new Error('This user already belongs to the tenant');
          conflictError.statusCode = 409;
          throw conflictError;
        }

        const [membership] = await trx('memberships')
          .insert({
            tenant_id: req.user.tenantId,
            user_id: existingUser.id,
            role,
          })
          .returning(['id', 'role', 'created_at']);

        return {
          id: membership.id,
          role: membership.role,
          created_at: membership.created_at,
          user_id: existingUser.id,
          full_name: existingUser.full_name,
          email: existingUser.email,
          is_active: existingUser.is_active,
        };
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [user] = await trx('users')
        .insert({
          email,
          password_hash: passwordHash,
          full_name: fullName,
        })
        .returning(['id', 'full_name', 'email', 'is_active']);

      const [membership] = await trx('memberships')
        .insert({
          tenant_id: req.user.tenantId,
          user_id: user.id,
          role,
        })
        .returning(['id', 'role', 'created_at']);

      return {
        id: membership.id,
        role: membership.role,
        created_at: membership.created_at,
        user_id: user.id,
        full_name: user.full_name,
        email: user.email,
        is_active: user.is_active,
      };
    });

    return res.status(201).json(createdMember);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    if (error.code === '23505') {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }

    return next(error);
  }
});

router.patch('/:membershipId', validate(updateMemberRoleSchema), async (req, res, next) => {
  const { membershipId } = req.params;
  const { role } = req.body;

  try {
    const membership = await db('memberships')
      .join('users', 'memberships.user_id', 'users.id')
      .where('memberships.id', membershipId)
      .andWhere('memberships.tenant_id', req.user.tenantId)
      .select(
        'memberships.id',
        'memberships.user_id',
        'memberships.role',
        'memberships.created_at',
        'users.full_name',
        'users.email',
        'users.is_active'
      )
      .first();

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    if (req.user.role !== 'owner' && membership.role === 'owner') {
      return res.status(403).json({ error: 'Only owners can manage owner memberships' });
    }

    if (req.user.role !== 'owner' && role === 'owner') {
      return res.status(403).json({ error: 'Only owners can assign the owner role' });
    }

    if (membership.user_id === req.user.userId && role !== 'owner') {
      return res.status(400).json({ error: 'You cannot demote your own owner membership' });
    }

    const [updatedMembership] = await db('memberships')
      .where({
        id: membershipId,
        tenant_id: req.user.tenantId,
      })
      .update({
        role,
        updated_at: db.fn.now(),
      })
      .returning(['id', 'user_id', 'role', 'created_at']);

    return res.json({
      id: updatedMembership.id,
      user_id: updatedMembership.user_id,
      role: updatedMembership.role,
      created_at: updatedMembership.created_at,
      full_name: membership.full_name,
      email: membership.email,
      is_active: membership.is_active,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:membershipId', async (req, res, next) => {
  const { membershipId } = req.params;

  try {
    const membership = await db('memberships')
      .where({
        id: membershipId,
        tenant_id: req.user.tenantId,
      })
      .first();

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    if (req.user.role !== 'owner' && membership.role === 'owner') {
      return res.status(403).json({ error: 'Only owners can remove owner memberships' });
    }

    if (membership.user_id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot remove your own membership' });
    }

    await db('memberships')
      .where({
        id: membershipId,
        tenant_id: req.user.tenantId,
      })
      .del();

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
