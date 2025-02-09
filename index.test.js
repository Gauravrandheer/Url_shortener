const request = require("supertest");
const express = require("express");

const { app, prisma } = require("./index");

beforeEach(async () => {
  await prisma.url_shortener.deleteMany();
});

test("Post /shorten api should store shortcode", async () => {
  const test_url = "https://example.com/";
  const res = await request(app)
    .post("/shorten")
    .send({ url: test_url })
    .set("Appect", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "shortcode stored");
});

test("Post /short api should return error if url is missing", async () => {
  const res = await request(app)
    .post("/shorten")
    .send({})
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error", "Url is required");
});

test("Post /short api should stored shortcode if original url is already in db", async () => {
  const test_url = `https://example.com/`;

  const firstRes = await request(app)
    .post("/shorten")
    .send({ url: test_url })
    .set("Accept", "application/json");

  const firstShortCode = firstRes.body.short_url;

  const secondRes = await request(app)
    .post("/shorten")
    .send({ url: test_url })
    .set("Accept", "application/json");

  expect(firstRes.statusCode).toBe(200);
  expect(firstRes.body).toHaveProperty("status", "shortcode stored");
  expect(firstRes.body).toHaveProperty("short_url");

  expect(secondRes.statusCode).toBe(200);
  expect(secondRes.body).toHaveProperty("status", "shortcode already exists");
  expect(secondRes.body).toHaveProperty("short_url", firstShortCode);
});

test("Get /redirect api should redirect the url", async () => {
  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
    },
  });

  const res = await request(app).get("/redirect?code=yoDhDo");

  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toBe("https://example.com/");
});

test("Delete /shorten/:code that exist should delete the shorturl ", async () => {
  await prisma.url_shortener.create({
    data: {
      short_code: "yoDhDo",
      original_url: "https://example.com/",
    },
  });

  const res = await request(app).delete("/shorten/yoDhDo");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "Short url deleted succeefully");
});

test("Delete /shorten/:code will give error if shortcode does not exist ", async () => {
  const res = await request(app).delete("/shorten/yoDhDo");

  expect(res.statusCode).toBe(404);
  expect(res.body).toHaveProperty("error", "Short code not found");
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
