const request = require("supertest");
const { Favorite } = require("../src/models");
const Film = require("../src/models/Film.model");

describe("Favorites tests", () => {
  const validUserData = {
    name: "Carla",
    email: "carla@example.com",
    password: "TestUser1!",
  };

  const secondUserData = {
    name: "John",
    email: "john@example.com",
    password: "TestUser2!",
  };

  let agent;
  let userId;
  let film;

  async function createAuthenticatedUser(userData) {
    const userAgent = request.agent(global.testApp);

    const signupResponse = await userAgent
      .post("/api/signup")
      .send(userData)
      .expect(201);

    await userAgent
      .post("/api/login")
      .send({
        email: userData.email,
        password: userData.password,
      })
      .expect(200);

    return {
      agent: userAgent,
      userId: signupResponse.body.user.id,
    };
  }

  beforeEach(async () => {
    const authenticatedUser =
      await createAuthenticatedUser(validUserData);

    agent = authenticatedUser.agent;
    userId = authenticatedUser.userId;

    film = await Film.create({
      title: "Test Film",
      poster: "https://example.com/poster.jpg",
      year: 2024,
      director: "Test Director",
      genre: "Acción",
      runtime: 120,
      plot: "A film created for integration tests.",
      actors: ["Actor One", "Actor Two"],
      rating: [],
    });
  });

  describe("GET /api/favorites", () => {
    it("fetches favorites belonging to the authenticated user", async () => {
      const favorite = await Favorite.create({
        userId,
        movieSource: "mongo",
        movieSourceId: film._id.toString(),
      });

      const response = await agent
        .get("/api/favorites")
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        favoriteId: favorite.id,
        movieSource: "mongo",
        movieSourceId: film._id.toString(),
        unavailable: false,
        title: "Test Film",
      });
    });

    it("does not expose another user's favorites", async () => {
      const secondUser =
        await createAuthenticatedUser(secondUserData);

      const ownFavorite = await Favorite.create({
        userId,
        movieSource: "mongo",
        movieSourceId: film._id.toString(),
      });

      await Favorite.create({
        userId: secondUser.userId,
        movieSource: "mongo",
        movieSourceId: film._id.toString(),
      });

      const response = await agent
        .get("/api/favorites")
        // This query parameter should be ignored.
        .query({ userId: secondUser.userId })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].favoriteId).toBe(ownFavorite.id);
    });

    it("marks a missing Mongo film as unavailable", async () => {
      const favorite = await Favorite.create({
        userId,
        movieSource: "mongo",
        movieSourceId: "507f1f77bcf86cd799439011",
      });

      const response = await agent
        .get("/api/favorites")
        .expect(200);

      expect(response.body[0]).toEqual({
        favoriteId: favorite.id,
        movieSource: "mongo",
        movieSourceId: "507f1f77bcf86cd799439011",
        unavailable: true,
      });
    });

    it("rejects unauthenticated access", async () => {
      const response = await request(global.testApp)
        .get("/api/favorites")
        .expect(401);

      expect(response.body).toEqual({
        message: "Unauthorized",
      });
    });
  });

  describe("POST /api/favorites", () => {
    it("adds a favorite to the authenticated user's list", async () => {
      const response = await agent
        .post("/api/favorites")
        .send({
          movieSource: "mongo",
          movieSourceId: film._id.toString(),
        })
        .expect(201);

      expect(response.body.created).toBe(true);
      expect(response.body.favorite).toMatchObject({
        userId,
        movieSource: "mongo",
        movieSourceId: film._id.toString(),
      });

      const storedFavorite = await Favorite.findOne({
        where: {
          userId,
          movieSource: "mongo",
          movieSourceId: film._id.toString(),
        },
      });

      expect(storedFavorite).not.toBeNull();
    });

    it("does not allow assigning a favorite to another user", async () => {
      const secondUser =
        await createAuthenticatedUser(secondUserData);

      const response = await agent
        .post("/api/favorites")
        .send({
          userId: secondUser.userId,
          movieSource: "mongo",
          movieSourceId: film._id.toString(),
        })
        .expect(201);

      // The controller must ignore body.userId.
      expect(response.body.favorite.userId).toBe(userId);

      const otherUserFavorite = await Favorite.findOne({
        where: {
          userId: secondUser.userId,
          movieSourceId: film._id.toString(),
        },
      });

      expect(otherUserFavorite).toBeNull();
    });

    it("does not create duplicate favorites", async () => {
      const favoriteData = {
        movieSource: "mongo",
        movieSourceId: film._id.toString(),
      };

      await agent
        .post("/api/favorites")
        .send(favoriteData)
        .expect(201);

      const response = await agent
        .post("/api/favorites")
        .send(favoriteData)
        .expect(200);

      expect(response.body.created).toBe(false);

      const count = await Favorite.count({
        where: {
          userId,
          ...favoriteData,
        },
      });

      expect(count).toBe(1);
    });

    it("rejects an invalid movie source", async () => {
      const response = await agent
        .post("/api/favorites")
        .send({
          movieSource: "netflix",
          movieSourceId: "123",
        })
        .expect(400);

      expect(response.body.message).toBe(
        "movieSource debe ser omdb o mongo"
      );
    });

    it("rejects missing favorite fields", async () => {
      await agent
        .post("/api/favorites")
        .send({ movieSource: "mongo" })
        .expect(400);
    });

    it("rejects unauthenticated additions", async () => {
      await request(global.testApp)
        .post("/api/favorites")
        .send({
          movieSource: "mongo",
          movieSourceId: film._id.toString(),
        })
        .expect(401);
    });
  });

  describe("DELETE /api/favorites/:id", () => {
    it("deletes the authenticated user's favorite", async () => {
      const favorite = await Favorite.create({
        userId,
        movieSource: "mongo",
        movieSourceId: film._id.toString(),
      });

      const response = await agent
        .delete(`/api/favorites/${favorite.id}`)
        .expect(200);

      expect(response.body.message).toContain(
        `ID: ${favorite.id}`
      );

      expect(
        await Favorite.findByPk(favorite.id)
      ).toBeNull();
    });

    it("does not delete another user's favorite", async () => {
      const secondUser =
        await createAuthenticatedUser(secondUserData);

      const favorite = await Favorite.create({
        userId: secondUser.userId,
        movieSource: "mongo",
        movieSourceId: film._id.toString(),
      });

      const response = await agent
        .delete(`/api/favorites/${favorite.id}`)
        .expect(404);

      expect(response.body).toEqual({
        message: "Favorito no encontrado",
      });

      expect(
        await Favorite.findByPk(favorite.id)
      ).not.toBeNull();
    });

    it("returns 404 for a nonexistent favorite", async () => {
      await agent
        .delete("/api/favorites/999999")
        .expect(404);
    });

    it("rejects unauthenticated deletion", async () => {
      const favorite = await Favorite.create({
        userId,
        movieSource: "mongo",
        movieSourceId: film._id.toString(),
      });

      await request(global.testApp)
        .delete(`/api/favorites/${favorite.id}`)
        .expect(401);

      expect(
        await Favorite.findByPk(favorite.id)
      ).not.toBeNull();
    });
  });
});