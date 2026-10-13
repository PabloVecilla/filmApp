const jwt = require("jsonwebtoken");
const request = require("supertest");

const { Favorite, User } = require("../src/models");

describe("User API tests", () => {
  let admin;
  let normalUser;
  let targetUser;

  const createUser = (overrides = {}) =>
    User.create({
      name: "Test User",
      email: "test-user@example.com",
      passwordHash: "stored-password-hash",
      role: "user",
      ...overrides,
    });

  const authCookie = (user, overrides = {}) => {
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...overrides,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "20m" },
    );

    return `accessToken=${token}`;
  };

  const expectSafeUser = (user) => {
    expect(user).not.toHaveProperty("passwordHash");
    expect(user).not.toHaveProperty("password_hash");
    expect(user).not.toHaveProperty("createdAt");
    expect(user).not.toHaveProperty("updatedAt");
  };

  const protectedEndpoints = [
    {
      label: "list users",
      method: "get",
      path: () => "/api/users",
    },
    {
      label: "get a user",
      method: "get",
      path: () => `/api/user/${targetUser.id}`,
    },
    {
      label: "update a user",
      method: "put",
      path: () => `/api/user/${targetUser.id}`,
      body: { role: "admin" },
    },
    {
      label: "delete a user",
      method: "delete",
      path: () => `/api/user/${targetUser.id}`,
    },
  ];

  const callEndpoint = (endpoint, cookie) => {
    let apiRequest = request(global.testApp)[endpoint.method](endpoint.path());

    if (cookie) {
      apiRequest = apiRequest.set("Cookie", cookie);
    }

    if (endpoint.body) {
      apiRequest = apiRequest.send(endpoint.body);
    }

    return apiRequest;
  };

  beforeEach(async () => {
    admin = await createUser({
      name: "Admin User",
      email: "admin-users-test@example.com",
      role: "admin",
    });
    normalUser = await createUser({
      name: "Normal User",
      email: "normal-users-test@example.com",
    });
    targetUser = await createUser({
      name: "Target User",
      email: "target-users-test@example.com",
    });
  });

  describe("GET /api/users", () => {
    it("allows an admin to list users without exposing sensitive fields", async () => {
      const response = await request(global.testApp)
        .get("/api/users")
        .set("Cookie", authCookie(admin))
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body).toEqual(
        expect.arrayContaining([
          {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
          },
        ]),
      );
      response.body.forEach(expectSafeUser);
    });

    it("does not expose internal database errors", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      jest
        .spyOn(User, "findAll")
        .mockRejectedValue(new Error("private database connection details"));

      const response = await request(global.testApp)
        .get("/api/users")
        .set("Cookie", authCookie(admin))
        .expect(500);

      expect(response.body).toEqual({ message: "Internal server error" });
      expect(JSON.stringify(response.body)).not.toContain("private database");
    });
  });

  describe("GET /api/user/:id", () => {
    it("allows an admin to fetch one user without sensitive fields", async () => {
      const response = await request(global.testApp)
        .get(`/api/user/${targetUser.id}`)
        .set("Cookie", authCookie(admin))
        .expect(200);

      expect(response.body).toEqual({
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      });
      expectSafeUser(response.body);
    });

    it("returns 404 when the user does not exist", async () => {
      await request(global.testApp)
        .get("/api/user/999999")
        .set("Cookie", authCookie(admin))
        .expect(404, { message: "User not found" });
    });

    it("rejects malformed user IDs without leaking database errors", async () => {
      const response = await request(global.testApp)
        .get("/api/user/not-a-number")
        .set("Cookie", authCookie(admin))
        .expect(400);

      expect(response.body).toEqual({ message: "Invalid user id" });
    });
  });

  describe("PUT /api/user/:id", () => {
    it("allows an admin to promote and demote a user", async () => {
      const promoteResponse = await request(global.testApp)
        .put(`/api/user/${targetUser.id}`)
        .set("Cookie", authCookie(admin))
        .send({ role: "admin" })
        .expect(200);

      expect(promoteResponse.body.user.role).toBe("admin");
      expectSafeUser(promoteResponse.body.user);
      expect((await targetUser.reload()).role).toBe("admin");

      const demoteResponse = await request(global.testApp)
        .put(`/api/user/${targetUser.id}`)
        .set("Cookie", authCookie(admin))
        .send({ role: "user" })
        .expect(200);

      expect(demoteResponse.body.user.role).toBe("user");
      expect((await targetUser.reload()).role).toBe("user");
    });

    it("rejects invalid roles without changing the user", async () => {
      await request(global.testApp)
        .put(`/api/user/${targetUser.id}`)
        .set("Cookie", authCookie(admin))
        .send({ role: "superadmin" })
        .expect(400, { message: "Invalid user role" });

      expect((await targetUser.reload()).role).toBe("user");
    });

    it("ignores mass-assignment attempts and only updates the role", async () => {
      const originalPasswordHash = targetUser.passwordHash;

      const response = await request(global.testApp)
        .put(`/api/user/${targetUser.id}`)
        .set("Cookie", authCookie(admin))
        .send({
          id: admin.id,
          name: "Injected Name",
          email: "injected@example.com",
          passwordHash: "attacker-controlled-hash",
          role: "admin",
        })
        .expect(200);

      await targetUser.reload();
      expect(targetUser).toMatchObject({
        name: "Target User",
        email: "target-users-test@example.com",
        passwordHash: originalPasswordHash,
        role: "admin",
      });
      expect(response.body.user).toMatchObject({
        id: targetUser.id,
        name: "Target User",
        email: "target-users-test@example.com",
        role: "admin",
      });
      expectSafeUser(response.body.user);
    });

    it("returns 404 when the user does not exist", async () => {
      await request(global.testApp)
        .put("/api/user/999999")
        .set("Cookie", authCookie(admin))
        .send({ role: "admin" })
        .expect(404, { message: "User not found" });
    });

    it("rejects malformed user IDs", async () => {
      await request(global.testApp)
        .put("/api/user/not-a-number")
        .set("Cookie", authCookie(admin))
        .send({ role: "admin" })
        .expect(400, { message: "Invalid user id" });
    });
  });

  describe("DELETE /api/user/:id", () => {
    it("allows an admin to delete a user and cascade their favorites", async () => {
      await Favorite.create({
        userId: targetUser.id,
        movieSource: "omdb",
        movieSourceId: "tt0133093",
      });

      const response = await request(global.testApp)
        .delete(`/api/user/${targetUser.id}`)
        .set("Cookie", authCookie(admin))
        .expect(200);

      expect(response.body.user).toMatchObject({
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      });
      expectSafeUser(response.body.user);
      expect(await User.findByPk(targetUser.id)).toBeNull();
      expect(await Favorite.count({ where: { userId: targetUser.id } })).toBe(0);
    });

    it("returns 404 when the user does not exist", async () => {
      await request(global.testApp)
        .delete("/api/user/999999")
        .set("Cookie", authCookie(admin))
        .expect(404, { message: "User not found" });
    });

    it("rejects malformed user IDs", async () => {
      await request(global.testApp)
        .delete("/api/user/not-a-number")
        .set("Cookie", authCookie(admin))
        .expect(400, { message: "Invalid user id" });
    });
  });

  describe("Authorization", () => {
    it.each(protectedEndpoints)(
      "rejects unauthenticated attempts to $label",
      async (endpoint) => {
        const response = await callEndpoint(endpoint).expect(401);
        expect(response.body).toEqual({ message: "Unauthorized" });
      },
    );

    it.each(protectedEndpoints)(
      "rejects non-admin attempts to $label",
      async (endpoint) => {
        const response = await callEndpoint(
          endpoint,
          authCookie(normalUser),
        ).expect(403);
        expect(response.body).toEqual({ message: "Admin only" });
      },
    );

    it("rejects invalid authentication tokens", async () => {
      const response = await request(global.testApp)
        .get("/api/users")
        .set("Cookie", "accessToken=invalid-token")
        .expect(401);

      expect(response.body).toEqual({
        message: "Invalid or expired token",
      });
    });
  });
});
