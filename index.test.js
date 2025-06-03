const request = require("supertest");
const express = require("express");
const fs = require("fs");
const prisma = require("./prismaClient");
const app = require("./index");
const { status } = require("express/lib/response");
const redisClient = require("./cache");
// jest.setTimeout(30000);

beforeAll(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  console.log("🟢 Redis isOpen:", redisClient.isOpen); // should be true
});

beforeEach(async () => {
  await prisma.url_shortener.deleteMany();
  try {
    if (redisClient.isOpen) {
      await redisClient.flushDb();
    }
  } catch (err) {
    console.error("Redis flushDb failed:", err);
  }
});

afterAll(async () => {
  await redisClient.quit();
});

test("Post /shorten api should store generated shortcode with valid api key with expired date with no password", async () => {
  const test_url = "https://example.com/";
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";
  const expired_date = "2025-03-07";
  const res = await request(app)
    .post("/shorten")
    .send({ url: test_url, expired_date: expired_date })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "shortcode stored");
  expect(res.body).toHaveProperty("short_url");
});

test("Post /shorten api should store generated shortcode with valid api key with expired date with  password", async () => {
  const test_url = "https://example.com/";
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";
  const expired_date = "2025-03-07";
  const password = "123456";
  const res = await request(app)
    .post("/shorten")
    .send({ url: test_url, expired_date: expired_date, password: password })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "shortcode stored");
  expect(res.body).toHaveProperty("short_url");
});

test("Post /shorten api should store cutom shortcode with valid api key with expired date", async () => {
  const test_url = "https://example.com/";
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";
  const expired_date = "2025-03-07";
  const custom_code = "awesome-link";
  const res = await request(app)
    .post("/shorten")
    .send({
      url: test_url,
      expired_date: expired_date,
      custom_code: custom_code,
    })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "shortcode stored");
  expect(res.body).toHaveProperty("short_url");
});

test("Post /shorten api should store shortcode with valid api key without expired date", async () => {
  const test_url = "https://example.com/";
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";
  const expired_date = "";
  const res = await request(app)
    .post("/shorten")
    .send({ url: test_url, expired_date: expired_date })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "shortcode stored");
  expect(res.body).toHaveProperty("short_url");
});

test("Post /shorten api should fail without api key", async () => {
  const test_url = "https://example.com/";
  const res = await request(app)
    .post("/shorten")
    .send({ url: test_url })
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error", "API KEY is Required");
});

test("Post /shorten api should fail with invalid api key", async () => {
  const test_url = "https://example.com/";
  const api_key = "invalid_api_key";
  const res = await request(app)
    .post("/shorten")
    .send({ url: test_url })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty("error", "Invalid API KEY");
});

test("Post /short api should return error if url is missing", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  const res = await request(app)
    .post("/shorten")
    .send({})
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error", "Url is required");
});

test("Post /short api should different shortcode even if original url is already in db", async () => {
  const test_url = `https://example.com/`;
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";
  const firstRes = await request(app)
    .post("/shorten")
    .send({ url: test_url })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  const firstShortCode = firstRes.body.short_url;

  const secondRes = await request(app)
    .post("/shorten")
    .send({ url: test_url })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(firstRes.statusCode).toBe(200);
  expect(firstRes.body).toHaveProperty("status", "shortcode stored");
  expect(firstRes.body).toHaveProperty("short_url");

  expect(secondRes.statusCode).toBe(200);
  expect(secondRes.body).toHaveProperty("status", "shortcode stored");
  expect(secondRes.body).toHaveProperty("short_url");
});

test("Get /redirect api should redirect the url with expired_date not passed without password as well no cache ", async () => {
  let expired_date = "2100-03-07";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      expired_at: new Date(expired_date),
    },
  });

  const res = await request(app).get("/redirect?code=yoDhDo");

  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toBe("https://example.com/");
  expect(res.header).toHaveProperty("x-cache-status", "MISS");
});

