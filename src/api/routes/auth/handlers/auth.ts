import { getDrizzle } from "../../../../init";
import { usersTable, sessionsTable } from "../../../../schema";
import { validateParams, registerSchema, loginSchema } from "../../../validation";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../../../i18n";
import { ok, unauthorized, forbidden, methodNotAllowed, conflict, serverError } from "../../../response";
import { withAuth } from "../middleware";
import type { AuthUser } from "../middleware";
import { hashPassword, verifyPassword, generateToken, generateVerificationCode } from "../utils";

export async function handleRegister(req: Request): Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  if (req.method !== "POST") return methodNotAllowed(locale);

  try {
    const body = await req.json();
    const v = validateParams(registerSchema, body, locale);
    if (!v.success) return v.error;

    const { username, email, password, display_name } = v.data;

    const drizzle = getDrizzle();
    const existing = drizzle.select(usersTable)
      .select("id")
      .where("username = ? OR email = ?", [username, email])
      .all();

    if (existing.length > 0) {
      return conflict("Username or email already exists", locale);
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    const result = drizzle.insert(usersTable).values({
      username,
      email,
      password_hash: passwordHash,
      display_name: display_name || username,
      role: 'user',
      is_active: 1,
      created_at: now,
      updated_at: now
    }).run();

    const userId = result.lastInsertRowid;

    return ok({ id: userId, username, email, display_name: display_name || username }, { locale }, 201);
  } catch (err) {
    return serverError(err, locale);
  }
}

export async function handleLogin(req: Request): Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  if (req.method !== "POST") return methodNotAllowed(locale);

  try {
    const body = await req.json();
    const v = validateParams(loginSchema, body, locale);
    if (!v.success) return v.error;

    const { username, password } = v.data;

    const drizzle = getDrizzle();
    const users = drizzle.select(usersTable)
      .select("id", "username", "email", "password_hash", "display_name", "role", "is_active")
      .where("username = ? OR email = ?", [username, username])
      .all();

    if (users.length === 0) {
      return unauthorized("Invalid credentials", locale);
    }

    const user = users[0]!;

    if (!user.is_active) {
      return forbidden("Account is disabled", locale);
    }

    const valid = await verifyPassword(password, user.password_hash as string);
    if (!valid) {
      return unauthorized("Invalid credentials", locale);
    }

    if ((user.password_hash as string).startsWith("sha256_")) {
      const newHash = await hashPassword(password);
      drizzle.update(usersTable)
        .set({ password_hash: newHash, updated_at: new Date().toISOString() })
        .where("id = ?", [user.id])
        .run();
      console.log(`[auth] Migrated user ${user.username} to new password hashing algorithm`);
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    drizzle.insert(sessionsTable).values({
      user_id: user.id,
      token,
      expires_at: expiresAt,
      created_at: now
    }).run();

    return ok({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name || user.username,
        role: user.role,
      },
    }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
}

export const handleLogout = withAuth(async (req: Request, _user: AuthUser) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const drizzle = getDrizzle();
      drizzle.delete(sessionsTable).where("token = ?", [token]).run();
    }

    return ok({ message: "Logged out successfully" }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

export const handleMe = withAuth(async (req: Request, user: AuthUser) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  
  try {
    const drizzle = getDrizzle();

    const users = drizzle.select(usersTable)
      .select("id", "username", "email", "display_name", "role")
      .where("id = ?", [user.id])
      .all();

    if (users.length === 0) {
      return unauthorized("User not found", locale);
    }

    const userData = users[0]!;

    return ok({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      display_name: userData.display_name || userData.username,
      role: userData.role,
    }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});