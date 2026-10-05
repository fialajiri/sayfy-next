# Phase 5 — Settings, results, partners, page content

**Goal:** the yearly site maintenance that used to need a code change + deploy (git history:
"vysledky 2025", "add 2026 vysledky link", "update register button", "register button removed",
"added logos") becomes **admin UI work**.

**Estimate:** ~3–4 days · **Source of truth:** `docs/03` §New content, `docs/05` §New collections,
`docs/06` §9 (home countdown states, Výsledky, Podpora). Reuse zive:
`components/admin/registration-toggle.tsx`, `server/actions/settings.ts` (shape).

**Exit criteria:**
- [ ] Changing race date/ročník in `/admin/nastaveni` updates the hero countdown, facts strip,
      propozice quick facts and JSON-LD immediately.
- [ ] Toggling registration (also on the dashboard) shows or hides the CTA everywhere.
- [ ] Adding "2027 · 17. ročník · URL" creates `/vysledky/2027` and a bib card on home/výsledky.
- [ ] Partners: the 9 legacy logos are migrated with real names; add/edit/reorder/delete works;
      `/podpora` and the home strip read from the DB.
- [ ] **Every visitor-facing text, image, link and contact** is editable in `/admin/obsah/*`
      (checklist `08` §B1 fully ticked); edits appear immediately; "Obnovit výchozí" restores the
      legacy copy.

## ⚠️ Key gotchas
1. **Dates/timezones:** store `raceDate` as a UTC `Date`; the admin enters a local date + time in
   `Europe/Prague`. Convert explicitly (date-fns + `Intl`) and never rely on the server's TZ
   (Vercel = UTC).
2. **Settings is a singleton** (`_id:'site'`): `findOneAndUpdate(..., {upsert:true})`; reads fall
   back to defaults so a missing doc never breaks the home page.
3. **Results URL in an iframe:** CSP `frame-src` only allows sportt.cz. If an admin enters another
   host, show a warning ("bude zobrazeno jen jako odkaz") and render link-only for that year.
4. **Partner logos are PNG with transparency.** Skip JPEG compression for them (resize only, keep
   PNG/WebP).
5. **Reorder** uses an `order` integer per partner; write all orders in one `bulkWrite`.

## 1. Settings
- [ ] `schemas/settings.ts` (date, time, edition ≥1, `registrationUrl` https, `registrationOpen`).
- [ ] `application/settings.ts` `updateSettings`, `setRegistrationOpen`. Actions revalidate `/`,
      `/propozice`, `/vysledky`.
- [ ] `admin/nastaveni/page.tsx`: date picker (shadcn calendar + popover) + time input, edition,
      URL, switch, with a preview of the countdown state.
- [ ] Dashboard race-status card: inline switch (`useOptimistic`), "Upravit nastavení".

## 2. Results
- [ ] `schemas/result.ts` (year 2009–2100 unique, edition, url https, note ≤200).
- [ ] `application/results.ts` CRUD; actions revalidate `/`, `/vysledky`, `/vysledky/<year>`.
- [ ] `admin/vysledky/page.tsx`: table + inline add/edit dialog, delete confirm.

## 3. Partners
- [ ] `schemas/partner.ts` (name 1–100, logo URL (`partners/` prefix), url optional https, order).
- [ ] `application/partners.ts` CRUD + `reorder(ids[])` + S3 logo cleanup on replace/delete.
- [ ] `admin/partneri/page.tsx`: logo cards with ◀ ▶, edit dialog with `image-upload`, delete
      confirm.
- [ ] `scripts/seed-partners.ts`: uploads the 9 `*-transparent.png` files to `partners/` and inserts
      docs. **Names/URLs come from a JSON mapping the organisers fill in** (`scripts/data/partners.json`).
- [ ] Switch `/podpora` + the home partners strip to the repository.

## 4. Page content CMS (spec: `08` Part B)
- [ ] `schemas/page-content/{site,home,sayfy,kontakt,podpora}.ts` (Zod, mirrors the DTOs; rich fields
      as HTML strings ≤50 kB; repeatable lists bounded).
- [ ] `application/page-content.ts`: `updatePageContent(key, input)`: sanitize rich fields, validate
      image/video URLs (host + `stranky/` / `media/` prefix, or an allowed `/public` default path),
      upsert, diff + delete replaced S3 objects.
- [ ] `server/actions/page-content.ts`: guard → Zod → use case → revalidate (`home` → `/`,
      `sayfy` → `/sayfy` + `/`, `kontakt` → `/kontakt`, `podpora` → `/podpora` + `/`,
      `site` → `revalidatePath('/', 'layout')`).
- [ ] Shared admin components: `image-field` (from zive `homepage-image-field`), `video-field`
      (mp4/webm + poster, size warning), `repeatable-list` (add/remove/◀▶), `reset-to-default` button,
      sticky save bar + unsaved guard.
- [ ] Forms: `/admin/obsah/uvod` (+ live preview, from zive `homepage-preview`), `/sayfy`
      (chapters with the full editor, photo strip via bulk upload + reorder), `/kontakt`
      (contacts list), `/podpora`, `/web` (socials, SEO defaults, OG image, footer tagline).
- [ ] Hero `kicker` supports `{edition}` / `{year}` tokens filled from settings (documented in the field help).

## Tests
- [ ] Settings: TZ conversion (Prague local 10:00 on 28. 9. → 08:00Z; a date in winter → 09:00Z),
      defaults when missing.
- [ ] Results: unique year → conflict; non-sportt URL → `embeddable:false` in the DTO.
- [ ] Partners: reorder writes all orders; replace logo deletes the old key; delete cleans up.
- [ ] Page content: each schema rejects out-of-bounds lists and foreign image hosts; replace image →
      old S3 key deleted, `/public` default never deleted; `site` save revalidates the layout; kicker
      token rendering.
- [ ] Guard coverage test picks up the new actions automatically (Phase 2 table test).
