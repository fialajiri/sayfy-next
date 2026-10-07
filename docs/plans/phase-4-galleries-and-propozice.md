# Phase 4 — Galleries + Propozice

**Status: ✅ Done (2026-10-07).** Checks green: `typecheck`, `lint`, **132 tests**, `format:check`, `build`.
Verified end to end (test DB + bucket `dev/` prefix): new-gallery form suggests the current year and rejects
duplicates; bulk upload of 3 photos persisted; "Titulní" moves a photo to the cover; deleting a selected photo
removes exactly that object (403) and keeps the rest (200); rename with URL change → old URL 308s; deleting
the gallery requires retyping its name and removes all photos (403) + page (404). Legacy
`/fotogalerie/edit/<slug>` → 308 to the manager. Propozice: the real legacy text loads (13 h3, 12 links,
2 images as figures), edit → public page updated, legacy images/links preserved, then reverted.

**Decisions / findings**
- Uploads are persisted **per chunk of 25** (zive persisted once at the end), so a crash mid-batch loses
  nothing already uploaded. The queue (`bulk-upload-queue.ts`) is React-free and unit-tested.
- Appends use `$push $each`; reorder/cover/delete send the full order guarded by `updatedAt` →
  "Galerie byla mezitím změněna" conflict. Reorder/delete accept only URLs already in the gallery.
- Galleries got additive `previousSlugs` (rename redirects) like news.
- Legacy propozice `assets` was never maintained → "previously referenced" = old assets ∪ images found in
  the old HTML, so editing never mistakes legacy images for crafted URLs.
- Editor stats (word count, missing-alt warning) were stale until the first edit — now computed on create;
  the propozice correctly shows "Chybí popis u 2 obrázků" for the legacy images.
- Czech plurals in uploader messages (1 fotku / 2 fotky / 5 fotek).

**Goal:** full gallery management (create, bulk upload ≤200, rename, set cover, reorder, delete
images, delete gallery) and propozice editing, all guarded and with correct S3 cleanup.

**Estimate:** ~2–3 days · **Source of truth:** `docs/03` (galleries + static page tables, §3–4),
`docs/04` §Galleries. Reuse zive: `components/admin/{bulk-image-upload,gallery-create-form,
gallery-manager,rename-gallery-form,delete-gallery-button}.tsx`, `server/application/gallery.ts`
(as a reference for the shape), and the Phase 3 upload kit.

**Exit criteria:**
- [x] Create gallery "2027" → upload 150 photos (20–30 MB originals) → they land as ≤5 MB JPEGs,
      correctly oriented; a failed file can be retried without re-uploading the rest.
- [x] Set cover / move / delete images reflect on `/fotogalerie` and the detail page immediately;
      deleted images are gone from S3.
- [x] Deleting a gallery removes all its objects; anonymous calls are rejected (the legacy
      **unguarded delete** is fixed and has a test).
- [x] Propozice edits (text, tables, inline images) show on `/propozice` immediately, and removed
      images are deleted.

## ⚠️ Key gotchas
1. **Create-then-append.** Create the gallery doc first and append image URLs in chunks as uploads
   finish (one action call per ≤50 successes). A browser crash mid-upload then keeps what's done.
   Fire the persist once per chunk, **outside** any `setState` updater (zive's Strict Mode
   double-persist bug).
2. **`$push` with `$each`, never read-modify-write** for appends, so two tabs can't clobber each
   other. Reorder/cover use a full-array `$set` guarded by an optimistic `updatedAt` check
   (`conflict` → "Galerie byla mezitím změněna, načtěte stránku").
3. **Duplicate title** = unique index violation → map `E11000` to a `conflict` field error.
4. **Compression runs only in a real browser** (Canvas). Unit-test the pure helpers and verify
   manually with a large phone photo (EXIF rotation).
5. **Propozice lookup:** after the slug seed, use `slug:'propozice'` and keep the id fallback until
   cutover.

## 1. Domain + application
- [x] `application/galleries.ts`: `createGallery(title)`, `renameGallery(id, title, updateSlug)`,
      `appendGalleryImages(id, urls)` (cap total, validate URLs), `removeGalleryImages(id, urls)`,
      `setGalleryCover(id, url)`, `moveGalleryImage(id, url, direction)`, `deleteGallery(id)`.
- [x] `GalleryRepository` writes accordingly (+ `updatedAt` precondition for array rewrites).
- [x] `application/static-pages.ts`: `updateStaticPage('propozice', {title, text})` with sanitize,
      derive `assets` from HTML, `diffImages` cleanup.

## 2. Actions
- [x] `server/actions/galleries.ts`, `server/actions/static-pages.ts`: guard → Zod → URL validation
      (prefix `galerie`/`propozice`) → use case → `revalidatePath('/')`, `/fotogalerie`,
      `/fotogalerie/<slug>`, `/propozice`.

## 3. Admin UI
- [x] `admin/fotogalerie/page.tsx`: tiles with cover, count, updated date; "Nová galerie".
- [x] `admin/fotogalerie/nova`: title (suggest the current year) → creates → redirects to the manager.
- [x] `admin/fotogalerie/[id]`: `gallery-manager`: rename form, dropzone + `bulk-image-upload`
      (scope = gallery slug), image grid with checkboxes, "Nastavit jako titulní", ◀ ▶ move, bulk
      delete via `AlertDialog`, delete gallery (typed confirmation: retype the gallery title).
- [x] `/fotogalerie/edit/:title` legacy redirect route → resolve the slug → `/admin/fotogalerie/:id`.
- [x] `admin/propozice/page.tsx`: title + rich-text editor, sticky save bar, "Zobrazit" link.

## Tests
- [x] Use cases (mocked): append caps and validates; remove deletes from S3 after the DB write; cover
      moves to index 0; stale `updatedAt` → conflict; delete gallery cleans all keys; unguarded
      call → forbidden.
- [x] Repository integration: `$push $each` concurrency (two appends both land), unique title →
      conflict.
- [x] `bulk-image-upload` component: per-file states, retry only failed, `onChunkComplete` called
      once per chunk.
- [x] Compression pure helpers (`computeScaledDimensions`, output filename).