test("Get /redirect api should redirect the url with expired_date not passed without password as well give response from cache for the 2nd time same request ", async () => {
  let expired_date = "2100-03-07";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      expired_at: new Date(expired_date),
    },
  });

  const res = await request(app).get("/redirect?code=yoDhDo");

  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toBe("https://example.com/");
  expect(res.header).toHaveProperty("x-cache-status", "MISS");

  const res2 = await request(app).get("/redirect?code=yoDhDo");

  expect(res2.statusCode).toBe(302);
  expect(res2.headers.location).toBe("https://example.com/");
  expect(res2.header).toHaveProperty("x-cache-status", "HIT");
});

test("Get /redirect api should redirect the url with expired_date not passed with password", async () => {
  let expired_date = "2100-03-07";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      expired_at: new Date(expired_date),
      password: "123456",
    },
  });

  const res = await request(app).get("/redirect?code=yoDhDo&pass=123456");

  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toBe("https://example.com/");
});

test("Get /redirect api should fall if password is not correct", async () => {
  let expired_date = "2100-03-07";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      expired_at: new Date(expired_date),
      password: "123456",
    },
  });

  const res = await request(app).get("/redirect?code=yoDhDo&pass=12345");

  expect(res.statusCode).toBe(403);
  expect(res.body).toHaveProperty(
    "error",
    "This shortcode is password protected.Please provide valid password"
  );
});

test("Get /redirect api should fail if expired_date is passed", async () => {
  let expired_date = "2000-03-07";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      expired_at: new Date(expired_date),
    },
  });

  const res = await request(app).get("/redirect?code=yoDhDo");

  expect(res.statusCode).toBe(404);
  expect(res.body).toHaveProperty("error", "short_code is expired");
});

test("Get /redirect api should return error if code is missing", async () => {
  const res = await request(app).get("/redirect");

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error", "Missing code parameter");
});

test("Get /redirect api should return 404 if short code does not exist", async () => {
  const res = await request(app).get("/redirect?code=yoDhDo");

  expect(res.statusCode).toBe(404);
  expect(res.body).toHaveProperty("error", "URL NOT FOUND");
});

test("Delete /shorten/:code that exist should delete the shorturl with valid api key", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      user_id: 1,
    },
  });

  const res = await request(app)
    .delete("/shorten/yoDhDo")
    .set("Authorization", api_key);

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "Short url deleted succeefully");
});

test("Delete /shorten/:code will give error if shortcode does found or already deleted", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";
  const res = await request(app)
    .delete("/shorten/yoDhDo")
    .set("Authorization", api_key);

  expect(res.statusCode).toBe(404);
  expect(res.body).toHaveProperty(
    "error",
    "Short URL not found or already deleted"
  );
});

test("Delete /shorten/:code will give error if api key is invalid", async () => {
  const api_key = "invalid_api_key";
  const res = await request(app)
    .delete("/shorten/yoDhDo")
    .set("Authorization", api_key);

  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty("error", "Invalid API KEY");
});

test("/shorten-bulk should shorten multiple url with valid api key and valid urls in array with enterprise teir ", async () => {
  const test_urls = [
    "https://gaurav.com",
    "https://github.com",
    "https://example.com",
  ];
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  const res = await request(app)
    .post("/shorten-bulk")
    .send({ urls: test_urls })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("Success");
  expect(res.body).toHaveProperty("Failure");

  expect(res.body.Success.length).toBe(test_urls.length);
  expect(res.body.Failure.length).toBe(0);
});

test("/shorten-bulk should fail without enterprise teir ", async () => {
  const test_urls = [
    "https://gaurav.com",
    "https://github.com",
    "https://example.com",
  ];
  const api_key = "e1a94c6f5d2b47c2ab89de3f0a1e7653";

  const res = await request(app)
    .post("/shorten-bulk")
    .send({ urls: test_urls })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(403);
  expect(res.body).toHaveProperty(
    "error",
    "Bulk shortening is only available for enterprise users"
  );
});

