/** Pure lead handling shared by the Worker and offline tests. */
export const OFFICE_RECIPIENT = "team@dopplerwellness.com";
export const MAX_LEAD_BODY_BYTES = 12_288;
export type LeadKind = "patient" | "careers" | "partner";
export type Lead = {
  kind: LeadKind;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  contactPreference: "email" | "phone";
  consent: true;
  relationship?: string;
  careFormat?: string;
  insurance?: string;
  role?: string;
  licenseState?: string;
  community?: string;
  jobTitle?: string;
  residentCount?: string;
};
export type StoredLead = {
  id: string;
  idempotency_key: string;
  fingerprint: string;
  kind: LeadKind;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  state: string;
  contact_preference: "email" | "phone";
  fields_json: string;
  consent: number;
  status: "queued" | "sending" | "sent";
  provider_message_id: string | null;
  last_error: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
};
export type DeliveryEnv = { RESEND_API_KEY?: string; LEAD_FROM_EMAIL?: string; OFFICE_ADMIN_EMAILS?: string };
export class LeadError extends Error {
  status: number;
  field?: string;
  constructor(message: string, status = 400, field?: string) {
    super(message);
    this.name = "LeadError";
    this.status = status;
    this.field = field;
  }
}

const BASE_FIELDS = ["kind", "firstName", "lastName", "email", "phone", "state", "contactPreference", "consent", "website"];
const EXTRA_FIELDS: Record<LeadKind, string[]> = {
  patient: ["relationship", "careFormat", "insurance"],
  careers: ["role", "licenseState", "careFormat"],
  partner: ["community", "jobTitle", "residentCount"],
};
const CONTROLS = /[\u0000-\u001f\u007f]/;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const STATES = new Set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR VI GU AS MP".split(" "));

function textField(input: Record<string, unknown>, field: string, required = false, max = 120): string {
  const raw = input[field];
  if (raw === undefined || raw === null || raw === "") {
    if (required) throw new LeadError("Please complete this field.", 400, field);
    return "";
  }
  if (typeof raw !== "string") throw new LeadError("Please enter valid contact information.", 400, field);
  const value = raw.trim();
  if ((required && !value) || value.length > max || CONTROLS.test(value)) {
    throw new LeadError("Please check this field.", 400, field);
  }
  return value;
}

export function validateLead(raw: unknown): Lead {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new LeadError("Please enter valid contact information.");
  const input = raw as Record<string, unknown>;
  if (!["patient", "careers", "partner"].includes(String(input.kind))) throw new LeadError("Please choose the type of request.", 400, "kind");
  const kind = input.kind as LeadKind;
  const allowed = new Set([...BASE_FIELDS, ...EXTRA_FIELDS[kind]]);
  if (Object.keys(input).some((key) => !allowed.has(key))) throw new LeadError("This form accepts basic contact information only.");
  if (textField(input, "website", false, 200)) throw new LeadError("We could not process this request.");
  if (input.consent !== true) throw new LeadError("Please agree to be contacted.", 400, "consent");
  const firstName = textField(input, "firstName", true, 80);
  const lastName = textField(input, "lastName", true, 80);
  const email = textField(input, "email", false, 254).toLowerCase();
  const phone = textField(input, "phone", false, 32);
  if (email && !EMAIL.test(email)) throw new LeadError("Please enter a valid email address.", 400, "email");
  if (phone && (!/^[+()\d .-]+$/.test(phone) || phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 15)) {
    throw new LeadError("Please enter a valid phone number.", 400, "phone");
  }
  if (!email && !phone) throw new LeadError("Please provide an email address or phone number.", 400, "email");
  const state = textField(input, "state", true, 2).toUpperCase();
  if (!STATES.has(state)) throw new LeadError("Please choose your state.", 400, "state");
  const preference = textField(input, "contactPreference", false, 10).toLowerCase() || (email ? "email" : "phone");
  if (preference !== "email" && preference !== "phone") throw new LeadError("Please choose how to contact you.", 400, "contactPreference");
  if ((preference === "email" && !email) || (preference === "phone" && !phone)) throw new LeadError("Please provide your preferred contact details.", 400, preference);
  const lead: Lead = { kind, firstName, lastName, email, phone, state, contactPreference: preference, consent: true };
  for (const field of EXTRA_FIELDS[kind]) {
    const value = textField(input, field, false, field === "community" ? 160 : 100);
    if (value) (lead as unknown as Record<string, unknown>)[field] = value;
  }
  if (lead.licenseState) {
    lead.licenseState = lead.licenseState.toUpperCase();
    if (!STATES.has(lead.licenseState)) throw new LeadError("Please choose your license state.", 400, "licenseState");
  }
  if (lead.relationship && !["self", "family", "professional"].includes(lead.relationship)) throw new LeadError("Please choose your relationship.", 400, "relationship");
  if (lead.careFormat && !["In person", "Telehealth", "Help me decide", "Both"].includes(lead.careFormat)) throw new LeadError("Please choose a care preference.", 400, "careFormat");
  if (lead.role && !["Licensed therapist", "Psychologist", "Social worker", "Other clinician"].includes(lead.role)) throw new LeadError("Please choose your role.", 400, "role");
  if (kind === "partner" && !lead.community) throw new LeadError("Please enter your community or organization.", 400, "community");
  if (lead.residentCount && !["Under 50 residents", "50–100 residents", "101–200 residents", "More than 200 residents"].includes(lead.residentCount)) throw new LeadError("Please choose a resident count.", 400, "residentCount");
  return lead;
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (!origin || origin !== new URL(request.url).origin || site === "cross-site") {
    throw new LeadError("Please submit this form from the Doppler Wellness website.", 403);
  }
}

