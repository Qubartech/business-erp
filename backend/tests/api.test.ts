import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("health endpoint", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("auth", () => {
  it("rejects unauthenticated /api/auth/me", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
  it("validates login payload", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "x", password: "" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("404", () => {
  it("returns envelope error for unknown route", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("github webhook", () => {
  it("rejects invalid webhook payload", async () => {
    const res = await request(app).post("/api/webhooks/github").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
  it("processes webhook push events with no matching projects", async () => {
    const res = await request(app)
      .post("/api/webhooks/github")
      .send({
        repository: { full_name: "nonexistent/repo" },
        commits: [
          {
            id: "sha123",
            message: "Commit message",
            timestamp: "2026-06-13T12:00:00Z",
            url: "https://github.com/nonexistent/repo/commit/sha123",
            author: { name: "Author", email: "author@test.com" }
          }
        ]
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("No matching projects");
  });
});

