const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://37fa398abfe6f30935f97a7e07adaedc@o4508986839597056.ingest.de.sentry.io/4508986843070544",

  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
});


const sentryMiddleware = (req, res, next) => {
  try {
    const start = process.hrtime();

    res.on("finish", () => {
      const diff = process.hrtime(start);
      const responseTime = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(3);

      Sentry.captureMessage("Request Tracked", {
        level: "info",
        extra: {
          method: req.method,
          url: req.url,
          userAgent: req.get("User-Agent"),
          ip: req.ip,
          responseTime: responseTime + "ms",
          statusCode: res.statusCode,
        },
      });
    });

    next();
  } catch (error) {
    Sentry.captureException(error); // Send errors to Sentry
    next(error);
  }
};


module.exports = sentryMiddleware