test("/shorten-bulk should fall without api key", async () => {
  const test_urls = [
    "https://gaurav.com",
    "https://github.com",
    "https://example.com",
  ];

  const res = await request(app)
    .post("/shorten-bulk")
    .send({ urls: test_urls })
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error", "API KEY is Required");
});
test("/shorten-bulk should fall  without valid api key", async () => {
  const test_urls = [
    "https://gaurav.com",
    "https://github.com",
    "https://example.com",
  ];
  const api_key = "asdas";

  const res = await request(app)
    .post("/shorten-bulk")
    .send({ urls: test_urls })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty("error", "Invalid API KEY");
});

test("/shorten-bulk should fall where urls array length is 0 ", async () => {
  const test_urls = [];
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  const res = await request(app)
    .post("/shorten-bulk")
    .send({ urls: test_urls })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty(
    "error",
    "At least one valid URL is required, and URLs input must be an array"
  );
});

test("/shorten-bulk should shorten multiple url with valid url and error for invalid urls", async () => {
  const test_urls = ["https://gaurav.com", "https://github.com", "", "adsfasd"];
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  const res = await request(app)
    .post("/shorten-bulk")
    .send({ urls: test_urls })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("Success");
  expect(res.body).toHaveProperty("Failure");

  expect(res.body.Success.length).toBe(2);
  expect(res.body.Failure.length).toBe(2);
});

test("/shorten/edit api should give succees with valid api key with valid shortcode and status and no password", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      user_id: 1,
    },
  });

  const res = await request(app)
    .patch("/shorten/edit")
    .send({ short_code: "yoDhDo", status: "active" })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "status updated succesfully");
});

test("/shorten/edit api should give succees with valid api key with valid shortcode and status and no password with updated cached", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      user_id: 1,
    },
  });

  const res = await request(app)
    .patch("/shorten/edit")
    .send({ short_code: "yoDhDo", status: "inactive" })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "status updated succesfully");

  const cached = await redisClient.get("yoDhDo");
  const parsed = JSON.parse(cached);

  expect(parsed).toMatchObject({
    original_url: "https://example.com/",
    passwordProtected: false,
    password: null,
    expired_at: new Date(null).toISOString(),
  });
});

test("/shorten/edit api should error when redis is down", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      user_id: 1,
    },
  });

  await redisClient.set(
    "yoDhDo",
    JSON.stringify({
      original_url: "https://example.com/",
      passwordProtected: false,
      password: null,
      expired_at: new Date(null),
    })
  );

  const mock = jest
    .spyOn(redisClient, "set")
    .mockRejectedValue(new Error("Redis is down"));

  const res = await request(app)
    .patch("/shorten/edit")
    .send({ short_code: "yoDhDo", status: "active" })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(500);
  expect(res.body).toHaveProperty("error", "Internal server error");
  mock.mockRestore();
});

///
test("/shorten/edit api should give succees with valid api key with valid shortcode and status and no password but not updated cached", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      user_id: 1,
    },
  });

  await redisClient.set(
    "yoDhDo",
    JSON.stringify({
      original_url: "https://example.com/",
      passwordProtected: false,
      password: null,
      expired_at: new Date(null),
    })
  );

  const mock = jest.spyOn(redisClient, "set").mockResolvedValue("OK");

  const res = await request(app)
    .patch("/shorten/edit")
    .send({ short_code: "yoDhDo", status: "active" })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "status updated succesfully");

  const cached = await redisClient.get("yoDhDo");
  const parsed = JSON.parse(cached);

  expect(parsed.expired_at).toEqual(new Date(null).toISOString());

  mock.mockRestore();
});
///

