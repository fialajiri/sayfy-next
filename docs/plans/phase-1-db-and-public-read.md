# Phase 1 — DB layer + public read path, in the new design (tracer bullet)

**Goal:** every public page renders **real data from the test DB copy**, read-only, **already in the
final design**. This proves DB connectivity, collection-name pinning, legacy data quirks and image
hosts before any writes.

**Estimate:** ~3–4 days · **Source of truth:** `docs/01`, `docs/03`, `docs/04`, `docs/05`, `docs/06`.
Legacy schemas: `../sayfy-backend-ts/src/models/**`. Legacy pages/copy: `../sayfy-frontend-ts/src/**`.

**Exit criteria:**
- [ ] Home, Sayfy, Aktuality (list + detail), Propozice, Výsledky (list + detail), Fotogalerie
      (list + detail with lightbox), Kontakt and Podpora render, matching the `06` page designs, at
      phone/tablet/desktop widths.
- [ ] Legacy S3/CloudFront image URLs render via `next/image`. **Every existing slug resolves**
      (spot-check the 5 oldest news items, which have the dirtiest slugs).
- [ ] Domain helpers unit-tested; repositories integration-tested; all checks green.

## ⚠️ Key gotchas
1. **Never point local dev at production.** Do §0a first. Zive ran Phase 1 against prod by
   accident and had to switch later.
2. **Collection names:** confirm `aktualitas` (not `aktuality`/`aktualita`) in Atlas before pinning.
   A wrong name silently returns an empty list.
3. **Slugs are dirty.** Route params arrive URL-encoded. `decodeURIComponent` them, then query the
   exact stored value. Don't "normalise" before looking up.
4. **No `toJSON` transforms.** Map to DTOs in the repository (`id`, ISO strings) so RSC → client
   props serialise.
5. **No visitor-facing copy literals in JSX.** Pages render `pagecontent` (defaults = legacy copy),
   so Phase 5 only adds admin forms (`08` §B4).
6. **Results come from a new collection,** so seed it into the **test** DB in this phase. Don't
   write to prod until cutover (additive or not).
7. **Countdown hydration:** server renders days only; the ticking clock is client-only. Never render
   `Date.now()`-derived seconds on the server.

## 0. Prerequisites
- [ ] Copy zive `scripts/check-db-connection.ts` → `npm run db:check` lists collections + counts.
- [ ] Record the real names/counts here: `users` (?), `aktualitas` (?), `galleries` (?),
      `staticpages` (?), `logs` (?).
- [ ] Confirm the propozice doc `_id 635c21aea369bc4f74025d04` exists.

## 0a. Clone prod → test DB
- [ ] Copy zive `scripts/clone-prod-to-test.ts`. Adapt: target `sayfy-next-test`,
      `--nsExclude '*.logs'`, sanitiser = optional known admin password (`TEST_ADMIN_PASSWORD`).
- [ ] Run it and record counts. `.env.local` `MONGODB_URI` → test DB.

## 1. Infrastructure: DB
- [ ] `server/infrastructure/db/connection.ts` (copy zive).
- [ ] Models (`05`): `user`, `aktualita`, `gallery`, `static-page`, `result`, `settings`, `partner`,
      collection names pinned.
- [ ] Repositories (read side): `NewsRepository.list({page, pageSize})` (sorted `createdAt desc`,
      projection without `text`), `findBySlug`, `findAdjacent(createdAt)` (prev/next);
      `GalleryRepository.listSummaries()` (title, slug, cover = `images[0]`, count via
      `$size`), `findBySlug`; `StaticPageRepository.findBySlugOrId('propozice', legacyId)` (until
      the slug is seeded); `ResultRepository.list()`, `findByYear`; `SettingsRepository.get()`
      (with defaults if missing); `PartnerRepository.list()`;
      `PageContentRepository.get(key)` (merges the stored doc over `DEFAULT_*`, fails safe to the defaults).
- [ ] `domain/page-content/*.ts`: DTO types + `DEFAULT_SITE/HOME/SAYFY/KONTAKT/PODPORA` holding the
      **legacy copy verbatim** (from `homepage.tsx`, `info-section.tsx`, `sayfy-page.tsx`, `images.json`,
      `Kontakt.tsx`, `support-page.tsx`, `navigation-links.tsx`, `_document.tsx`), see `08` §B1–B2.

## 2. Domain (pure, tested)
- [ ] `domain/result.ts` (copy zive), `domain/errors.ts`.
- [ ] `domain/race-status.ts`: `raceStatus(now, raceDate, tz='Europe/Prague')` →
      `{ kind:'upcoming', days, … } | { kind:'raceDay' } | { kind:'finished', year }`.
