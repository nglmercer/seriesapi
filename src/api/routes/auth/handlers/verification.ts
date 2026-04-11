import { getDrizzle } from "../../../../init";
import { usersTable, verificationCodesTable } from "../../../../schema";
import { validateParams, roleChallengeSchema } from "../../../validation";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../../../i18n";
import { ok, badRequest, notFound, serverError, methodNotAllowed } from "../../../response";
import { withAuth, withAdmin } from "../middleware";
import type { AuthUser } from "../middleware";
import { generateVerificationCode } from "../utils";

export const handleVerifyCodeGenerate = withAdmin(async (req: Request, _user: AuthUser) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  
  try {
    const body = await req.json();
    const { username, target_role } = body;

    if (!username || !target_role) {
      return badRequest("Missing username or target_role", locale);
    }

    const drizzle = getDrizzle();
    const users = drizzle.select(usersTable)
      .select("id")
      .where("username = ?", [username])
      .all();

    if (users.length === 0) {
      return notFound("User", locale);
    }

    const userId = users[0]!.id as number;
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    drizzle.insert(verificationCodesTable).values({
      code,
      target_role,
      user_id: userId,
      expires_at: expiresAt,
      used: 0,
      created_at: now
    }).run();

    console.log(`[auth] Verification code generated: ${code} for user ${username} -> ${target_role}`);

    return ok({ code, username, target_role, expires_at: expiresAt }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

export const handleRoleChallengeRequest = withAuth(async (req: Request, user: AuthUser) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  
  try {
    const body = await req.json();
    const v = validateParams(roleChallengeSchema, body, locale);
    if (!v.success) return v.error;

    const { target_role } = v.data;

    const drizzle = getDrizzle();
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    drizzle.insert(verificationCodesTable).values({
      code,
      target_role,
      user_id: user.id,
      expires_at: expiresAt,
      used: 0,
      created_at: now
    }).run();

    console.log("================================================================================");
    console.log(`[SECURITY] Role Challenge Generated for ${user.username} -> ${target_role}`);
    console.log(`[SECURITY] CHALLENGE CODE: ${code}`);
    console.log("================================================================================");

    return ok({ 
      message: "Challenge initiated. Please check server logs for verification code.",
      expires_at: expiresAt 
    }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});

export async function handleVerifyCodeApply(req: Request): Promise<Response> {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  if (req.method !== "POST") return methodNotAllowed(locale);

  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return badRequest("Missing code", locale);
    }

    const drizzle = getDrizzle();
    const codes = drizzle.select(verificationCodesTable)
      .where("code = ?", [code])
      .all();

    if (codes.length === 0) {
      return badRequest("Invalid code", locale);
    }

    const verifyCode = codes[0]!;

    if (verifyCode.used) {
      return badRequest("Code already used", locale);
    }

    if (new Date(verifyCode.expires_at as string) < new Date()) {
      return badRequest("Code expired", locale);
    }

    drizzle.update(usersTable)
      .set({ role: verifyCode.target_role, updated_at: new Date().toISOString() })
      .where("id = ?", [verifyCode.user_id as number])
      .run();
    
    drizzle.update(verificationCodesTable)
      .set({ used: 1 })
      .where("id = ?", [verifyCode.id as number])
      .run();

    const users = drizzle.select(usersTable)
      .select("username", "role")
      .where("id = ?", [verifyCode.user_id as number])
      .all();

    console.log(`[auth] Verification code applied: ${code} -> user ${users[0]?.username} is now ${verifyCode.target_role}`);

    return ok({ message: `Role changed to ${verifyCode.target_role}`, username: users[0]?.username, role: verifyCode.target_role }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
}