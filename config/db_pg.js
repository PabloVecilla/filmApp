const { Sequelize } = require("sequelize");

if (!process.env.POSTGRES_URI) throw new Error("Missing env var: POSTRES_URI")

const sequelize = new Sequelize(process.env.POSTGRES_URI, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,    // ensure SSL conexión to Supabase
        rejectUnauthorized: false,
      },
    },
  });

module.exports = sequelize;
