export { 
  hashPassword, 
  hashPasswordLegacy, 
  verifyPassword, 
  generateToken, 
  generateVerificationCode,
  ensureDefaultRoles 
} from "./auth/utils";

export { 
  getUserFromToken, 
  withAuth, 
  withAdmin,
  type AuthUser 
} from "./auth/middleware";

export * from "./auth/handlers/auth";
export * from "./auth/handlers/user";
export * from "./auth/handlers/role";
export * from "./auth/handlers/verification";

export { handleAuthRouter } from "./auth/index";