# 01 — Architecture

## Goal

One deployable Next.js app (Vercel) that **replaces two legacy projects**:

- `../sayfy-backend-ts` — Express 4 + Mongoose 6 + custom JWT cookie auth, hosted on Heroku
  (`sayfy-memorial-backend.herokuapp.com`).
- `../sayfy-frontend-ts` — Next 12 **Pages Router** + SCSS, hosted on Vercel
  (`sayfy-frontend-ts.vercel.app`), fetching the backend over HTTP with axios.

The "backend" stops being a separate HTTP service. It becomes **server-only modules** (React Server
Components, Server Actions and two route handlers) that talk to MongoDB Atlas and S3 directly. That
removes the Heroku dyno, the CORS/credentialed-cookie dance between two origins (which is also the
root of the legacy CSRF exposure — see `03-backend-plan.md` §Security), and the build-time dependency
on the backend being up (`getStaticProps` called Heroku during `next build`).

The sister project `../../zive-teplice/zive-teplice-next` went through the same rewrite. **This plan
deliberately mirrors its architecture and reuses its proven modules** (presign route, upload client,
image compression, rich-text sanitizer, guards, rate limiter, Result type, DB connection) — see
"Reuse from zive-teplice-next" below. Sayfy is a much smaller domain (admin-only, no public user
accounts, no emails), so several zive layers simply aren't needed.

## Scope at a glance

| Area | Legacy | New |
|---|---|---|
| Public site | Domů, Sayfy, Aktuality, Propozice, Výsledky, Fotogalerie, Kontakt, Podpora | Same pages, same Czech URLs, **full redesign** (`06-design-system.md`) |
| Admin | Inline "Edit/Smazat" buttons on public pages, client-only guard | Dedicated `/admin` area, server-guarded |
| Users | Admins only (signup route commented out) | Admins only — created via a script, no public signup |
| Content managed in DB | Aktuality, galleries, propozice (static page) | + **Výsledky**, **site settings** (race date, ročník, registration link/toggle), **partners** |
| Content hard-coded in git | `vysledky.json`, register-button URL, sponsor logos, **all page copy** (home hero, Sayfy bio + photos, Kontakt details, socials, SEO defaults) | **Everything admin-editable**, like zive: DB + admin UI, defaults = today's copy (`08` Part B) |
| Rich-text editor | Tiptap 2 beta: styles, headings, lists, align, images, documents, YouTube, links, tables | **Richer Tiptap 3 editor**, full parity + image replace/resize/align/alt/caption, attachments, callouts (`08` Part A) |

## Layering (Clean Architecture, pragmatic)

Dependencies point inward. Framework code (Next, Mongoose, AWS SDK, Auth.js) lives at the edges;
business rules do not import it.

```
Presentation      app/**                 RSC pages, layouts, route handlers, server actions (thin)
   │  calls
Application       server/application     use cases: orchestration + DTOs, no framework imports
   │  depends on
Domain            server/domain          entities, value objects, pure rules, port interfaces (zero deps)
   ▲  implemented by
Infrastructure    server/infrastructure  Mongoose models + repositories, S3 storage, password crypto, rate limiter
```

Wiring happens in one **composition root** (`server/container.ts`). Server actions and pages call
use cases, never Mongoose directly.

> Pragmatic note (same as zive): simple read pages may use a one-line pass-through use case. The
> layering earns its keep on the **write path** — uploads + S3 cleanup, slug generation, sanitizing
> rich text, settings-driven registration state. Don't add ports for things with one implementation
> and no testing need.

Domain logic that genuinely deserves pure, unit-tested functions in this project:

- `raceStatus(now, raceDate)` → `upcoming | raceDay | finished` (drives the hero countdown, the
  registration CTA and the "výsledky jsou tady" banner).
- `slugify(title)` + `uniqueSlug(base, exists)` — Czech diacritics, punctuation-safe, collision suffix.
- `storageKeyFromUrl(url, allowedHosts)` — map a stored full image URL back to its S3 key, refusing
  foreign hosts (prevents "delete arbitrary object" bugs).
- `diffImages(before, after)` — which S3 objects to delete after a gallery/news edit.
- `legacyPassword.verify/hash` — `hash.salt` pbkdf2 format (see `05`).

## Folder structure

