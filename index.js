const express = require("express");
const { nanoid } = require("nanoid");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 3000;

app.use(express.json());

let db = new sqlite3.Database("./url_shortener", (err) => {
  if (err) {
    return console.error("Database opening error", err.message);
  }

  console.log("connected to sqlite database");
});

//create table

db.run(
  "Create Table IF NOT EXISTS url_shortener(id INTEGER PRIMARY KEY AUTOINCREMENT, original_url TEXT NOT NULL, short_code TEXT NOT NULL UNIQUE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  )",
  (err) => {
    if (err) {
      console.error("ERROR CREATING TABLE", err);
    } else {
      console.log("Table succesfully created");
    }
  }
);

//generateshortcode

function generateShortCode() {
  return nanoid(6);
}

//redirect

app.get("/redirect", (req, res) => {
  const code = req.query.code;

  if (!code) {
   return res.status(400).json({ error: "Missing code parameter" });
  }

  db.get(
    "Select original_url from url_shortener where short_code = ? ",
    [code],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (row) {
        res.status(302).redirect(row.original_url);
      } else {
        res.status(404).json({ error: "URL NOT FOUND" });
      }
    }
  );
});

// Shorten
app.post("/shorten", (req, res) => {
  let long_url = req.body.url;

  if (!long_url) {
    return res.status(400).json({ error: "Url is required" });
  }

  const short_code = generateShortCode();

  db.run(
    "INSERT INTO url_shortener (short_code, original_url) VALUES (?,?)",
    [short_code, long_url],
    (err) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      const my_short_url = `http://localhost:${port}/redirect?code=${short_code}`;

      return res.status(200).json({
        status: "shortcode stored",
        short_url: my_short_url,
      });
    }
  );
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

module.exports = app;
