const redisClient = require("../cache");

function checkRateLimiter(limit) {
  return async function (req, res, next) {
    const ip = req.ip;

    const key = `ip_rate_limit:${ip}`;
    const currentCount = await redisClient.incr(key);

    if (currentCount == 1) {
      await redisClient.expire(key, 1);
    }

    if (currentCount > limit) {
      return res
        .status(429)
        .json({ error: "Too many requests. Try again later." });
    }
    next();
  };
}

module.exports = checkRateLimiter;
