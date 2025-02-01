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

  if (code) {
    res.redirect("https:google.com");
  } else {
    res.json({ error: "Missing code parameter" });
  }
});

app.post("/shorten", (req, res) => {
  let long_url = req.body;

  let short_code = "asdja";
  res.json({ result: short_code });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
