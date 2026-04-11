import { getDrizzle } from "../../../../init";
import { usersTable } from "../../../../schema";
import { validateParams, userUpdateSchema } from "../../../validation";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../../../i18n";
import { ok, badRequest, unauthorized, notFound, conflict, serverError } from "../../../response";
import { withAuth, withAdmin } from "../middleware";
import type { AuthUser } from "../middleware";
import { hashPassword } from "../utils";

export const handleUserUpdate = withAuth(async (req: Request, user: AuthUser) => {
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

export const handleUserList = withAdmin(async (req: Request, _user: AuthUser) => {
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

export const handleUserUpdateAdmin = withAdmin(async (req: Request, _user: AuthUser) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  try {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    const targetUserId = parseInt(parts[4] ?? "", 10);
    if (isNaN(targetUserId)) return badRequest("Invalid user ID", locale);

    const body = await req.json();
    const drizzle = getDrizzle();

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

export const handleUserDelete = withAdmin(async (req: Request, _user: AuthUser) => {
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