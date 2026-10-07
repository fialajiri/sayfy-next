# Phase 5 — Settings, results, partners, page content

**Status: ✅ Done (2026-10-07).** Checks green: `typecheck`, `lint`, **146 tests**, `build`; contrast audit
(`scripts/e2e/contrast-audit.playwright.js`, now incl. all Phase 5 admin routes) passes on 24 routes × dark/light.
Verified end to end on `next start` (test DB + bucket `dev/` prefix): ročník override 99 → home hero +
propozice, then cleared; dashboard switch shows/hides the registration CTA; result 2027 added (form
pre-fills latest+1) and deleted; 9 legacy partners imported with real names, reorder persisted, `http://`
partner URL rejected, `https://` saved and linked on `/podpora`; every `/admin/obsah/*` form loads
(unknown slug → 404), edits appear on the public page, invalid input is marked, "Obnovit výchozí texty"
restores the legacy copy; Sayfy photo upload → shown on `/sayfy` → removed via restore → S3 object
deleted (200 → 403); kontakt add/remove contact (bad e-mail rejected, last contact can't be removed);
SEO keywords edit reflected in `<meta name="keywords">`, then reverted.

**Decisions / findings**
- **Partners seed = an admin button**, not a script: while the collection is empty, `/admin/partneri`
  offers "Načíst původní loga z webu", which creates the 9 records from `LEGACY_PARTNERS` (bundled
  `/partners/N-transparent.png`, names from `domain/partner.ts`). Works the same on test and prod and
  needs no S3 upload; bundled logos are never deleted. Partner URLs are still to be filled in by the
  organisers. Logos skip both the crop step and JPEG compression (PNG transparency).
- Page-content forms share one hook (`use-page-content-form.ts`): the page's Zod schema as resolver,
  server field errors mapped back by path, reset after save (leave guard), restore defaults = fill the
  form only (nothing is stored until Save; two-click confirmation in the save bar).
- A form-level `prepare` (e.g. drop blank keyword lines) runs **inside the resolver**, before
  validation — found in e2e: blank lines failed `min(1)` and the save never happened.
- **Toasts moved to top-right**: at bottom-right they covered the sticky save bar's Save button, so
  after an error toast it was unclickable until the toast faded (all admin forms).
- `useFieldArray` uses `keyName: "fieldKey"` for chapters/contacts — their own `id` would be shadowed.
- Deferred: live preview on `/admin/obsah/uvod` ("Zobrazit na webu" opens the page instead). The
  non-sportt results URL warning (`embeddable`) is shown in the admin table rather than in the dialog.

**Goal:** the yearly site maintenance that used to need a code change + deploy (git history:
"vysledky 2025", "add 2026 vysledky link", "update register button", "register button removed",
"added logos") becomes **admin UI work**.

**Estimate:** ~3–4 days · **Source of truth:** `docs/03` §New content, `docs/05` §New collections,
`docs/06` §9 (home countdown states, Výsledky, Podpora). Reuse zive:
`components/admin/registration-toggle.tsx`, `server/actions/settings.ts` (shape).

**Exit criteria:**
- [x] Changing the ročník override in `/admin/nastaveni` updates the hero, facts strip,
      propozice quick facts and JSON-LD immediately.
- [x] Toggling registration (also on the dashboard) shows or hides the CTA everywhere.
- [x] Adding "2027 · 17. ročník · URL" creates `/vysledky/2027` and a bib card on home/výsledky.
- [x] Partners: the 9 legacy logos are migrated with real names; add/edit/reorder/delete works;
      `/podpora` and the home strip read from the DB.
- [x] **Every visitor-facing text, image, link and contact** is editable in `/admin/obsah/*`
      (checklist `08` §B1 fully ticked); edits appear immediately; "Obnovit výchozí" restores the
      legacy copy.

## ⚠️ Key gotchas
1. **No race-date setting:** the race is always 28. 9. at 11:00 Prague, computed in
   `domain/race-status.ts` (DST-safe, tested). Don't add a date field.
2. **Settings is a singleton** (`_id:'site'`): `findOneAndUpdate(..., {upsert:true})`; reads fall
   back to defaults so a missing doc never breaks the home page.
3. **Results URL in an iframe:** CSP `frame-src` only allows sportt.cz. If an admin enters another
   host, show a warning ("bude zobrazeno jen jako odkaz") and render link-only for that year.
4. **Partner logos are PNG with transparency.** Skip JPEG compression for them (resize only, keep
   PNG/WebP).
5. **Reorder** uses an `order` integer per partner; write all orders in one `bulkWrite`.

## 1. Settings
- [x] `schemas/settings.ts` (date, time, edition ≥1, `registrationUrl` https, `registrationOpen`).
- [x] `application/settings.ts` `updateSettings`, `setRegistrationOpen`. Actions revalidate `/`,
      `/propozice`, `/vysledky`.
- [x] `admin/nastaveni/page.tsx`: registration URL + switch, ročník override (empty = derived),
      with a preview of the countdown state.
- [x] Dashboard race-status card: inline switch (`useOptimistic`), "Upravit nastavení".

## 2. Results
- [x] `schemas/result.ts` (year 2009–2100 unique, edition, url https, note ≤200).
- [x] `application/results.ts` CRUD; actions revalidate `/`, `/vysledky`, `/vysledky/<year>`.
- [x] `admin/vysledky/page.tsx`: table + inline add/edit dialog, delete confirm.

## 3. Partners
- [x] `schemas/partner.ts` (name 1–100, logo URL (`partners/` prefix), url optional https, order).
- [x] `application/partners.ts` CRUD + `reorder(ids[])` + S3 logo cleanup on replace/delete.
- [x] `admin/partneri/page.tsx`: logo cards with ◀ ▶, edit dialog with `image-upload`, delete
      confirm.
- [x] ~~`scripts/seed-partners.ts`~~ → admin import button (see Decisions): uploads the 9 `*-transparent.png` files to `partners/` and inserts
      docs. **Names/URLs come from a JSON mapping the organisers fill in** (`scripts/data/partners.json`).
      Names identified from the logos (2026-10-05): Olympia, Kolakola, Hrob (town crest), Mature, Bombus,
      Edgewell, Krušnohoří, Teplice, plus the **race's own wheel logo** (keep it, confirmed by the organisers).
      Partner websites (URLs) still to be supplied.
- [x] Switch `/podpora` + the home partners strip to the repository.

## 4. Page content CMS (spec: `08` Part B)
- [x] `schemas/page-content/{site,home,sayfy,kontakt,podpora}.ts` (Zod, mirrors the DTOs; rich fields
      as HTML strings ≤50 kB; repeatable lists bounded).
- [x] `application/page-content.ts`: `updatePageContent(key, input)`: sanitize rich fields, validate
      image/video URLs (host + `stranky/` / `media/` prefix, or an allowed `/public` default path),
      upsert, diff + delete replaced S3 objects.
- [x] `server/actions/page-content.ts`: guard → Zod → use case → revalidate (`home` → `/`,
      `sayfy` → `/sayfy` + `/`, `kontakt` → `/kontakt`, `podpora` → `/podpora` + `/`,
      `site` → `revalidatePath('/', 'layout')`).
- [x] Shared admin components: `image-field` (from zive `homepage-image-field`), `video-field`
      (mp4/webm + poster, size warning), `repeatable-list` (add/remove/◀▶), `reset-to-default` button,
      sticky save bar + unsaved guard.
- [x] Forms: `/admin/obsah/uvod` (live preview deferred — "Zobrazit na webu" instead), `/sayfy`
      (chapters with the full editor, photo strip via bulk upload + reorder), `/kontakt`
      (contacts list), `/podpora`, `/web` (socials, SEO defaults, OG image, footer tagline).
- [x] Hero `kicker` supports `{edition}` / `{year}` tokens filled from settings (documented in the field help).

## Tests
- [x] Settings: defaults when missing; edition override vs derived.
- [x] Results: unique year → conflict; non-sportt URL → `embeddable:false` in the DTO.
- [x] Partners: reorder writes all orders; replace logo deletes the old key; delete cleans up.
- [x] Page content: each schema rejects out-of-bounds lists and foreign image hosts; replace image →
      old S3 key deleted, `/public` default never deleted; `site` save revalidates the layout; kicker
      token rendering.
- [x] Guard coverage test picks up the new actions automatically (Phase 2 table test).
