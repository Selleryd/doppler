# Recovery notes — September 16, 2026

## Source status

The saved artifact was “Doppler Wellness — Therapy That Fits,” project
`appgprj_6aa1812705008191bc945eea804ebaf6`, at
`https://doppler-wellness-reimagined.sellery.chatgpt.site`.
Its Library record had version 21 and referred to source version 25. The readable saved record
contained homepage text; it was not the editable source tree. Source export through the available
file tool was unsupported, and hosted-file retrieval was unsuccessful. No earlier website ZIP
was recovered. This archive must not be described as an exact source export.

Recovered Library record:
`file-inline-libfile_2b02d33316f481918a1d45a84c29c199`.

## What was recovered versus recreated

Most homepage wording, the section sequence, navigation labels, email address, care-setting and
breathing-tool concepts, and three journal titles came from the saved homepage. Several captions
and visual references came from dated screenshots of the site. Seven clean artwork regions were
cropped from those screenshots and encoded as WebP; no new artwork was generated to impersonate
an unrecovered original. See `ASSET_PROVENANCE.json` for exact image IDs and crop coordinates.

All HTML templates, CSS, JavaScript, responsive behavior, timers, the vector brand mark, and the
build/preview workflow are newly written. Secondary page bodies and all eight guide bodies are
new editorial copy, not recovered originals. First three guide titles were recovered; five other
titles were newly supplied. See `PAGE_PROVENANCE.json` for route-by-route disclosure.

The broad dark-to-gray fade above “Notice sooner” was not carried into this reconstruction.
No blank placeholder pages or deliberately nonworking form buttons are used. External forms are
linked rather than replaced with unconnected forms. Interactive tools do not collect or store
patient records.

The screenshot artwork is illustrative. In particular, the photographed therapy conversation
must not be represented as an actual Doppler clinician, client, office, or testimonial. Its alt
text identifies it as staged when used in the care-setting component.

## External destinations

- Matching questionnaire: https://form.jotform.com/221866424710151
- Patient intake: https://hipaa.jotform.com/212377807897169
- Clinician application: https://hipaa.jotform.com/212468592144055
- Contact: team@dopplerwellness.com

The questionnaire address was recovered from the earlier project context and opened as a Doppler
quiz. The two intake/application addresses were found in links on the public corporate site,
https://dopplerwellness.com . Their submission flows, access settings, account ownership, and
HIPAA configurations were not audited. No form was submitted. Recheck them before publication.
Related public pages consulted were `/pages/careers` and `/pages/we-accept-insurance`.

## Evidence used for limited new informational wording

These links support background information, not claims about this specific practice or a promise
that a short tool will treat a condition:

- NCCIH: https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety
- NIMH: https://www.nimh.nih.gov/health/topics/psychotherapies
- 988 Lifeline: https://988lifeline.org/get-help/
- Crisis Text Line: https://www.crisistextline.org/
- SAMHSA crisis information: https://www.samhsa.gov/find-support/in-crisis
- GitHub PAT documentation: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

Owner/clinical/legal review is still required for the newly written material. No certification,
clinical protocol validation, patient outcomes, universal insurance coverage, provider licensure
inventory, supported-state list, or factual rating has been inferred from those sources.

## Not recovered

The original component framework, original source history, full-resolution artwork, font files,
server-side services, original clinical privacy notices, hidden SEO metadata, analytics accounts,
and unpublished content were not recovered. This archive is a self-contained static frontend,
not a backup of any clinical backend. Font files are not bundled; system fonts are used.
