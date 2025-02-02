const request = require("supertest");
const express = require("express");

const app = require("./index");

// Call /shorten API with input URL as “https://example.com”, store the short code received in a variable. Call /redirect API with the short code and see if the redirection happens correctly.
test("Post /shorten api should store shortcode", async () => {
  const res = await request(app)
    .post("/shorten")
    .send({ url: "https://example.com/" })
    .set("Appect", "application/json");

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("status", "shortcode stored");
  expect(res.body).toHaveProperty("url", "https://example.com/");
});

test("Post /short api should return error if url is missing", async () => {
  const res = await request(app)
    .post("/shorten")
    .send({})
    .set("Accept", "application/json");

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error", "Url is required");
});

test("Get /redirect api should redirect the url", async () => {
   
    const res = await request(app).get('/redirect?code=1234')

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe("https://example.com/")
});

test('Get /redirect api should return error if code is missing',async()=>{
    const res = await request(app).get('/redirect')

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('error','Missing code parameter')
})