export async function readLeadBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new LeadError("Please submit the website form.", 415);
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_LEAD_BODY_BYTES) throw new LeadError("This request is too large.", 413);
  if (!request.body) throw new LeadError("Please complete the form.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_LEAD_BODY_BYTES) {
        await reader.cancel();
        throw new LeadError("This request is too large.", 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let position = 0;
  for (const chunk of chunks) { bytes.set(chunk, position); position += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new LeadError("Please enter valid contact information."); }
}

export function getIdempotencyKey(request: Request): string {
  const value = request.headers.get("idempotency-key") || crypto.randomUUID();
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(value)) throw new LeadError("Please refresh the form and try again.", 400);
  return value;
}

export async function digest(value: string): Promise<string> {
  const result = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function deliveryConfigured(config: DeliveryEnv): boolean {
  const from = config.LEAD_FROM_EMAIL?.trim();
  return Boolean(config.RESEND_API_KEY?.trim() && from && from.length <= 254 && EMAIL.test(from) && !CONTROLS.test(from));
}

export function requireOfficeUser(request: Request, config: DeliveryEnv): string {
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  const userId = request.headers.get("oai-authenticated-user-id");
  if (!email || !userId) throw new LeadError("Sign in to access the office.", 401);
  const configured = config.OFFICE_ADMIN_EMAILS?.trim();
  const allowList = (configured || "mykitchensupplier@gmail.com,team@dopplerwellness.com").split(",").map((item) => item.trim().toLowerCase()).filter((item) => EMAIL.test(item));
  if (!allowList.includes(email)) throw new LeadError("This account does not have office access.", 403);
  return email;
}

const FIELD_LABELS: Record<string, string> = {
  relationship: "Relationship", careFormat: "Care preference", insurance: "Insurance", role: "Role of interest",
  licenseState: "License state", community: "Community / organization", jobTitle: "Job title", residentCount: "Resident count",
};
const KIND_LABELS: Record<LeadKind, string> = { patient: "Care request", careers: "Career inquiry", partner: "Community inquiry" };

// PDF standard fonts support Latin text. Transliterate accents and represent
// unsupported characters explicitly; UTF-8 originals remain in the office record.
function pdfText(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[–—]/g, "-").replace(/[‘’]/g, "\'").replace(/[“”]/g, '"').replace(/[^\x20-\x7e]/g, "?").replace(/[\\()]/g, "\\$&");
}
function wrap(value: string, limit = 82): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line && line.length + word.length + 1 > limit) { lines.push(line); line = ""; }
    let remaining = word;
    while (remaining.length > limit) {
      if (line) { lines.push(line); line = ""; }
      lines.push(remaining.slice(0, limit)); remaining = remaining.slice(limit);
    }
    line = line ? `${line} ${remaining}` : remaining;
  }
  if (line) lines.push(line);
  return lines;
}

