const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const Tree = require("./models/Tree");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/TreeShop";
const DEFAULT_COUNT = 60;
const IMAGE_POOL = [
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&w=640&q=80",
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const countArg = Number.parseInt(args[0], 10);
  const count = Number.isFinite(countArg) && countArg > 0 ? countArg : DEFAULT_COUNT;
  const clearFirst = args.includes("--clear");
  return { count, clearFirst };
};

const buildTree = () => {
  const plantType = faker.helpers.arrayElement([
    "Orchid",
    "Rose",
    "Bonsai",
    "Lavender",
    "Cactus",
    "Monstera",
    "Sunflower",
    "Tulip",
  ]);

  return {
    treename: `${plantType} ${faker.location.city()}`,
    description: faker.commerce.productDescription(),
    image: faker.helpers.arrayElement(IMAGE_POOL),
  };
};

const run = async () => {
  const { count, clearFirst } = parseArgs();

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding.");

    if (clearFirst) {
      await Tree.deleteMany({});
      console.log("Cleared existing tree data.");
    }

    const payload = Array.from({ length: count }, () => buildTree());
    await Tree.insertMany(payload);
    console.log(`Seeded ${count} products successfully.`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
};

run();
