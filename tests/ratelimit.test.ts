import { describe, it, expect } from "bun:test";
import { createRateLimiter, corsHeaders, handlePreflight } from "../src/middleware/ratelimit";

describe("Rate Limiter Middleware", () => {
  describe("createRateLimiter", () => {
    it("should allow requests within limit", () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 3 });
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "10.0.0.1" }
      });

      expect(limiter.check(req)).toBeUndefined();
    });

    it("should fallback to unknown when x-forwarded-for is missing", () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 3 });
      const req = new Request("http://localhost/api/test"); // No headers

      expect(limiter.check(req)).toBeUndefined();
      expect(limiter.stats().activeKeys).toBeGreaterThanOrEqual(1);
    });

    it("should allow multiple requests within limit", () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "10.0.0.2" }
      });

      expect(limiter.check(req)).toBeUndefined();
      expect(limiter.check(req)).toBeUndefined();
    });

    it("should block requests exceeding limit", () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "10.0.0.3" }
      });

      limiter.check(req);
      limiter.check(req);
      const blocked = limiter.check(req);

      expect(blocked).not.toBeUndefined();
      expect(blocked?.status).toBe(429);
      expect(blocked?.headers.get("X-RateLimit-Remaining")).toBe("0");
    });

    it("should track different IPs separately", () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
      const req1 = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "10.0.0.4" }
      });
      const req2 = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "10.0.0.5" }
      });

      expect(limiter.check(req1)).toBeUndefined();
      expect(limiter.check(req2)).toBeUndefined();
    });

    it("should include rate limit headers in response", () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "10.0.0.6" }
      });

      limiter.check(req);
      limiter.check(req);
      const blocked = limiter.check(req);

      expect(blocked?.headers.get("X-RateLimit-Limit")).toBe("2");
      expect(blocked?.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(blocked?.headers.get("X-RateLimit-Reset")).not.toBeNull();
    });

    it("should include CORS headers", () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "10.0.0.7" }
      });

      limiter.check(req);
      limiter.check(req);
      const blocked = limiter.check(req);

      expect(blocked?.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });
  });

  describe("corsHeaders", () => {
    it("should return CORS headers", () => {
      const headers = corsHeaders();
      expect(headers["Access-Control-Allow-Origin"]).toBe("*");
    });
  });

  describe("handlePreflight", () => {
    it("should handle OPTIONS request", () => {
      const req = new Request("http://localhost/api/test", { method: "OPTIONS" });
      const preflight = handlePreflight(req);
      expect(preflight).not.toBeUndefined();
      expect(preflight?.status).toBe(204);
    });

    it("should return undefined for non-OPTIONS request", () => {
      const req = new Request("http://localhost/api/test", { method: "GET" });
      const preflight = handlePreflight(req);
      expect(preflight).toBeUndefined();
    });
  });
});