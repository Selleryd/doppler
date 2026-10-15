import { LeadError, OFFICE_RECIPIENT, type StoredLead } from "@/lib/leads";
import { jsonResponse, leadDb, leadErrorResponse, leadForOffice, officeAccess, officeConfigured } from "@/lib/leads-runtime";

export async function GET(request: Request): Promise<Response> {
  try {
    officeAccess(request);
    const url = new URL(request.url);
    const requestedLimit = Number(url.searchParams.get("limit"));
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 50;
    const cursor = url.searchParams.get("cursor");
    if (cursor && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\|[a-f0-9-]{36}$/i.test(cursor)) throw new LeadError("Invalid page cursor.");
    const [before, beforeId] = cursor?.split("|") || [];
    const db = leadDb();
    const query = cursor
      ? db.prepare("SELECT * FROM leads WHERE created_at < ? OR (created_at = ? AND id < ?) ORDER BY created_at DESC, id DESC LIMIT ?").bind(before, before, beforeId, limit + 1)
      : db.prepare("SELECT * FROM leads ORDER BY created_at DESC, id DESC LIMIT ?").bind(limit + 1);
    const result = await query.all<StoredLead>();
    const rows = result.results.slice(0, limit);
    const last = rows[rows.length - 1];
    return jsonResponse({
      ok: true, leads: rows.map(leadForOffice), deliveryConfigured: officeConfigured(), recipient: OFFICE_RECIPIENT,
      nextCursor: result.results.length > limit && last ? `${last.created_at}|${last.id}` : null,
    });
  } catch (error) { return leadErrorResponse(error); }
}
