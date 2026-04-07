import { getDrizzle } from "../../init";
import { contentReportsTable } from "../../schema";

export async function handleReportCreate(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method Not Allowed" }), { status: 405 });
  }

  try {
    const { entity_type, entity_id, report_type, locale, message } = await req.json() as any;
    
    if (!entity_type || !entity_id || !report_type) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required fields" }), { status: 400 });
    }

    const drizzle = getDrizzle();
    const now = new Date().toISOString();

    drizzle.insert(contentReportsTable).values({
      entity_type,
      entity_id,
      report_type,
      locale: locale || null,
      message: message || null,
      status: "pending",
      created_at: now
    }).run();

    return new Response(JSON.stringify({ ok: true, message: "Report submitted successfully" }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "Internal Server Error" }), { status: 500 });
  }
}

export async function handleReportList(req: Request) {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ ok: false, error: "Method Not Allowed" }), { status: 405 });
  }

  try {
    const drizzle = getDrizzle();
    
    const reports = drizzle.select(contentReportsTable)
      .orderBy("created_at", "desc")
      .limit(50)
      .all();

    return new Response(JSON.stringify({ ok: true, data: reports }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "Internal Server Error" }), { status: 500 });
  }
}
