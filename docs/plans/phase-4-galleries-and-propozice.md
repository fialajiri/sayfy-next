# Phase 4 — Galleries + Propozice

**Goal:** full gallery management (create, bulk upload ≤200, rename, set cover, reorder, delete
images, delete gallery) and propozice editing, all guarded and with correct S3 cleanup.

**Estimate:** ~2–3 days · **Source of truth:** `docs/03` (galleries + static page tables, §3–4),
`docs/04` §Galleries. Reuse zive: `components/admin/{bulk-image-upload,gallery-create-form,
gallery-manager,rename-gallery-form,delete-gallery-button}.tsx`, `server/application/gallery.ts`
(as a reference for the shape), and the Phase 3 upload kit.

**Exit criteria:**
- [ ] Create gallery "2027" → upload 150 photos (20–30 MB originals) → they land as ≤5 MB JPEGs,
      correctly oriented; a failed file can be retried without re-uploading the rest.
- [ ] Set cover / move / delete images reflect on `/fotogalerie` and the detail page immediately;
      deleted images are gone from S3.
- [ ] Deleting a gallery removes all its objects; anonymous calls are rejected (the legacy
      **unguarded delete** is fixed and has a test).
- [ ] Propozice edits (text, tables, inline images) show on `/propozice` immediately, and removed
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
- [ ] `application/galleries.ts`: `createGallery(title)`, `renameGallery(id, title, updateSlug)`,
      `appendGalleryImages(id, urls)` (cap total, validate URLs), `removeGalleryImages(id, urls)`,
      `setGalleryCover(id, url)`, `moveGalleryImage(id, url, direction)`, `deleteGallery(id)`.
- [ ] `GalleryRepository` writes accordingly (+ `updatedAt` precondition for array rewrites).
- [ ] `application/static-pages.ts`: `updateStaticPage('propozice', {title, text})` with sanitize,
      derive `assets` from HTML, `diffImages` cleanup.

## 2. Actions
- [ ] `server/actions/galleries.ts`, `server/actions/static-pages.ts`: guard → Zod → URL validation
      (prefix `galerie`/`propozice`) → use case → `revalidatePath('/')`, `/fotogalerie`,
      `/fotogalerie/<slug>`, `/propozice`.

## 3. Admin UI
- [ ] `admin/fotogalerie/page.tsx`: tiles with cover, count, updated date; "Nová galerie".
- [ ] `admin/fotogalerie/nova`: title (suggest the current year) → creates → redirects to the manager.
- [ ] `admin/fotogalerie/[id]`: `gallery-manager`: rename form, dropzone + `bulk-image-upload`
      (scope = gallery slug), image grid with checkboxes, "Nastavit jako titulní", ◀ ▶ move, bulk
      delete via `AlertDialog`, delete gallery (typed confirmation: retype the gallery title).
- [ ] `/fotogalerie/edit/:title` legacy redirect route → resolve the slug → `/admin/fotogalerie/:id`.
- [ ] `admin/propozice/page.tsx`: title + rich-text editor, sticky save bar, "Zobrazit" link.

## Tests
- [ ] Use cases (mocked): append caps and validates; remove deletes from S3 after the DB write; cover
      moves to index 0; stale `updatedAt` → conflict; delete gallery cleans all keys; unguarded
      call → forbidden.
- [ ] Repository integration: `$push $each` concurrency (two appends both land), unique title →
      conflict.
- [ ] `bulk-image-upload` component: per-file states, retry only failed, `onChunkComplete` called
      once per chunk.
- [ ] Compression pure helpers (`computeScaledDimensions`, output filename).
