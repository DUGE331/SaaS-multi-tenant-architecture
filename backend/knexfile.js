const config = require('./config');

const baseConfig = {
  client: 'pg',
  connection: config.db,
  migrations: {
    directory: './migrations',
  },
};

module.exports = {
  development: {
    ...baseConfig,
  },
  production: {
    ...baseConfig,
  },
};
