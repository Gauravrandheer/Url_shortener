const express = require("express");
const { nanoid } = require("nanoid");
// const sqlite3 = require("sqlite3").verbose();
const { PrismaClient } = require("@prisma/client");
const { status } = require("express/lib/response");
const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

//generateshortcode

const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;

//functions

function generateShortCode() {
  return nanoid(6);
}

function isValidUrl(url) {
  try {
    const parsedUrl = new URL(url); //valid url
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (_) {
    return false;
  }
}
//routers

//user

//redirect

app.get("/redirect", async (req, res) => {
  const code = req.query.code;
  const password = req?.query.pass;

  if (!code) {
    return res.status(400).json({ error: "Missing code parameter" });
  }

  const row = await prisma.url_shortener.findFirst({
    where: { short_code: code, deleted_at: null },
  });

  if (row && row.password && row.password !== password) {
    return res.status(403).json({
      error:
        "This shortcode is password protected.Please provide valid password",
    });
  }

  if (row) {
    const isExpired = row.expired_at
      ? new Date() > new Date(row.expired_at)
      : false;

    if (isExpired) {
      return res.status(404).json({ error: "short_code is expired" });
    }
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

// Shorten YYYY-MM-DD
app.post("/shorten", async (req, res) => {
  let api_key = req.header("Authorization");

  if (!api_key) {
    return res.status(400).json({ error: "API KEY is Required" });
  }

  let row = await prisma.users.findUnique({
    where: {
      api_key: api_key,
    },
  });

  if (!row) {
    return res.status(403).json({ error: "Invalid API KEY" });
  }

  let long_url = req.body.url;
  let password = req.body.password;
  let expired_date = req.body.expired_date;
  let custom_code = req.body.custom_code;

  if (!long_url) {
    return res.status(400).json({ error: "Url is required" });
  }

  let finalpassword = password ? password : null;

  const short_code = generateShortCode();
  const our_short_code =
    custom_code?.trim().length > 0 ? custom_code.trim() : short_code;
  if (!expired_date) {
    await prisma.url_shortener.create({
      data: {
        short_code: our_short_code,
        original_url: long_url,
        user_id: row.id,
        password: finalpassword,
      },
    });
  } else {
    let expiredDate = new Date(expired_date);

    await prisma.url_shortener.create({
      data: {
        short_code: our_short_code,
        original_url: long_url,
        user_id: row.id,
        expired_at: expiredDate,
        password: finalpassword,
      },
    });
  }

  const my_short_url = `${BASE_URL}/redirect?code=${our_short_code}`;

  return res.status(200).json({
    status: "shortcode stored",
    short_url: my_short_url,
  });
});

app.post("/shorten-bulk", async (req, res) => {
  const api_key = req.header("Authorization");
  const urls = req.body.urls;

  if (!api_key) {
    return res.status(400).json({ error: "API Key is required" });
  }

  const user = await prisma.users.findUnique({
    where: {
      api_key: api_key,
    },
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid API Key" });
  }

  if (!user.tier || user.tier !== "enterprise") {
    return res.status(403).json({
      error: "Bulk shortening is only available for enterprise users",
    });
  }

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({
      error:
        "At least one valid URL is required, and URLs input must be an array",
    });
  }

  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        if (!url || typeof url !== "string" || !isValidUrl(url)) {
          return { original_url: url, error: "Invalid url format" };
        }
        const short_code = generateShortCode();
        const newData = await prisma.url_shortener.create({
          data: {
            short_code: short_code,
            original_url: url,
            user_id: user.id,
          },
        });

        return { original_url: url, short_code: newData.short_code };
      } catch (error) {
        return { original_url: url, error: error.message };
      }
    })
  );

  return res.status(200).json({
    Success: results.filter((r) => !r.error),
    Failure: results.filter((r) => r.error),
  });
});

//patch

app.patch("/shorten/edit", async (req, res) => {
  try {
    const api_key = req.header("Authorization");
    const short_code = req.body.short_code;
    const status = req.body.status.toLowerCase();
    const old_password = req.body.old_password;
    const new_password = req.body.new_password;

    if (!api_key) {
      return res.status(400).json({ error: "API KEY is Required" });
    }

    const user = await prisma.users.findUnique({
      where: {
        api_key: api_key,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid API KEY" });
    }

    if (!short_code) {
      return res.status(400).json({ error: "short code parameter is missing" });
    }

    if (!status) {
      return res.status(400).json({ error: "status parameter is missing" });
    }

    let expiredDate = "";

    if (status == "active") {
      expiredDate = null;
    } else if (status == "inactive") {
      expiredDate = new Date();
    } else {
      return res.status(400).json({ error: "Invalid status parameter" });
    }

    const row = await prisma.url_shortener.findUnique({
      where: {
        short_code: short_code,
        user_id: user.id,
        deleted_at: null,
      },
    });

    if (!row) {
      return res.status(404).json({
        error: "Shortcode not found for user or does not belong to the user",
      });
    }

    if (row.password !== null) {
      if (!old_password || row.password !== old_password) {
        return res.status(403).json({
          error:
            "This shortcode is password protected. Please provide a valid password.",
        });
      }
    }

    const newdata = {
      expired_at: expiredDate,
      password: new_password || row.password,
    };

    await prisma.url_shortener.update({
      where: {
        short_code: short_code,
        user_id: user.id,
        deleted_at: null,
      },
      data: newdata,
    });

    return res.status(200).json({ status: "status updated succesfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Delete

app.delete("/shorten/:code", async (req, res) => {
  const code = req.params.code;
  const api_key = req.header("Authorization");

  if (!api_key) {
    return res.status(400).json({ error: "API KEY is Required" });
  }

  const user = await prisma.users.findUnique({
    where: {
      api_key: api_key,
    },
  });

  if (!user) {
    return res.status(403).json({ error: "Invalid API KEY" });
  }

  if (!code) {
    return res.status(400).json({ error: "short code parameter is missing" });
  }

  const row = await prisma.url_shortener.findFirst({
    where: { short_code: code, user_id: user.id, deleted_at: null },
  });

  if (!row) {
    return res
      .status(404)
      .json({ error: "Short URL not found or already deleted" });
  }

  await prisma.url_shortener.update({
    where: { short_code: code },
    data: {
      deleted_at: new Date(),
    },
  });

  return res.status(200).json({ status: "Short url deleted succeefully" });
});

//list of users

app.get("/user/urls", async (req, res) => {
  try {
    const api_key = req.header("Authorization");

    if (!api_key) {
      return res.status(400).json({ error: "API KEY is Required" });
    }

    const user = await prisma.users.findUnique({
      where: { api_key },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid API KEY" });
    }

    const urls = await prisma.url_shortener.findMany({
      where: { user_id: user.id, deleted_at: null },
    });

    return res.status(200).json({ urls });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Health

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`Select 1`;

    return res.status(200).json({ status: "healthy", database: "connected" });
  } catch (error) {
    return res.status(500).json({
      status: "unhealthy",
      database: "databse connection failed",
      error: error.message,
    });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running at ${BASE_URL}:${port}`);
  });
}

module.exports = { app, prisma };
