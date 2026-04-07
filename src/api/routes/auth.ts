import { getDrizzle } from "../../init";
import { corsHeaders } from "../../middleware/ratelimit";
import { validateParams, registerSchema, loginSchema, userUpdateSchema } from "../validation";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

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
  const res = drizzle.query<{ user_id: number; role: string; username: string; expires_at: string; is_active: number }>(
    `SELECT s.user_id, u.role, u.username, s.expires_at, u.is_active 
     FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?`
  ).get([token]);
  
  if (!res || !res.is_active || new Date(res.expires_at) < new Date()) {
    if (res && new Date(res.expires_at) < new Date()) {
      drizzle.query(`DELETE FROM sessions WHERE token = ?`).run([token]);
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

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("X-Forwarded-For");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("X-Real-IP") ?? "unknown";
}

function hashIp(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i);
    hash = hash & hash;
  }
  return "ip_" + Math.abs(hash).toString(16);
}

interface VerificationCode {
  id: number;
  code: string;
  target_role: string;
  user_id: number;
  expires_at: string;
  used: number;
  created_at: string;
}

function generateVerificationCode(targetRole: string, userId: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function handleRegister(req: Request): Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }

  try {
    const body = await req.json();
    const v = validateParams(registerSchema, body, locale);
    if (!v.success) return v.error;

    const { username, email, password, display_name } = v.data;

    const drizzle = getDrizzle();
    const existing = drizzle.query<{id: number}>(
      `SELECT id FROM users WHERE username = ? OR email = ?`,
    ).all([username, email]);

    if (existing.length > 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Username or email already exists" }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    const result = drizzle.query(
      `INSERT INTO users (username, email, password_hash, display_name, role, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 'user', 1, ?, ?)`,
    ).run([username, email, passwordHash, display_name || username, now, now]);

    const userId = result.lastInsertRowid;

    return new Response(
      JSON.stringify({
        ok: true,
        data: { id: userId, username, email, display_name: display_name || username },
      }),
      { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  } catch (err) {
    console.error("[auth] register error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }
}

export async function handleLogin(req: Request): Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }

  try {
    const body = await req.json();
    const v = validateParams(loginSchema, body, locale);
    if (!v.success) return v.error;

    const { username, password } = v.data;

    const drizzle = getDrizzle();
    const users = drizzle.query<{
      id: number;
      username: string;
      email: string;
      password_hash: string;
      display_name: string | null;
      role: string;
      is_active: number;
    }>(
      `SELECT id, username, email, password_hash, display_name, role, is_active FROM users WHERE username = ? OR email = ?`,
    ).all([username, username]);

    if (users.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid credentials" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const user = users[0]!;

    if (!user.is_active) {
      return new Response(
        JSON.stringify({ ok: false, error: "Account is disabled" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid credentials" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    drizzle.query(
      `INSERT INTO sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)`,
    ).run([user.id, token, expiresAt, now]);

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            display_name: user.display_name || user.username,
            role: user.role,
          },
        },
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  } catch (err) {
    console.error("[auth] login error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }
}

export async function handleLogout(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const drizzle = getDrizzle();
      drizzle.query(`DELETE FROM sessions WHERE token = ?`).run([token]);
    }

    return new Response(
      JSON.stringify({ ok: true, data: { message: "Logged out successfully" } }),
      { headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  } catch (err) {
    console.error("[auth] logout error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }
}

export async function handleMe(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ ok: false, error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const token = authHeader.slice(7);
    const drizzle = getDrizzle();

    const sessions = drizzle.query<{
      user_id: number;
      expires_at: string;
      username: string;
      email: string;
      display_name: string | null;
      role: string;
      is_active: number;
    }>(
      `SELECT s.user_id, s.expires_at, u.username, u.email, u.display_name, u.role, u.is_active 
       FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?`,
    ).all([token]);

    if (sessions.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid or expired session" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const session = sessions[0]!;

    if (new Date(session.expires_at) < new Date()) {
      drizzle.query(`DELETE FROM sessions WHERE token = ?`).run([token]);
      return new Response(
        JSON.stringify({ ok: false, error: "Session expired" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    if (!session.is_active) {
      return new Response(
        JSON.stringify({ ok: false, error: "Account is disabled" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          id: session.user_id,
          username: session.username,
          email: session.email,
          display_name: session.display_name || session.username,
          role: session.role,
        },
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  } catch (err) {
    console.error("[auth] me error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }
}

export async function handleVerifyCodeGenerate(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }

  try {
    const user = getUserFromToken(req);
    if (!user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }
    if (user.role !== "admin") {
      return new Response(
        JSON.stringify({ ok: false, error: "Admin only" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const body = await req.json();
    const { username, target_role } = body;

    if (!username || !target_role) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing username or target_role" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const drizzle = getDrizzle();
    const users = drizzle.query<{ id: number }>(
      `SELECT id FROM users WHERE username = ?`,
    ).all([username]);

    if (users.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const userId = users[0]!.id;
    const code = generateVerificationCode(target_role, userId);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    drizzle.query(
      `INSERT INTO verification_codes (code, target_role, user_id, expires_at, used, created_at) 
       VALUES (?, ?, ?, ?, 0, ?)`,
    ).run([code, target_role, userId, expiresAt, now]);

    console.log(`[auth] Verification code generated: ${code} for user ${username} -> ${target_role}`);

    return new Response(
      JSON.stringify({
        ok: true,
        data: { code, username, target_role, expires_at: expiresAt },
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  } catch (err) {
    console.error("[auth] verify code generate error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }
}

export async function handleVerifyCodeApply(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }

  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing code" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const drizzle = getDrizzle();
    const codes = drizzle.query<VerificationCode>(
      `SELECT * FROM verification_codes WHERE code = ?`,
    ).all([code]);

    if (codes.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid code" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const verifyCode = codes[0]!;

    if (verifyCode.used) {
      return new Response(
        JSON.stringify({ ok: false, error: "Code already used" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    if (new Date(verifyCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ ok: false, error: "Code expired" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    drizzle.query(`UPDATE users SET role = ?, updated_at = ? WHERE id = ?`).run([verifyCode.target_role, new Date().toISOString(), verifyCode.user_id]);
    drizzle.query(`UPDATE verification_codes SET used = 1 WHERE id = ?`).run([verifyCode.id]);

    const users = drizzle.query<{ username: string; role: string }>(
      `SELECT username, role FROM users WHERE id = ?`,
    ).all([verifyCode.user_id]);

    console.log(`[auth] Verification code applied: ${code} -> user ${users[0]?.username} is now ${verifyCode.target_role}`);

    return new Response(
      JSON.stringify({
        ok: true,
        data: { message: `Role changed to ${verifyCode.target_role}`, username: users[0]?.username, role: verifyCode.target_role },
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  } catch (err) {
    console.error("[auth] verify code apply error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }
}

export async function handleUserUpdate(req: Request): Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  if (req.method !== "PUT" && req.method !== "PATCH") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }

  try {
    const user = getUserFromToken(req);
    if (!user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const body = await req.json();
    const v = validateParams(userUpdateSchema, body, locale);
    if (!v.success) return v.error;

    const { display_name, email, password } = v.data;
    const drizzle = getDrizzle();

    const updates: string[] = [];
    const params: unknown[] = [];

    if (display_name !== undefined) {
      updates.push("display_name = ?");
      params.push(display_name);
    }
    if (email !== undefined) {
      // Check if email already exists
      const existing = drizzle.query<{id: number}>(
        `SELECT id FROM users WHERE email = ? AND id != ?`,
      ).all([email, user.id]);

      if (existing.length > 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Email already exists" }),
          { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders() } },
        );
      }
      updates.push("email = ?");
      params.push(email);
    }
    if (password !== undefined) {
      const passwordHash = await hashPassword(password);
      updates.push("password_hash = ?");
      params.push(passwordHash);
    }

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, data: { message: "No changes to update" } }),
        { headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    updates.push("updated_at = ?");
    params.push(new Date().toISOString());
    params.push(user.id);

    drizzle.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
    ).run(params);

    return new Response(
      JSON.stringify({
        ok: true,
        data: { message: "User updated successfully" },
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  } catch (err) {
    console.error("[auth] user update error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }
}