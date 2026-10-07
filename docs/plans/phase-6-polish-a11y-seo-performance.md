# Phase 6 — Polish, motion, accessibility, SEO, performance

**Goal:** turn the functionally complete, already-designed app into a production-quality experience:
the motion layer, optimised media, every loading/empty/error state, a real accessibility audit,
complete SEO, enforced CSP, and measured performance.

**Estimate:** ~2–3 days · **Source of truth:** `docs/06` (§5 motifs, §6 motion, §7 assets, §11 a11y),
`docs/04` §SEO. Reference: zive `docs/plans/phase-6-design-a11y-seo.md` (CSP gotchas, OG images,
sitemap tests).

**Exit criteria:**
- [ ] Lighthouse mobile ≥95 in all four categories on `/`, `/aktuality/<slug>`, `/fotogalerie/<slug>`;
      LCP < 2.5 s on 4G throttling for `/` (the hero poster is the LCP element, not the video).
- [ ] axe: 0 serious/critical violations on every public page + login; full keyboard walkthrough of
      nav, rail, lightbox, editor toolbar, gallery manager; VoiceOver pass on home + gallery.
- [ ] `prefers-reduced-motion` verified: no autoplay, no scroll-driven animation.
- [ ] CSP enforced in production with **no violations** during normal use (incl. sportt iframe,
      YouTube embed, uploads, lightbox).
- [ ] Sitemap/robots/OG/JSON-LD validated (Rich Results Test for `SportsEvent` + `NewsArticle`).
- [ ] Playwright smoke suite green against a preview deployment.

## ⚠️ Key gotchas
1. **Presentation only.** No new data model. If a page needs a new query shape, add it as a
   repository method, keeping RSC → use case → repo.
2. **Video is the biggest perf risk.** Poster as the `next/image` `priority` LCP, `preload="none"`
   on small screens / `saveData`, start playback only after `load` via the hero client component.
3. **Scroll-driven animations** must sit inside `@supports (animation-timeline: view())` **and**
   `@media (prefers-reduced-motion: no-preference)`.
4. **View Transitions in Next 16:** check whether `experimental.viewTransition` / React
   `<ViewTransition>` is still experimental in the installed versions. If it's unstable, ship without
   it (it's a nice-to-have).
5. **CSP + `next/og`:** OG routes run on the server; nothing to allow-list. But `next-themes` injects an
   inline script, so `'unsafe-inline'` (or nonce) is needed (zive gotcha).

## 1. Motion & media
- [ ] Course-profile scroll-draw, header solid-on-scroll, card hover/focus lifts, countdown digit
      flip (reduced-motion: plain update), `@starting-style` reveals.
- [x] Re-encode video — **done early (2026-10-07):** the legacy clip had a speed-ramped edit (two
      ~4–5× sections), so the sped-up parts were slowed ~4× and motion-interpolated to a steady 30 fps
      (`minterpolate` mci). That felt too slow (60 s), so the even-speed master was sped up uniformly 1.6×:
      37 s, 1280×720, no audio: `hero.mp4` 4.4 MB, `hero.webm` 3.1 MB, `hero-poster.jpg`.
      Play/pause control done in Phase 1. Optional: AVIF poster.
- [ ] Sayfy photos → AVIF/WebP via `next/image` (static imports for blur placeholders).
- [ ] SVG logo (light/dark variants), favicon set + `apple-icon`, `manifest.ts`.

## 2. States
- [ ] Skeletons that match the final layouts (no spinner overlays anywhere). ⚠️ **Never put a `loading.tsx`
      above a route that can `notFound()`** (`aktuality/[slug]`, `fotogalerie/[slug]`, `vysledky/[rok]`): the
      Suspense boundary starts streaming with HTTP 200, so missing pages return 200 instead of 404 (found in
      Phase 1). Use an in-page `<Suspense>` around slow parts instead.
- [ ] Empty states: no news ("Zatím žádné aktuality"), an empty gallery, no results, no partners.
- [ ] `error.tsx` per segment with retry; `not-found.tsx` designed; image `onError` placeholder.

## 3. Responsive pass
- [ ] 360 / 390 / 768 / 1024 / 1280 / 1440 widths; landscape phone for the lightbox; admin forms on
      tablet. Hero type never overflows (`clamp` + `text-wrap: balance`).

## 4. Accessibility
- [ ] Landmarks, one h1 per page, skip link "Přeskočit na obsah".
- [ ] Rail: `role="region"` + `aria-label`, buttons with labels, `tabindex=0` scroller.
- [ ] Countdown static text alternative; video control; external-link announcements.
- [ ] Forms: labels, `aria-describedby` errors, focus on first error, `autocomplete`.
- [ ] Colour-contrast re-check in both themes with the final tokens.

## 5. SEO
- [ ] `generateMetadata` everywhere (title, description from excerpt, canonical, OG/Twitter).
- [ ] `app/opengraph-image.tsx` (brand default) + `aktuality/[slug]/opengraph-image.tsx`.
- [ ] JSON-LD: `SportsEvent` (home, propozice), `NewsArticle` (detail), `Organization` (footer).
      Escape `<` in the JSON-LD string (no raw interpolation of DB text).
- [ ] `sitemap.ts` (static + news + galleries + results with `lastModified`), `robots.ts`.

## 6. Security headers
- [ ] Switch CSP to enforce in prod; walk every flow with DevTools open; add the needed sources only.
- [ ] Optional: nonce-based CSP via `proxy.ts` if feasible on Next 16 without losing static
      rendering (likely not, since it forces dynamic rendering, so stay with the zive approach).

## 7. Analytics (if chosen)
- [ ] `@vercel/analytics` in the root layout, with CSP updated accordingly.

## 8. E2E
- [ ] Playwright: public smoke (all routes 200, no console errors), login + logout, create + delete
      news with an image, upload 3 photos to a gallery, toggle registration.
