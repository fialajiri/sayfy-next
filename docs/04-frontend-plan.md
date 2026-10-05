# 04 — Frontend rewrite plan

Keep every existing capability, modernise how it's delivered, and ship the redesign from
`06-design-system.md`. Concretely: Pages Router → App Router; SCSS (`src/sass/**`, ~50 partials) →
Tailwind v4 tokens + shadcn/ui (Base UI); `AuthContext` + axios + `useHttpClient` → RSC + server
actions; inline admin buttons on public pages → a real `/admin` area.

**Public pages are built in the new design from the start** (Phase 1), not restyled later. Unlike
zive, nothing is built twice.

## Route map (legacy → new)

Public URLs stay **identical** (they're indexed and shared on Facebook/Instagram).

| Legacy page | New route | Type | Notes |
|---|---|---|---|
| `pages/index.tsx` | `(site)/page.tsx` | RSC + ISR | Hero video + countdown + registration CTA, news rail, results teaser, gallery teaser, partners strip |
| `pages/sayfy` | `(site)/sayfy/page.tsx` | static RSC | Memorial page, editorial redesign; photo strip → lightbox |
| `pages/aktuality/index` | `(site)/aktuality/page.tsx` | RSC + ISR | Featured latest + grid, paginated `?strana=` (legacy rendered everything) |
| `pages/aktuality/[title]` | `(site)/aktuality/[slug]/page.tsx` | RSC + ISR, `generateStaticParams` | Hero image, sanitized body, gallery → lightbox, share button, prev/next |
| `pages/propozice` | `(site)/propozice/page.tsx` | RSC + ISR | Rich text + auto TOC from headings + sticky quick-facts card (date, place, ročník, registration CTA from settings) |
| `pages/vysledky` | `(site)/vysledky/page.tsx` | RSC + ISR | "Race bib" cards per year (from DB) |
| `pages/vysledky/[year]` | `(site)/vysledky/[rok]/page.tsx` | RSC + ISR | Lazy iframe of sportt.cz + "Otevřít na sportt.cz" link (iframe may be blocked → link is the fallback) |
| `pages/fotogalerie/index` | `(site)/fotogalerie/page.tsx` | RSC + ISR | Year tiles with cover + photo count |
| `pages/fotogalerie/[galleryTitle]` | `(site)/fotogalerie/[slug]/page.tsx` | RSC + client lightbox | Uniform grid, deep link `?foto=12` |
| `pages/kontakt` | `(site)/kontakt/page.tsx` | static | Contact card + "zapojte se" CTA + map link (mapy.cz, no embed) |
| `pages/podpora` | `(site)/podpora/page.tsx` | RSC + ISR | Partner logo wall from DB, real names as `alt` (legacy `alt="image_2"`) |
| `pages/login` | `(auth)/prihlaseni/page.tsx` | client form + SA | redirect `/login` → `/prihlaseni` |
| `pages/aktuality/new`, `edit/[id]` | `admin/aktuality/nova`, `admin/aktuality/[id]` | client forms + SA | redirect old paths |
| `pages/fotogalerie/new`, `edit/[title]` | `admin/fotogalerie/nova`, `admin/fotogalerie/[id]` | client + SA | |
| `pages/propozice/edit` | `admin/propozice` | client + SA | |
| — | `admin`, `admin/vysledky`, `admin/partneri`, `admin/nastaveni`, `admin/ucet` | RSC + SA | new |
| — | `admin/obsah/{uvod,sayfy,kontakt,podpora,web}` | RSC + SA | new: page-content CMS (`08` Part B) |

> **No visitor-facing copy in JSX.** Home, Sayfy, Kontakt, Podpora, header socials and SEO defaults
> render from `pagecontents` (with defaults = legacy copy) from Phase 1 on. See `08` §B4.

`next.config.ts` redirects (permanent): `/login → /prihlaseni`, `/aktuality/new → /admin/aktuality/nova`,
`/aktuality/edit/:id → /admin/aktuality/:id`, `/fotogalerie/new → /admin/fotogalerie/nova`,
`/propozice/edit → /admin/propozice`. `/fotogalerie/edit/:title` needs a lookup, so it gets a tiny
route that resolves the slug to an id and redirects.

## Component system

### shadcn/ui primitives (`components/ui/`, `base-nova` style like zive)
`button`, `input`, `textarea`, `label`, `field` (RHF+Zod messages), `switch` (registration toggle),
`select`, `dialog`, `alert-dialog` (destructive confirms), `sheet` (mobile nav, admin sidebar on
mobile), `dropdown-menu`, `table`, `card`, `badge`, `skeleton`, `sonner`, `tooltip`, `pagination`,
`separator`, `calendar` + `popover` (race-date picker), `progress` (uploads), `sidebar` (admin shell).
Copy zive's already-generated files where they exist; generate the rest with the CLI.

### Site components (`components/site/`)
| Component | Kind | Notes |
|---|---|---|
| `site-header` | server + client island | Transparent over the hero, solid after scroll (IntersectionObserver sentinel), Sheet menu on mobile, socials |
| `site-footer` | server | Course-profile line, nav, socials, partners mini-strip, "created by codeFactory" credit |
| `hero-video` | client | Muted loop, `poster`, `preload="metadata"`, **paused under `prefers-reduced-motion`**, pause/play button (WCAG 2.2.2) |
| `race-countdown` | server shell + client tick | Bib-style digit tiles. Uses `raceStatus()`: upcoming → countdown, race day → "Dnes závodíme!", finished → link to results |
| `registration-cta` | server | Hidden or "Registrace bude otevřena" when `registrationOpen=false`. External link with an `↗` icon + `rel="noopener"` |
| `news-card`, `news-rail` | server | Rail = CSS scroll-snap with prev/next buttons (`scrollBy`), keyboard-scrollable region with a label |
| `bib-card` | server | Results card styled as a race bib: ročník number, year, safety-pin dots |
| `gallery-tile`, `gallery-grid`, `gallery-lightbox` | server + client | Lightbox = yet-another-react-lightbox (zoom, thumbnails, swipe), from zive |
| `rich-text` | server | Sanitize + typographic styles (`prose`-like tokens, tables scroll horizontally) |
| `course-profile` | server SVG | Decorative elevation line (`aria-hidden`), scroll-driven "draw" in `@supports` |
| `page-header` | server | Kicker + display title + optional lead, consistent across pages |
| `admin-shortcut` | client | Small floating "Upravit" pill on public pages, rendered only when `useSession()` says admin |

### Legacy component → new mapping
| Legacy | New |
|---|---|
| `ui-elements/button` | shadcn `Button` (`cva` variants: `primary`, `signal`, `outline`, `ghost`, `link`) |
| `ui-elements/modal`, `backdrop`, `error-modal` | `Dialog` / `AlertDialog` / `sonner` |
| `ui-elements/loading-spinner` | route `loading.tsx` skeletons + `useFormStatus`/`isPending` |
| `ui-elements/side-drawer` + checkbox hamburger hack | `Sheet` |
| `ui-elements/photo-modal` | `gallery-lightbox` |
| `ui-elements/image-card` | `next/image` inside `gallery-tile`/`news-card` |
| `ui-elements/register-button` (hard-coded URL) | `registration-cta` (settings-driven) |
| `carousel/*` (`react-alice-carousel`) | `news-rail` / photo strip (scroll-snap) |
| `form-elements/floating-label-input` | shadcn `Field` + `Input` |
| `form-elements/multiple-image-upload` (re-downloads existing images via `createFileFromUrl`!) | `image-upload` / `bulk-image-upload` from zive. Existing images are shown by URL, never re-downloaded |
| `form-elements/single-file-picker` | `image-upload` |
| `tiptap/*` (12 files, SVG icon buttons, `window.prompt` dialogs, document-as-link hack) | `components/admin/editor/*`: full Tiptap 3 editor with **every legacy command** plus image replace/resize/align/alt/caption, attachment chips, link/YouTube dialogs, table bubble menu, brand colours, callouts, preview (`08` Part A) |
| `tiptap/tip-tap-lite` | same editor with a `variant="basic"` toolbar (text + lists + links) for short rich fields |
| `meta/simple-head`, `meta/aktualita-head` | Metadata API: `metadata` / `generateMetadata` |
| `layout/*` | `site-header`, `site-footer`, `(site)/layout.tsx` |
| `context/auth-context`, `hooks/http-hook`, `models/axios-config`, `models/error-model` | deleted; `auth()` / `useSession()` / server actions |

## Galleries
- **Index:** year tiles (cover = `images[0]`, count badge), newest year first, 2/3/4 columns.
- **Detail:** uniform 4:3 grid with `object-cover` (no stored dimensions, so no layout shift),
  `sizes` set per breakpoint, first row `priority`, the rest lazy. Clicking opens the lightbox at
  that index, and `?foto=n` makes a photo deep-linkable.
- **Large galleries (≤200):** render all thumbnails. They're lazy, and `content-visibility: auto` on
  rows keeps rendering cheap. Paginate only if a real gallery measures slow.
- **Admin:** drag-and-drop dropzone + file picker, client compression, per-file progress, concurrency
  4, failed files retryable without re-uploading the successes (zive `bulk-image-upload`). Image
  management grid: **"Nastavit jako titulní"** (move to index 0), move left/right buttons (keyboard
  accessible, no DnD library), multi-select delete behind an `AlertDialog`.

## Forms & validation
- One Zod schema per form in `src/schemas/` (news, gallery, static-page, result, settings, partner,
  login, change-password). The client form (RHF resolver) and the server action (`safeParse` first)
  both import it. One source of truth replaces `express-validator` + `validators.tsx`.
- Rules carried over: title non-empty ≤150 + unique (news, gallery); news `mainPhoto` required;
  news photo gallery ≤10 (legacy limit); gallery ≤200 photos per upload batch; email format; password
  non-empty (new passwords ≥12 chars).
- Server actions return typed field errors, rendered inline and announced (`aria-describedby`,
  `aria-invalid`, focus moves to the first invalid field on submit).
- `useActionState` for submit state. Optimistic `useOptimistic` only where it's obviously safe
  (partner reorder, registration toggle).

## Auth on the client
- Server guard in `app/admin/layout.tsx` (`auth()` → `redirect('/prihlaseni?next=…')` if not admin)
  **and** `requireAdmin()` inside every action and the presign route. The layout isn't a security
  boundary on its own.
- Optional `proxy.ts` (Next 16's rename of `middleware.ts`) for a coarse `/admin/*` redirect. Read
  the Next 16 docs first.
- `SessionProvider` only wraps the admin layout and the `admin-shortcut` island, so public pages
  don't pay for a session fetch unless the island mounts.
- Public nav **drops the login icon** (legacy showed a user icon to every visitor). The footer gets a
  discreet "Administrace" link.

## Styling
- All tokens in `globals.css` `@theme` (see `06`). The SCSS palette is the starting point.
- Mobile-first. Container queries for cards used in both rails and grids (`@container`).
- `next/font/google` for the display + text faces with the `latin-ext` subset (Czech diacritics).
- Light and dark themes via `next-themes`. The hero and footer are always "asphalt" dark.

## SEO
- Metadata API per route, `generateMetadata` for news, gallery and results detail pages. `metadataBase`
  from `NEXT_PUBLIC_SITE_URL` = **`https://www.sayfy.cz`** in production (legacy `HOST_URL` was `""`,
  so every `og:url` was broken). Canonical URLs always use `www`.
- `opengraph-image.tsx`: a branded default plus a per-article image (news main photo + title),
  generated with `next/og`.
- JSON-LD **`SportsEvent`** on home + propozice (name, `startDate` from settings, location Hrob,
  organiser, `url` to registration). JSON-LD `NewsArticle` on news detail.
- `sitemap.ts` (static routes + news + galleries + results), `robots.ts` (disallow `/admin`,
  `/prihlaseni`).
- Keep the legacy description/keywords copy (`_document.tsx`) as the default metadata.

## Data-fetching rules (React 19 standards)
- No `useEffect` + fetch anywhere. Admin edit pages load data in the RSC and pass it to the client
  form as props (legacy fetched in `useEffect` after a client-side guard).
- Derive state during render. No prop mirroring. Controlled inputs through RHF.
