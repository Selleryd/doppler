# Doppler Wellness

The approved V40 website source is now maintained in this repository. It targets older adults, their families and senior living communities, with personalized therapist matching, insurance assistance, support groups and consent-based care-team coordination.

Approved source checkpoint: `fa955069a08081796169d723d7592f8bcfab722c` from the ChatGPT Sites project. This includes the latest journal separator removal, mobile spacing correction and restored glass styling.

## Current hosting

The complete approved application runs at https://doppler-wellness-reimagined.sellery.chatgpt.site with its existing private review access. The application source lives in `app/`, `src/`, `public/`, `lib/`, `db/`, `drizzle/` and `build/`.

The root `index.html`, `styles.css`, `app.js`, `assets/`, `pages/`, `blogs/` and `a/` remain the previous GitHub Pages deployment. They are retained so a source push does not replace the public website with invalid Worker output. They are not the approved V40 application. The GitHub Actions workflow validates the new source; it does not deploy Worker files as a static website.

To replace the public GitHub Pages version, use a dedicated export of `src/generated-pages.json` and `public/` with the `/doppler/` base path, together with a public production lead API. A full application deployment needs a Cloudflare Worker-compatible host and D1 database. GitHub Pages cannot run the server routes or database. Do not deploy `.generated/legacy/` (an intermediate, older design) or upload the entire Worker `dist/` folder to Pages.

## Development and validation

Use Node.js 22.13 or newer. Install dependencies with `npm ci`, then:

```sh
npm run generate
npm run check
npm run build
```

`npm run generate` produces the final 35 marketing, journal and office routes. `npm run build` creates the Vinext/Cloudflare Worker application. Database migrations are in `drizzle/`. The existing `.openai/hosting.json` identifies the ChatGPT Sites project.

## Lead workflow

The patient quiz, career interest form and community partnership form collect basic contact and preference information. The team follows up manually with the full intake or application. Family referral buttons point to `https://google.com` until the final referral form is supplied.

Lead records are saved to D1 before email delivery. The authenticated `/office/` dashboard lists requests, downloads PDF summaries and retries queued emails. Every lead email targets `team@dopplerwellness.com`.

Configure `RESEND_API_KEY` and a verified plain email address in `LEAD_FROM_EMAIL` as runtime secrets to enable PDF emails. Email credentials are not currently configured; submissions remain in the office queue. `OFFICE_ADMIN_EMAILS` optionally overrides the default server-side office allowlist. Secrets and captured leads are excluded from this repository.

The frontend uses idempotency keys. The backend validates requests, checks origins, enforces size and rate limits, fixes the email recipient and authorizes office access. It does not collect clinical narratives or insurance member IDs.

Asset provenance is recorded in `ASSET_SOURCES.md`. The ChatGPT review site remains marked `noindex`.
