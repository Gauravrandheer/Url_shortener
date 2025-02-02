const express = require("express");
const app = express();
const port = 3000;
const sqlite3 = require("sqlite3").verbose();
app.use(express.json());

let db = new sqlite3.Database("./url_shortener", (err) => {
  if (err) {
    return console.error("Database opening error", err.message);
  }

  console.log("connected to sqlite database");
});

app.get("/redirect", (req, res) => {
  const code = req.query.code;

  if (!code) {
    res.status(400).json({ error: "Missing code parameter" });
  }

  res.status(302).redirect("https://example.com/");
});

app.post("/shorten", (req, res) => {
  let long_url = req.body.url;
  let short_code = "asdja";
  if (!long_url) {
    res.status(400).json({ error: "Url is required" });
  }
  res.status(200).json({ status: "shortcode stored", url: long_url });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

module.exports = app;
