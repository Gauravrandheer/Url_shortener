const redisClient = require("../cache")

function apiKeyRateLimiter(limit,route){
  return async function(req,res,next){

    let api_key = req.header("Authorization");

    if (!api_key) {
      return res.status(400).json({ error: "API KEY is Required" });
    }

    const redisKey = `api_rate_limit:${route}:${api_key}`

    const currentCount = await redisClient.incr(redisKey)
    console.log("Count for key", currentCount);
    if(currentCount == 1){
        await redisClient.expire(redisKey,1)

    }

    if(currentCount>limit){
        return res.status(429).json({error:"Too many requests. Please try again later."})
    }

    next()
  }

}

module.exports = apiKeyRateLimiter