const axios = require("axios");

const BASE_URL = "https://www.omdbapi.com/";

const fetchMovies = async (params = {}) => {
  try {
    const apiKey = process.env.OMDB_API_KEY;

    if (!apiKey) {
      throw new Error("OMDB_API_KEY no definida en .env");
    }

    const response = await axios.get(BASE_URL, {
      params: {
        apikey: apiKey,
        ...params,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error("OMDb request failed"); 
  }
};

module.exports = fetchMovies;
