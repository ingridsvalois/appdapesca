import request from "supertest";
import { app } from "../../app";

const withDb = process.env.DATABASE_URL ? describe : describe.skip;

withDb("Auth", () => {
  it("POST /api/auth/register with valid body returns 201", async () => {
    const email = `test-${Date.now()}@example.com`;
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email, password: "password123" })
      .set("Content-Type", "application/json");
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("email", email);
  });

  it("POST /api/auth/register with short password returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "a@b.com", password: "short" })
      .set("Content-Type", "application/json");
    expect(res.status).toBe(400);
  });
});
