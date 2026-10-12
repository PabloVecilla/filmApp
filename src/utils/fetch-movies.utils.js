const { requestOmdb } = require("./omdb.client");

const fetchMovies = async (params = {}) => {
  try {
    return await requestOmdb(params);
  } catch (error) {
    throw new Error("OMDb request failed"); 
  }
};

module.exports = fetchMovies;