export function leadPdf(lead: Lead, id: string, createdAt: string): Uint8Array {
  const lines = [
    "DOPPLER WELLNESS", KIND_LABELS[lead.kind], "",
    `Request ID: ${id}`, `Submitted: ${createdAt}`, "",
    `Name: ${lead.firstName} ${lead.lastName}`,
    `Email: ${lead.email || "Not provided"}`,
    `Phone: ${lead.phone || "Not provided"}`,
    `State: ${lead.state}`, `Preferred contact: ${lead.contactPreference}`, "",
  ];
  for (const field of EXTRA_FIELDS[lead.kind]) {
    const value = (lead as unknown as Record<string, unknown>)[field];
    if (typeof value === "string" && value) lines.push(`${FIELD_LABELS[field]}: ${value}`);
  }
  lines.push("", "Consent: Agreed to be contacted by the Doppler Wellness team.", "", "Office follow-up: Contact the person and send the appropriate intake or", "application directly. This contact request is not a clinical intake.", "", "Handle this document as confidential contact information.");
  const wrapped = lines.flatMap((line) => line ? wrap(line) : [""]);
  const stream = ["BT", "/F1 11 Tf", "16 TL", "50 750 Td", ...wrapped.map((line, index) => `${index ? "T* " : ""}(${pdfText(line)}) Tj`), "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index++) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function sendLeadEmail(lead: Lead, id: string, createdAt: string, config: DeliveryEnv, fetcher: typeof fetch = fetch): Promise<{ delivery: "queued" | "sent"; messageId?: string; error?: string }> {
  if (!deliveryConfigured(config)) return { delivery: "queued", error: "Email delivery is not configured." };
  try {
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.RESEND_API_KEY!.trim()}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `doppler-lead-${id}`,
      },
      body: JSON.stringify({
        from: config.LEAD_FROM_EMAIL!.trim(),
        to: [OFFICE_RECIPIENT],
        ...(lead.email ? { reply_to: lead.email } : {}),
        subject: `New Doppler Wellness ${KIND_LABELS[lead.kind].toLowerCase()}`,
        text: `A new ${KIND_LABELS[lead.kind].toLowerCase()} has been received. The basic contact details are attached as a PDF. Please contact the person directly and send the appropriate intake or application.\n\nRequest ID: ${id}`,
        attachments: [{ filename: `doppler-${lead.kind}-${id}.pdf`, content: base64(leadPdf(lead, id, createdAt)) }],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return { delivery: "queued", error: `Email provider did not accept delivery (HTTP ${response.status}).` };
    const result: unknown = await response.json();
    const messageId = result && typeof result === "object" && "id" in result && typeof result.id === "string" ? result.id : "";
    if (!messageId) return { delivery: "queued", error: "Email provider did not confirm delivery." };
    return { delivery: "sent", messageId };
  } catch {
    return { delivery: "queued", error: "Email delivery is temporarily unavailable." };
  }
}

export function storedLeadData(row: StoredLead): Lead {
  const extras = JSON.parse(row.fields_json) as Partial<Lead>;
  return {
    ...extras,
    kind: row.kind, firstName: row.first_name, lastName: row.last_name, email: row.email, phone: row.phone,
    state: row.state, contactPreference: row.contact_preference, consent: true,
  };
}

export async function enforceRateLimit(db: D1Database, ip: string | null): Promise<void> {
  // Cloudflare's trusted client IP header is absent from some local previews.
  if (!ip) return;
  const now = Date.now();
  const window = Math.floor(now / (15 * 60_000));
  const bucket = await digest(`doppler-lead:${window}:${ip}`);
  const row = await db.prepare("INSERT INTO lead_rate_limits (bucket, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET count = count + 1 RETURNING count").bind(bucket, now + 30 * 60_000).first<{ count: number }>();
  await db.prepare("DELETE FROM lead_rate_limits WHERE expires_at < ?").bind(now).run();
  if (row && row.count > 8) throw new LeadError("Too many requests. Please try again in a few minutes.", 429);
}

export async function saveLead(db: D1Database, lead: Lead, idempotencyKey: string): Promise<StoredLead> {
  const fingerprint = await digest(JSON.stringify(lead));
  const extras: Record<string, string> = {};
  for (const field of EXTRA_FIELDS[lead.kind]) {
    const value = (lead as unknown as Record<string, unknown>)[field];
    if (typeof value === "string") extras[field] = value;
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.prepare("INSERT INTO leads (id, idempotency_key, fingerprint, kind, first_name, last_name, email, phone, state, contact_preference, fields_json, consent, status, attempts, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'queued', 0, ?, ?) ON CONFLICT(idempotency_key) DO NOTHING")
    .bind(id, idempotencyKey, fingerprint, lead.kind, lead.firstName, lead.lastName, lead.email, lead.phone, lead.state, lead.contactPreference, JSON.stringify(extras), now, now).run();
  const row = await db.prepare("SELECT * FROM leads WHERE idempotency_key = ?").bind(idempotencyKey).first<StoredLead>();
  if (!row) throw new Error("Lead was not persisted.");
  if (row.fingerprint !== fingerprint) throw new LeadError("This request changed. Please refresh the form and submit again.", 409);
  return row;
}

export async function deliverStoredLead(db: D1Database, row: StoredLead, config: DeliveryEnv, fetcher: typeof fetch = fetch): Promise<"queued" | "sent"> {
  if (row.status === "sent") return "sent";
  if (!deliveryConfigured(config)) return "queued";
  const now = new Date().toISOString();
  const stale = new Date(Date.now() - 5 * 60_000).toISOString();
  const claimed = await db.prepare("UPDATE leads SET status = 'sending', updated_at = ?, attempts = attempts + 1 WHERE id = ? AND (status = 'queued' OR (status = 'sending' AND updated_at < ?)) RETURNING id")
    .bind(now, row.id, stale).first<{ id: string }>();
  if (!claimed) {
    const latest = await db.prepare("SELECT status FROM leads WHERE id = ?").bind(row.id).first<{ status: string }>();
    return latest?.status === "sent" ? "sent" : "queued";
  }
  const result = await sendLeadEmail(storedLeadData(row), row.id, row.created_at, config, fetcher);
  await db.prepare("UPDATE leads SET status = ?, provider_message_id = ?, last_error = ?, updated_at = ? WHERE id = ?")
    .bind(result.delivery === "sent" ? "sent" : "queued", result.messageId || null, result.error || null, new Date().toISOString(), row.id).run();
  return result.delivery;
}
