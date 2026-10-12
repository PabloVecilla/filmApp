const mongoose = require("mongoose");

async function connectDB() {
  const variable =
    process.env.NODE_ENV === "test"
      ? "MONGO_URI_TEST"
      : "MONGO_URI";

  const mongoUri = process.env[variable];

  if (!mongoUri) {
    throw new Error(`Missing environment variable: ${variable}`);
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  });

  return mongoose.connection;
}

module.exports = connectDB;