import { getPoster } from "../utils/ui-helpers.js"; 
import { FavoritesAPI } from "../utils/favorites-api.js";
const grid = document.getElementById("movies-grid");

let currentFavorites = []; 

const loadFavorites = async () => {
  currentFavorites = await FavoritesAPI.getAll(); 
  renderFavoriteMovies(); 
}

const showMessage = (message) => {
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  grid.replaceChildren(paragraph);
};

const createRemoveButton = (favorite) => {
  const button = document.createElement("button");
  button.className = "btn delete-favorite-btn";
  button.dataset.favoriteId = favorite.favoriteId ?? "";
  button.dataset.movieSource = favorite.movieSource ?? "";
  button.dataset.movieSourceId = favorite.movieSourceId ?? "";
  button.textContent = "Quitar de favoritos";
  return button;
};

const renderFavoriteMovies = () => {
  if (!currentFavorites.length) {
    showMessage("Tu lista de favoritos está vacía");
    return;
  }

  const cards = currentFavorites.map((favorite) => {
    const card = document.createElement("div");
    card.className = "movie-card";

    if (favorite.unavailable) {
      const title = document.createElement("h3");
      title.textContent = "Película no disponible";

      const description = document.createElement("p");
      description.textContent = "Imposible cargar la información";

      card.append(title, description, createRemoveButton(favorite));
      return card;
    }

    const poster = document.createElement("img");
    poster.className = "movie-poster";
    poster.src = getPoster(favorite.poster);
    poster.alt = favorite.title ?? "";

    const title = document.createElement("h3");
    title.textContent = favorite.title ?? "";

    const year = document.createElement("p");
    year.textContent = favorite.year ?? "";

    const detailLink = document.createElement("a");
    detailLink.className = "btn";
    detailLink.href = `/search/${encodeURIComponent(favorite.movieSourceId ?? "")}`;
    detailLink.textContent = "Ver detalle";

    card.append(
      poster,
      title,
      year,
      detailLink,
      createRemoveButton(favorite),
    );
    return card;
  });

  grid.replaceChildren(...cards);
}; 

const handleFavoriteClick = async (button) => {
  const movieSourceId = button.dataset.movieSourceId;
  const favoriteId = button.dataset.favoriteId; 
  try {
      await FavoritesAPI.remove(favoriteId);

    await loadFavorites();
    renderFavoriteMovies();
  } catch (e) {
    console.error(e);
    alert("Error al actualizar favorito");
  }
};

document.addEventListener("click", async (event) => {
  if (event.target.classList.contains("delete-favorite-btn")) {
    await handleFavoriteClick(event.target);
  }
});

document.addEventListener("error", (e) => {
  if (e.target.classList.contains("movie-poster")) {
    e.target.src = "/img/no-poster.png";
  }
}, true);

loadFavorites();
