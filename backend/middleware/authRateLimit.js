const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again later.',
  },
});

module.exports = authRateLimit;
