import { usersTable, sessionsTable } from "../../../../schema";
import { registerSchema, loginSchema } from "../../../validation";
import { serverError } from "../../../response";
import { withAuth } from "../middleware";
import type { AuthUser } from "../middleware";
import { hashPassword, verifyPassword, generateToken } from "../utils";
import { ApiContext } from "../../../context";

export async function handleRegister(ctx: ApiContext): Promise<Response> {
  if (!ctx.POST) return ctx.badRequest("Method not allowed");

  try {
    const v = await ctx.body(registerSchema);
    if (!v.success) return v.error;

    const { username, email, password, display_name } = v.data;

    const { drizzle } = ctx;
    const existing = drizzle.select(usersTable)
      .select("id")
      .where("username = ? OR email = ?", [username, email])
      .all();

    if (existing.length > 0) {
      return ctx.badRequest("Username or email already exists");
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

    return ctx.ok({ id: userId, username, email, display_name: display_name || username }, {}, 201);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export async function handleLogin(ctx: ApiContext): Promise<Response> {
  if (!ctx.POST) return ctx.badRequest("Method not allowed");

  try {
    const v = await ctx.body(loginSchema);
    if (!v.success) return v.error;

    const { username, password } = v.data;

    const { drizzle } = ctx;
    const users = drizzle.select(usersTable)
      .select("id", "username", "email", "password_hash", "display_name", "role", "is_active")
      .where("username = ? OR email = ?", [username, username])
      .all();

    if (users.length === 0) {
      return ctx.badRequest("Invalid credentials");
    }

    const user = users[0]!;

    if (!user.is_active) {
      return ctx.forbidden("Account is disabled");
    }

    const valid = await verifyPassword(password, user.password_hash as string);
    if (!valid) {
      return ctx.badRequest("Invalid credentials");
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

    return ctx.ok({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name || user.username,
        role: user.role,
      },
    });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export const handleLogout = withAuth(async (ctx: ApiContext, _user: AuthUser) => {
  try {
    const authHeader = ctx.req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { drizzle } = ctx;
      drizzle.delete(sessionsTable).where("token = ?", [token]).run();
    }

    return ctx.ok({ message: "Logged out successfully" });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export const handleMe = withAuth(async (ctx: ApiContext, user: AuthUser) => {
  try {
    const { drizzle } = ctx;

    const users = drizzle.select(usersTable)
      .select("id", "username", "email", "display_name", "role")
      .where("id = ?", [user.id])
      .all();

    if (users.length === 0) {
      return ctx.badRequest("User not found");
    }

    const userData = users[0]!;

    return ctx.ok({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      display_name: userData.display_name || userData.username,
      role: userData.role,
    });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});