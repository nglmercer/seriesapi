import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../i18n";
import { validateParams } from "./validation";
import { ok, notFound, badRequest, forbidden } from "./response";
import type { SqliteNapiAdapter } from "../core/driver";
import { Database } from "sqlite-napi";
import { getDrizzle, getDb } from "../init";

import { z } from "zod";

export class ApiContext {
  public readonly url: URL;
  public readonly locale: string;
  public readonly parts: string[];
  public readonly method: string;
  public readonly params: Record<string, string>;

  constructor(
    public readonly req: Request,
    public readonly drizzle: SqliteNapiAdapter,
    public readonly db: Database
  ) {
    this.url = new URL(req.url);
    this.locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    this.parts = this.url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    this.method = req.method;
    this.params = Object.fromEntries(this.url.searchParams);
  }

  static from(req: Request) {
    return new ApiContext(req, getDrizzle(), getDb());
  }



  get GET() { return this.method === "GET"; }
  get POST() { return this.method === "POST"; }
  get PUT() { return this.method === "PUT"; }
  get DELETE() { return this.method === "DELETE"; }

  // Path segments
  get resource() { return this.parts[2]; }
  get p3() { return this.parts[3]; }
  get p4() { return this.parts[4]; }
  get p5() { return this.parts[5]; }

  /**
   * Parse a segment as an integer.
   * @param index The segment index (e.g. 3 for /api/v1/resource/:id)
   */
  seg(index: number): number {
    return parseInt(this.parts[index] ?? "", 10);
  }

  /**
   * Helper to quickly get a query param
   */
  query(name: string): string | null {
    return this.url.searchParams.get(name);
  }

  /**
   * Helper to validate query params against a schema
   */
  validate<T>(schema: z.ZodSchema<T>) {
    return validateParams(schema, this.params, this.locale);
  }

  /**
   * Helper to parse and optionally validate JSON body
   */
  async body<T>(schema?: z.ZodSchema<T>) {
    try {
      const data = await this.req.json();
      if (schema) {
        return validateParams(schema, data, this.locale);
      }
      return { success: true, data } as const;
    } catch (e) {
      return { success: false, error: new Response("Invalid JSON", { status: 400 }) } as const;
    }
  }

  /**
   * Helper to return a success response
   */
  ok<T>(data: T, meta: any = {}, status: number = 200) {
    return ok(data, { locale: this.locale, ...meta }, status);
  }

  /**
   * Helper to return a not found response
   */
  notFound(resourceName: string) {
    return notFound(resourceName, this.locale);
  }

  /**
   * Helper to return a bad request response
   */
  badRequest(message: string) {
    return badRequest(message, this.locale);
  }

  /**
   * Helper to return a forbidden response
   */
  forbidden(message: string) {
    return forbidden(message, this.locale);
  }

  /**
   * Helper for paginated responses (extracts page/limit)
   */
  get pagination() {
    const page = Math.max(1, parseInt(this.query("page") ?? "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(this.query("limit") ?? "20", 10) || 20),
    );
    return { page, limit, offset: (page - 1) * limit };
  }
}


