import { getDrizzle } from "../../init";
import { corsHeaders } from "../../middleware/ratelimit";
import { validateParams, registerSchema, loginSchema, userUpdateSchema } from "../validation";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";
import { usersTable, sessionsTable, verificationCodesTable } from "../../schema";
import { ok, badRequest, unauthorized, forbidden, notFound, methodNotAllowed, conflict, serverError } from "../response";

async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 2,
  });
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
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
    .get() as any) as { user_id: number; role: string; username: string; expires_at: string; is_active: number } | undefined;
  
  if (!res || !res.is_active || new Date(res.expires_at) < new Date()) {
    if (res && new Date(res.expires_at) < new Date()) {
      drizzle.delete(sessionsTable).where("token = ?", [token]).run();
    }
    return null;
  }
  
  return { id: res.user_id, role: res.role, username: res.username };
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

    const user = users[0]! as any;

    if (!user.is_active) {
      return forbidden("Account is disabled", locale);
    }

    const valid = await verifyPassword(password, user.password_hash as string);
    if (!valid) {
      return unauthorized("Invalid credentials", locale);
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

export async function handleLogout(req: Request): Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  if (req.method !== "POST") return methodNotAllowed(locale);

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
}

export async function handleMe(req: Request): Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  if (req.method !== "GET") return methodNotAllowed(locale);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return unauthorized("Not authenticated", locale);
    }

    const token = authHeader.slice(7);
    const drizzle = getDrizzle();

    const sessions = (drizzle.select(sessionsTable).as("s")
      .selectRaw("s.user_id, s.expires_at, u.username, u.email, u.display_name, u.role, u.is_active")
      .join("users u", "s.user_id = u.id")
      .where("s.token = ?", [token])
      .all() as any) as {
        user_id: number;
        expires_at: string;
        username: string;
        email: string;
        display_name: string | null;
        role: string;
        is_active: number;
      }[];

    if (sessions.length === 0) {
      return unauthorized("Invalid or expired session", locale);
    }

    const session = sessions[0]!;

    if (new Date(session.expires_at) < new Date()) {
      drizzle.delete(sessionsTable).where("token = ?", [token]).run();
      return unauthorized("Session expired", locale);
    }

    if (!session.is_active) {
      return forbidden("Account is disabled", locale);
    }

    return ok({
      id: session.user_id,
      username: session.username,
      email: session.email,
      display_name: session.display_name || session.username,
      role: session.role,
    }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
}

export async function handleVerifyCodeGenerate(req: Request): Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  if (req.method !== "POST") return methodNotAllowed(locale);

  try {
    const user = getUserFromToken(req);
    if (!user) {
      return unauthorized("Not authenticated", locale);
    }
    if (user.role !== "admin") {
      return forbidden("Admin only", locale);
    }

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
}

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
      .set({ role: verifyCode.target_role as any, updated_at: new Date().toISOString() })
      .where("id = ?", [verifyCode.user_id as number])
      .run();
    
    drizzle.update(verificationCodesTable)
      .set({ used: 1 } as any)
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

export async function handleUserUpdate(req: Request): Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  if (req.method !== "PUT" && req.method !== "PATCH") return methodNotAllowed(locale);

  try {
    const user = getUserFromToken(req);
    if (!user) {
      return unauthorized("Not authenticated", locale);
    }

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
}