test("/shorten/edit api should give succees with valid api key with valid shortcode and status with also change password ", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      user_id: 1,
      password: "12345",
    },
  });

  const res = await request(app)
    .patch("/shorten/edit")
    .send({
      short_code: "yoDhDo",
      status: "active",
      old_password: "12345",
      new_password: "1234556",
    })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "status updated succesfully");
});

test("/shorten/edit api should also give success when only valid old password is there ", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      user_id: 1,
      password: "12344",
    },
  });

  const res = await request(app)
    .patch("/shorten/edit")
    .send({ short_code: "yoDhDo", status: "active", old_password: "12344" })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "status updated succesfully");
});

test("/shorten/edit api should fail with without api key", async () => {
  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      user_id: 1,
    },
  });

  const res = await request(app)
    .patch("/shorten/edit")
    .send({ short_code: "yoDhDo", status: "active" })
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error", "API KEY is Required");
});

test("/shorten/edit api should fail with invalid api key", async () => {
  const api_key = "invalid";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      user_id: 1,
    },
  });

  const res = await request(app)
    .patch("/shorten/edit")
    .send({ short_code: "yoDhDo", status: "active" })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty("error", "Invalid API KEY");
});

test("/shorten/edit api should fail without shortcode paramenter", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      user_id: 1,
    },
  });

  const res = await request(app)
    .patch("/shorten/edit")
    .send({ short_code: "", status: "active" })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error", "short code parameter is missing");
});

test("/shorten/edit api should fail without status paramenter", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      user_id: 1,
    },
  });

  const res = await request(app)
    .patch("/shorten/edit")
    .send({ short_code: "yoDhDo", status: "" })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error", "status parameter is missing");
});

test("/shorten/edit api should fail without invalid status paramenter", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      user_id: 1,
    },
  });

  const res = await request(app)
    .patch("/shorten/edit")
    .send({ short_code: "yoDhDo", status: "sdf" })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error", "Invalid status parameter");
});

test("/shorten/edit should give fail if Shortcode not found for user or does not belong to the user", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
      user_id: 2,
    },
  });

  const res = await request(app)
    .patch("/shorten/edit")
    .send({ short_code: "yoDhDo", status: "active" })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(404);
  expect(res.body).toHaveProperty(
    "error",
    "Shortcode not found for user or does not belong to the user"
  );
});

test("/user/urls should return all URLs for a user with pagination working", async () => {
  const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";

  const urlsToCreate = Array.from({ length: 15 }, (_, i) => ({
    short_code: `code${i + 1}`,
    original_url: `https://example${i + 1}.com`,
    user_id: 1,
    created_at: new Date(Date.now() + i),
  }));

 await prisma.url_shortener.createMany({ data: urlsToCreate });

  const res1 = await request(app)
    .get("/user/urls?page=1&limit=5")
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res1.statusCode).toBe(200);
  expect(res1.body.urls).toHaveLength(5);
  expect(res1.body.page).toBe(1);
  expect(res1.body.limit).toBe(5);
  expect(res1.body.totalCount).toBe(15);
  expect(res1.body.totalPages).toBe(3);

  const res2 = await request(app)
    .get("/user/urls?page=2&limit=5")
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res1.statusCode).toBe(200);
  expect(res1.body.urls).toHaveLength(5);
  expect(res1.body.page).toBe(1);
  expect(res1.body.limit).toBe(5);

  expect(res1.body.urls[0].short_code).not.toEqual(
    res2.body.urls[0].short_code
  );
});

test("/user/urls should fall with no API key", async () => {
  const res = await request(app)
    .get("/user/urls")
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error", "API KEY is Required");
});

test("/user/urls should fall with invalid API key", async () => {
  const res = await request(app)
    .get("/user/urls")
    .set("Authorization", "invalid_api_key")
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty("error", "Invalid API KEY");
});

