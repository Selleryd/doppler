# Doppler Wellness — editable website reconstruction

**This is a newly coded reconstruction, not an export of the original hosted ChatGPT Site.**
It uses the saved Doppler homepage text, navigation, design screenshots, and artwork crops.
The original source, server-side services, and full-resolution image files were not recovered.

## Open it

Unzip the archive. The website folder is named **doppler-wellness-site**.
Open `index.html` in a browser. The pages, CSS, JavaScript, and seven artwork files are included;
no npm installation, external fonts, build server, or account is needed for the site itself.

For a local web-server preview on a Mac, put the folder on Desktop and run:

```bash
bash "$HOME/Desktop/doppler-wellness-site/OPEN_PREVIEW.command"
```

This opens a loopback-only Python preview. Keep Terminal open while previewing; Control+C stops it.
The external questionnaire, intake, application, and email links still require the appropriate
external service or email application. No form submissions were tested or made.

## What is included

The homepage, care and approach pages, mindfulness tools, mission, contact, clinician information,
insurance questions, journal, individual guides, and a 404 page are rendered as editable HTML.
There are 35 content routes plus a `/404/` route and the hosting-oriented `404.html` file.

The warm ivory pause section has **no gray fade or dark overlay**. The reconstruction includes
responsive navigation, a three-step introductory quiz, matching tabs, a home/in-person toggle,
breathing controls, five-senses grounding, an unsaved reflection area, a quiet timer, and journal
search/filter controls. The mobile contact email is kept on one line.

The mini-quiz is an introductory interaction, not a matching engine: its choices are not sent to
the external questionnaire. The actual Doppler form links are preserved in `config.json`.
This package contains no clinical backend, authentication service, scheduling system, or patient
record store, and it does not claim those systems were recovered.

## Review before publishing

**Newly written subpage and article copy needs the owner's and an appropriate clinical review.**
Most homepage wording and the first three journal titles were recoverable. The remaining page
copy, all article bodies, code, interactions, and small vector logo were recreated. The original
“5.0” rating and “thousands of clients” claims were not reproduced without verification.
Art is cropped from the saved screenshots, not recovered original-resolution assets. Details
and provenance are in `docs/RECOVERY_NOTES.md` and the two provenance JSON files.

Search indexing is **off by default for this review copy**. This is a meta/robots instruction,
not access control: publishing to a public host still makes the content publicly accessible.
After approving the design, copy, privacy notice, care availability, and external form destinations,
set both `public_url` and `allow_indexing` in `config.json`, then rebuild. For example:

```json
"public_url": "https://selleryd.github.io/doppler",
"allow_indexing": true
```

Use the actual eventual public address, not a temporary preview address. Rebuilding with these
settings generates canonical URLs and a sitemap and turns indexing on for content pages.
The 404 page remains noindex. Any existing SEO strategy, redirects, or analytics require an
additional review; the original site's hidden metadata and tracking setup were not recoverable.

## Edit and rebuild

`assets/site.css` controls the presentation. `assets/site.js` controls the interactions.
`src/build.py` contains reusable page templates and content. `config.json` holds shared links.
You can edit the finished HTML directly, but a later rebuild will overwrite those direct edits.
To regenerate the HTML after changing templates or configuration:

```bash
cd "$HOME/Desktop/doppler-wellness-site"
python3 src/build.py
python3 tests/check_static.py
```

Only Python's standard library is needed for rebuilding and static checks.

## Upload to selleryd/doppler

After reviewing the extracted site, run:

```bash
bash "$HOME/Desktop/doppler-wellness-site/PUSH_TO_GITHUB.command"
```

The helper uses its own website folder, with **no folder-selection window**. It requires `git`,
`python3`, and `rsync`, reads your PAT with hidden input directly from Terminal, verifies the account
and repository, and prepares a fresh clone under `~/Desktop/Doppler-GitHub-Uploads/`.
It shows the staged changes and requires you to type **PUSH** before committing and uploading.
The PAT is not written into the repository or remote URL. Never paste it into a chat.

Use a fine-grained PAT limited to `selleryd/doppler` with Contents read/write. The repository must
already exist. The helper does not create it or configure hosting. If existing GitHub Actions
workflows are present, a push can trigger them. Confirm the intended deployment before authorizing
PUSH. No Actions workflow is included in this package.

The helper overlays this site's files and preserves repository history and unmatched existing
files. It never force-pushes or deletes an existing local checkout. Consequently, obsolete remote
files, custom-domain settings, and old deployment workflows may need a separate deliberate review.
It does not automatically change Pages settings, turn indexing on, or verify a live deployment.

## Validation and limits

See `docs/VALIDATION.md`. Static local links, image references, page structure, JavaScript syntax,
and 118 browser interaction/layout checks passed in the build environment. Chromium rendered the
local code with resources inlined for testing because this environment blocked browser HTTP/file
navigation. This was not a live production test or a Safari/iOS/Android device certification.
The upload helper was syntax-checked but not run against the user's GitHub account.
