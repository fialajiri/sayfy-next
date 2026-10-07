# Phase 3 — First write path: Aktuality CRUD + uploads + full editor

**Status: ✅ Done (2026-10-07)** except the ⏳ items. Checks green: `typecheck`, `lint`, **119 tests**,
`format:check`, `build`. Verified end to end in a real browser against the test DB + the S3 bucket (`dev/`
prefix): create with main photo, inline image (alt, caption, 50 %, right), PDF chip, YouTube, gallery photo;
edit removing the inline + gallery images deletes exactly those two objects (403) and keeps the rest (200);
rename with "Změnit i adresu" → old URL 308s to the new one; delete removes the article (404) and its files.
Anonymous presign → 401 (legacy `/api/upload` had no auth).

**Findings / fixes during the phase**
- `.env.local` AWS key ID and secret were **swapped** — fixed locally. The IAM user
  (`sayfyho-memorial-s3-user`) has object access only (no `ListBucket`/CORS read). Bucket CORS allows `PUT`
  from `*` (tighten at cutover, docs/aws).
- **Safety bug found and fixed:** the `dev/` key prefix was keyed on `NODE_ENV`, so a local `next start`
  (production mode, test DB) used the real namespace AND allowed deletes of live images. Now `dev/` unless
  `VERCEL_ENV=production` (+ explicit `S3_KEY_PREFIX`), with tests. Deletes outside the prefix are always
  skipped and logged. Before the fix, a few e2e test files landed in the real namespace: 3 known keys were
  deleted; **3 images remain** in `aktuality/e2e-test-nova-trat-2027/` (1) and
  `aktuality/e2e-test-2-nova-trat-2027/` (2) — remove via the AWS console (we can't list the bucket).
- Editor dialogs are portaled, but React bubbles `submit` through the component tree: the YouTube dialog
  **submitted the article form**. Fixed with `stopPropagation` + regression test.
- Inserting after a just-inserted image **replaced** it (NodeSelection). `chainAtInsertPoint()` collapses to
  after the node first. Regression test.
- Sanitizer would have stripped **YouTube wrappers** and **rgb() colours** on save (lost on next edit);
  caught by the new editor → sanitize → editor cycle test.
- Phase 1 gap: the article page didn't render the legacy **perex**. Now shown above the main photo; editable.
- Image size uses % presets (33/50/75/100), not drag-resize (Tiptap's resize stores fixed px → overflow on
  phones). docs/08 updated.
- Running `npm run typecheck` (`next typegen`) wipes the `.next` build under a running `next start`.

**Remaining ⏳**: the `quick-test` slug rename (§0, needs approval); news-form component test.

**Goal:** an admin creates, edits and deletes an article end-to-end (main photo, photo gallery,
inline editor images, tables, YouTube). Public pages update immediately, and removed images are
**actually deleted** from S3. This loop is the template for every later write feature.

**Estimate:** ~4–5 days (editor ≈ half) · **Source of truth:** `docs/03` (aktuality table, §3–6). Reuse zive:
`app/api/uploads/presign/route.ts`, `schemas/upload.ts`, `server/infrastructure/storage/s3.ts`,
`components/admin/{upload-client.ts,image-compression.ts,image-upload.tsx,rich-text-editor.tsx}`,
`components/admin/delete-news-button.tsx`, `server/actions/image-ref.ts`.

**Exit criteria:**
- [x] Create → appears on `/`, `/aktuality`, `/aktuality/<slug>` without waiting for ISR.
- [x] Edit: replacing the main photo or removing gallery/inline images deletes those S3 objects
      (verify in the test bucket).
- [x] Delete: the doc plus every referenced S3 object is gone; the public page 404s.
- [x] Presign route rejects: no session (401), wrong MIME, >15 MB, unknown prefix, >50 files.
- [x] The editor passes the **legacy parity checklist** (`08` §A1, every command) and the new
      features in `08` §A2 "Must". The current propozice and 3 real news items open, edit and save
      **without losing content** (images, links, tables, document links).

## ⚠️ Key gotchas
1. **Never stream files through the server** (Vercel ~4.5 MB body limit). Browser → S3 PUT only.
2. **Re-validate every URL the client sends** in the action: `storageKeyFromUrl` must accept the
   host **and** the key must start with an allowed prefix. Otherwise, a crafted action call could
   make the server reference (and later delete) any object.
3. **Delete from S3 only after the DB write succeeds,** and never fail the action because S3 delete
   failed. Log the key count, not the keys.
4. **`filesFromEditor` is derived,** never trusted from the client: parse `img[src]` from the
   sanitized HTML and keep only our hosts.
5. **Legacy images aren't in the new prefix scheme.** `diffImages` must treat any allowed-host URL as
   deletable **only if it was referenced by this document before the edit**. Never delete a URL that
   another document also references (check before deleting; legacy re-uploads could share URLs).
6. **Slug stays put on rename** unless the admin opts in (then push the old one to `previousSlugs`).
7. **S3 CORS** must allow `PUT` from `http://localhost:3000` and preview origins (see `docs/aws/`).

## 0. Data fix to run with this phase (after confirmation)
- [ ] "Vzpomínková vyjížďka 2022" has the legacy slug `quick-test`. Once rename-with-redirect works, rename
      it to `vzpominkova-vyjizdka-2022` (keeping `quick-test` in `previousSlugs`). This is a production write,
      so do it only with explicit approval (see docs/05).

## 1. Storage
- [x] `domain/ports/storage.ts`: `presignPut({key, contentType, contentLength})`, `deleteMany(keys)`,
      `publicUrl(key)`.
- [x] `infrastructure/storage/s3.ts` (copy zive; `DeleteObjectsCommand` batched ≤1000).
- [x] `schemas/upload.ts`: prefixes `aktuality | galerie | propozice | partners`, MIME allow-list,
      15 MB max, ≤50 files/request, `scope` slug segment (validated `[a-z0-9-]{1,80}`).
- [x] `app/api/uploads/presign/route.ts`: `requireAdmin` → Zod → keys
      `<prefix>/<scope>/<uuid>.<ext>` → presigned URLs (5 min expiry, `ContentType` + `ContentLength`
      signed).

## 2. Client upload kit (copy zive, adapt)
- [x] `image-compression.ts` (2560 px / 0.82 / 5 MB target; skip for PNG logos with transparency).
- [x] `upload-client.ts`: presign in batches of 50, PUT with progress (XHR or `fetch` +
      streams), concurrency 4, one retry.
- [x] `image-upload.tsx` (single: preview, replace, remove) and `multi-image-upload.tsx` (≤10 for
      the news photo gallery, reorder with buttons).

## 3. Rich-text editor (spec: `08` Part A — read it fully first)
- [x] Scaffold `components/admin/editor/` per `08` §A3 (zive's file only as a starting skeleton).
- [x] Extensions list in `extensions/index.ts` (shared by the editor and tests): StarterKit (Link
      `openOnClick:false` + autolink + protocols, Underline, Blockquote, HR, HardBreak, lists,
      history), TextAlign (`heading`,`paragraph`, 4 values), Subscript, Superscript, TableKit
      (resizable), Youtube (`nocookie:true`), TextStyle + Color (palette), Highlight, Placeholder,
      CharacterCount, Dropcursor, Gapcursor, FileHandler, TableOfContents.
- [x] Custom nodes: `FigureImage` (resize, width presets, align, alt, caption, legacy `<img>` parse),
      `Attachment` (chip, legacy `a.editor--file` parse), `Callout`.
- [x] Toolbar groups (text / headings / paragraph / insert / table / history), sticky, roving
      tabindex, tooltips with shortcuts, overflow menu on narrow widths.
- [x] Bubble menus: image (replace, alt, caption, size, align, link, delete), link (edit/open/remove),
      attachment (replace/rename/remove), table (rows/cols/merge/split/header/delete).
- [x] Dialogs: link, YouTube (URL parse + preview), image alt (enforced before save).
- [x] `use-editor-uploads.ts`: drop/paste/picker → placeholder → presign → PUT → swap URL; failure
      removes the placeholder with a toast.
- [x] Preview toggle rendering through the public `rich-text` component.
- [x] `lib/sanitize-html.ts` with the full allow-list from `08` §A3; `components/site/rich-text.tsx`
      renders figures, lightbox on images, table wrappers, attachment chips, YouTube facade.

## 4. Domain + application
- [x] `domain/images.ts`: `diffImages(before[], after[])` → `removed[]`; `extractImageUrls(html)`.
- [x] `application/news.ts`: `createNews`, `updateNews`, `deleteNews` (deps: repo, storage, clock,
      allowed hosts). Unique title check → `conflict` with a field error. Slug via `uniqueSlug`.
- [x] `NewsRepository` writes: `create`, `update`, `delete` (returns the doc for cleanup),
      `existsByTitle(title, exceptId)`, `existsBySlug`, `isUrlReferencedElsewhere(url, exceptId)`.

## 5. Actions + admin UI
- [x] `schemas/news.ts` (title 1–150, mainPhoto URL, photoGallery ≤10 URLs, text HTML ≤200 kB,
      `updateSlug?: boolean`).
- [x] `server/actions/news.ts`: guard → Zod → validate URLs (gotcha #2) → use case →
      `revalidatePath('/')`, `/aktuality`, `/aktuality/<slug>` (+ old slug).
- [x] `admin/aktuality/page.tsx`: table (title, date, photo thumb), search by title, links to edit
      and the public page, delete with `AlertDialog`.
- [x] `admin/aktuality/nova` + `[id]`: `news-form.tsx` (RHF + Zod, sticky save bar, unsaved-changes
      `beforeunload` guard, pending state, toast on success → redirect to the list).

## Tests
- [x] Presign route: 401/400 matrix, key format, no client filename in the key.
- [x] `diffImages`, `extractImageUrls` (incl. legacy HTML samples from the test DB).
- [x] `news` use cases (mocked repo/storage): create sanitizes + derives `filesFromEditor`; update
      deletes only removed + unshared URLs, **after** the repo update; delete cleans everything;
      storage failure → still `ok`; title conflict → field error.
- [x] Repository integration: uniqueness, `isUrlReferencedElsewhere`.
- [x] Sanitizer: strips `<script>`, `on*` attributes, `javascript:` links, foreign iframes, off-palette
      colours; keeps figures (align/width), attachments, tables (spans/widths), alignment, nocookie YouTube.
- [x] Editor: HTML → doc → HTML round-trip for every node using **real legacy HTML samples** from the
      test DB; legacy `<img>` → `FigureImage`; legacy `a.editor--file` → `Attachment`.
- [x] Toolbar: every legacy command present with a correct Czech label (fixes the swapped legacy
      labels), active/disabled states, keyboard navigation.
- [ ] ⏳ `news-form` component: validation messages, pending state.
