const prisma = require("../prismaClient")


const isValidApiKey = async (req, res, next) => {
  let api_key = req.header("Authorization");

  if (!api_key) {
    return res.status(400).json({ error: "API KEY is Required" });
  }

  let user = await prisma.users.findUnique({
    where: {
      api_key: api_key,
    },
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid API KEY" });
  }

  req.user = user;

  next();
};

module.exports = isValidApiKey