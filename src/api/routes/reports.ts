import { contentReportsTable } from "../../schema";
import { serverError } from "../response";
import { withAdmin } from "./auth";
import { reportCreateSchema } from "../validation";
import { ApiContext } from "../context";

export async function handleReportCreate(ctx: ApiContext) {
  try {
    const v = await ctx.body(reportCreateSchema);
    if (!v.success) return v.error;

    const { entity_type, entity_id, report_type, locale: reportLocale, message } = v.data;

    const { drizzle } = ctx;
    const now = new Date().toISOString();

    drizzle.insert(contentReportsTable).values({
      entity_type,
      entity_id,
      report_type,
      locale: reportLocale || undefined,
      message: message || undefined,
      status: "pending",
      created_at: now
    }).run();

    return ctx.ok({ message: "Report submitted successfully" });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export const handleReportList = withAdmin(async (ctx: ApiContext) => {
  try {
    const { drizzle } = ctx;
    
    const reports = drizzle.select(contentReportsTable)
      .orderBy("created_at", "desc")
      .limit(50)
      .all();

    return ctx.ok(reports);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

