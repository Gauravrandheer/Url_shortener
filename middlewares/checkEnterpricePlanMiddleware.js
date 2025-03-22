
const checkEnterpricePlanMiddleware = (req, res, next) => {
    const user = req.user;
  
    if (!user.tier || user.tier !== "enterprise") {
      return res.status(403).json({
        error: "Bulk shortening is only available for enterprise users",
      });
    }
  
    next();
  };


  module.exports = checkEnterpricePlanMiddleware