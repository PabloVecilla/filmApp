const request = require("supertest");
const axios = require("axios");

const { User } = require("../src/models");
const Film = require("../src/models/Film.model");

describe("Film tests", () => {
  const validUserData = {
    name: "Carla",
    email: "carla@example.com",
    password: "TestUser1!",
  };

  const validFilmData = {
    title: "Test Film",
    poster: "https://example.com/poster.jpg",
    year: 2024,
    director: "Test Director",
    genre: "Acción",
    runtime: 120,
    plot: "A film created for integration tests.",
    actors: ["Actor One", "Actor Two"],
    rating: [],
  };

  const omdbFilm = {
    Title: "The Matrix",
    Poster: "https://example.com/matrix.jpg",
    Year: "1999",
    imdbID: "tt0133093",
    Director: "Lana Wachowski, Lilly Wachowski",
    Genre: "Action, Sci-Fi",
    Runtime: "136 min",
    Plot: "A computer hacker discovers the truth.",
    Actors: "Keanu Reeves, Laurence Fishburne",
    imdbRating: "8.7",
    Response: "True",
  };

  async function createAuthenticatedUser(userData, role = "user") {
    const agent = request.agent(global.testApp);

    const signupResponse = await agent
      .post("/api/signup")
      .send(userData)
      .expect(201);

    const userId = signupResponse.body.user.id;

    // Public signup must always create a normal user.
    // Promote directly in the test database before login.
    if (role === "admin") {
      await User.update(
        { role: "admin" },
        { where: { id: userId } }
      );
    }

    await agent
      .post("/api/login")
      .send({
        email: userData.email,
        password: userData.password,
      })
      .expect(200);

    return { agent, userId };
  }

  function mockOmdbResponse(data) {
    return jest
      .spyOn(axios, "get")
      .mockResolvedValue({ data });
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/films", () => {
    it("fetches and normalizes a film from OMDb", async () => {
      const { agent } =
        await createAuthenticatedUser(validUserData);

      mockOmdbResponse(omdbFilm);

      const response = await agent
        .get("/api/films")
        .query({ t: "The Matrix" })
        .expect(200);

      expect(response.body.Response).toBe("True");
      expect(response.body.Search).toHaveLength(1);

      expect(response.body.Search[0]).toMatchObject({
        title: "The Matrix",
        year: "1999",
        id: "tt0133093",
        movieSource: "omdb",
        movieSourceId: "tt0133093",
        director: "Lana Wachowski, Lilly Wachowski",
      });

      expect(axios.get).toHaveBeenCalledWith(
        "https://www.omdbapi.com/",
        {
          params: {
            apikey: process.env.OMDB_API_KEY,
            t: "The Matrix",
          },
          timeout: 5000,
        }
      );
    });

    it("fetches OMDb search results", async () => {
      const { agent } =
        await createAuthenticatedUser(validUserData);

      mockOmdbResponse({
        Response: "True",
        Search: [
          omdbFilm,
          {
            ...omdbFilm,
            Title: "The Matrix Reloaded",
            imdbID: "tt0234215",
          },
        ],
      });

      const response = await agent
        .get("/api/films")
        .query({ s: "Matrix" })
        .expect(200);

      expect(response.body.Search).toHaveLength(2);
      expect(response.body.Search[0].movieSource).toBe("omdb");
      expect(response.body.Search[1].title).toBe(
        "The Matrix Reloaded"
      );
    });

    it("falls back to MongoDB when OMDb has no results", async () => {
      const { agent } =
        await createAuthenticatedUser(validUserData);

      await Film.create(validFilmData);

      mockOmdbResponse({
        Response: "False",
        Error: "Movie not found!",
      });

      const response = await agent
        .get("/api/films")
        .query({ t: "Test Film" })
        .expect(200);

      expect(response.body.Response).toBe("True");
      expect(response.body.Search).toHaveLength(1);

      expect(response.body.Search[0]).toMatchObject({
        title: "Test Film",
        movieSource: "mongo",
        director: "Test Director",
      });
    });

    it("returns 404 when neither OMDb nor MongoDB has results", async () => {
      const { agent } =
        await createAuthenticatedUser(validUserData);

      mockOmdbResponse({
        Response: "False",
        Error: "Movie not found!",
      });

      const response = await agent
        .get("/api/films")
        .query({ t: "Nonexistent Film" })
        .expect(404);

      expect(response.body).toEqual({
        error: "Movie not found!",
      });
    });

    it("requires a search parameter", async () => {
      const { agent } =
        await createAuthenticatedUser(validUserData);

      const axiosGetSpy = jest.spyOn(axios, "get"); 

      const response = await agent
        .get("/api/films")
        .expect(400);

      expect(response.body).toEqual({
        error: "Debes proporcionar al menos: t, i o s",
      });

      expect(axiosGetSpy).not.toHaveBeenCalled();
    });

    it("rejects unauthenticated searches", async () => {
      await request(global.testApp)
        .get("/api/films")
        .query({ t: "The Matrix" })
        .expect(401);
    });

    it("returns 500 when the OMDb request throws", async () => {
      const { agent } =
        await createAuthenticatedUser(validUserData);

      jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      jest
        .spyOn(axios, "get")
        .mockRejectedValue(new Error("OMDb unavailable"));

      const response = await agent
        .get("/api/films")
        .query({ t: "The Matrix" })
        .expect(500);

      expect(response.body).toEqual({
        error: "Error al conectar con OMDB",
      });
    });
  });

  describe("GET /api/films/random", () => {
    it("returns up to twelve normalized random OMDb films", async () => {
      const movies = Array.from({ length: 12 }, (_, index) => ({
        ...omdbFilm,
        Title: `Random Film ${index + 1}`,
        imdbID: `tt${String(index + 1).padStart(7, "0")}`,
      }));

      mockOmdbResponse({
        Response: "True",
        Search: movies,
      });

      const response = await request(global.testApp)
        .get("/api/films/random")
        .expect(200);

      expect(response.body).toHaveLength(12);

      expect(response.body[0]).toMatchObject({
        movieSource: "omdb",
      });

      expect(response.body.every((film) => film.title)).toBe(true);
    });

    it("returns 404 when OMDb provides no random films", async () => {
      mockOmdbResponse({
        Response: "False",
        Error: "Movie not found!",
      });

      const response = await request(global.testApp)
        .get("/api/films/random")
        .expect(404);

      expect(response.body).toEqual({
        error: "No se encontraron películas",
      });

      // The controller tries a maximum of three pages.
      expect(axios.get).toHaveBeenCalledTimes(3);
    });

    it("returns 500 when the random OMDb request fails", async () => {
      jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      jest
        .spyOn(axios, "get")
        .mockRejectedValue(new Error("OMDb unavailable"));

      const response = await request(global.testApp)
        .get("/api/films/random")
        .expect(500);

      expect(response.body).toEqual({
        error: "Error obteniendo películas random",
      });
    });
  });

  describe("Admin film routes", () => {
    const adminData = {
      name: "Admin",
      email: "admin@example.com",
      password: "AdminUser1!",
    };

    it("allows an admin to list MongoDB films", async () => {
      const { agent } =
        await createAuthenticatedUser(adminData, "admin");

      await Film.create(validFilmData);

      const response = await agent
        .get("/api/films/admin")
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe("Test Film");
    });

    it("returns a message when there are no admin films", async () => {
      const { agent } =
        await createAuthenticatedUser(adminData, "admin");

      const response = await agent
        .get("/api/films/admin")
        .expect(200);

      expect(response.body).toEqual({
        message: "No hay peliculas creadas por administrador",
      });
    });

    it("allows an admin to fetch a MongoDB film by ID", async () => {
      const { agent } =
        await createAuthenticatedUser(adminData, "admin");

      const film = await Film.create(validFilmData);

      const response = await agent
        .get(`/api/films/admin/${film._id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        title: "Test Film",
        director: "Test Director",
      });
    });

    it("allows an admin to create a film", async () => {
      const { agent } =
        await createAuthenticatedUser(adminData, "admin");

      const response = await agent
        .post("/api/films")
        .send(validFilmData)
        .expect(201);

      expect(response.body.message).toBe("Pelicula creada");
      expect(response.body.film.title).toBe("Test Film");

      const storedFilm = await Film.findById(
        response.body.film._id
      );

      expect(storedFilm).not.toBeNull();
      expect(storedFilm.director).toBe("Test Director");
    });

    it("allows an admin to update a film", async () => {
      const { agent } =
        await createAuthenticatedUser(adminData, "admin");

      const film = await Film.create(validFilmData);

      const response = await agent
        .put(`/api/films/${film._id}`)
        .send({
          title: "Updated Film",
          runtime: 130,
          unauthorizedField: "ignored",
        })
        .expect(200);

      expect(response.body.message).toBe("Pelicula editada");
      expect(response.body.film.title).toBe("Updated Film");
      expect(response.body.film.runtime).toBe(130);
      expect(response.body.film.unauthorizedField).toBeUndefined();

      const storedFilm = await Film.findById(film._id);

      expect(storedFilm.title).toBe("Updated Film");
    });

    it("allows an admin to delete a film", async () => {
      const { agent } =
        await createAuthenticatedUser(adminData, "admin");

      const film = await Film.create(validFilmData);

      await agent
        .delete(`/api/films/${film._id}`)
        .expect(200);

      expect(await Film.findById(film._id)).toBeNull();
    });

    it("rejects admin routes for a normal user", async () => {
      const { agent } =
        await createAuthenticatedUser(validUserData);

      await agent
        .post("/api/films")
        .send(validFilmData)
        .expect(403);

      expect(await Film.countDocuments()).toBe(0);
    });

    it("rejects admin routes for an unauthenticated user", async () => {
      await request(global.testApp)
        .get("/api/films/admin")
        .expect(401);
    });
  });
});
