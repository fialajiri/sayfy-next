# 08 — Content editing: rich-text editor + admin-editable site

Two requirements on top of the earlier docs:

1. **The editor must keep everything the legacy editor does** (images, changing images, styling,
   links, tables, YouTube, file attachments), and it should be better at it. Zive's
   `rich-text-editor.tsx` is StarterKit-only, so it's **not** enough here. Build a richer editor;
   zive's file is only a starting skeleton.
2. **Like zive, every piece of site content is admin-editable.** No visitor-facing text, image, link
   or contact detail should need a code change. Zive's pattern: a typed singleton document per page,
   with **defaults equal to today's copy**, so the feature ships with zero visible change.

---

## Part A — Rich-text editor

Used for: Aktuality `text`, Propozice `text`, Sayfy page chapters, and the long text blocks in page
content (Podpora intro, Kontakt intro). Short single-line fields (titles, labels) stay plain inputs.

### A1. Legacy feature inventory (must keep, all of it)

From `../sayfy-frontend-ts/src/components/tiptap/*` and the live propozice editor:

| Group | Legacy commands | Keep |
|---|---|---|
| Text | bold, italic, strikethrough, superscript, subscript, horizontal rule ("dělící čára"), hard break ("mezera") | ✅ all |
| Headings | H2, H3, H4 | ✅ (+ paragraph to switch back) |
| Paragraph | bullet list, ordered list, align left / center / right / justify | ✅ all |
| Media | insert file (image **or document**), YouTube video (by URL), link, unlink | ✅ all |
| Documents | `.pdf .txt .doc .docx .xls` inserted as a download **link** (`editor--file` anchor) | ✅, done properly (see A3) |
| Tables | insert 3×3 with header row, add column left/right, delete column, add row above/below, delete row, delete table | ✅ all (+ merge/split cells, toggle header row/column; the legacy repo had icons for these but never wired them) |
| History | undo, redo | ✅ |

Legacy problems we fix: `window.prompt()` for links and YouTube; images uploaded only at save time
(blob URLs, so a failed save lost them); a file inserted as an image and then swapped for a link via
`document.querySelector`; no alt text; no way to resize or align an image; swapped `helpText` labels
(bullet/ordered, row above/below); every button had `alt="editor button icon"`.

### A2. New feature set

