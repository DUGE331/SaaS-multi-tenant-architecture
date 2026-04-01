const config = require('./config');
const app = require('./app');

app.listen(config.serverPort, () => {
  console.log(`API listening on port ${config.serverPort}`);
});
