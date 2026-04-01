const cors = require('cors');
const express = require('express');

const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const invitationRoutes = require('./routes/invitations');
const membershipRoutes = require('./routes/memberships');
const projectRoutes = require('./routes/projects');

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/invitations', invitationRoutes);
app.use('/memberships', membershipRoutes);
app.use('/projects', projectRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
