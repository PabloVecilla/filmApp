const { requestOmdb } = require("./omdb.client");

const getMovieById = async (imdbID) => {
    try {
        const movie = await requestOmdb({
          i: imdbID,
          plot: "short", // sinopsis corta para tarjetas de películas
        });
        
          if (movie.Response === "False") {
            return null;
          }
        
          return movie;
    } catch (e) {
        console.error("OMDb error:", e.message); 
        return null; 
    }
};

module.exports = {
  getMovieById,
};
