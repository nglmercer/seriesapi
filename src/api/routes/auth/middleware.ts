import { getDrizzle } from "../../../init";
import { sessionsTable, usersTable } from "../../../schema";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../../i18n";
import { unauthorized, forbidden } from "../../response";

export interface AuthUser {
  id: number;
  role: string;
  username: string;
}

export function getUserFromToken(req: Request): AuthUser | null {
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

export function withAuth(
  handler: (req: Request, user: AuthUser) => Promise<Response>
) {
  return async (req: Request) => {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const user = getUserFromToken(req);
    if (!user) return unauthorized("Authentication required", locale);
    return handler(req, user);
  };
}

export function withAdmin(
  handler: (req: Request, user: AuthUser) => Promise<Response>
) {
  return async (req: Request) => {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const user = getUserFromToken(req);
    if (!user) return unauthorized("Authentication required", locale);
    if (user.role !== "admin") return forbidden("Administrator privileges required", locale);
    return handler(req, user);
  };
}