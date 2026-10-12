const request = require("supertest");
const {User} = require("../src/models"); 

describe("Auth tests", () => {
    const validUserData = {
        name: "Carla",
        email: "carla@example.com",
        password: "TestUser1!"
      }
      const invalidUserData = {
        name: "Carla",
        email: "carla123@example.com",
        password: "TestUser"
      }

  describe("POST /api/signup", () => {
    it("registers a new user with valid credentials", async () => {
        const response = await request(global.testApp).post("/api/signup").send(validUserData);

        const user = await User.findOne({where: {email: validUserData.email}}); 

        expect(response.status).toBe(201);
        expect(response.body.user).toEqual({ id: user.id, name: user.name, role: user.role });
    }); 
    it("rejects an existing user", async () => {
        await request(global.testApp).post("/api/signup").send(validUserData);
        const response = await request(global.testApp).post("/api/signup").send(validUserData);

        expect(response.status).toBe(409);
        expect(response.body.message).toBe("User already exists");
    })
    it("rejects register with invalid password", async () => {
        const response = await request(global.testApp).post("/api/signup").send(invalidUserData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Password must contain 1 number, 1 uppercase letter and 1 special character");
    })
    it("rejects register with invalid email", async () => {
        const response = await request(global.testApp).post("/api/signup").send({
            name: "Carla",
            email: "carla1example.com",
            password: "TestUser"
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid email format");
    })
  });
});