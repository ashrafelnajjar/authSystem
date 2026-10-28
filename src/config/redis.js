const Redis = require("ioredis");

const client = new Redis(process.env.REDIS_URL);

client.on('connect', () => {
  console.log('✅ Connected to Redis successfully!');
});

client.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err.message);
});
module.exports = client;