import { deliverStoredLead, enforceRateLimit, getIdempotencyKey, LeadError, readLeadBody, saveLead, validateLead } from "@/lib/leads";
import { allowedLeadOrigin, leadPreflightResponse, withLeadCors } from "@/lib/lead-origin";
import { jsonResponse, leadConfig, leadDb, leadErrorResponse } from "@/lib/leads-runtime";

export function OPTIONS(request: Request): Response { return leadPreflightResponse(request); }

export async function POST(request: Request): Promise<Response> {
  try {
    if (!allowedLeadOrigin(request)) throw new LeadError("Please submit this form from the Doppler Wellness website.", 403);
    const lead = validateLead(await readLeadBody(request));
    const db = leadDb();
    await enforceRateLimit(db, request.headers.get("cf-connecting-ip"));
    const row = await saveLead(db, lead, getIdempotencyKey(request));
    let delivery: "sent" | "queued" = row.status === "sent" ? "sent" : "queued";
    try { delivery = await deliverStoredLead(db, row, leadConfig()); }
    catch { /* The request is durable; the office can retry delivery. */ }
    return withLeadCors(request, jsonResponse({ ok: true, id: row.id, delivery }, 201));
  } catch (error) { return withLeadCors(request, leadErrorResponse(error)); }
}
