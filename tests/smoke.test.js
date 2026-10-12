const request = require("supertest");

describe("Application smoke tests", () => {
  test("GET /health returns 200", async () => {
    const response = await request(global.testApp)
      .get("/health")
      .expect(200);

    expect(response.body.status).toBe("UP");
  });

  test("unknown API route returns JSON 404", async () => {
    const response = await request(global.testApp)
      .get("/api/does-not-exist")
      .expect(404);

    expect(response.body).toEqual({
      message: "Not found",
    });
  });
});