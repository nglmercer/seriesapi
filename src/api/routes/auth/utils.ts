import { getDrizzle } from "../../../init";
import { usersTable, sessionsTable, verificationCodesTable, rolesTable } from "../../../schema";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../../i18n";
import { ok, unauthorized, forbidden, methodNotAllowed, serverError } from "../../response";

const DAILON_API_KEY = process.env.DAILON_API_KEY ?? "demo_key_123";

export function hashPasswordLegacy(password: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + DAILON_API_KEY);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i]!;
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "sha256_" + Math.abs(hash).toString(16);
}

export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 2,
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith("sha256_")) {
    return hashPasswordLegacy(password) === hash;
  }

  try {
    return await Bun.password.verify(password, hash);
  } catch (e) {
    console.error("[auth] password verification error:", e);
    return false;
  }
}

export function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function ensureDefaultRoles() {
  const drizzle = getDrizzle();
  const existing = drizzle.select(rolesTable).all();
  if (existing.length === 0) {
    const now = new Date().toISOString();
    drizzle.insert(rolesTable).values({ name: "admin", description: "System Administrator", is_default: 1, created_at: now, updated_at: now }).run();
    drizzle.insert(rolesTable).values({ name: "user", description: "Standard User", is_default: 1, created_at: now, updated_at: now }).run();
    console.log("[auth] Default roles seeded");
  }
}