const responseTimeMiddleware = (req, res, next) => {
    const timeDifference = Date.now() - req.startTime;
    res.set("X-Response-Time", `${timeDifference}ms`);
    next();
  };


module.exports = responseTimeMiddleware