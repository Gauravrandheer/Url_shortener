const redisClient = require("../cache")

const checkRateLimiter = async (req,res,next)=>{
  const ip = req.ip

  const key = `rate_limit:${ip}`
  const currentCount = await redisClient.incr(key)

  if(currentCount ===1){
    await redisClient.expire(key,60)
  }
  
  if(currentCount > 100){
    return res.status(429).json({error:"Too many requests. Try again later."})
  }
  next()

}


module.exports = checkRateLimiter