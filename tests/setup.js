const path = require("path");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";

require("dotenv").config({
  path: path.resolve(process.cwd(), ".env.test"),
});

const requiredVariables = [
  "POSTGRES_URI_TEST",
  "MONGO_URI_TEST",
  "ACCESS_TOKEN_SECRET",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing test environment variable: ${variable}`);
  }
}

// Protect against accidentally pointing tests at production.
if (
  process.env.POSTGRES_URI &&
  process.env.POSTGRES_URI_TEST === process.env.POSTGRES_URI
) {
  throw new Error("POSTGRES_URI_TEST cannot equal POSTGRES_URI");
}

if (
  process.env.MONGO_URI &&
  process.env.MONGO_URI_TEST === process.env.MONGO_URI
) {
  throw new Error("MONGO_URI_TEST cannot equal MONGO_URI");
}

const { sequelize } = require("../config/db_pg");
const connectDB = require("../config/db_mongo");

// Registers Sequelize models and associations.
require("../src/models");

const app = require("../src/app");

// Available to every test as global.testApp.
global.testApp = app;

beforeAll(async () => {
  await Promise.all([
    sequelize.authenticate(),
    connectDB(),
  ]);
});

beforeEach(async () => {
  // Clears registered Sequelize tables without removing the schema.
  await sequelize.truncate({
    cascade: true,
    restartIdentity: true,
  });

  // Clears Mongo documents while preserving collections and indexes.
  const collections = Object.values(
    mongoose.connection.collections
  );

  await Promise.all(
    collections.map((collection) => collection.deleteMany({}))
  );
});

afterAll(async () => {
  await Promise.allSettled([
    sequelize.close(),
    mongoose.disconnect(),
  ]);
});