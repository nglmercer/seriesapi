import { getDrizzle } from "../../init";
import { contentReportsTable } from "../../schema";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";
import { validateParams, reportCreateSchema } from "../validation";
import { ok, badRequest, serverError } from "../response";
import { withAdmin } from "./auth";

export async function handleReportCreate(req: Request) {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  
  try {
    const body = await req.json();
    const v = validateParams(reportCreateSchema, body, locale);
    if (!v.success) return v.error;

    const { entity_type, entity_id, report_type, locale: reportLocale, message } = v.data;

    const drizzle = getDrizzle();
    const now = new Date().toISOString();

    drizzle.insert(contentReportsTable).values({
      entity_type,
      entity_id,
      report_type,
      locale: reportLocale || null,
      message: message || null,
      status: "pending",
      created_at: now
    }).run();

    return ok({ message: "Report submitted successfully" }, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
}

export const handleReportList = withAdmin(async (req: Request) => {
  const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
  
  try {
    const drizzle = getDrizzle();
    
    const reports = drizzle.select(contentReportsTable)
      .orderBy("created_at", "desc")
      .limit(50)
      .all();

    return ok(reports, { locale });
  } catch (err) {
    return serverError(err, locale);
  }
});
