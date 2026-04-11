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

import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../../i18n";
import { notFound } from "../../response";

import { handleRegister, handleLogin, handleLogout, handleMe } from "./handlers/auth";
import { handleUserUpdate, handleUserList, handleUserUpdateAdmin, handleUserDelete } from "./handlers/user";
import { handleRoleList, handleRoleCreate, handleRoleUpdate, handleRoleDelete } from "./handlers/role";
import { handleVerifyCodeGenerate, handleVerifyCodeApply, handleRoleChallengeRequest } from "./handlers/verification";

export async function handleAuthRouter(req: Request, parts: string[]): Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  const [, , , p3, p4] = parts;
  const POST = req.method === "POST";
  const GET = req.method === "GET";
  const PATCH = req.method === "PATCH";
  const PUT = req.method === "PUT";
  const DELETE = req.method === "DELETE";

  if (p3 === "register" && POST) return handleRegister(req);
  if (p3 === "login" && POST) return handleLogin(req);
  if (p3 === "logout" && POST) return handleLogout(req);
  if (p3 === "me" && GET) return handleMe(req);
  if (p3 === "update" && (PATCH || PUT)) return handleUserUpdate(req);
  
  if (p3 === "users") {
    if (GET && !p4) return handleUserList(req);
    if ((PATCH || PUT) && p4) return handleUserUpdateAdmin(req);
    if (DELETE && p4) return handleUserDelete(req);
    return notFound("User management route", locale);
  }

  if (p3 === "roles") {
    if (GET && !p4) return handleRoleList(req);
    if (POST && !p4) return handleRoleCreate(req);
    if ((PATCH || PUT) && p4) return handleRoleUpdate(req);
    if (DELETE && p4) return handleRoleDelete(req);
    return notFound("Role management route", locale);
  }

  if (p3 === "verify-code") {
    if (p4 === "generate" && POST) return handleVerifyCodeGenerate(req);
    if (p4 === "apply" && POST) return handleVerifyCodeApply(req);
    return notFound("Verification code route", locale);
  }

  if (p3 === "role-challenge" && POST) return handleRoleChallengeRequest(req);

  return notFound("Auth route", locale);
}