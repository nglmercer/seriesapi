import { getDrizzle } from "../../init";
import { corsHeaders } from "../../middleware/ratelimit";
import { validateParams, registerSchema, loginSchema, userUpdateSchema, roleChallengeSchema } from "../validation";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";
import { usersTable, sessionsTable, verificationCodesTable } from "../../schema";
import { ok, badRequest, unauthorized, forbidden, notFound, methodNotAllowed, conflict, serverError } from "../response";

const DAILON_API_KEY = process.env.DAILON_API_KEY ?? "demo_key_123";

/**
 * Legacy hashing for backward compatibility with old user accounts.
 */
function hashPasswordLegacy(password: string): string {
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

async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 2,
  });
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Check if it's a legacy hash
  if (hash.startsWith("sha256_")) {
    return hashPasswordLegacy(password) === hash;
  }
  
  // Use Bun's native verification for new hashes (Argon2id, etc.)
  try {
    return await Bun.password.verify(password, hash);
  } catch (e) {
    console.error("[auth] password verification error:", e);
    return false;
  }
}

export function getUserFromToken(req: Request): { id: number; role: string; username: string } | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  
  const drizzle = getDrizzle();
  const res = (drizzle.select(sessionsTable).as("s")
    .selectRaw("s.user_id, u.role, u.username, s.expires_at, u.is_active")
    .join("users u", "s.user_id = u.id")
    .where("s.token = ?", [token])
    .get()) as { user_id: number; role: string; username: string; expires_at: string; is_active: number } | undefined;
  
  if (!res || !res.is_active || new Date(res.expires_at) < new Date()) {
    if (res && new Date(res.expires_at) < new Date()) {
      drizzle.delete(sessionsTable).where("token = ?", [token]).run();
    }
    return null;
  }
  
  return { id: res.user_id, role: res.role, username: res.username };
}

/**
 * Higher-order helper to wrap route handlers with authentication requirements.
 */
export function withAuth(
  handler: (req: Request, user: { id: number; role: string; username: string }) => Promise<Response>
) {
  return async (req: Request) => {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const user = getUserFromToken(req);
    if (!user) return unauthorized("Authentication required", locale);
    return handler(req, user);
  };
}

/**
 * Higher-order helper to wrap route handlers with admin requirements.
 */
export function withAdmin(
  handler: (req: Request, user: { id: number; role: string; username: string }) => Promise<Response>
) {
  return async (req: Request) => {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const user = getUserFromToken(req);
    if (!user) return unauthorized("Authentication required", locale);
    if (user.role !== "admin") return forbidden("Administrator privileges required", locale);
    return handler(req, user);
  };
}

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

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

    // Migrate legacy hash if necessary
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

