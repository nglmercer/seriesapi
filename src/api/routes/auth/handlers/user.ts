import { usersTable } from "../../../../schema";
import { userUpdateSchema } from "../../../validation";
import { conflict, serverError } from "../../../response";
import { withAuth, withAdmin } from "../middleware";
import type { AuthUser } from "../middleware";
import { hashPassword } from "../utils";
import { ApiContext } from "../../../context";

export const handleUserUpdate = withAuth(async (ctx: ApiContext, user: AuthUser) => {
  try {
    const v = await ctx.body(userUpdateSchema);
    if (!v.success) return v.error;

    const { display_name, email, password } = v.data;

    const updateData: Record<string, any> = {};

    if (display_name !== undefined) {
      updateData.display_name = display_name;
    }
    if (email !== undefined) {
      const existing = ctx.drizzle.select(usersTable)
        .select("id")
        .where("email = ? AND id != ?", [email, user.id])
        .all();

      if (existing.length > 0) {
        return conflict("Email already exists", ctx.locale);
      }
      updateData.email = email;
    }
    if (password !== undefined) {
      const passwordHash = await hashPassword(password);
      updateData.password_hash = passwordHash;
    }

    if (Object.keys(updateData).length === 0) {
      return ctx.ok({ message: "No changes to update" });
    }

    updateData.updated_at = new Date().toISOString();

    ctx.drizzle.update(usersTable)
      .set(updateData)
      .where("id = ?", [user.id])
      .run();

    return ctx.ok({ message: "User updated successfully" });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export const handleUserList = withAdmin(async (ctx: ApiContext, _user: AuthUser) => {
  try {
    const { drizzle } = ctx;
    const users = drizzle.select(usersTable)
      .select("id", "username", "email", "display_name", "role", "is_active", "created_at", "updated_at")
      .all();
    return ctx.ok(users);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export const handleUserUpdateAdmin = withAdmin(async (ctx: ApiContext, _user: AuthUser) => {
  try {
    const { drizzle } = ctx;
    const targetUserId = ctx.seg(4);
    if (isNaN(targetUserId)) return ctx.badRequest("Invalid user ID");

    const result = await ctx.body();
    if (!result.success) return result.error;
    const body = result.data as Record<string, unknown>;

    const existing = drizzle.select(usersTable).where("id = ?", [targetUserId]).get();
    if (!existing) return ctx.notFound("User");
    const bodyPassword = body.password as string;
    const updateData: Record<string, any> = {};
    if (body.display_name !== undefined) updateData.display_name = body.display_name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.is_active !== undefined) updateData.is_active = body.is_active ? 1 : 0;
    if (bodyPassword !== undefined && bodyPassword.length >= 6) {
      updateData.password_hash = await hashPassword(bodyPassword);
    }

    if (Object.keys(updateData).length === 0) return ctx.ok({ message: "No changes" });

    updateData.updated_at = new Date().toISOString();
    drizzle.update(usersTable).set(updateData).where("id = ?", [targetUserId]).run();

    return ctx.ok({ message: "User updated successfully by admin" });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export const handleUserDelete = withAdmin(async (ctx: ApiContext, _user: AuthUser) => {
  try {
    const { drizzle } = ctx;
    const targetUserId = ctx.seg(4);
    if (isNaN(targetUserId)) return ctx.badRequest("Invalid user ID");

    drizzle.delete(usersTable).where("id = ?", [targetUserId]).run();

    return ctx.ok({ message: "User deleted successfully" });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});