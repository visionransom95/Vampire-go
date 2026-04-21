const { createClient } = require('redis');
const { REDIS_HOST, REDIS_PORT } = require('./env');

const client = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

client.on('error', (err) => {
  console.error('Redis client error', err);
});

(async () => {
  try {
    await client.connect();
    console.log('Connected to Redis');
  } catch (e) {
    console.error('Failed to connect to Redis', e.message);
  }
})();

module.exports = client;