```
sayfy-next/
├─ src/
│  ├─ app/                                   # PRESENTATION — App Router
│  │  ├─ (site)/                             # public pages, shared header/footer layout
│  │  │  ├─ page.tsx                         # landing: hero video + countdown, news rail, results, gallery teaser
│  │  │  ├─ sayfy/page.tsx                   # memorial page (static content)
│  │  │  ├─ aktuality/page.tsx               # news list (paginated, ?strana=)
│  │  │  ├─ aktuality/[slug]/page.tsx        # news detail (+ photo gallery lightbox)
│  │  │  ├─ propozice/page.tsx               # race rules (rich text from DB) + quick facts + registration CTA
│  │  │  ├─ vysledky/page.tsx                # results by year ("race bib" cards)
│  │  │  ├─ vysledky/[rok]/page.tsx          # results detail (embedded sportt.cz + external link)
│  │  │  ├─ fotogalerie/page.tsx             # galleries by year
│  │  │  ├─ fotogalerie/[slug]/page.tsx      # gallery grid + lightbox
│  │  │  ├─ kontakt/page.tsx
│  │  │  ├─ podpora/page.tsx                 # partners (from DB)
│  │  │  ├─ loading.tsx / error.tsx / not-found.tsx
│  │  │  └─ layout.tsx
│  │  ├─ (auth)/prihlaseni/page.tsx          # admin login (legacy /login → redirect)
│  │  ├─ admin/                              # ADMIN area (role: admin) — dynamic, never cached
│  │  │  ├─ layout.tsx                       # guard: session + isAdmin, sidebar shell
│  │  │  ├─ page.tsx                         # dashboard: race status, counts, quick actions
│  │  │  ├─ aktuality/{page,nova,[id]}       # news CRUD
│  │  │  ├─ fotogalerie/{page,nova,[id]}     # gallery CRUD + bulk upload + reorder/cover/delete images
│  │  │  ├─ propozice/page.tsx               # edit the propozice static page
│  │  │  ├─ vysledky/page.tsx                # results CRUD (year, ročník, URL)
│  │  │  ├─ partneri/page.tsx                # partners CRUD (name, logo, link, order)
│  │  │  ├─ obsah/{uvod,sayfy,kontakt,podpora,web}/page.tsx   # page content CMS (08 Part B)
│  │  │  ├─ nastaveni/page.tsx               # race date, ročník, registration URL + open/closed
│  │  │  └─ ucet/page.tsx                    # change own password
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/route.ts      # Auth.js handlers
│  │  │  └─ uploads/presign/route.ts         # admin-only presigned S3 PUT URLs
│  │  ├─ layout.tsx                          # root: fonts, providers, <Toaster/>, theme
│  │  ├─ sitemap.ts / robots.ts / opengraph-image.tsx
│  │  └─ globals.css                         # Tailwind v4 entry + design tokens (@theme)
│  ├─ components/
│  │  ├─ ui/                                 # shadcn/ui (Base UI primitives) — generated, owned
│  │  ├─ site/                               # header, footer, hero, countdown, news-card, bib-card, gallery-grid, lightbox…
│  │  └─ admin/                              # forms, tables, image-upload, bulk-upload, image-field, repeatable-list
│  │     └─ editor/                          # rich-text editor: extensions, toolbar groups, bubble menus, dialogs (08 Part A)
│  ├─ server/                                # SERVER-ONLY (every file imports 'server-only')
│  │  ├─ domain/                             # entities, value objects, ports, Result, pure rules (race-status, slug, storage-key)
│  │  ├─ application/                        # use cases, one file per aggregate (news, galleries, results, settings, partners, auth)
│  │  ├─ infrastructure/
│  │  │  ├─ db/{connection.ts, models/*.ts, repositories/*.ts}   # Mongoose 9, pinned collection names
│  │  │  ├─ storage/s3.ts                    # @aws-sdk/client-s3 + presigner (implements StoragePort)
│  │  │  ├─ auth/password.ts                 # legacy pbkdf2 "hash.salt" verify/hash
│  │  │  └─ rate-limit/upstash.ts            # login rate limiter (implements RateLimiter port)
│  │  ├─ actions/                            # 'use server' entrypoints (thin → guards → use cases → revalidate)
│  │  └─ container.ts                        # composition root
│  ├─ schemas/                               # Zod schemas shared by client forms + server actions
│  ├─ lib/                                   # framework-agnostic helpers named by purpose (dates.ts, site-url.ts, sanitize-html.ts, cn)
│  └─ auth.ts                                # Auth.js config (auth, signIn, signOut, handlers)
├─ scripts/                                  # tsx: db-check, clone-prod-to-test, seed-*, create-admin, verify-migration, s3-orphans
├─ public/                                   # brand assets, hero video + poster, Sayfy photos (optimised)
├─ docs/                                     # ← you are here
├─ proxy.ts                                  # (Next 16 name for middleware) optional coarse /admin redirect
├─ next.config.ts                            # image hosts, security headers, CSP, redirects
└─ package.json
```

## Data-flow model

