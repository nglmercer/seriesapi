import { getDrizzle } from "../../init";
import { translationRequestsTable } from "../../schema";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";
import { validateParams, translationRequestSchema } from "../validation";
import { ok, badRequest, methodNotAllowed, serverError } from "../response";

export async function handleTranslationRequest(req: Request) {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  if (req.method !== "POST") return methodNotAllowed(locale);

  try {
    const body = await req.json();
    const v = validateParams(translationRequestSchema, body, locale);
    if (!v.success) return v.error;

    const { entity_type, entity_id, locale: targetLocale } = v.data;

    const drizzle = getDrizzle();
    const now = new Date().toISOString();

    // Check if a request already exists
    const existing = drizzle.select(translationRequestsTable)
      .where("entity_type = ? AND entity_id = ? AND locale = ?", [entity_type, entity_id, targetLocale])
      .get() as { id: number, request_count: number } | undefined;

    if (existing) {
      // Update request count
      drizzle.update(translationRequestsTable)
        .set({ 
          request_count: (existing.request_count || 0) + 1,
          last_requested_at: now
        })
        .where("id = ?", [existing.id])
        .run();
    } else {
      // Create new request
      drizzle.insert(translationRequestsTable).values({
        entity_type,
        entity_id,
        locale: targetLocale,
        request_count: 1,
        last_requested_at: now
      }).run();
    }

    return ok({ message: "Translation request recorded" }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
}
