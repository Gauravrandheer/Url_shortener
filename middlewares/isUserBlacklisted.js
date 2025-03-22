const fs = require("fs");
const path = require("path");

const isUserBlacklisted = (req, res, next) => {
  let api_key = req.header("Authorization");

  if (!api_key) {
    return res.status(400).json({ error: "API KEY is Required" });
  }

  fs.readFile(path.join(__dirname,"..", "blacklist.json"), "utf-8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Internal Server error" });
    }

    let blacklistdata = JSON.parse(data);
    if (blacklistdata.includes(api_key)) {
      return res.status(403).json({ error: "Your API key is blacklisted." });
    }

    next();
  });
};

module.exports = isUserBlacklisted