const logMiddlewareTime = (name, middlwareFn) => {
    return async (req, res, next) => {
      const startTime = process.hrtime();
    
      await middlwareFn(req, res, () => {
        const diff = process.hrtime(startTime);
        const executionTime = diff[0] * 1000 + diff[1] / 1e6;
        console.log(`[${name}] Completed in ${executionTime}ms`);
        next();
      });
    };
  };

  module.exports = logMiddlewareTime