- [ ] `domain/slug.ts`: `slugify`, `uniqueSlug` (used in Phase 3, built + tested now).
- [ ] `domain/storage-key.ts`: `storageKeyFromUrl`, `allowedImageHosts` (from env).
- [ ] `domain/excerpt.ts`: strip tags → collapse whitespace → cut at a word boundary ≤160 chars.
- [ ] `lib/dates.ts`: Czech formats + `pluralizeDays` (den/dny/dní).

## 3. Application (read use cases)
- [ ] `news.ts` (`listNews`, `getNewsBySlug`), `galleries.ts`, `static-pages.ts`, `results.ts`,
      `settings.ts`, `partners.ts`. Thin pass-throughs are fine. `container.ts` wires them.

## 4. Seeds (test DB only)
- [ ] `scripts/seed-results.ts`: reads `../sayfy-frontend-ts/public/data/vysledky.json` → upsert by
      year. Idempotent.
- [ ] `scripts/seed-settings.ts`: upsert `{_id:'site'}` with `raceDate 2027-09-28T10:00 Europe/Prague`
      (confirm the time), `edition 17`, `registrationUrl https://sportt.cz/register/1544`,
      `registrationOpen false`.
- [ ] `scripts/seed-static-page-slug.ts`: `$set {slug:'propozice'}` on the legacy id.
- [ ] All seeds refuse to run when the DB name lacks `test` unless `--prod --yes` (used at cutover).

## 5. Components (`components/site/`), built to `06`
- [ ] `site-header` (final), `site-footer` (final), `page-header`, `course-profile` (static SVG for now).
- [ ] `hero-video` (poster, reduced-motion pause, control), `race-countdown`, `registration-cta`.
- [ ] `news-card` (container-query layouts: rail / grid / featured), `news-rail` (scroll-snap).
- [ ] `bib-card`, `gallery-tile`, `gallery-grid`, `gallery-lightbox` (copy zive's lightbox wrapper).
- [ ] `rich-text` (copy zive's sanitize + render; extend the allow-list per `03` §6; tables in scroll
      wrappers), `toc` (extract h2/h3 server-side, inject ids).
- [ ] `partner-wall` (static legacy PNGs for now, with temporary names).

## 6. Pages
- [ ] `(site)/page.tsx`: hero, facts strip, news rail (5 latest), memorial band, results (3
      latest), gallery teaser (latest gallery, 5 photos), partners strip, finish CTA. `revalidate = 300`.
- [ ] `sayfy/page.tsx`: memorial page rendered from `pagecontent: sayfy` (defaults = legacy copy: 4 chapters + quote + photos) and the photo
      strip → lightbox.
- [ ] `aktuality/page.tsx` (featured + grid + `?strana=`), `aktuality/[slug]/page.tsx`
      (`generateStaticParams` for the latest 20, `dynamicParams` true, `notFound()`, prev/next,
      share).
- [ ] `propozice/page.tsx` (TOC + quick-facts card from settings).
- [ ] `vysledky/page.tsx`, `vysledky/[rok]/page.tsx` (lazy iframe + external link + gallery link).
- [ ] `fotogalerie/page.tsx`, `fotogalerie/[slug]/page.tsx` (`?foto=` deep link).
- [ ] `kontakt/page.tsx` (legacy contact data, copy buttons), `podpora/page.tsx`.
- [ ] `loading.tsx` skeletons for list/detail routes, `not-found.tsx` ("Tady trať nevede.").
- [ ] Basic `generateMetadata` per page (full SEO pass is Phase 6).

## Tests
- [ ] Domain: `raceStatus` (35 days before, the day before at 23:59 Prague, race day 00:00, the day
      after, DST change in late October), `slugify` (`"Závod zná svého vítěze!"` →
      `zavod-zna-sveho-viteze`), `uniqueSlug`, `storageKeyFromUrl` (S3 host, CloudFront host, foreign
      host → null, `%20` decoding), `excerpt`, `pluralizeDays`.
- [ ] `PageContentRepository`: missing doc → defaults; partial doc → merged; invalid stored shape →
      defaults + logged warning.
- [ ] Repositories on `mongodb-memory-server`: sort order, pagination, slug lookup with a dirty slug,
      gallery summary count, settings defaults when missing.
- [ ] Components: countdown renders all three states; news rail buttons scroll; lightbox opens at
      index and closes on Esc.
- [ ] A render smoke test of each list page with a mocked use case.

## Out of scope
Auth, any writes, partner DB data (Phase 5), motion polish + OG images (Phase 6).
