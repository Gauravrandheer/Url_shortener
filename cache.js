const redis = require("redis");

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient
  .connect()
  .then(async () => {
    console.log("Redis connected!!");

    if (
      process.env.NODE_ENV === "test" ||
      process.env.NODE_ENV === "development"
    ) {
      await redisClient.configSet("maxmemory-policy", "volatile-lfu");
      console.log("Set Eviction Policy to volatile-lfu");
      const policy = await redisClient.configGet("maxmemory-policy");
      console.log("Current Eviction Policy:", policy["maxmemory-policy"]);
    }
  })
  .catch((err) => console.error("Redis Connection Error", err));

module.exports = redisClient;
