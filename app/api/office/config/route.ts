import { OFFICE_RECIPIENT } from "@/lib/leads";
import { jsonResponse, leadErrorResponse, officeAccess, officeConfigured } from "@/lib/leads-runtime";

export async function GET(request: Request): Promise<Response> {
  try {
    const adminEmail = officeAccess(request);
    return jsonResponse({ ok: true, deliveryConfigured: officeConfigured(), recipient: OFFICE_RECIPIENT, adminEmail });
  } catch (error) { return leadErrorResponse(error); }
}
