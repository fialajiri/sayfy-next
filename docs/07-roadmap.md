# 07 — Roadmap (phased, tracer-bullet)

Each phase ends with something demonstrable and deployable to a Vercel preview. The order proves the
riskiest things first: DB parity and image hosts in Phase 1, legacy login in Phase 2, and the
upload + revalidate loop in Phase 3. Every later write feature reuses that loop.

The difference from zive: **the design system lands in Phase 0 and public pages are built in the
final design in Phase 1.** Phase 6 is polish, motion, SEO and audits, not a restyle.

Detailed checklists live in `docs/plans/phase-*.md`.

## Phase 0 — Scaffold, tooling, design foundation · ~1–1.5 days
- `create-next-app` (TS, App Router, Tailwind v4, ESLint, `src/`), pinned TS 6 / ESLint 9.
- Copy tooling from zive: Prettier + tailwind plugin, Husky + lint-staged, Vitest config,
  `CLAUDE.md`/`AGENTS.md` (adapted).
- shadcn init (`base-nova`), copy zive's `components/ui/*`, generate the missing primitives.
- **Design tokens** (colour, type, radius, motion) in `globals.css`, fonts via `next/font`, dark mode.
- `next.config.ts`: image hosts, security headers, CSP (Report-Only in dev), legacy redirects.
- `.env.example`. Root layout + `(site)` layout with header/footer shells. `/admin/styleguide` page.
- **Deliverable:** a themed empty site on a Vercel preview; the styleguide shows every token.

## Phase 1 — DB layer + public read path, in the new design · ~3–4 days
- Test DB clone (§0a of the phase plan), connection, models with pinned collection names, repositories,
  read use cases.
- Seed scripts for the **new** collections into the test DB: `results` (from `vysledky.json`),
  `settings`, `staticpages.slug = "propozice"`. Partners come later (Phase 5).
- Domain: `raceStatus`, `slugify`, `storageKeyFromUrl`, excerpt helper. All unit-tested.
- `pagecontents` repository + `DEFAULT_*` content (= legacy copy). Every page reads its copy from it,
  so there are no copy literals in JSX (`08` §B4).
- Pages: home (hero + countdown + news rail + results + gallery teaser), aktuality list/detail,
  propozice, výsledky list/detail, fotogalerie list/detail + lightbox, sayfy, kontakt. Podpora is
  static from the legacy PNGs until Phase 5.
- **Deliverable:** the whole public site renders **real data from the test DB** in the new design;
  legacy S3/CloudFront images load via `next/image`.

## Phase 2 — Auth + admin shell · ~1.5–2 days
- `src/auth.ts` (Auth.js v5 Credentials) + `verifyLegacyPassword` (`hash.salt`), tested against a
  real stored value from the test DB.
- Login page, logout, Upstash rate limit (reuse zive), `requireAdmin()` guard, `admin/layout.tsx`
  sidebar shell, dashboard skeleton, change password, `scripts/create-admin.ts`.
- `admin-shortcut` island on public pages.
- **Deliverable:** an **existing** admin logs in with their current password; `/admin/*` redirects
  when logged out.

## Phase 3 — First write path: Aktuality CRUD + uploads + full editor · ~4–5 days
- Presign route (reuse zive) with the per-prefix policy table (images / `soubory` documents / `media`
  video).
- Upload client + compression + `image-upload` (reuse zive).
- **Full rich-text editor per `08` Part A:** every legacy command (text styles, H2–H4, lists, 4×
  alignment, links, YouTube, documents, all table operations, undo/redo), plus image
  replace/resize/align/alt/caption, drag-drop/paste upload, attachment chips, link/YouTube dialogs,
  brand colours, highlight, callouts, preview. Must round-trip **real legacy HTML** from the test DB.
- News create/update/delete with Zod, slugs, sanitize, `diffImages` S3 cleanup, `revalidatePath`.
  Admin news table.
- **Deliverable:** an admin creates/edits/deletes an article with a main photo, gallery and inline
  images; the public list and home rail update immediately; removed images are really deleted from S3.

## Phase 4 — Galleries + Propozice · ~2–3 days
- Gallery create → bulk upload (≤200, concurrency 4, retry), rename, set cover, reorder, delete
  images, delete gallery (guarded, with S3 cleanup).
- Propozice editor (static page), assets tracking.
- **Deliverable:** full content management for galleries and propozice.

## Phase 5 — Settings, results, partners, page content · ~3–4 days
- `admin/nastaveni`: race date/time, ročník, registration URL + open toggle (also on the dashboard).
  Drives the hero countdown, CTA and JSON-LD.
- `admin/vysledky`: add/edit/delete a year.
- `admin/partneri`: CRUD + order + logo upload. `scripts/seed-partners.ts` migrates the 9 legacy
  logos. The public Podpora page switches to DB.
