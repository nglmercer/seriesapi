import { getDrizzle } from "../../../../init";
import { rolesTable } from "../../../../schema";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../../../i18n";
import { ok, badRequest, notFound, forbidden, conflict, serverError } from "../../../response";
import { withAdmin } from "../middleware";
import type { AuthUser } from "../middleware";

export const handleRoleList = async (req: Request): Promise<Response> => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  try {
    const drizzle = getDrizzle();
    const roles = drizzle.select(rolesTable).all();
    return ok(roles, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
};

export const handleRoleCreate = withAdmin(async (req: Request, _user: AuthUser) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  try {
    const body = await req.json();
    if (!body.name) return badRequest("Missing role name", locale);
    
    const drizzle = getDrizzle();
    const existing = drizzle.select(rolesTable).where("name = ?", [body.name]).get();
    if (existing) return conflict("Role already exists", locale);

    const now = new Date().toISOString();
    drizzle.insert(rolesTable).values({
      name: body.name,
      description: body.description || "",
      is_default: 0,
      created_at: now,
      updated_at: now
    }).run();

    return ok({ message: "Role created successfully" }, { locale }, 201);
  } catch (err) {
    return serverError(err, locale);
  }
});

export const handleRoleUpdate = withAdmin(async (req: Request, _user: AuthUser) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  try {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    const roleId = parseInt(parts[4] ?? "", 10);
    if (isNaN(roleId)) return badRequest("Invalid role ID", locale);

    const body = await req.json();
    const drizzle = getDrizzle();
    const role = (drizzle.select(rolesTable).where("id = ?", [roleId]).get()) as any;
    if (!role) return notFound("Role", locale);
    if (role.is_default) return forbidden("Cannot edit default roles", locale);

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;

    drizzle.update(rolesTable).set(updateData).where("id = ?", [roleId]).run();
    return ok({ message: "Role updated successfully" }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

export const handleRoleDelete = withAdmin(async (req: Request, _user: AuthUser) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  try {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    const roleId = parseInt(parts[4] ?? "", 10);
    if (isNaN(roleId)) return badRequest("Invalid role ID", locale);

    const drizzle = getDrizzle();
    const role = (drizzle.select(rolesTable).where("id = ?", [roleId]).get()) as any;
    if (!role) return notFound("Role", locale);
    if (role.is_default) return forbidden("Cannot delete default roles", locale);

    drizzle.delete(rolesTable).where("id = ?", [roleId]).run();
    return ok({ message: "Role deleted successfully" }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});