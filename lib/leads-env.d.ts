declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    RESEND_API_KEY?: string;
    LEAD_FROM_EMAIL?: string;
    OFFICE_ADMIN_EMAILS?: string;
  }
}