- **Page content CMS** (`08` Part B): `/admin/obsah/{uvod,sayfy,kontakt,podpora,web}` forms on top of
  the `pagecontents` repository that public pages already read since Phase 1. Image fields, repeatable
  lists (Sayfy chapters, contacts), hero video replace, live preview for Úvod.
- **Deliverable:** **everything visitors see is admin-editable** (like zive). Yearly maintenance (new
  results link, registration link, sponsors, texts, photos) needs **no code change or deploy**.

## Phase 6 — Polish, motion, a11y, SEO, performance · ~2–3 days
- Motion layer (scroll-driven course line, header transition, View Transitions), video re-encode +
  poster, Sayfy photo optimisation, SVG logo.
- Loading/empty/error states everywhere, 404 page, responsive pass (360 / 768 / 1024 / 1440).
- Accessibility audit (axe + keyboard + VoiceOver), reduced-motion pass.
- Metadata per route, OG images, JSON-LD `SportsEvent`/`NewsArticle`, sitemap/robots.
- CSP enforced in production with no violations. Optional `@vercel/analytics`.
- Lighthouse budget: **≥95** Performance/Accessibility/Best-practices/SEO on mobile for home,
  aktuality detail and a gallery.
- Playwright smoke tests: login, create news, upload to a gallery, public pages render.
- **Deliverable:** production-quality UX.

## Phase 7 — Verification, staging, cutover · ~1–2 days
- `scripts/verify-migration.ts` against a fresh test clone, full QA on a staging deployment.
- Production env vars on Vercel, S3 CORS for the production origin (`docs/aws/`), Atlas snapshot.
- Move `www.sayfy.cz` + `sayfy.cz` from the legacy Vercel project to the new one, monitor, then
  retire Heroku and the old Vercel project.
- After cutover: transparent password re-hash (`05`), `s3-orphans` cleanup (dry run first), decide
  whether to purge `logs`.
- **Deliverable:** the combined app is live; legacy services are retired.

## Rough total
**~3.5–4 focused weeks** for one developer. Smaller than zive in domain (no public accounts, no
emails, no event/performer workflow), but the redesign is first-class, the editor is substantially
richer than zive's, and every page's content becomes admin-editable.

## Testing strategy (throughout)
- **Domain** (pure): `raceStatus` (before / race day / after, timezone `Europe/Prague`, DST edges),
  `slugify` (Czech diacritics, punctuation, collisions), `storageKeyFromUrl` (foreign host refused,
  encoded keys), `diffImages`, excerpt.
- **Auth crypto:** `verifyLegacyPassword` against a real redacted value, plus a round-trip with
  `hashLegacyPassword`. **The most important test.**
- **Use cases:** mocked repos + storage (S3 delete after DB success, never before; failures swallowed).
- **Repositories:** `mongodb-memory-server` integration (pinned collections, slug uniqueness, sort).
- **Actions:** guard tests: every admin action rejects without a session (table-driven over all
  exported actions, so a newly added action can't skip the guard silently).
- **Components:** login form, news form validation, countdown states, lightbox keyboard.
- **E2E (Playwright):** 3–4 smoke flows on the preview deployment.

## Open questions (resolve before/while building)
1. ~~**Production domain.**~~ **Resolved: `https://www.sayfy.cz`** (canonical). Checked on 2026-10-05:
   the domain already serves the **legacy** frontend from Vercel, DNS is on Vercel
   (`ns1/ns2.vercel-dns.com`), and the apex `sayfy.cz` already 308-redirects to `www`. Cutover = move
   the domain between Vercel projects; no DNS changes needed.
2. **Partner names + URLs** for the 9 logos in `public/logos/support` (legacy alts were `image_2`…).
   Which ones are current?
3. **Race facts:** start time, start/finish place, the first year of the race (to confirm "since
   2009" and the ročník count), categories. Is a GPX of the course available (for the real
   elevation profile)?
4. **New uploads URL host:** keep `sayfyho-memorial.s3…amazonaws.com` (like legacy rows) or serve new
   images through CloudFront `d3o6i10cj9gxf0.cloudfront.net`?
5. **Hero footage:** is newer race video available? Is there a vector Sayfy logo?
6. **`logs` collection:** purge after cutover (recommended, GDPR), archive, or keep?
7. **Admins:** how many accounts exist and who are they? Confirm emails in the test copy.
8. **Analytics:** none, Vercel Analytics (cookieless), or reinstate GA (needs a consent banner)?
9. **Dark-mode toggle** visible to visitors, or system preference only?
10. ~~**Editor extras:** text colour, highlight, callouts?~~ **Resolved: yes.** Brand-palette text
    colour, highlight and info/warning callout blocks are in scope (`08` §A2, Phase 3).
11. ~~**Documents in content:** PDF attachments in news too?~~ **Resolved: yes.** Attachments
    (PDF/DOC/DOCX/XLS/XLSX/TXT ≤20 MB) are available everywhere the full editor is used: aktuality,
    propozice, Sayfy chapters, page rich-text blocks.
