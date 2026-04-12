import { rolesTable } from "../../../../schema";
import { conflict, serverError } from "../../../response";
import { withAdmin } from "../middleware";
import type { AuthUser } from "../middleware";
import { ApiContext } from "../../../context";

export const handleRoleList = async (ctx: ApiContext): Promise<Response> => {
  try {
    const { drizzle } = ctx;
    const roles = drizzle.select(rolesTable).all();
    return ctx.ok(roles);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
};

export const handleRoleCreate = withAdmin(async (ctx: ApiContext, _user: AuthUser) => {
  try {
    const { drizzle } = ctx;
    const result = await ctx.body();
    if (!result.success) return result.error;
    const body = result.data as any;

    if (!body.name) return ctx.badRequest("Missing role name");

    const existing = drizzle.select(rolesTable).where("name = ?", [body.name]).get();
    if (existing) return conflict("Role already exists", ctx.locale);

    const now = new Date().toISOString();
    drizzle.insert(rolesTable).values({
      name: body.name,
      description: body.description || "",
      is_default: 0,
      created_at: now,
      updated_at: now
    }).run();

    return ctx.ok({ message: "Role created successfully" }, { status: 201 });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export const handleRoleUpdate = withAdmin(async (ctx: ApiContext, _user: AuthUser) => {
  try {
    const { drizzle } = ctx;
    const roleId = ctx.seg(4);
    if (isNaN(roleId)) return ctx.badRequest("Invalid role ID");

    const result = await ctx.body();
    if (!result.success) return result.error;
    const body = result.data;

    const role = drizzle.select(rolesTable).where("id = ?", [roleId]).get();
    if (!role) return ctx.notFound("Role");
    if (role.is_default) return ctx.forbidden("Cannot edit default roles");

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;

    drizzle.update(rolesTable).set(updateData).where("id = ?", [roleId]).run();
    return ctx.ok({ message: "Role updated successfully" });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export const handleRoleDelete = withAdmin(async (ctx: ApiContext, _user: AuthUser) => {
  try {
    const { drizzle } = ctx;
    const roleId = ctx.seg(4);
    if (isNaN(roleId)) return ctx.badRequest("Invalid role ID");

    const role = drizzle.select(rolesTable).where("id = ?", [roleId]).get();
    if (!role) return ctx.notFound("Role");
    if (role.is_default) return ctx.forbidden("Cannot delete default roles");

    drizzle.delete(rolesTable).where("id = ?", [roleId]).run();
    return ctx.ok({ message: "Role deleted successfully" });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});