const redis = require("redis");

const redisClient = redis.createClient({
  url: "redis://localhost:6379",
});

redisClient
  .connect()
  .then(() => console.log("Redis connected!!"))
  .catch((err) => console.error("Redis Connection Error", err));

module.exports = redisClient;
