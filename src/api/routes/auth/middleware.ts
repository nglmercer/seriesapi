import { ApiContext } from "../../context";
import { sessionsTable, usersTable } from "../../../schema";
import { unauthorized, forbidden } from "../../response";

export interface AuthUser {
  id: number;
  role: string;
  username: string;
  display_name: string;
}

export function getUserFromToken(ctx: ApiContext): AuthUser | null {
  const authHeader = ctx.req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  
  const drizzle = ctx.drizzle;
  const res = (drizzle.select(sessionsTable).as("s")
  .selectRaw("s.user_id, u.role, u.username, u.display_name, s.expires_at, u.is_active")
    .join("users u", "s.user_id = u.id")
    .where("s.token = ?", [token])
    .get()) as { user_id: number; role: string; username: string; display_name: string; expires_at: string; is_active: number } | undefined;
   
  if (!res || !res.is_active || new Date(res.expires_at) < new Date()) {
    if (res && new Date(res.expires_at) < new Date()) {
      drizzle.delete(sessionsTable).where("token = ?", [token]).run();
    }
    return null;
  }
  
  return { id: res.user_id, role: res.role, username: res.username, display_name: res.display_name };
}

export function withAuth(
  handler: (ctx: ApiContext, user: AuthUser) => Promise<Response>
) {
  return async (ctx: ApiContext) => {
    const user = getUserFromToken(ctx);
    if (!user) return unauthorized("Authentication required", ctx.locale);
    return handler(ctx, user);
  };
}

export function withAdmin(
  handler: (ctx: ApiContext, user: AuthUser) => Promise<Response>
) {
  return async (ctx: ApiContext) => {
    const user = getUserFromToken(ctx);
    if (!user) return unauthorized("Authentication required", ctx.locale);
    if (user.role !== "admin") return forbidden("Administrator privileges required", ctx.locale);
    return handler(ctx, user);
  };
}