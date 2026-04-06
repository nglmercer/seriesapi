import { describe, it, expect } from "bun:test";
import { parseAcceptLanguage, resolveLocale } from "../src/i18n";

describe("i18n", () => {
  describe("parseAcceptLanguage", () => {
    it("should parse Accept-Language header correctly", () => {
      const parsed = parseAcceptLanguage("es-MX,es;q=0.9,en;q=0.8");
      expect(parsed[0]).toBe("es-MX");
      expect(parsed[1]).toBe("es");
      expect(parsed[2]).toBe("en");
    });

    it("should handle single language", () => {
      const parsed = parseAcceptLanguage("en");
      expect(parsed).toEqual(["en"]);
    });

    it("should handle empty header", () => {
      const parsed = parseAcceptLanguage("");
      expect(parsed).toContain("en");
    });

    it("should handle complex header with quality values", () => {
      const parsed = parseAcceptLanguage("pt-BR,pt;q=0.9,en;q=0.8,es;q=0.7");
      expect(parsed[0]).toBe("pt-BR");
      expect(parsed[1]).toBe("pt");
      expect(parsed[2]).toBe("en");
      expect(parsed[3]).toBe("es");
    });
  });

  describe("resolveLocale", () => {
    it("should resolve to supported locale", () => {
      expect(resolveLocale("es-MX,es;q=0.9", new Set(["en", "es"]))).toBe("es");
    });

    it("should fallback when no match", () => {
      expect(resolveLocale("fr-CA,fr;q=0.9", new Set(["en", "es"]))).toBe("en");
    });

    it("should resolve to exact match when available", () => {
      expect(resolveLocale("pt-BR,pt;q=0.9,es;q=0.8", new Set(["en", "es"]))).toBe("es");
    });

    it("should fallback to default when nothing matches", () => {
      expect(resolveLocale("ru,ru-RU;q=0.9", new Set(["en", "es"]))).toBe("en");
    });

    it("should handle empty header", () => {
      expect(resolveLocale("", new Set(["en", "es"]))).toBe("en");
    });
  });
});