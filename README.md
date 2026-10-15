# Doppler Wellness

The approved website is published at https://selleryd.github.io/doppler/.

The site supports older adults, their families and senior living communities, with personalized therapist matching, insurance assistance, support groups and consent-based care-team coordination. The latest release retains the approved glass materials, lifeline animation, mobile refinements and all 12 journal articles.

## Website and backend

The root HTML pages, CSS, JavaScript and `assets/` are the current GitHub Pages website, exported from the final generated application pages. The complete application source remains in `app/`, `src/`, `public/`, `lib/`, `db/`, `drizzle/` and `build/`.

The lead API runs on the existing hosted application at https://doppler-wellness-reimagined.sellery.chatgpt.site/api/leads. Both the patient quiz and the short career/community forms use that endpoint. Its CORS policy accepts the exact GitHub Pages origin and the native application origin, only for contact submissions. It does not send cookies across origins or allow cross-origin office operations.

Office access is at https://doppler-wellness-reimagined.sellery.chatgpt.site/office/. Anonymous visitors are sent to ChatGPT sign-in; the lead list, PDFs and resend actions also enforce an office account allowlist on the server. No office records are exported to GitHub Pages or included in this repository.

## Development and publishing

Use Node.js 22.13 or newer. Install dependencies with `npm ci`, then:

```sh
npm run generate
npm run check
npm run build
```

`npm run generate` produces the final 35 marketing, journal and office routes. `npm run build` creates the Vinext/Cloudflare Worker backend. Database migrations are in `drizzle/` and the existing `.openai/hosting.json` identifies the hosted project.

To export the approved design for GitHub Pages, choose a clean directory outside the repository:

```sh
node scripts/export-pages.mjs --output /tmp/doppler-pages
```

The exporter uses `src/generated-pages.json` and `public/`, prefixes local URLs with `/doppler/`, configures the hosted lead endpoint, preserves every article and directs office access to its authenticated host. Copy the generated files to the repository root before committing a public website update. Keep the application source directories. GitHub Pages deploys from the repository root; the workflow independently validates the source and export.

Do not publish `.generated/legacy/`, an intermediate design, or the entire Worker `dist/` folder as a static site. Keep the Worker backend deployed whenever changing its source; a GitHub Pages push alone does not update that runtime.

## Lead workflow

Forms collect basic contact and preference information. The team follows up manually with the full intake or application. Family referral buttons point to `https://google.com` until the final referral form is supplied.

Lead records are saved to D1 before email delivery. The office dashboard lists requests, downloads PDF summaries and retries queued emails. Every lead email targets `team@dopplerwellness.com`.

Configure `RESEND_API_KEY` and a verified plain email address in `LEAD_FROM_EMAIL` as runtime secrets to enable PDF emails. Email credentials are not currently configured; submissions remain in the office queue. `OFFICE_ADMIN_EMAILS` optionally overrides the default server-side office allowlist. Secrets and captured leads are excluded from this repository.

The frontend uses idempotency keys. The backend validates contact fields, consent, origins, request sizes and rate limits. It does not collect clinical narratives or insurance member IDs. Asset provenance is recorded in `ASSET_SOURCES.md`.
