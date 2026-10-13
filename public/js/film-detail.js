import { getPoster } from "../utils/ui-helpers.js"; 
import { FavoritesAPI } from "../utils/favorites-api.js";
const movieId = window.location.pathname.split("/").pop();
const filmDetail = document.getElementById("film-detail");

let currentMovie = null;
let currentFavorites = [];

const loadFavorites = async () => {
  currentFavorites = await FavoritesAPI.getAll();
};

const showMessage = (message) => {
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  filmDetail.replaceChildren(paragraph);
};

const loadMovie = async () => {
  try {
    const res = await fetch(`/api/films?i=${encodeURIComponent(movieId)}`);
    const data = await res.json();

    if (!res.ok || data.Response === "False" || !data.Search?.length) {
      showMessage("Película no encontrada");
      return;
    }

    currentMovie = data.Search[0];

    await loadFavorites();

    renderMovie();
  } catch (e) {
    console.error(e);
    showMessage("Error cargando la película");
  }
};

const createMovieInfoRow = (label, value) => {
  const paragraph = document.createElement("p");
  const labelElement = document.createElement("strong");
  labelElement.textContent = `${label}:`;
  paragraph.append(labelElement, ` ${value || "No disponible"}`);
  return paragraph;
};

const renderMovie = () => {
  const favorite = FavoritesAPI.findFavorite(
    currentFavorites,
    currentMovie.movieSource,
    currentMovie.movieSourceId
  );

  const isFavorite = Boolean(favorite);

  const detail = document.createElement("div");
  detail.className = "film-detail";

  const poster = document.createElement("img");
  poster.className = "movie-poster";
  poster.src = getPoster(currentMovie.poster);
  poster.alt = currentMovie.title ?? "";

  const movieInfo = document.createElement("div");
  movieInfo.className = "movie-info";

  const title = document.createElement("h1");
  title.textContent = currentMovie.title ?? "";

  const favoriteButton = document.createElement("button");
  favoriteButton.className = "btn favorite-btn";
  favoriteButton.dataset.movieSource = currentMovie.movieSource ?? "";
  favoriteButton.dataset.movieSourceId = currentMovie.movieSourceId ?? "";
  favoriteButton.dataset.favoriteId = favorite?.favoriteId ?? "";
  favoriteButton.dataset.isFavorite = String(isFavorite);
  favoriteButton.textContent = isFavorite
    ? "Quitar de favoritos"
    : "Añadir a favoritos";

  movieInfo.append(
    title,
    createMovieInfoRow("Año", currentMovie.year),
    createMovieInfoRow("Director", currentMovie.director),
    createMovieInfoRow("Género", currentMovie.genre),
    createMovieInfoRow("Duración", currentMovie.runtime),
    createMovieInfoRow("Actores", currentMovie.actors),
    createMovieInfoRow("Sinopsis", currentMovie.plot),
    createMovieInfoRow("Rating", currentMovie.rating),
    favoriteButton,
  );

  detail.append(poster, movieInfo);
  filmDetail.replaceChildren(detail);
}; // ahora tenemos display dinámico del botón (añadir/quitar)

const handleFavoriteClick = async (button) => {
  const movieSource = button.dataset.movieSource;
  const movieSourceId = button.dataset.movieSourceId;
  const favoriteId = button.dataset.favoriteId;
  const isFavorite = button.dataset.isFavorite === "true";

  try {
    if (isFavorite) {
      await FavoritesAPI.remove(favoriteId);
    } else {
      await FavoritesAPI.add(movieSource, movieSourceId);
    }

    await loadFavorites();
    renderMovie();
  } catch (e) {
    console.error(e);
    alert("Error actualizando favorito");
  }
};

document.addEventListener("click", async (event) => {
  if (event.target.classList.contains("favorite-btn")) {
    await handleFavoriteClick(event.target);
  }
});

document.addEventListener("error", (e) => {
  if (e.target.classList.contains("movie-poster")) {
    e.target.src = "/img/no-poster.png";
  }
}, true);


loadMovie();
