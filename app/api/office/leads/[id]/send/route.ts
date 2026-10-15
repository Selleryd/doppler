import { assertSameOrigin, deliverStoredLead, LeadError, type StoredLead } from "@/lib/leads";
import { jsonResponse, leadConfig, leadDb, leadErrorResponse, officeAccess, validateLeadId } from "@/lib/leads-runtime";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context): Promise<Response> {
  try {
    officeAccess(request);
    assertSameOrigin(request);
    const { id } = await context.params;
    validateLeadId(id);
    const db = leadDb();
    const row = await db.prepare("SELECT * FROM leads WHERE id = ?").bind(id).first<StoredLead>();
    if (!row) throw new LeadError("Request not found.", 404);
    const delivery = await deliverStoredLead(db, row, leadConfig());
    return jsonResponse({ ok: true, id, delivery });
  } catch (error) { return leadErrorResponse(error); }
}