| Concern | Mechanism | Notes |
|---|---|---|
| Public read (home, aktuality, galleries, propozice, výsledky, podpora) | **RSC** → use case → repository; ISR (`export const revalidate`) | No client fetch, no API hop. SEO-friendly, cheap. |
| On-demand freshness | `revalidatePath()` from every admin mutation | Admin edits show up immediately; ISR is only the safety net. |
| Auth | **Auth.js v5** Credentials provider, JWT session, `isAdmin`/`id` in token | Verifies legacy `hash.salt` passwords; no data migration. |
| Admin mutations | **Server Actions** + Zod + `requireAdmin()` + `revalidatePath()` | Built-in Origin check replaces the legacy permissive-CORS setup. |
| Image upload (single, editor, bulk ≤200) | Client compress (Canvas) → **presigned S3 PUT** → server action persists URLs | Bypasses Vercel's ~4.5 MB body limit; reuse zive's upload client. |
| Rich text (aktuality, propozice, Sayfy chapters, page blocks) | **Tiptap 3** full editor (`08` Part A) → HTML → `sanitize-html` on write **and** on render | Legacy rows were never sanitized — render-time sanitize covers them. |
| Page content (home, sayfy, kontakt, podpora, site-wide) | Typed singleton docs in `pagecontents`, merged over `DEFAULT_*` = legacy copy | Pages never contain visitor-facing copy literals (`08` Part B). |
| Toasts | **sonner** | Replaces `ErrorModal`/`LoadingSpinner` overlays. |
| Admin "Upravit" shortcuts on public pages | Tiny client island reading the session | Keeps public pages static (no `auth()` in RSC). |

## Rendering & caching strategy

- **Public pages:** static + ISR. Suggested `revalidate`: home/aktuality `300`, galleries/results/
  partners `3600`, sayfy/kontakt fully static. Every mutation calls `revalidatePath` for the affected
  routes (incl. `/` because the home page shows news, results and settings).
- **Countdown:** server renders the day count (correct to the ISR window); a small client component
  upgrades it to a live ticking clock after hydration — no hydration mismatch because the live part
  renders only on the client.
- **Admin pages:** dynamic (they call `auth()`), never cached.
- **Images:** `next/image` with `remotePatterns` for the legacy S3 + CloudFront hosts
  (`sayfyho-memorial.s3.eu-central-1.amazonaws.com`, `d3o6i10cj9gxf0.cloudfront.net`). Thumbnails go
  through the optimizer; the **lightbox full-size view loads the original URL directly** (already
  compressed for new uploads) to stay within the Vercel image-optimization quota.

> Next 16 also offers **Cache Components** (`cacheComponents`, `'use cache'`, `cacheTag`). Zive uses
> plain segment `revalidate` + `revalidatePath`; start the same way for parity. Re-evaluate in Phase 0
> after reading `node_modules/next/dist/docs/` — don't mix both models.

## Reuse from zive-teplice-next

Copy and adapt (don't re-invent) — these are already tested in production:

| zive module | Use here for |
|---|---|
| `server/infrastructure/db/connection.ts` | Cached serverless-safe Mongoose connection |
| `server/domain/result.ts` | `Result<T, E>` + `ok`/`err` helpers |
| `server/actions/guards.ts` | `requireAdmin()` (drop `requireSelfOrAdmin` — not needed) |
| `app/api/uploads/presign/route.ts` + `schemas/upload.ts` | Presign route with MIME/size/prefix validation |
| `components/admin/upload-client.ts`, `image-compression.ts`, `bulk-image-upload.tsx`, `image-upload.tsx` | Upload UX, concurrency cap, Canvas compression |
| `components/admin/rich-text-editor.tsx`, `lib/sanitize-html.ts`, `components/site/rich-text.tsx` | **Skeleton only.** Zive's editor is StarterKit-only, far below legacy Sayfy parity. Build the full editor per `08` Part A |
| `domain/homepage-content.ts` + `homepage-content-form.tsx`, `homepage-image-field.tsx`, `homepage-preview.tsx`, `social-links-form.tsx` | The page-content CMS pattern (singleton doc + defaults + image field + preview), generalised to 5 pages |
| `components/site/image-lightbox.tsx`, `gallery-lightbox.tsx` | yet-another-react-lightbox wrapper |
| `server/application/rate-limit.ts` + Upstash adapter | Login brute-force protection |
| `scripts/clone-prod-to-test.ts`, `scripts/check-db-connection.ts` | Test-DB workflow |
| `next.config.ts` header/CSP structure | Security headers (adjust hosts + add `frame-src` for sportt.cz / YouTube) |
| eslint/prettier/husky/vitest configs | Tooling parity |

## Cross-cutting rules (from global standards)

- No `any`; `unknown` + Zod parsing at every trust boundary (action input, route body, env, DB rows
  that legacy code may have written inconsistently).
- Use cases return `Result<T, DomainError>` (discriminated union); actions map to
  `{ ok: false, message, fieldErrors? }`. No throwing across layers.
- Every module under `src/server/**` imports `'server-only'`.
- Files ≤200 lines, functions ≤50 lines, ≤3 nesting levels, early returns.
- Semantic HTML, keyboard-accessible, `prefers-reduced-motion` honoured, a single `<main>`.