test("/user/urls should fall with blaclisted API key", async () => {
  const res = await request(app)
    .get("/user/urls")
    .set("Authorization", "e1a94c6f5d2b47c2ab89de3f0a1e7653")
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(403);
  expect(res.body).toHaveProperty("error", "Your API key is blacklisted.");
});

test("/user/urls should fall with file not opening", async () => {
  jest
    .spyOn(fs, "readFile")
    .mockImplementation((filePath, encoding, callback) => {
      callback(new Error("Simulated file reading error"), null);
    });

  const res = await request(app)
    .get("/user/urls")
    .set("Authorization", "e1a94c6f5d2b47c2ab89de3f0a1e7653")
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(500);
  expect(res.body).toHaveProperty("error", "Internal Server error");
  jest.restoreAllMocks();
});
test("/health should return 200 with success", async () => {
  const res = await request(app).get("/health");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "healthy");
  expect(res.body).toHaveProperty("database", "connected");
});
test("/health should return 200 with success as well includes X-Response-time header", async () => {
  const res = await request(app).get("/health");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "healthy");
  expect(res.body).toHaveProperty("database", "connected");
  expect(res.headers).toHaveProperty("x-response-time");
});

test("/health should return 500 with failure", async () => {
  jest.spyOn(prisma, "$queryRaw").mockRejectedValue(new Error("DB error"));
  const res = await request(app).get("/health");
  expect(res.statusCode).toBe(500);
  expect(res.body).toHaveProperty("status", "unhealthy");
  jest.restoreAllMocks();
});

// switch from ip to api rate limiting
// test("should allow up to 100 requests", async()=>{

//   const ip = "123.123.123.123"

//   await prisma.url_shortener.create({
//     data: {
//       short_code: "yoDhDo",
//       original_url: "https://example.com/",
//     },
//   });

//   for(let i=0;i<99;i++){
//     await request(app).get("/redirect?code=yoDhDo").set("X-Forwarded-For",ip)
//   }

//   const res = await request(app).get("/redirect?code=yoDhDo").set("X-Forwarded-For",ip)

//   expect(res.statusCode).toBe(302);
//   expect(res.headers.location).toBe("https://example.com/");

// })

// test("should block ip after 100 requests", async()=>{

//   const ip = "123.123.123.123"

//   await prisma.url_shortener.create({
//     data: {
//       short_code: "yoDhDo",
//       original_url: "https://example.com/",
//     },
//   });

//   for(let i=0;i<100;i++){
//     await request(app).get("/redirect?code=yoDhDo").set("X-Forwarded-For",ip)
//   }

//   const res = await request(app).get("/redirect?code=yoDhDo").set("X-Forwarded-For",ip)

//   expect(res.statusCode).toBe(429);
//   expect(res.body).toHaveProperty("error","Too many requests. Try again later.");

// })

//API Rate limiting to tier rate limiting so keeping it here for sometime
// test("/shorten should allow up to 10 requests per second", async () => {
//   const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";
//   const test_url = "https://example.com/";

//   for (let i = 0; i < 9; i++) {
//     await request(app)
//       .post("/shorten")
//       .send({ url: test_url })
//       .set("Authorization", api_key)
//       .set("Accept", "application/json");
//   }
//   const res = await request(app)
//     .post("/shorten")
//     .send({ url: test_url })
//     .set("Authorization", api_key)
//     .set("Accept", "application/json");

//   expect(res.statusCode).toBe(200);
//   expect(res.body).toHaveProperty("status", "shortcode stored");
//   expect(res.body).toHaveProperty("short_url");
// });

// test("/shorten should stop more than 10 requests per second", async () => {
//   const api_key = "8f32e5a9d2c74b56a1d98c4e57f6e2bc";
//   const test_url = "https://example.com/";

//   const requests = [];

//   for (let i = 0; i < 11; i++) {
//     requests.push(
//       request(app)
//         .post("/shorten")
//         .send({ url: test_url })
//         .set("Authorization", api_key)
//         .set("Accept", "application/json")
//     );
//   }

