const retry = require("async-retry");

const prismaRetry = async (fn) => {
  return retry(async (bail, attempt) => {
      try {
        console.log("prisma retry");
        return await fn();
      } catch (err) {
        if (err.code === "P2002" || err.code === "P2025") {
          bail(err);
          return;
        }
        console.warn(`Retry attempt ${attempt} failed:`, err.message);
        throw err;
      }
    },
    {
      retries: 3,
      minTimeout: 100,
      maxTimeout: 1000,
      factor: 2,
    }
  );
};

module.exports = { prismaRetry };
