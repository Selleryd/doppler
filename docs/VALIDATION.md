# Validation — reconstruction review copy

## Passed

The static validator checked 37 HTML files (35 content pages, a 404 route, and root 404.html),
1,346 local link/asset references, 113 image elements, one H1 per page, duplicate IDs, referenced
fragments, and robots metadata. No missing local targets were found. The JavaScript and shell
helpers passed syntax checks.

The browser test suite passed 118 assertions. Tests covered quiz completion/back/reset, external
quiz link integrity, matching tabs and arrow keys, care-setting toggles, absence of a gray pause
section background overlay, breathing start/pause/resume/completion/reset, text-only and
reduced-motion options, mobile navigation/Escape, grounding progression/reset, reflection
word count/clearing, quiet timer controls, journal search/filtering, all page images, and layouts.

All 36 index.html routes were rendered at a 390-pixel viewport; none produced document-wide
horizontal overflow. The homepage was also checked at widths 320, 375, 768, 800, 1024, 1440,
and 2048 pixels. The mobile contact address occupied one line. No JavaScript exception was
reported in the tests. Large and narrow viewport screenshots were inspected.

## Scope and limitations

Chromium / Playwright rendered actual local HTML, CSS, JavaScript, and image bytes through an
in-memory document fixture. External resource attributes were replaced with their local bytes
for that fixture; the downloaded website retains normal relative file references. The test
environment blocked direct browser HTTP and file navigation. Internal targets were therefore
validated against the filesystem rather than claimed as end-to-end production navigation.

These are not Safari/iOS, Android-device, assistive-technology, complete WCAG, clinical, HIPAA,
security-penetration, SEO-performance, or live-production certifications. External form
submissions and email/SMS/telephone delivery were not exercised. The real GitHub upload was
not run and no live deployment was performed. The helper was syntax-checked only.

`STATIC_CHECKS.json` and `BROWSER_CHECKS.json` contain the machine-readable results.
