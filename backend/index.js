const config = require('./config');
const app = require('./app');
const { logger } = require('./logger');

app.listen(config.serverPort, () => {
  logger.info({ port: config.serverPort }, 'API listening');
});
