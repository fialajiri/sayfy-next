# 06 — Redesign & design system

The legacy site (2022) is a light mint background (`#e8f2ee`), green/purple uppercase Oswald headings
and a lot of centred blocks. It works, but it looks dated, the hierarchy is weak, and nothing says
"bike race". The redesign should feel **modern, fast and a bit cool**, the way a well-run amateur
race looks today, and it still has to honour that this is a **memorial**.

> **The race is a mountain-bike (MTB) race,** per the live propozice: ~13–14 km laps on mixed
> terrain around Hrob and lake Barbora (paved + unpaved, gravel), start/finish at the Hrob football
> pitch, Hobby and age categories. The visual language leans **trail/MTB** (gravel textures, a
> topographic contour pattern, a course map), not road racing.
>
> **All copy and imagery shown in the wireframes below is admin-editable** (`08` Part B). The design
> must tolerate longer or shorter texts (no fixed-height text boxes, `text-wrap: balance` on
> display type, and images cropped with `object-cover` + focal centre).

## 1. Concept — "Aspoň jsem to zkusil"

Sayfy's motto ("At least I tried", quoted on the legacy Sayfy page) is the emotional anchor. Two
registers, used deliberately:

| Register | Where | Feel |
|---|---|---|
| **Race day** | Home, Propozice, Výsledky, Fotogalerie, Aktuality | Energy: dark asphalt, signal colour, big condensed italic type, race-bib numbers, motion that suggests speed |
| **Memorial** | Sayfy page, the "Sayfy" band on home | Calm: lots of whitespace, warm paper tone, no signal colour, slow fades, photos given room |

Design principles:
1. **Content first, chrome second.** Photos and video from the race carry the page. The UI frames them.
2. **One loud thing per screen.** Signal colour (lime) only on the single primary action/number.
3. **Race vocabulary, not clip-art.** Bib numbers, the course profile line, the finish-line checker,
   and timing-style numerals. No cartoon bikes or stock icons of cyclists.
4. **Fast and accessible is part of the look.** No heavy animation runtime, everything respects
   reduced motion, AA contrast everywhere.

## 2. Colour

The legacy palette is the starting point: `$color-primary #1b7a57`, `$color-sayfy-logo #00974d`,
`$color-secondary(-light1) #7a5b0f/#c79722`, `$color-tertiary #5f236e`. The new palette keeps the
**Sayfy green** as the brand, adds a dark **asphalt** neutral family and a high-vis **signal** accent,
keeps **gold** for results only, and retires the purple (it clashed with the green and doesn't
appear in the logo).

### Core tokens (define in `globals.css` `@theme`, as OKLCH in code; hex given here for reference)

| Token | Hex | Role |
|---|---|---|
| `--color-asphalt-950` | `#0b0f0d` | Hero/footer background, dark-mode page bg |
| `--color-asphalt-900` | `#121815` | Dark surfaces (cards on dark) |
| `--color-asphalt-700` | `#2a332e` | Dark borders, muted dark text bg |
| `--color-asphalt-400` | `#7d8a83` | Muted text on dark |
| `--color-paper` | `#f6f5f0` | Light page background (warm off-white, replaces the mint) |
| `--color-paper-2` | `#ebe9e1` | Light alt sections, memorial band |
| `--color-ink` | `#141a17` | Body text on light |
| `--color-sayfy-500` | `#00974d` | Brand green, logo colour: fills, large display text, icons |
| `--color-sayfy-700` | `#1b7a57` | Green **text/link** colour on light (legacy primary) |
| `--color-sayfy-900` | `#0e3d2c` | Deep green panels |
| `--color-signal` | `#d4ff3a` | High-vis lime: primary CTA bg, countdown digits on dark, focus ring on dark |
| `--color-gold-400` | `#c79722` | Results/podium accents **on dark** |
| `--color-gold-700` | `#7a5b0f` | Gold text on light |
| `--color-danger` | `#c2410c` | Destructive (admin) |

shadcn semantic tokens (`--background`, `--foreground`, `--primary`, `--muted`, `--ring`…) map onto
these for light and dark, so generated components pick up the brand automatically.

