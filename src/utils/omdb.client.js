const axios = require("axios");

const OMDB_BASE_URL = "https://www.omdbapi.com/";
const OMDB_TIMEOUT_MS = 5000;

const requestOmdb = async (params = {}) => {
  const apiKey = process.env.OMDB_API_KEY;

  if (!apiKey) {
    throw new Error("OMDB_API_KEY no definida en .env");
  }

  const response = await axios.get(OMDB_BASE_URL, {
    params: {
      apikey: apiKey,
      ...params,
    },
    timeout: OMDB_TIMEOUT_MS,
  });

  return response.data;
};

module.exports = {
  requestOmdb,
  OMDB_BASE_URL,
  OMDB_TIMEOUT_MS,
};