//   const responses = await Promise.all(requests);

//   const tooManyRequests = responses.filter((res) => res.statusCode === 429);

//   expect(tooManyRequests.length).toBeGreaterThanOrEqual(1);
//   expect(tooManyRequests[0].body).toHaveProperty(
//     "error",
//     "Too many requests. Please try again later."
//   );
// });

//ip rate limit for /redirect

test("/redirect should allow up to 50 requests", async () => {
  const ip = "123.123.123.123";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
    },
  });

  for (let i = 0; i < 49; i++) {
    await request(app).get("/redirect?code=yoDhDo").set("X-Forwarded-For", ip);
  }

  const res = await request(app)
    .get("/redirect?code=yoDhDo")
    .set("X-Forwarded-For", ip);

  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toBe("https://example.com/");
});

test("/redirect should block ip after 50 requests", async () => {
  const ip = "123.123.123.123";

  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
    },
  });

  const requests = [];

  for (let i = 0; i < 51; i++) {
    requests.push(
      request(app).get("/redirect?code=yoDhDo").set("X-Forwarded-For", ip)
    );
  }

  const responses = await Promise.all(requests);

  const tooManyRequests = responses.filter((res) => res.statusCode === 429);

  expect(tooManyRequests.length).toBeGreaterThanOrEqual(1);
  expect(tooManyRequests[0].body).toHaveProperty(
    "error",
    "Too many requests. Try again later."
  );
});

//t tier limiting
test("/shorten should allow up 5 requests  per 60 second", async () => {
  const api_key = "5b67a2e9f8d34c5e9b10d7c6f3a4d1b2";
  const test_url = "https://example.com/";

  for (let i = 0; i < 4; i++) {
    await request(app)
      .post("/shorten")
      .send({ url: test_url })
      .set("Authorization", api_key)
      .set("Accept", "application/json");
  }
  const res = await request(app)
    .post("/shorten")
    .send({ url: test_url })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "shortcode stored");
  expect(res.body).toHaveProperty("short_url");
});

test("/shorten should stop more than 5 requests per 60 second", async () => {
  const api_key = "5b67a2e9f8d34c5e9b10d7c6f3a4d1b2";
  const test_url = "https://example.com/";

  const requests = [];

  for (let i = 0; i < 6; i++) {
    requests.push(
      request(app)
        .post("/shorten")
        .send({ url: test_url })
        .set("Authorization", api_key)
        .set("Accept", "application/json")
    );
  }

  const responses = await Promise.all(requests);

  const tooManyRequests = responses.filter((res) => res.statusCode === 429);

  expect(tooManyRequests.length).toBeGreaterThanOrEqual(1);
  expect(tooManyRequests[0].body).toHaveProperty(
    "error",
    "Too many requests. Please try again later."
  );
});

test("/shorten should allow 3 requests as well as send ratelimit-limit ,remaining and resettime", async () => {
  const api_key = "5b67a2e9f8d34c5e9b10d7c6f3a4d1b2";
  const test_url = "https://example.com/";

  for (let i = 0; i < 2; i++) {
    await request(app)
      .post("/shorten")
      .send({ url: test_url })
      .set("Authorization", api_key)
      .set("Accept", "application/json");
  }
  const res = await request(app)
    .post("/shorten")
    .send({ url: test_url })
    .set("Authorization", api_key)
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.header).toHaveProperty("x-ratelimit-limit");
  expect(res.header).toHaveProperty("x-ratelimit-remaining");
  expect(res.header).toHaveProperty("x-ratelimit-reset");
  expect(Number(res.header["x-ratelimit-limit"])).toBe(5);
  expect(Number(res.header["x-ratelimit-remaining"])).toBe(2);
  expect(Number(res.header["x-ratelimit-reset"])).toBeGreaterThanOrEqual(
    Math.floor(Date.now() / 1000)
  );
});
