const express = require('express');

const requireAuth = require('../middleware/requireAuth');
const db = require('../db');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const projects = await db('projects')
      .where({ tenant_id: req.user.tenantId })
      .select('id', 'tenant_id', 'name', 'description', 'status', 'created_at', 'updated_at')
      .orderBy('created_at', 'desc');

    return res.json(projects);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const [project] = await db('projects')
      .insert({
        tenant_id: req.user.tenantId,
        name: name.trim(),
        description: description ? description.trim() : null,
      })
      .returning(['id', 'tenant_id', 'name', 'description', 'status', 'created_at', 'updated_at']);

    return res.status(201).json(project);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A project with that name already exists for this tenant' });
    }

    return next(error);
  }
});

module.exports = router;
