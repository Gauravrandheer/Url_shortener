const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { nanoid } = require("nanoid");



const batchSize = 1000
const TotalRecords = 100000

function generateMockData(batchSize) {
  const data = [];

  for (let i = 0; i < 10000; i++) {
    data.push({
      short_code: nanoid(6),
      original_url: `https://example1.com/${i}`,
      user_id: 1,
      expired_at: null,
      password: null,
    });
  }

  return data;
}

async function generateUrldata() {

  for (let i = 0; i < TotalRecords; i+=batchSize) {
    const batch = generateMockData(batchSize)
      await prisma.url_shortener.createMany({
        data:batch,
        skipDuplicates:true
      })
   console.log(`Inserted batch ${i / batchSize + 1}`);
  }

 await prisma.$disconnect();;
  console.log("Generate data completed");
  process.exit(0);
}

generateUrldata();
