
let redisClient;

if (process.env.USE_UPSTASH === "true") {
  const { Redis } = require("@upstash/redis");
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log("Using Upstash Redis");
} else {
  const redis = require("redis");
  redisClient = redis.createClient({
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
 
}






module.exports = redisClient;
