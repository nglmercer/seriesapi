import { usersTable, verificationCodesTable } from "../../../../schema";
import { roleChallengeSchema } from "../../../validation";
import { serverError } from "../../../response";
import { withAuth, withAdmin } from "../middleware";
import type { AuthUser } from "../middleware";
import { generateVerificationCode } from "../utils";
import { ApiContext } from "../../../context";

export const handleVerifyCodeGenerate = withAdmin(async (ctx: ApiContext, _user: AuthUser) => {
  try {
    const result = await ctx.body();
    if (!result.success) return result.error;
    const { username, target_role } = result.data as any;

    if (!username || !target_role) {
      return ctx.badRequest("Missing username or target_role");
    }

    const { drizzle } = ctx;
    const users = drizzle.select(usersTable)
      .select("id")
      .where("username = ?", [username])
      .all();

    if (users.length === 0) {
      return ctx.notFound("User");
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

    return ctx.ok({ code, username, target_role, expires_at: expiresAt });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export const handleRoleChallengeRequest = withAuth(async (ctx: ApiContext, user: AuthUser) => {
  try {
    const v = await ctx.body(roleChallengeSchema);
    if (!v.success) return v.error;

    const { target_role } = v.data;

    const { drizzle } = ctx;
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

    return ctx.ok({ 
      message: "Challenge initiated. Please check server logs for verification code.",
      expires_at: expiresAt 
    });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export async function handleVerifyCodeApply(ctx: ApiContext): Promise<Response> {
  if (!ctx.POST) return ctx.badRequest("Method not allowed");

  try {
    const result = await ctx.body();
    if (!result.success) return result.error;
    const { code } = result.data as any;

    if (!code) {
      return ctx.badRequest("Missing code");
    }

    const { drizzle } = ctx;
    const codes = drizzle.select(verificationCodesTable)
      .where("code = ?", [code])
      .all();

    if (codes.length === 0) {
      return ctx.badRequest("Invalid code");
    }

    const verifyCode = codes[0]!;

    if (verifyCode.used) {
      return ctx.badRequest("Code already used");
    }

    if (new Date(verifyCode.expires_at as string) < new Date()) {
      return ctx.badRequest("Code expired");
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

    return ctx.ok({ message: `Role changed to ${verifyCode.target_role}`, username: users[0]?.username, role: verifyCode.target_role });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}