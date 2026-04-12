export { 
  hashPassword, 
  hashPasswordLegacy, 
  verifyPassword, 
  generateToken, 
  generateVerificationCode,
  ensureDefaultRoles 
} from "./utils";

export { 
  getUserFromToken, 
  withAuth, 
  withAdmin,
  type AuthUser 
} from "./middleware";

export * from "./handlers/auth";
export * from "./handlers/user";
export * from "./handlers/role";
export * from "./handlers/verification";

import { ApiContext } from "../../context";
import { notFound } from "../../response";

import { handleRegister, handleLogin, handleLogout, handleMe } from "./handlers/auth";
import { handleUserUpdate, handleUserList, handleUserUpdateAdmin, handleUserDelete } from "./handlers/user";
import { handleRoleList, handleRoleCreate, handleRoleUpdate, handleRoleDelete } from "./handlers/role";
import { handleVerifyCodeGenerate, handleVerifyCodeApply, handleRoleChallengeRequest } from "./handlers/verification";

export async function handleAuthRouter(ctx: ApiContext): Promise<Response> {
  const { p3, p4, POST, GET, method, locale } = ctx;
  const PATCH = method === "PATCH";
  const PUT = ctx.PUT;
  const DELETE = ctx.DELETE;

  if (p3 === "register" && POST) return handleRegister(ctx.req);
  if (p3 === "login" && POST) return handleLogin(ctx.req);
  if (p3 === "logout" && POST) return handleLogout(ctx.req);
  if (p3 === "me" && GET) return handleMe(ctx.req);
  if (p3 === "update" && (PATCH || PUT)) return handleUserUpdate(ctx.req);
  
  if (p3 === "users") {
    if (GET && !p4) return handleUserList(ctx.req);
    if ((PATCH || PUT) && p4) return handleUserUpdateAdmin(ctx.req);
    if (DELETE && p4) return handleUserDelete(ctx.req);
    return notFound("User management route", locale);
  }

  if (p3 === "roles") {
    if (GET && !p4) return handleRoleList(ctx.req);
    if (POST && !p4) return handleRoleCreate(ctx.req);
    if ((PATCH || PUT) && p4) return handleRoleUpdate(ctx.req);
    if (DELETE && p4) return handleRoleDelete(ctx.req);
    return notFound("Role management route", locale);
  }

  if (p3 === "verify-code") {
    if (p4 === "generate" && POST) return handleVerifyCodeGenerate(ctx.req);
    if (p4 === "apply" && POST) return handleVerifyCodeApply(ctx.req);
    return notFound("Verification code route", locale);
  }

  if (p3 === "role-challenge" && POST) return handleRoleChallengeRequest(ctx.req);

  return notFound("Auth route", locale);
}