// 1. Force load of env variables
require('dotenv').config(); 
const { Sequelize } = require("sequelize");

if (!process.env.POSTGRES_URI) throw new Error("Missing env var: POSTGRES_URI");

// Export configurations by environments
const dbConfig = {
  url: process.env.NODE_ENV === "production" ? process.env.POSTGRES_URI : process.env.POSTGRESS_URI_TEST,
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true, // ensure SSL conexión to Supabase
      rejectUnauthorized: false,
    },
  },
};

// 3. Export config object (Sequelize CLI). Keep server instance
module.exports = {
  // CLI config (migrations)
  test: dbConfig,
  development: dbConfig,
  production: dbConfig,
  
  // server sequelize instance
  sequelize: new Sequelize(process.env.POSTGRES_URI, dbConfig)
};

