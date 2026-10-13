import { getPoster } from "../utils/ui-helpers.js"; 
import { FavoritesAPI } from "../utils/favorites-api.js";
const grid = document.getElementById("movies-grid");

let currentMovies = []; 
let currentFavorites = []; 

const loadFavorites = async () => {
  currentFavorites = await FavoritesAPI.getAll(); 
}

const loadMovies = async () => {
  const res = await fetch("/api/films/random");
  const movies = await res.json();

  currentMovies = movies; 

  await loadFavorites(); 

  renderMovies(); 
}; 

const showMessage = (message) => {
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  grid.replaceChildren(paragraph);
};

const renderMovies = () => {
  if (!currentMovies.length) {
    showMessage("No hay películas disponibles");
    return;
  }

  const cards = currentMovies.map((movie) => {
    const favorite = FavoritesAPI.findFavorite(
      currentFavorites,
      movie.movieSource,
      movie.movieSourceId,
    );
    const isFavorite = Boolean(favorite);

    const card = document.createElement("div");
    card.className = "movie-card";

    const poster = document.createElement("img");
    poster.className = "movie-poster";
    poster.src = getPoster(movie.poster);
    poster.alt = movie.title ?? "";

    const title = document.createElement("h3");
    title.textContent = movie.title ?? "";

    const year = document.createElement("p");
    year.textContent = movie.year ?? "";

    const detailLink = document.createElement("a");
    detailLink.className = "btn";
    detailLink.href = `/search/${encodeURIComponent(movie.movieSourceId ?? "")}`;
    detailLink.textContent = "Ver detalle";

    const favoriteButton = document.createElement("button");
    favoriteButton.className = "btn favorite-btn";
    favoriteButton.dataset.movieSource = movie.movieSource ?? "";
    favoriteButton.dataset.movieSourceId = movie.movieSourceId ?? "";
    favoriteButton.dataset.favoriteId = favorite?.favoriteId ?? "";
    favoriteButton.dataset.isFavorite = String(isFavorite);
    favoriteButton.textContent = isFavorite
      ? "Quitar de favoritos"
      : "Añadir a favoritos";

    card.append(poster, title, year, detailLink, favoriteButton);
    return card;
  });

  grid.replaceChildren(...cards);
}; 

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
    renderMovies();
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

const searchMovies = async () => {
  const title = document.getElementById("searchInput").value;

  if (!title) {
    loadMovies();
    return;
  }

  const res = await fetch(`/api/films?s=${title}`);
  const movies = await res.json();

  if (!movies || !movies.Search || movies.Search.length === 0) {
    showMessage("No hay resultados");
    return;
  }

  currentMovies = movies.Search;

  await loadFavorites(); 

  renderMovies(); 
};

document.getElementById("searchInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchMovies();
});

document
  .getElementsByClassName("btn btn-search")[0]
  .addEventListener("click", (event) => {
    searchMovies();
  });

document.addEventListener("error", (e) => {
  if (e.target.classList.contains("movie-poster")) {
    e.target.src = "/img/no-poster.png";
  }
}, true);

loadMovies();
