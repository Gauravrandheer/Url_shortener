const express = require("express");
const { nanoid } = require("nanoid");
// const sqlite3 = require("sqlite3").verbose();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

//generateshortcode

const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;

function generateShortCode() {
  return nanoid(6);
}

//redirect

app.get("/redirect", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ error: "Missing code parameter" });
  }

  const row = await prisma.url_shortener.findUnique({
    where: { short_code: code },
  });

  if (row) {
    await prisma.url_shortener.update({
      where: {
        id: row.id,
      },
      data: {
        visit_count: {
          increment: 1,
        },
        last_accessed_at: new Date(),
      },
    });

    return res.status(302).redirect(row.original_url);
  } else {
    return res.status(404).json({ error: "URL NOT FOUND" });
  }
});

// Shorten
app.post("/shorten", async (req, res) => {
  let long_url = req.body.url;

  if (!long_url) {
    return res.status(400).json({ error: "Url is required" });
  }

  const short_code = generateShortCode();

  await prisma.url_shortener.create({
    data: {
      short_code: short_code,
      original_url: long_url,
    },
  });
  const my_short_url = `${BASE_URL}/redirect?code=${short_code}`;

  return res.status(200).json({
    status: "shortcode stored",
    short_url: my_short_url,
  });
});

app.delete("/shorten/:code", async (req, res) => {
  const code = req.params.code;

  if (!code) {
    return res.status(400).json({ error: "code parameter is missing" });
  }

  const row = await prisma.url_shortener.findUnique({
    where: { short_code: code },
  });

  if (!row) {
    return res.status(404).json({ error: "Short code not found" });
  }

  await prisma.url_shortener.delete({ where: { short_code: code } });

  return res.status(200).json({ status: "Short url deleted succeefully" });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running at ${BASE_URL}:${port}`);
  });
}

module.exports = { app, prisma };