**Must (parity + fixes):**
- Everything in A1.
- **Images:** insert from file picker, **drag & drop** and **paste** (FileHandler extension). Each one
  uploads immediately through the presign flow with an inline progress placeholder. Bubble menu on
  an image:
  - **Vyměnit obrázek** (replace): uploads a new file, keeps size/alignment/alt, and the old object
    is cleaned up on save.
  - **Alt text** (required before saving; the form blocks save with a clear message).
  - **Popisek** (optional caption → `<figure><img><figcaption>`).
  - **Velikost:** drag-resize handles (Tiptap 3 Image `resize` option) **plus** presets
    *malý 33 % / střední 50 % / velký 75 % / celá šířka*, stored as `width` (percent) so it scales
    responsively.
  - **Zarovnání:** left / center / right (the screenshot's centred course map is the common case).
    Left/right float with text wrap on ≥md; on mobile always full width.
  - **Odkaz z obrázku** (wrap the image in a link) and **Smazat**.
- **Links:** dialog (not `prompt`): URL, text, "otevřít v novém okně". Bubble menu on a link:
  *upravit / otevřít / odebrat*. Autolink on paste. Internal links (`/vysledky/2026`) allowed.
- **File attachments** (**confirmed: in every full-editor field**, incl. aktuality, not just
  propozice): PDF, DOC/DOCX, XLS/XLSX, TXT, ≤20 MB, uploaded to the `soubory/` prefix and
  inserted as an **attachment chip** (custom inline node): file-type icon + file name + size,
  rendered publicly as `<a href download>` with "PDF · 1,2 MB". Replace and rename from its bubble menu.
- **YouTube:** dialog with URL paste + live preview; accepts `youtu.be`, `watch?v=`, `shorts/`;
  stored as `youtube-nocookie.com/embed/<id>`, rendered as a responsive 16:9 frame.
- **Tables:** a toolbar group shown when the cursor is in a table (or a table bubble menu): all A1
  actions + merge/split cells + header row/column toggles + column resize. Public render: horizontal
  scroll wrapper, zebra rows, sticky first column on mobile.
- **Styling** beyond legacy (**confirmed by the client**), deliberately limited so the brand stays
  consistent:
  - underline, blockquote ("citace"), inline code off (not needed);
  - **text colour** from a **fixed brand palette only** (ink, sayfy-700, gold-700, danger), no
    free picker;
  - **highlight** (marker) in one brand tint;
  - "**Zvýrazněný blok**" (callout): a paragraph wrapper with a tinted background and an icon
    (info / warning). Useful for "Důležité" notes in propozice.
  - clear formatting.
- **Undo/redo**, keyboard shortcuts shown in tooltips (⌘B, ⌘I, ⌘K…).
- **Toolbar UX:** sticky at the top of the editor while scrolling (the legacy toolbar scrolled away on
  long propozice), grouped with separators, a `role="toolbar"` with roving tabindex, lucide icons +
  Czech `aria-label` + tooltip, active/disabled states. On narrow screens it collapses into an
  overflow menu.
- **Character/word count** in the footer (CharacterCount), and a **Placeholder**.
- **Preview toggle** ("Náhled"): renders the content through the *public* `rich-text` component, so
  the admin sees exactly what visitors will see.

**Should:**
- Drag handle to move blocks (DragHandle React extension).
- Paste from Word/Google Docs cleaned to our schema (Tiptap does most of it; strip inline styles
  except allowed ones).
- Autosave a draft to `localStorage` every few seconds, with "Obnovit neuložený koncept?" on
  reopen (a per-browser convenience only, never the source of truth).
- Table of contents source: headings get stable ids (TableOfContents extension), used by the
  propozice "Na této stránce" box.

**Won't (keep it sane):** free font families/sizes, arbitrary colours, raw HTML mode, iframes
other than YouTube, inline `<script>`/`<style>`.

### A3. Implementation notes

**Packages** (all `3.31.4`, see `02`): `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit` (includes
Link, Underline, Blockquote, HorizontalRule, HardBreak, lists, history),
`@tiptap/extension-image` (with `resize`), `@tiptap/extension-table` (TableKit),
`@tiptap/extension-text-align`, `@tiptap/extension-subscript`, `@tiptap/extension-superscript`,
`@tiptap/extension-youtube`, `@tiptap/extension-text-style` (TextStyle + Color),
`@tiptap/extension-highlight`, `@tiptap/extensions` (Placeholder, CharacterCount, Dropcursor,
Gapcursor), `@tiptap/extension-file-handler`, `@tiptap/extension-table-of-contents`,
optional `@tiptap/extension-drag-handle-react`. Bubble menus via `@tiptap/react/menus`.

**Custom extensions** (small, in `components/admin/editor/extensions/`):
- `FigureImage`: extends Image with `width` (%), `align` (`left|center|right`), `caption`, renders
  `<figure data-align data-width><img alt><figcaption>`. **Parses legacy HTML** (bare `<img
  src alt="an image from editor">`, and the `style`/`width` attributes Tiptap 2 wrote) into the new
  node so old content opens cleanly; the placeholder legacy alt is flagged as "chybí popis".
- `Attachment`: inline atom node `{href, name, size, mime}`. Its `parseHTML` also matches the legacy
  `a.editor--file` anchors, so old attachments become chips.
- `Callout`: block node `{variant: info|warning}`.

**Folder** (split to respect the 200-line rule):
```
components/admin/editor/
├─ rich-text-editor.tsx        # composition: useEditor + toolbar + bubble menus + footer
├─ extensions/{figure-image,attachment,callout,index}.ts   # extension list in one place (shared with tests)
├─ toolbar/{toolbar,text-group,heading-group,paragraph-group,insert-group,table-group,history-group}.tsx
├─ menus/{image-bubble,link-bubble,attachment-bubble,table-bubble}.tsx
├─ dialogs/{link-dialog,youtube-dialog,image-alt-dialog}.tsx
└─ use-editor-uploads.ts       # presign + PUT + placeholder replacement, reuses the upload kit
```

**Uploads in the editor** reuse the Phase 3 upload kit (`upload-client.ts`, `image-compression.ts`).
Images get compressed (2560 px); documents are never touched. Presign prefixes: `aktuality`,
`propozice`, `stranky` (page content) for images, `soubory` for documents. The presign schema gets a
**per-prefix MIME + size table**: images ≤15 MB, documents ≤20 MB, `media` video ≤60 MB.

**Saving:** the form submits HTML. The server action:
1. sanitizes with the **shared allow-list** (`lib/sanitize-html.ts`): figure/figcaption/img (our
   hosts, `data-align`, `data-width` ∈ {25..100}), a (`href` http/https/mailto/tel/relative,
   `target=_blank` gets `rel="noopener noreferrer"` forced, `download`), table/thead/tbody/tr/th/td
   (`colspan`, `rowspan`, `colwidth`), `span style="color:<palette>"`, `mark`, `sub`, `sup`, `u`, `s`,
   `blockquote`, `hr`, `br`, `h2–h4` (with `id`), `div[data-callout]`, `iframe` only for
   `https://www.youtube-nocookie.com/embed/<id>`;
2. derives the referenced asset URLs (`img[src]` + attachment hrefs) → `filesFromEditor` / `assets`;
3. diffs against the previous list → deletes unreferenced S3 objects after the DB write (`03` §4).

**Rendering** (`components/site/rich-text.tsx`): sanitize again (legacy rows), then map
`figure` → responsive `next/image` where width/height can be inferred (otherwise plain `<img
loading="lazy" decoding="async">`), images → **lightbox on click**, tables → scroll wrapper,
attachments → download chips, YouTube → `lite` facade (thumbnail + play, loads the iframe on click,
which is good for performance and privacy).

**Tests:** extension round-trip (HTML → doc → HTML) for every node, **including real legacy HTML
samples copied from the test DB** (propozice + 3 news items); sanitizer allow/deny matrix; attachment
legacy parsing; `extractAssetUrls`; toolbar component test (labels, active state, keyboard nav);
upload placeholder replaced on success / removed on failure.

---

## Part B — Everything admin-editable

### B1. Inventory: what was hard-coded in the legacy frontend

| Where | Hard-coded content | New home |
|---|---|---|
| `homepage.tsx`, `sayfy-hero.tsx`, `info-section.tsx` | Hero title "Sayfyho Memorial / Cyklistický závod", hero portrait `sayfy_02222.webp`, background video, "28. září · každý rok · Královské Město Hrob" | `pagecontent: home` |
| `register-button.tsx` | registration URL (changed by commits yearly) | `settings` (already planned) |
| `sayfy-page.tsx`, `public/data/images.json` | Name, nickname, birth/death dates, 4 bio paragraphs, 4 photos, 9 carousel photos, profile photo | `pagecontent: sayfy` |
| `Kontakt.tsx` | Place, "Máte chuť se zapojit? Neváhejte se ozvat!", contact person, phone, email, Facebook link | `pagecontent: kontakt` |
| `support-page.tsx` | heading "Podporují nás", 9 logos | `pagecontent: podpora` (texts) + `partners` (already planned) |
| `navigation-links.tsx` | Facebook + Instagram URLs | `pagecontent: site` |
| `_document.tsx`, `simple-head.tsx` | default description, keywords, OG image | `pagecontent: site` (SEO defaults) |
| `footer.tsx` | "created by codeFactory" + email | stays in code (author credit, not site content) |
| `public/data/vysledky.json` | results | `results` (already planned) |

### B2. Content model

Collection **`pagecontents`** (pinned), one document per page, `_id` = page key. Each has its own
**Zod schema + TypeScript DTO + `DEFAULT_*` constant equal to the legacy copy**. The repository
merges stored data over the defaults (a missing or partial doc never breaks a page), the same idiom
as zive's `homepage-content`.

```ts
type ImageRef = { url: string; alt: string }            // url = S3 (our hosts) or a /public default
type Rich = string                                       // sanitized HTML from the editor

// _id: "site"
type SiteContent = {
  facebookUrl: string; instagramUrl: string             // "" hides the icon
  seo: { description: string; keywords: string; ogImage: ImageRef }
  footerTagline: string                                  // e.g. "Uvidíme se na startu"
}

// _id: "home"
type HomeContent = {
  hero: {
    kicker: string                                       // "{edition}. ročník · Královské město Hrob" (tokens {edition},{year} filled from settings)
    title: string                                        // "Sayfyho Memorial"
    subtitle: string                                     // "Cyklistický závod na památku Davida „Sayfyho“ Seifrta"
    video: { mp4Url: string; webmUrl?: string; poster: ImageRef } // replaceable (media/ prefix)
    secondaryCta: { label: string; href: string }        // default "Propozice" → /propozice
  }
  facts: [Fact, Fact, Fact]                              // fixed 3: { value: string; label: string } e.g. "28. 9." / "každý rok"
  memorial: { quote: string; portrait: ImageRef; linkLabel: string }
  sections: { newsTitle: string; resultsTitle: string; galleryTitle: string; partnersTitle: string } // visible headings
  finishCta: { title: string; text: string }             // "Uvidíme se na startu"
}

// _id: "sayfy"
type SayfyContent = {
  name: string; nickname: string                         // "David", "„Sayfy“", "Seifrt" → name holds full form with {nickname}
  born: string; died: string                             // display strings "8. 2. 1991", "28. 9. 2008"
  portrait: ImageRef
  intro?: Rich
  chapters: Array<{ id: string; title: string; body: Rich; image?: ImageRef }> // add/remove/reorder, 1..12
  quote: { text: string; attribution?: string }          // "ASPOŇ JSEM TO ZKUSIL"
  photos: ImageRef[]                                     // photo strip (0..40), lightbox
  closing: { text: string; linkLabel: string; href: string }
}

// _id: "kontakt"
type KontaktContent = {
  title: string; lead: string                            // "Máte chuť se zapojit?" / "Neváhejte se ozvat!"
  contacts: Array<{ id: string; name: string; role?: string; phone?: string; email?: string }> // 1..6
  place: { label: string; mapUrl?: string }              // "město Hrob", mapy.cz link
  extra?: Rich                                           // e.g. bank account for donations, IČO
}

// _id: "podpora"
type PodporaContent = { title: string; lead?: Rich; patronageTitle?: string }
```

`propozice` stays in `staticpages` (legacy doc, its `title` + `text`). It gains a link to the new
quick-facts card, which reads `settings`.

**Images in page content** live in S3 under `stranky/<page>/…`; defaults point at `/public` files
(`url` starting with `/`). Cleanup on replace only deletes S3 URLs, never `/public` paths (same
`imageKey: ""` trick as zive, expressed through `storageKeyFromUrl` returning `null` for relative
URLs).

**Video:** new `media/` prefix (mp4/webm ≤60 MB, no compression). The admin form shows file size
with a warning above 10 MB ("zpomalí načítání na mobilu"). The poster is required.

### B3. Admin UI

New sidebar group **"Obsah webu"**:

| Route | Edits |
|---|---|
| `/admin/obsah/uvod` | hero (texts, video, poster, CTA), the 3 facts, memorial band, section headings, finish CTA. With a **live preview pane** (zive `homepage-preview.tsx` idea) |
| `/admin/obsah/sayfy` | name/dates/portrait, chapters (add/remove/◀▶ reorder, rich text + image each), quote, photo strip (bulk upload + reorder), closing |
| `/admin/obsah/kontakt` | title/lead, contacts list, place + map link, extra rich text |
| `/admin/obsah/podpora` | title, lead, patronage title (logos stay in `/admin/partneri`) |
| `/admin/obsah/web` | Facebook/Instagram, SEO defaults + OG image, footer tagline |

Shared admin building blocks: `image-field` (upload/replace/alt, reuse zive `homepage-image-field`),
`repeatable-list` (add/remove/move with buttons, keyboard accessible), `rich-text-editor` (Part A),
sticky save bar, unsaved-changes guard, "Obnovit výchozí text" per field (resets to the `DEFAULT_*`
value), and a "Zobrazit stránku ↗" link.

Every save action: `requireAdmin` → Zod → validate image URLs (host + prefix) → sanitize rich
fields → upsert → diff + delete replaced S3 images → `revalidatePath` of the affected routes
(`site` → **layout-level** `revalidatePath('/', 'layout')`, since header/footer/SEO are everywhere).

### B4. Public pages read content, never literals

From **Phase 1**, every public page reads its `pagecontent` through the repository with defaults.
So the site renders today's copy before any admin UI exists, and Phase 5 only adds the forms. Rule
for reviews: **no visitor-facing Czech copy in JSX** except UI chrome (button labels like "Další",
"Zavřít", aria labels, empty states).