export const handleLogout = withAuth(async (req: Request, user) => {
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

export const handleMe = withAuth(async (req: Request, user) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  
  try {
    const drizzle = getDrizzle();

    // Get more info about the user since withAuth only provides basic info
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

export const handleVerifyCodeGenerate = withAdmin(async (req: Request) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  
  try {
    const body = await req.json();
    const { username, target_role } = body;

    if (!username || !target_role) {
      return badRequest("Missing username or target_role", locale);
    }

    const drizzle = getDrizzle();
    const users = drizzle.select(usersTable)
      .select("id")
      .where("username = ?", [username])
      .all();

    if (users.length === 0) {
      return notFound("User", locale);
    }

    const userId = users[0]!.id as number;
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    drizzle.insert(verificationCodesTable).values({
      code,
      target_role,
      user_id: userId,
      expires_at: expiresAt,
      used: 0,
      created_at: now
    }).run();

    console.log(`[auth] Verification code generated: ${code} for user ${username} -> ${target_role}`);

    return ok({ code, username, target_role, expires_at: expiresAt }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

/**
 * Public route for a user to request a role change challenge.
 * The verification code is only logged to the console by default.
 */
export const handleRoleChallengeRequest = withAuth(async (req: Request, user) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  
  try {
    const body = await req.json();
    const v = validateParams(roleChallengeSchema, body, locale);
    if (!v.success) return v.error;

    const { target_role } = v.data;

    const drizzle = getDrizzle();
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    drizzle.insert(verificationCodesTable).values({
      code,
      target_role,
      user_id: user.id,
      expires_at: expiresAt,
      used: 0,
      created_at: now
    }).run();

    // Security: Only log to console, do not return to user
    console.log("================================================================================");
    console.log(`[SECURITY] Role Challenge Generated for ${user.username} -> ${target_role}`);
    console.log(`[SECURITY] CHALLENGE CODE: ${code}`);
    console.log("================================================================================");

    return ok({ 
      message: "Challenge initiated. Please check server logs for verification code.",
      expires_at: expiresAt 
    }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

export async function handleVerifyCodeApply(req: Request): Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  if (req.method !== "POST") return methodNotAllowed(locale);

  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return badRequest("Missing code", locale);
    }

    const drizzle = getDrizzle();
    const codes = drizzle.select(verificationCodesTable)
      .where("code = ?", [code])
      .all();

    if (codes.length === 0) {
      return badRequest("Invalid code", locale);
    }

    const verifyCode = codes[0]!;

    if (verifyCode.used) {
      return badRequest("Code already used", locale);
    }

    if (new Date(verifyCode.expires_at as string) < new Date()) {
      return badRequest("Code expired", locale);
    }

    drizzle.update(usersTable)
      .set({ role: verifyCode.target_role, updated_at: new Date().toISOString() })
      .where("id = ?", [verifyCode.user_id as number])
      .run();
    
    drizzle.update(verificationCodesTable)
      .set({ used: 1 })
      .where("id = ?", [verifyCode.id as number])
      .run();

    const users = drizzle.select(usersTable)
      .select("username", "role")
      .where("id = ?", [verifyCode.user_id as number])
      .all();

    console.log(`[auth] Verification code applied: ${code} -> user ${users[0]?.username} is now ${verifyCode.target_role}`);

    return ok({ message: `Role changed to ${verifyCode.target_role}`, username: users[0]?.username, role: verifyCode.target_role }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
}

export const handleUserUpdate = withAuth(async (req: Request, user) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  
  try {
    const body = await req.json();
    const v = validateParams(userUpdateSchema, body, locale);
    if (!v.success) return v.error;

    const { display_name, email, password } = v.data;
    const drizzle = getDrizzle();

    const updateData: Record<string, any> = {};

    if (display_name !== undefined) {
      updateData.display_name = display_name;
    }
    if (email !== undefined) {
      // Check if email already exists
      const existing = drizzle.select(usersTable)
        .select("id")
        .where("email = ? AND id != ?", [email, user.id])
        .all();

      if (existing.length > 0) {
        return conflict("Email already exists", locale);
      }
      updateData.email = email;
    }
    if (password !== undefined) {
      const passwordHash = await hashPassword(password);
      updateData.password_hash = passwordHash;
    }

    if (Object.keys(updateData).length === 0) {
      return ok({ message: "No changes to update" }, { locale });
    }

    updateData.updated_at = new Date().toISOString();

    drizzle.update(usersTable)
      .set(updateData)
      .where("id = ?", [user.id])
      .run();

    return ok({ message: "User updated successfully" }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

/**
 * ADMIN: List all users.
 */
export const handleUserList = withAdmin(async (req: Request) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  try {
    const drizzle = getDrizzle();
    const users = drizzle.select(usersTable)
      .select("id", "username", "email", "display_name", "role", "is_active", "created_at", "updated_at")
      .all();
    return ok(users, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

/**
 * ADMIN: Update any user.
 */
export const handleUserUpdateAdmin = withAdmin(async (req: Request) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  try {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    const targetUserId = parseInt(parts[4] ?? "", 10);
    if (isNaN(targetUserId)) return badRequest("Invalid user ID", locale);

    const body = await req.json();
    const drizzle = getDrizzle();

    // Check if user exists
    const existing = drizzle.select(usersTable).where("id = ?", [targetUserId]).get();
    if (!existing) return notFound("User", locale);

    const updateData: Record<string, any> = {};
    if (body.display_name !== undefined) updateData.display_name = body.display_name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.is_active !== undefined) updateData.is_active = body.is_active ? 1 : 0;
    if (body.password !== undefined && body.password.length >= 6) {
      updateData.password_hash = await hashPassword(body.password);
    }

    if (Object.keys(updateData).length === 0) return ok({ message: "No changes" }, { locale });

    updateData.updated_at = new Date().toISOString();
    drizzle.update(usersTable).set(updateData).where("id = ?", [targetUserId]).run();

    return ok({ message: "User updated successfully by admin" }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

/**
 * ADMIN: Delete user.
 */
export const handleUserDelete = withAdmin(async (req: Request) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  try {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    const targetUserId = parseInt(parts[4] ?? "", 10);
    if (isNaN(targetUserId)) return badRequest("Invalid user ID", locale);

    const drizzle = getDrizzle();
    drizzle.delete(usersTable).where("id = ?", [targetUserId]).run();

    return ok({ message: "User deleted successfully" }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

/**
 * Main authentication router that dispatches requests to sub-routes.
 */
export async function handleAuthRouter(req: Request, parts: string[]): Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  const [, , , p3, p4] = parts; // parts[0] = "api", parts[1] = "v1", parts[2] = "auth", parts[3] = action, parts[4] = subaction
  const POST = req.method === "POST";
  const GET = req.method === "GET";
  const PATCH = req.method === "PATCH";
  const PUT = req.method === "PUT";
  const DELETE = req.method === "DELETE";

  if (p3 === "register" && POST) return handleRegister(req);
  if (p3 === "login" && POST) return handleLogin(req);
  if (p3 === "logout" && POST) return handleLogout(req);
  if (p3 === "me" && GET) return handleMe(req);
  if (p3 === "update" && (PATCH || PUT)) return handleUserUpdate(req);
  
  if (p3 === "users") {
    if (GET && !p4) return handleUserList(req);
    if ((PATCH || PUT) && p4) return handleUserUpdateAdmin(req);
    if (DELETE && p4) return handleUserDelete(req);
    return notFound("User management route", locale);
  }

  if (p3 === "verify-code") {
    if (p4 === "generate" && POST) return handleVerifyCodeGenerate(req);
    if (p4 === "apply" && POST) return handleVerifyCodeApply(req);
    return notFound("Verification code route", locale);
  }

  if (p3 === "role-challenge" && POST) return handleRoleChallengeRequest(req);

  return notFound("Auth route", locale);
}