/** Public contact forms may originate only here or on the approved Pages site.
 * Office endpoints deliberately retain their separate same-origin policy. */
export const GITHUB_PAGES_ORIGIN = "https://selleryd.github.io";

export function allowedLeadOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (origin === GITHUB_PAGES_ORIGIN) return origin;
  if (origin === new URL(request.url).origin && request.headers.get("sec-fetch-site") !== "cross-site") return origin;
  return null;
}

/** Applied only by /api/leads, including its validation-error responses. */
export function withLeadCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  headers.delete("Access-Control-Allow-Origin");
  headers.delete("Access-Control-Allow-Credentials");
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  if (!(headers.get("Vary") || "").split(",").some((value) => value.trim().toLowerCase() === "origin")) headers.append("Vary", "Origin");
  const origin = allowedLeadOrigin(request);
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function leadPreflightResponse(request: Request): Response {
  const origin = allowedLeadOrigin(request);
  const requestedMethod = request.headers.get("access-control-request-method");
  const requested = request.headers.get("access-control-request-headers");
  const allowedHeaders = new Set(["content-type", "idempotency-key"]);
  const validHeaders = requested === null || (requested.length <= 1024 && requested.split(",").every((header) => allowedHeaders.has(header.trim().toLowerCase())));
  const valid = Boolean(origin && requestedMethod === "POST" && validHeaders);
  const response = valid
    ? new Response(null, { status: 204, headers: {
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key",
    } })
    : Response.json({ ok: false, error: "Please submit this form from the Doppler Wellness website." }, { status: 403 });
  const decorated = withLeadCors(request, response);
  decorated.headers.append("Vary", "Access-Control-Request-Method, Access-Control-Request-Headers");
  return decorated;
}