### Contrast pairs (WCAG 2.2, computed)

| Foreground / background | Ratio | Use |
|---|---|---|
| `ink` on `paper` | ≈17:1 | body |
| `sayfy-700` on white/`paper` | ≈5.3:1 ✅ AA | links, small green text |
| `sayfy-500` on white | ≈3.8:1 ⚠️ large text only | display headings ≥24 px, icons, fills |
| `ink` on `sayfy-500` | ≈5.0:1 ✅ | text on green buttons/badges (**never white on `sayfy-500`**, which is 3.8:1) |
| `ink` on `signal` | ≈16:1 ✅ | primary CTA |
| `signal` on `asphalt-950` | ≈16:1 ✅ | countdown digits, focus ring on dark |
| `gold-400` on `asphalt-950` | ≈7:1 ✅ | results numbers on dark |
| `gold-700` on `paper` | ≈6:1 ✅ | gold text on light |
| `gold-400` on white | ≈2.7:1 ❌ | don't |

**Verified in Phase 0** (script, WCAG formula), with corrections to the estimates above: `ink`/`paper`
16.2, `sayfy-700`/`paper` **4.85** (5.29 on white), `ink`/`sayfy-500` **4.65**, `ink`/`signal` 15.3,
`signal`/`asphalt-950` 16.7, `gold-400`/`asphalt-950` 7.2, `gold-700`/`paper` 5.8, `sayfy-500`/
`asphalt-950` **5.1**. Added `sayfy-300` (#5fd39a, **10.4** on asphalt) as the green **text** colour in
dark mode, and `ink-muted` (#4b5650, 7.0 on paper) for secondary text. Tokens live in
`src/app/globals.css`.

### Dark mode
Support both themes (`next-themes`, system default + toggle in the footer). Dark mode = `asphalt-950`
background, `paper` text, and `sayfy-500` becomes usable for text (≈6:1 on asphalt). The **hero and
footer are dark in both themes**, so the light theme reads as "light content between dark race
bookends".

## 3. Typography

| Role | Face | Notes |
|---|---|---|
| Display (h1/h2, hero, numbers) | **Barlow Condensed** 700/800, often *italic* | The modern descendant of the legacy Oswald feel: condensed, sporty, used on jerseys and race posters. Italic = speed |
| Text & UI | **Geist** 400/500/600 | Same as zive/shadcn default. Very legible, neutral |
| Numerals (countdown, results, dates in cards) | **Geist Mono** with `tabular-nums` | Timing-screen feel, no jitter while ticking |

- Load with `next/font/google`, **`subsets: ['latin', 'latin-ext']`**. Czech needs ě š č ř ž ý á í é
  ů ú. Verify every face renders "Příliš žluťoučký kůň úpěl ďábelské ódy" in Phase 0.
- Fluid type scale with `clamp()`: hero `clamp(3.5rem, 11vw, 9rem)`, h1 `clamp(2.5rem, 6vw, 4.5rem)`,
  h2 `clamp(1.875rem, 4vw, 3rem)`, body `1.0625rem/1.65`.
- Display text is uppercase with `letter-spacing: -0.01em`. Body text is **never** uppercase (the
  legacy uppercase everywhere hurt readability).
- Long-form (news, propozice, Sayfy) measure `max-width: 68ch`.

## 4. Space, shape, elevation
- 4 px base grid; section padding `clamp(4rem, 10vw, 8rem)` block.
- Radius: cards `1rem`, buttons/inputs `0.75rem`, pills `9999px`, images `0.75rem`. Legacy `2rem`
  everywhere felt bubbly.
- Elevation: mostly **borders + tonal surfaces**, not shadows. One soft shadow token for floating
  things (header when solid, lightbox controls, admin shortcut).
- Layout width: content `72rem`, wide `90rem`, full-bleed for hero/video/gallery.

## 5. Signature motifs

1. **Course profile line + topo contours.** A single SVG polyline shaped like the lap's elevation
   profile (stylised; use the real course if a GPX/mapy.cz export is available, see open questions),
   plus a subtle **topographic contour pattern** (SVG, 4–6 % opacity) on dark sections. It nods to
   the course map that propozice already uses. It appears under the hero, as
   section dividers and in the footer. In `@supports (animation-timeline: view())` it "draws" in as it
   enters the viewport (`stroke-dashoffset`), otherwise it's static. `aria-hidden`.
2. **Race bib.** Results and the countdown use a bib: off-white card, big Barlow Condensed number,
   four small "safety-pin" dots in the corners, a thin sponsor-strip top bar in `sayfy-500`. Results
   cards = ročník number on the bib, year underneath.
3. **Finish-line checker.** An 8-px checker band (CSS `conic-gradient`, no image) marks finish
   moments: above the footer CTA "Uvidíme se na startu", and on the results page header. Used
   sparingly.
4. **Speed italics.** Display headings can be italic, and a section kicker uses a short slanted
   signal bar (`skew-x-[-12deg]`) before the label, e.g. `▰ AKTUALITY`.
5. **Photo treatment.** Race photos full colour. On the memorial page, historic photos sit on
   `paper-2` with generous margins and a thin caption line. No filters or overlays on his photos.

## 6. Motion
- Native CSS only: transitions, `@starting-style` for enter animations, scroll-driven animations in
  `@supports`, and View Transitions for route changes where supported (progressive enhancement).
- Durations 150–250 ms for UI, 600–900 ms for decorative reveals. Easing `cubic-bezier(.2,.8,.2,1)`.
- **`prefers-reduced-motion: reduce`** → no autoplay video (poster frame plus a play button), no
  scroll-driven drawing, no countdown "flip" animation (numbers still update), and instant view
  transitions.
- The memorial page uses only slow opacity fades.

## 7. Imagery & assets
- **Hero video:** the existing `video.mp4`/`video.webm` (8–9 MB). Re-encode to ~2–3 MB at 1080p,
  ~8–12 s loop, with an extracted `poster.avif`. Ideally swap in footage from the 2025/2026 race
  (ask the organisers). Serve from `public/` (or CloudFront if size grows).
- **Landing photos:** pick 6–10 of the best shots from the latest galleries in S3 (the 2026 gallery
  if uploaded) for the home "Fotogalerie" teaser. These stay dynamic (from the DB), not copied.
- **Sayfy photos:** `public/images/sayfy/*` (0.3–0.9 MB JPEGs). Re-export to AVIF/WebP at 2× display
  size and keep them static.
- **Logos:** `sayfy-logo-png.webp`, `sayfy_02222.webp` (portrait used in the old hero),
  `HROB-znak-BARVA.webp` (town crest), and the town of Teplice mark (PDF in `logos/support`). Ask
  whether a **vector (SVG) Sayfy logo** exists. If not, get the webp traced into an SVG so it works
  on dark and light.
- **OG image:** a new 1200×630 branded template (asphalt bg, logo, display title, course line),
  generated with `next/og`.

## 8. Iconography
`lucide-react` throughout (stroke 1.75). Socials: Facebook `facebook.com/sayfyhomemorial`, Instagram
`instagram.com/sayfyhomemorial`. Memorial dates keep the legacy **✱ (born) / ✝ (died)** symbols
(`public/icons/asterisk.svg`, `cross.svg`), redrawn to match the lucide stroke weight.

## 9. Page designs

### Home `/`
```
┌──────────────────────────────────────────────────────────────┐
│ [logo]   Sayfy Aktuality Propozice Výsledky Foto Kontakt  f ◎ │  ← transparent over video, solid on scroll
│                                                               │
│   ▰ 17. ROČNÍK · KRÁLOVSKÉ MĚSTO HROB                         │
│   SAYFYHO                                                     │  ← Barlow Condensed 800 italic, huge
│   MEMORIAL                                                    │
│   Cyklistický závod na památku Davida „Sayfyho“ Seifrta       │
│                                                               │
│   ┌──┐┌──┐ ┌──┐┌──┐ ┌──┐┌──┐ ┌──┐┌──┐                         │  ← bib-style countdown (signal digits)
│   │3 ││5 │ │0 ││4 │ │1 ││2 │ │0 ││9 │   DNÍ HOD MIN SEK      │
│   └──┘└──┘ └──┘└──┘ └──┘└──┘ └──┘└──┘                         │
│   [ Registrace ↗ ] (signal)   [ Propozice → ] (outline)       │  ← registration hidden/"brzy" when closed
│   ▶︎/❚❚ (video control)                                        │
│ ~~~~~~~~~~~~~~~~~~ course profile line ~~~~~~~~~~~~~~~~~~~~~~~ │
├──────────────────────────────────────────────────────────────┤
│  28. 9.            Hrob              16 ročníků               │  ← facts strip (from settings + results)
│  každý rok         jezero Barbora    od roku 20xx             │
├──────────────────────────────────────────────────────────────┤
│ ▰ AKTUALITY                                    Všechny →      │
│ [card][card][card][card] → scroll-snap rail, ◀ ▶ buttons      │
├──────────────────────────────────────────────────────────────┤
│ (memorial band, paper-2)                                      │
│  [portrait]   „ASPOŇ JSEM TO ZKUSIL“                          │
│               ✱ 8. 2. 1991  ✝ 28. 9. 2008                     │
│               Kdo byl Sayfy →                                 │
├──────────────────────────────────────────────────────────────┤
│ ▰ VÝSLEDKY   [bib 16 · 2026] [bib 15 · 2025] [bib 14 · 2024] │  ← gold accents, dark section
├──────────────────────────────────────────────────────────────┤
│ ▰ FOTOGALERIE  mosaic of 5 photos from latest gallery → 2026  │
├──────────────────────────────────────────────────────────────┤
│ Podporují nás: logo strip (grayscale → colour on hover/focus) │
├▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ checker band ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚┤
│ UVIDÍME SE NA STARTU   [Registrace ↗]   footer…               │
└──────────────────────────────────────────────────────────────┘
```
Countdown states via `raceStatus()`: **upcoming** (countdown), **race day** ("DNES ZÁVODÍME" + start
time), **finished** (until the admin updates settings: "Díky, že jste jeli! → Výsledky 2026").

### Sayfy `/sayfy` (memorial register)
Paper background. A large portrait (`sayfy-profile.png`, re-cut) beside the name *David „Sayfy“
Seifrt* and the ✱/✝ dates. Below it, **four chapters** from the legacy copy as an editorial timeline
(alternating text/photo on desktop, stacked on mobile): *Hokej → cyklistika*, *Top Ten Teplice →
Louny → Dukla Praha*, *„Aspoň jsem to zkusil“* (as a big pull quote), *28. 9. 2008 a Memorial*.
Then a scroll-snap photo strip (the 9 images from `images.json`) opening the lightbox. No signal
colour and no countdown on this page. It closes with a quiet link: "Přijeďte uctít jeho památku → Propozice".

### Aktuality `/aktuality`, `/aktuality/[slug]`
- List: the latest article as a **featured card** (big image, title, date, excerpt), then a 3-col grid
  (2 on tablet, 1 on phone). Date in Geist Mono. Pagination at the bottom.
- Detail: full-width image with the title overlaid on a gradient (or title above on mobile), date,
  rich text at 68ch, then "Fotogalerie" grid → lightbox, share button (Web Share/copy link), and
  previous/next article links.

### Propozice `/propozice`
Two columns on desktop: rich text (with an auto-generated **"Na této stránce"** TOC from h2/h3) and a
**sticky quick-facts card**: date + start time, place, ročník, registration CTA, link to last year's
results. On mobile the card comes first, collapsed. Tables in the content get horizontal scroll
wrappers and zebra rows.

### Výsledky `/vysledky`, `/vysledky/[rok]`
Dark section with a checker band header. A grid of **bib cards** (ročník big, year small, "Výsledky →"),
newest first. Detail: header with ročník + year, lazy-loaded iframe in a rounded frame (`min-height:
80vh`), a prominent "Otevřít na sportt.cz ↗" button (also the fallback if the iframe is blocked), and
links to that year's gallery if one exists (match by year).

### Fotogalerie `/fotogalerie`, `/fotogalerie/[slug]`
Index: year tiles. The cover photo fills the tile, the year sits in big display type bottom-left, the
photo count is a pill, and on hover/focus the image scales 1.03. Detail: header with year + count,
uniform grid (2/3/4/5 cols) → lightbox with thumbnails, zoom, swipe and a counter. The `Esc`/back
button closes it.

### Kontakt `/kontakt`
Split layout: left a big display "MÁTE CHUŤ SE ZAPOJIT?" + "Neváhejte se ozvat!" (legacy copy), right a
contact card with lucide icons: Nikola Fialová Seifrtová, `+420 607 720 869` (`tel:`),
`seifrtovanikola@gmail.com` (`mailto:`), město Hrob (link to mapy.cz), Facebook + Instagram. Every
value has a copy button (Clipboard API, with feature detection).

### Podpora `/podpora`
"Podporují nás" + a short thank-you line. A logo wall on `paper` in a responsive grid with equal
optical boxes (logos `object-contain` with padding), linked to the partner site if a URL is set, and
the real partner name as `alt`/accessible name. Town crests (Hrob, Teplice) get their own "Záštita"
row if the organisers want that distinction.

### Přihlášení `/prihlaseni`
A centred card on asphalt with the course line in the background. Email + password, `autocomplete`
attributes, inline errors, a rate-limit message ("Příliš mnoho pokusů, zkuste to za X min").

### 404 / error
On brand: "Tady trať nevede." with links home and to aktuality. The error page offers "Zkusit znovu".

## 10. Admin design
- Clean shadcn `base-nova` look on the brand tokens, light by default. **Sidebar** shell (Sheet on
  mobile) with: Přehled · *Obsah:* Aktuality, Fotogalerie, Propozice, Výsledky, Partneři ·
  *Stránky:* Úvod, Sayfy, Kontakt, Podpora, Celý web (socials, SEO) · Nastavení závodu · Účet ·
  "Zobrazit web ↗" · Odhlásit.
- **Editor** (`08` Part A): sticky grouped toolbar, bubble menus on images/links/tables, a
  "Náhled" toggle that renders through the public `rich-text` styles, and a word count in the footer.
  The editing surface uses the **public typography** (Geist body, Barlow Condensed headings), so
  what you see while editing is what visitors get.
- **Přehled (dashboard):** a race-status card (countdown + registration on/off switch inline), counts,
  "Poslední aktuality", and quick actions (Nová aktualita, Nová galerie, Přidat výsledky).
- Tables with search + sort for news. Forms in a single column, sticky save bar at the bottom on long
  forms (news, propozice), and an unsaved-changes guard.
- Destructive actions always go through `AlertDialog`, with the item name in the confirmation copy.
- Uploads: dropzone with thumbnails, per-file progress bars, error chips with "Zkusit znovu".

## 11. Accessibility checklist (design-level)
- One `<main>`, landmarks, logical heading order (one h1 per page, the hero title is the h1 on home).
- Visible `focus-visible` ring: 2 px `sayfy-700` on light, `signal` on dark, 2 px offset.
- Hit targets ≥44 px. The rail and lightbox are fully keyboard operable.
- Video: muted, with a visible pause control, and no autoplay with reduced motion.
- The countdown is **not** a live region (it would spam screen readers). It exposes a static text
  alternative: "Do závodu zbývá 35 dní".
- External links get an icon + visually-hidden "(otevře se v novém okně)" when `target=_blank`.
- `lang="cs"`, Czech date formats (`d. M. yyyy`), Czech plural rules for "den/dny/dní".

## 12. Deliverables of the design work
- `globals.css` tokens (light + dark), font setup, shadcn theme mapping (Phase 0).
- A `/admin/styleguide` route (dev only) rendering every token and component state, used for
  visual QA instead of Storybook.
- Re-encoded video + poster, optimised Sayfy photos, SVG logo, course-profile SVG, OG template.
