import { getDrizzle } from "../../init";
import { corsHeaders } from "../../middleware/ratelimit";

const DAILON_API_KEY = process.env.DAILON_API_KEY ?? "demo_key_123";

function hashPassword(password: string): string {
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

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
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

export async function handleRegister(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }

  try {
    const body = await req.json();
    const { username, email, password, display_name } = body;

    if (!username || !email || !password) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields: username, email, password" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ ok: false, error: "Password must be at least 6 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

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

    const passwordHash = hashPassword(password);
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
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }

  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing username or password" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

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

    const valid = verifyPassword(password, user.password_hash);
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