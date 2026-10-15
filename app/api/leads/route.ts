import { assertSameOrigin, deliverStoredLead, enforceRateLimit, getIdempotencyKey, readLeadBody, saveLead, validateLead } from "@/lib/leads";
import { jsonResponse, leadConfig, leadDb, leadErrorResponse } from "@/lib/leads-runtime";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const lead = validateLead(await readLeadBody(request));
    const db = leadDb();
    await enforceRateLimit(db, request.headers.get("cf-connecting-ip"));
    const row = await saveLead(db, lead, getIdempotencyKey(request));
    let delivery: "sent" | "queued" = row.status === "sent" ? "sent" : "queued";
    try { delivery = await deliverStoredLead(db, row, leadConfig()); }
    catch { /* The request is durable; the office can retry delivery. */ }
    return jsonResponse({ ok: true, id: row.id, delivery }, 201);
  } catch (error) { return leadErrorResponse(error); }
}
