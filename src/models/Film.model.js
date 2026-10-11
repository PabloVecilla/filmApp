const mongoose = require("mongoose");

const ALLOWED_GENRES = [
  "Novela",
  "Aventura",
  "Filosofía",
  "Distopía",
  "Terror",
  "Romántica",
  "Acción"
];

const filmSchema = new mongoose.Schema({
  title: { type: String, required: true },
  poster: { type: String, required: true }, // URL Imagen
  year: { type: Number, required: true },
  director: { type: String, required: true },
  genre: { type: String, enum: ALLOWED_GENRES, required: true },
  runtime: { type: Number, required: true },
  plot: { type: String, required: true }, // Descripción
  actors: [{ type: String, required: true }],

  rating: [
    {
      userId: {
        type: String,
        default: null, // Actualmente no tenemos usuarios, cuando haya, solo habrá que borrar esta línea
      },
      value: {
        type: Number,
        min: 0,
        max: 10,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("Film", filmSchema);
