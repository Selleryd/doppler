import { env } from "cloudflare:workers";
import { LeadError, deliveryConfigured, requireOfficeUser, storedLeadData, type StoredLead } from "./leads";

export function leadDb(): D1Database {
  if (!env.DB) throw new LeadError("We could not save this request. Please try again or contact team@dopplerwellness.com.", 503);
  return env.DB;
}
export function leadConfig() { return env; }
export function officeAccess(request: Request) { return requireOfficeUser(request, env); }
export function jsonResponse(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
export function leadErrorResponse(error: unknown): Response {
  if (error instanceof LeadError) return jsonResponse({ ok: false, error: error.message, ...(error.field ? { field: error.field } : {}) }, error.status);
  // Do not expose infrastructure errors, provider payloads or contact details.
  return jsonResponse({ ok: false, error: "We could not complete this request. Please try again or contact team@dopplerwellness.com." }, 503);
}
export function leadForOffice(row: StoredLead) {
  return {
    ...storedLeadData(row), id: row.id, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at,
    attempts: row.attempts, lastError: row.last_error, pdfUrl: `/api/office/leads/${row.id}/pdf`,
  };
}
export function officeConfigured() { return deliveryConfigured(env); }
export function validateLeadId(id: string): void {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) throw new LeadError("Request not found.", 404);
}
