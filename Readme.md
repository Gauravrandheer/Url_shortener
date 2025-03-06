
# URl Shortener

 It takes a long URL and turns it into a short link that is easier to share
 
## Deployed link
https://url-shortener-oziq.onrender.com/

## Run Locally

Clone the project

```bash
  git clone https://github.com/Gauravrandheer/Url_shortener.git
```

Install dependencies

```bash
  npm install
```
Start the server

```bash
  node index.js
```
## Testing with jest

```bash
 npm run test
```

## API Description

 - /shorten api is used for shortening the long url. 
 - /redirect with shortcode will redirect user to original long url.
 - /shorten/:code is used to delete shortcode. 

## Latest Database Schema 

Using Postgres with Prisma ORM

```bash
  url_shortener{
   id  Int @id@default(autoincrement())
   original_url String
   short_code String @unique
   created_at DateTime @default(now())
   visit_count Int @default(0)
   last_accessed_at DateTime?
   user_id  Int @default(1)
   deleted_at DateTime?
   expired_at DateTime?
   user users @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

## Load Testing 

#### /shorten api

P50 - 5ms

p90 - 6ms

p95 - 6ms

p99  - 8ms

#### /redirect api

P50 - 1380ms

p90 - 1517ms

p95 - 1517ms

p99  - 1615ms




