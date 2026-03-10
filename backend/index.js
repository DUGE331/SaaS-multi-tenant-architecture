require('dotenv').config({ path: '../.env' });

const cors = require('cors');
const express = require('express');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projects');

const app = express();
const port = Number(process.env.SERVER_PORT || 5000);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
