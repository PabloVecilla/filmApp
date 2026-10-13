// ADMIN MOVIES EJS FUNCTION:
// Save
const saveBtn = document.getElementById("saveBtn");
if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    saveMovie();
  });
}; 

// Cancel
const cancelBtn = document.getElementById("cancelBtn");
if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    hideForm();
  });
}; 

// New film
const createBtn = document.getElementById("createBtn");
if (createBtn) {
  createBtn.addEventListener("click", () => {
    showForm();
  });
};

// edit film
document.addEventListener("click", (e) => {
  // EDIT
  if (e.target.classList.contains("editBtn")) {
    const btn = e.target;
    editMovie(
      btn.dataset.id,
      btn.dataset.title,
      btn.dataset.poster,
      btn.dataset.year,
      btn.dataset.director,
      btn.dataset.genre,
      btn.dataset.runtime,
      btn.dataset.plot,
      btn.dataset.actors
    );
  }; 

  // ELIMINATE
  if (e.target.classList.contains("deleteBtn")) {
    deleteMovie(e.target.dataset.id);
  }
});
// Show create movie form
const showForm = () => {
  document.getElementById("movie-form").style.display = "block";
  document.getElementById("form-title").textContent = "Nueva película";
  document.getElementById("movie-id").value = "";
  document.getElementById("title").value = "";
  document.getElementById("poster").value = "";
  document.getElementById("year").value = "";
  document.getElementById("director").value = "";
  document.getElementById("genre").value = "";
  document.getElementById("runtime").value = "";
  document.getElementById("plot").value = "";
  document.getElementById("actors").value = "";
};

// hide create movie form
const hideForm = () => {
  document.getElementById("movie-form").style.display = "none";
};

// Load mongo movies
const loadMovies = async () => {
  const res = await fetch("/api/films/admin");
  const movies = await res.json();

  const list = document.getElementById("movies-list");

  if (!movies.length) {
    const message = document.createElement("p");
    message.textContent = "No hay películas";
    list.replaceChildren(message);
    return;
  }

  const cards = movies.map((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";

    const poster = document.createElement("img");
    poster.src = movie.poster || "/img/no-poster.png";
    poster.alt = movie.title ?? "";

    const title = document.createElement("h3");
    title.textContent = movie.title ?? "";

    const description = document.createElement("p");
    description.textContent = `${movie.year ?? ""} - ${movie.director ?? ""}`;

    const editButton = document.createElement("button");
    editButton.className = "btn editBtn";
    editButton.dataset.id = movie._id ?? "";
    editButton.dataset.title = movie.title ?? "";
    editButton.dataset.poster = movie.poster ?? "";
    editButton.dataset.year = movie.year ?? "";
    editButton.dataset.director = movie.director ?? "";
    editButton.dataset.genre = movie.genre ?? "";
    editButton.dataset.runtime = movie.runtime ?? "";
    editButton.dataset.plot = movie.plot ?? "";
    editButton.dataset.actors = movie.actors ?? "";
    editButton.textContent = "Editar";

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn deleteBtn";
    deleteButton.dataset.id = movie._id ?? "";
    deleteButton.textContent = "Eliminar";

    card.append(poster, title, description, editButton, deleteButton);
    return card;
  });

  list.replaceChildren(...cards);
};
// create mongo movie
const saveMovie = async () => {
  const id = document.getElementById("movie-id").value;
  const body = {
    title: document.getElementById("title").value,
    poster: document.getElementById("poster").value,
    year: document.getElementById("year").value,
    director: document.getElementById("director").value,
    genre: document.getElementById("genre").value,
    runtime: document.getElementById("runtime").value,
    plot: document.getElementById("plot").value,
    actors: document.getElementById("actors").value,
  };

  const url = id ? `/api/films/${id}` : "/api/films";
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  alert(data.message || data.error);
  hideForm();
  loadMovies();
};
// edit mongo movie
const editMovie = (
  id,
  title,
  poster,
  year,
  director,
  genre,
  runtime,
  plot,
  actors
) => {
  document.getElementById("movie-form").style.display = "block";
  document.getElementById("form-title").textContent = "Editar película";
  document.getElementById("movie-id").value = id;
  document.getElementById("title").value = title;
  document.getElementById("poster").value = poster;
  document.getElementById("year").value = year;
  document.getElementById("director").value = director;
  document.getElementById("genre").value = genre;
  document.getElementById("runtime").value = runtime;
  document.getElementById("plot").value = plot;
  document.getElementById("actors").value = actors;
};
// delete mongo movie
const deleteMovie = async (id) => {
  if (!confirm("¿Segur@ que quieres eliminar esta película?")) return;

  const res = await fetch(`/api/films/${id}`, { method: "DELETE" });
  const data = await res.json();
  alert(data.message || data.error);
  loadMovies();
};

loadMovies();
