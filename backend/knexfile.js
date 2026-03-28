const config = require('./config');

module.exports = {
  development: {
    client: 'pg',
    connection: config.db,
    migrations: {
      directory: './migrations',
    },
  },
};
