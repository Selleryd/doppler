import { LeadError, leadPdf, storedLeadData, type StoredLead } from "@/lib/leads";
import { leadDb, leadErrorResponse, officeAccess, validateLeadId } from "@/lib/leads-runtime";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context): Promise<Response> {
  try {
    officeAccess(request);
    const { id } = await context.params;
    validateLeadId(id);
    const row = await leadDb().prepare("SELECT * FROM leads WHERE id = ?").bind(id).first<StoredLead>();
    if (!row) throw new LeadError("Request not found.", 404);
    const pdf = leadPdf(storedLeadData(row), row.id, row.created_at);
    return new Response(pdf.buffer as ArrayBuffer, {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="doppler-${row.kind}-${row.id}.pdf"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) { return leadErrorResponse(error); }
}
