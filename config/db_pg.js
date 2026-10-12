const path = require("path");
const { Sequelize } = require("sequelize");

const environment = process.env.NODE_ENV || "development";

require("dotenv").config({
  path: path.resolve(
    process.cwd(),
    environment === "test" ? ".env.test" : ".env"
  ),
});

function createConfig(url, sslEnabled = false) {
  return {
    url,
    dialect: "postgres",
    logging: false,
    ...(sslEnabled && {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }),
  };
}

const sslEnabled = process.env.DB_SSL === "true";

const configurations = {
  development: createConfig(process.env.POSTGRES_URI, sslEnabled),
  test: createConfig(process.env.POSTGRES_URI_TEST, false),
  production: createConfig(process.env.POSTGRES_URI, sslEnabled),
};

const currentConfig = configurations[environment];

if (!currentConfig?.url) {
  const variable =
    environment === "test" ? "POSTGRES_URI_TEST" : "POSTGRES_URI";

  throw new Error(`Missing environment variable: ${variable}`);
}

const { url, ...sequelizeOptions } = currentConfig;

module.exports = {
  ...configurations,
  sequelize: new Sequelize(url, sequelizeOptions),
};

