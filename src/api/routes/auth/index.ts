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

  if (p3 === "register" && POST) return handleRegister(ctx);
  if (p3 === "login" && POST) return handleLogin(ctx);
  if (p3 === "logout" && POST) return handleLogout(ctx);
  if (p3 === "me" && GET) return handleMe(ctx);
  if (p3 === "update" && (PATCH || PUT)) return handleUserUpdate(ctx);
  
  if (p3 === "users") {
    if (GET && !p4) return handleUserList(ctx);
    if ((PATCH || PUT) && p4) return handleUserUpdateAdmin(ctx);
    if (DELETE && p4) return handleUserDelete(ctx);
    return ctx.notFound("User management route");
  }

  if (p3 === "roles") {
    if (GET && !p4) return handleRoleList(ctx);
    if (POST && !p4) return handleRoleCreate(ctx);
    if ((PATCH || PUT) && p4) return handleRoleUpdate(ctx);
    if (DELETE && p4) return handleRoleDelete(ctx);
    return ctx.notFound("Role management route");
  }

  if (p3 === "verify-code") {
    if (p4 === "generate" && POST) return handleVerifyCodeGenerate(ctx);
    if (p4 === "apply" && POST) return handleVerifyCodeApply(ctx);
    return ctx.notFound("Verification code route");
  }

  if (p3 === "role-challenge" && POST) return handleRoleChallengeRequest(ctx);

  return ctx.notFound("Auth route");
}