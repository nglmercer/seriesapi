import { getDrizzle } from "../../init";
import { translationRequestsTable } from "../../schema";

export async function handleTranslationRequest(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method Not Allowed" }), { status: 405 });
  }

  try {
    const { entity_type, entity_id, locale } = await req.json() as any;
    
    if (!entity_type || !entity_id || !locale) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required fields" }), { status: 400 });
    }

    const drizzle = getDrizzle();
    const now = new Date().toISOString();

    // Check if a request already exists
    const existing = drizzle.select(translationRequestsTable)
      .where("entity_type = ? AND entity_id = ? AND locale = ?", [entity_type, entity_id, locale])
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
        locale,
        request_count: 1,
        last_requested_at: now
      }).run();
    }

    return new Response(JSON.stringify({ ok: true, message: "Translation request recorded" }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "Internal Server Error" }), { status: 500 });
  }
}
