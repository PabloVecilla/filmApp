const Films = require("../models/Film.model.js");
const fetchMovies = require("../utils/fetch-movies.utils.js");
const normalizeMovie = require("../utils/movie-normalizer.js");

// GLOBAL
// get pelicula en ombd y si no tiene en mongodb
const getMovies = async (req, res) => {
  try {
    const { t, i, s } = req.query;

    let params = {};
    let moviesFromMongo = [];

    if (i) {
      params.i = i;
    } else if (t) {
      params.t = t;
    } else if (s) {
      params.s = s;
    } else {
      return res.status(400).json({
        error: "Debes proporcionar al menos: t, i o s",
      });
    }

    const movies = await fetchMovies(params);

    // CASO 1: OMDB FUNCIONA
    if (movies && movies.Response !== "False") {
      const list = Array.isArray(movies.Search) ? movies.Search : [movies]; // cuando es búsqueda por ID

      const normalized = list.map((movie) => normalizeMovie(movie, "omdb"));

      return res.json({
        Search: normalized,
        Response: "True",
      });
    }

    // CASO 2: FALLA OMDB → BUSCAR EN MONGO
    if (t) {
      moviesFromMongo = await Films.find({
        title: { $regex: t, $options: "i" },
      });
    } else if (i) {
      moviesFromMongo = await Films.find({
        _id: i,
      });
    } else if (s) {
      moviesFromMongo = await Films.find({
        title: { $regex: s, $options: "i" },
      });
    }

    // SI NO HAY RESULTADOS
    if (!moviesFromMongo.length) {
      return res.status(404).json({
        error: movies?.Error || "No se encontraron películas",
      });
    }

    // NORMALIZACIÓN
    const normalized = moviesFromMongo.map((movie) =>
      normalizeMovie(movie, "mongo"),
    );

    return res.json({
      Search: normalized,
      Response: "True",
    });
  } catch (error) {
    console.error("Error en OMDB API:", error.message);
    return res.status(500).json({
      error: "Error al conectar con OMDB",
    });
  }
};

// get unas cuantas peliculas random para la home de usuario (solo omdb)
const getRandomMoviesHome = async (req, res) => {
  try {
    const keywords = [
      "action",
      "love",
      "war",
      "terror",
      "romantic",
      "crime",
      "drama",
      "thriller",
      "comedy",
      "adventure",
      "sci-fi",
    ];

    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];

    let allMovies = [];

    // OMDB devuelve hasta 10 por página, así que buscamos varias páginas hasta reunir 12
    for (let page = 1; page <= 3 && allMovies.length < 12; page++) {
      const movies = await fetchMovies({
        s: randomKeyword,
        page,
      });

      if (movies.Response === "True" && Array.isArray(movies.Search)) {
        allMovies = [...allMovies, ...movies.Search];
      }
    }

    if (!allMovies.length) {
      return res.status(404).json({
        error: "No se encontraron películas",
      });
    }

    // Mezclar y limitar a 12
    const shuffled = allMovies.sort(() => 0.5 - Math.random());
    const limited = shuffled.slice(0, 12);

    const normalized = limited.map((movie) => normalizeMovie(movie, "omdb"));

    return res.json(normalized);
  } catch (error) {
    console.error("Error random movies:", error.message);
    return res.status(500).json({
      error: "Error obteniendo películas random",
    });
  }
};

// MONGO
// GET
// http://localhost:3000/api/films
const getFilmsAdmin = async (req, res) => {
  try {
    const films = await Films.find();

    if (films.length === 0) {
      return res.status(200).json({
        message: "No hay peliculas creadas por administrador",
      });
    }

    return res.status(200).json(films);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

// GET pelicula por id en mongodb
// http://localhost:3000/api/films/(id)
const getFilmById = async (req, res) => {
  const id = req.params.id;
  try {
    const film = await Films.findById(id);

    if (!film) {
      return res.status(404).json({
        message: "La película que buscas no existe",
      });
    }

    return res.status(200).json(film);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

// POST
// http://localhost:3000/api/films/
const createFilm = async (req, res) => {
  try {
    const {
      title,
      poster,
      year,
      director,
      genre,
      runtime,
      plot,
      actors,
      rating,
    } = req.body;

    const film = await Films.create({
      title,
      poster,
      year,
      director,
      genre,
      runtime,
      plot,
      actors,
      rating: Array.isArray(rating) ? rating : [], // Si rating es un array lo usa, si no crea array vacío
    });

    return res.status(201).json({
      message: `Pelicula creada`,
      film,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

// PUT
// http://localhost:3000/api/films/(id)
const updateFilm = async (req, res) => {
  const id = req.params.id;
  try {
    const allowedFields = [
      "title",
      "poster",
      "year",
      "director",
      "genre",
      "runtime",
      "plot",
      "actors",
      "rating",
    ];

    // Filtra solo campos aceptados por el Schema
    const updateData = {};
    for (const key of Object.keys(req.body)) {
      // Object.keys() se queda solo con los campos pasados por el body
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key]; // { updateData[title]: req.body[Matrix]} -> { title: Matrix }
      }
    }

    const film = await Films.findByIdAndUpdate(id, updateData, {
      new: true, // Devuelve la película ya actualizada
      runValidators: true, // Activa las validaciones del Schema
    });

    if (!film) {
      return res.status(404).json({ message: "La película no existe" });
    }

    return res.status(200).json({
      message: `Pelicula editada`,
      film,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

// DELETE
// http://localhost:3000/api/films/(id)
const deleteFilm = async (req, res) => {
  const id = req.params.id;
  try {
    const film = await Films.findByIdAndDelete(id);

    if (!film) {
      return res.status(404).json({
        message: "La película no existe",
      });
    }

    return res.status(200).json({
      message: `Película eliminada: ${id}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = {
  getMovies,
  getRandomMoviesHome,
  getFilmsAdmin,
  getFilmById,
  createFilm,
  updateFilm,
  deleteFilm,
};
