import { describe, it, expect } from "bun:test";
import { badRequest, serverError, notFound, ok, parsePagination } from "../src/api/response";

describe("API Response Helpers", () => {
  describe("badRequest", () => {
    it("should create 400 response with error message", async () => {
      const res = badRequest("Invalid input", "en");
      expect(res.status).toBe(400);
      const body = await res.json() as { ok: boolean; error: string };
      expect(body.ok).toBe(false);
      expect(body.error).toBe("Invalid input");
    });

    it("should include locale in meta", async () => {
      const res = badRequest("Error", "es");
      const body = await res.json() as { meta: { locale: string } };
      expect(body.meta.locale).toBe("es");
    });
  });

  describe("serverError", () => {
    it("should create 500 response", async () => {
      const res = serverError(new Error("test"), "en");
      expect(res.status).toBe(500);
    });

    it("should return generic error message", async () => {
      const res = serverError(new Error("test"), "en");
      const body = await res.json() as { ok: boolean; error: string };
      expect(body.ok).toBe(false);
      expect(body.error).toBe("Internal server error");
    });
  });

  describe("notFound", () => {
    it("should create 404 response with resource name", async () => {
      const res = notFound("Media", "en");
      expect(res.status).toBe(404);
      const body = await res.json() as { ok: boolean; error: string };
      expect(body.ok).toBe(false);
      expect(body.error).toBe("Media not found");
    });

    it("should work for different resources", async () => {
      const res1 = notFound("Person", "en");
      const res2 = notFound("Season", "en");
      const body1 = await res1.json() as { error: string };
      const body2 = await res2.json() as { error: string };
      expect(body1.error).toBe("Person not found");
      expect(body2.error).toBe("Season not found");
    });
  });

  describe("ok", () => {
    it("should create 200 response with data", async () => {
      const res = ok({ id: 1, name: "test" }, { locale: "en" });
      expect(res.status).toBe(200);
      const body = await res.json() as { ok: boolean; data: unknown };
      expect(body.ok).toBe(true);
      expect(body.data).toEqual({ id: 1, name: "test" });
    });

    it("should include meta in response", async () => {
      const res = ok([], { locale: "es", page: 1, pageSize: 20, total: 100 });
      const body = await res.json() as { meta: { locale: string; page: number; pageSize: number; total: number } };
      expect(body.meta.locale).toBe("es");
      expect(body.meta.page).toBe(1);
      expect(body.meta.total).toBe(100);
    });

    it("should allow custom status code", async () => {
      const res = ok({ created: true }, { locale: "en" }, 201);
      expect(res.status).toBe(201);
    });
  });

  describe("parsePagination", () => {
    it("should parse pagination params from URL", () => {
      const url = new URL("http://localhost/api?page=3&limit=50");
      const { page, pageSize, offset } = parsePagination(url);
      expect(page).toBe(3);
      expect(pageSize).toBe(50);
      expect(offset).toBe(100);
    });

    it("should use defaults for missing params", () => {
      const url = new URL("http://localhost/api");
      const { page, pageSize, offset } = parsePagination(url);
      expect(page).toBe(1);
      expect(pageSize).toBe(20);
      expect(offset).toBe(0);
    });

    it("should enforce max limit", () => {
      const url = new URL("http://localhost/api?page=1&limit=500");
      const { pageSize } = parsePagination(url);
      expect(pageSize).toBe(100);
    });

    it("should use default for invalid limit values", () => {
      const url = new URL("http://localhost/api?page=1&limit=0");
      const { pageSize } = parsePagination(url);
      expect(pageSize).toBe(20);
    });

    it("should handle invalid page values", () => {
      const url = new URL("http://localhost/api?page=-5");
      const { page } = parsePagination(url);
      expect(page).toBe(1);
    });
  });
});