const  requestTimeMiddleware= (req, res, next) => {
    req.startTime = Date.now();
   
    next();
  };


  module.exports = requestTimeMiddleware