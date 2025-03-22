const fs = require("fs");
const path = require("path");

const logMiddleware = (req, res, next) => {
  const logdata = `[${new Date().toISOString()}] ${req.method} ${
    req.url
  } - UserAgent: ${req.get("User-Agent")} - IP: ${req.ip}\n`;

  fs.appendFile(path.join(__dirname,"..", "requests.log"), logdata, (err) => {
    if (err) {
      console.log("Logging Error:", err);
    }
  });
  next();
};

module.exports = logMiddleware