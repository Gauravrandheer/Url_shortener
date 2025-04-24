const redisClient = require("../cache")
const prisma = require("../prismaClient")

const TIER_LIMITS = {
    free:{window:60,maxRequest:5},
    hobby:{window:60,maxRequest:100},
    enterprise:{window:60,maxRequest:1000},
}

async function tierRateLimiter(req,res,next){
   
    const api_key = req.header("Authorization")

    if(!api_key){
        return res.status(400).json({ error: "API KEY is Required" });
    }
   
    const user = await prisma.users.findUnique({
        where:{
            api_key:api_key,
        }
    })

    const tier = user.tier
    const limit = TIER_LIMITS[tier]

    const key = `tier_rate_limit:${api_key}`
    const currentCount = await redisClient.incr(key)

    if(currentCount==1){
        await redisClient.expire(key,limit.window)
    }

    if(currentCount>limit.maxRequest){
        return res.status(429).json({error:"Too many requests. Please try again later."})
    }

    next()
}


module.exports = tierRateLimiter