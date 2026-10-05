# 03 — Backend rewrite plan

The Express service (`../sayfy-backend-ts/src`, ~2.4k lines) becomes server code inside the Next app.
This doc covers the building blocks, a full **endpoint → new implementation** map, the tricky parts,
and the **security problems found in the legacy code** that the rewrite has to fix.

## Building blocks

### Mongoose connection (serverless-safe)
Copy zive's `server/infrastructure/db/connection.ts`: a connection cached on `globalThis`,
`maxPoolSize: 5`, `serverSelectionTimeoutMS: 8000`, and a loud failure if `MONGODB_URI` is missing.
The legacy code built the URI from `DB_USER`/`DB_PASSWORD`/`DB_NAME` against
`cluster0.oahmw.mongodb.net`. The new app takes one `MONGODB_URI`.

> Legacy bug worth noting: `index.ts` caught the `mongoose.connect` error, logged it, and **started
> listening anyway**, so a bad DB config showed up as random 400 "Něco se pokazilo" errors.

### Models: pin collection names
The legacy models relied on Mongoose's default pluralisation. **Pin each name explicitly** (third
argument to `model()`) once you've confirmed it in Atlas. Full field list in `05`.

| Model | Expected collection | Notes |
|---|---|---|
| `User` | `users` | admins only |
| `Aktualita` | `aktualitas` | Mongoose's plural of "Aktualita"; confirm before coding |
| `Gallery` | `galleries` | |
| `StaticPage` | `staticpages` | one document in use: propozice `635c21aea369bc4f74025d04` |
| `Log` | `logs` | **not modelled**; leave the collection in place, stop writing to it |
| *new* `Result` | `results` | race results by year (seeded from `vysledky.json`) |
| *new* `Settings` | `settings` | singleton: race date, ročník, registration URL + open flag |
| *new* `Partner` | `partners` | sponsor logos (seeded from `public/logos/support`) |
| *new* `PageContent` | `pagecontents` | one doc per page (`site`, `home`, `sayfy`, `kontakt`, `podpora`), defaults = legacy copy (`08` Part B) |

### Errors
Use cases return `Result<T, DomainError>` (`not_found | conflict | validation | forbidden |
storage | unavailable`). Server actions map them to `{ ok: false, message, fieldErrors? }`, and the
presign route maps them to HTTP status codes. This replaces `CustomError` subclasses, the
`express-async-errors` patch, and the global `errorHanlder` that turned every unknown error into a 400.

### Ports (only where they buy testability)
`StoragePort` (presign, delete, publicUrl), `RateLimiter`, and repositories per aggregate.
`PasswordHasher` is a pure module, not a port.

## Endpoint → new implementation map

Legend: **SA** = server action · **RH** = route handler · **RSC** = read in a server component ·
`[admin]` = `requireAdmin()` guard inside the action itself.

### Users (`/api/users/*`)
| Legacy | New | Notes |
|---|---|---|
| `POST /api/users/signin` | Auth.js Credentials `authorize()` via **SA** on `/prihlaseni` | Verify legacy `hash.salt` (see §1); Upstash rate limit by IP + email |
| `POST /api/users/signout` | Auth.js `signOut()` **SA** | Legacy "signout" set the cookie to `""` but never expired it |
| `GET /api/users/currentuser` | `auth()` (RSC) / `useSession()` (client island) | no endpoint |
| `POST /api/users/signup` (commented out) | **Dropped.** `scripts/create-admin.ts` instead | No public accounts exist or are planned |
| — *(new)* | **SA** `changePassword` `[admin]` | `/admin/ucet`; verify current, write new hash |

### Aktuality (`/api/aktualita*`)
| Legacy | New | Notes |
|---|---|---|
| `GET /api/aktualita` | **RSC** `listNews({ page })` | Legacy returned every doc unsorted and the FE sorted. Now: sort `createdAt desc` in the DB, paginate, project list fields only |
| `GET /api/aktualita/:param` (id or slug) | **RSC** `getNewsBySlug(slug)`; admin uses `getNewsById(id)` | Split the overloaded param |
| `POST /api/aktualita` `[admin]` | **SA** `createNews` | Zod: title 1–150, unique; `mainPhoto` required; sanitize `text`; generate unique slug |
| `PUT /api/aktualita/:id` `[admin]` | **SA** `updateNews` | **Fix:** legacy wrote `video` + `imagesFromEditor` (not in schema → silently dropped) and never refreshed the slug. Delete S3 objects no longer referenced (`diffImages`) |
| `DELETE /api/aktualita/:id` `[admin]` | **SA** `deleteNews` | **Fix:** also delete `mainPhoto`, `photoGallery[]`, `filesFromEditor[]` from S3 (legacy left them behind) |

### Galleries (`/api/gallery*`)
| Legacy | New | Notes |
|---|---|---|
| `GET /api/gallery` | **RSC** `listGalleries()` | Sort by numeric year from `title` (legacy `parseInt(title)` on the FE); return cover = `images[0]` + count, **not** the full image arrays |
| `GET /api/gallery/:galleryUrl` | **RSC** `getGalleryBySlug(slug)` | |
| `POST /api/gallery` `[admin]` | **SA** `createGallery` | Zod title 1–150, unique; legacy created an empty gallery, uploaded, then PUT — keep the "create first, then append" flow so a failed upload never loses the gallery |
| `PUT /api/gallery/:id` `[admin]` | **SA** `renameGallery`, `appendGalleryImages`, `removeGalleryImages`, `reorderGalleryImages` | Split the "replace everything" PUT into intent-specific actions. Removal deletes from S3 **correctly** (see §4) |
| `DELETE /api/gallery/:id` **(no guard!)** | **SA** `deleteGallery` `[admin]` | **Fix: anyone could delete a gallery.** Also delete all its S3 objects |

### Static page (`/api/static-page*`)
| Legacy | New | Notes |
|---|---|---|
| `GET /api/static-page/:param` | **RSC** `getStaticPage('propozice')` | Legacy looked up by a field `staticPageUrl` that **doesn't exist in the schema** — only the hard-coded ObjectId ever worked. New: add a `slug: "propozice"` field to that one doc (additive, see `05`) |
| `PUT /api/static-page/:id` `[admin]` | **SA** `updateStaticPage` | sanitize HTML; track `assets[]` for S3 cleanup |
| `POST`, `DELETE /api/static-page` | **Dropped** | Only propozice exists. Re-add if more editable pages are wanted |

### Upload (`/api/upload`)
| Legacy | New | Notes |
|---|---|---|
| `POST /api/upload` **(no auth, no validation!)** | **RH** `POST /api/uploads/presign` `[admin]` | Copy zive's route. Body `{ prefix, scope, files: [{ name, type, size }] }` (≤ 50 per request, client batches). A **per-prefix policy table** decides MIME + max size: images (`aktuality`, `galerie`, `propozice`, `partners`, `stranky`) `image/jpeg|png|webp|avif` ≤15 MB; documents (`soubory`) pdf/doc/docx/xls/xlsx/txt ≤20 MB; video (`media`) mp4/webm ≤60 MB. The server generates the key. Returns `[{ url, key, publicUrl }]` |

### New content (no legacy endpoint)
| Feature | New | Notes |
|---|---|---|
| Výsledky | **RSC** `listResults()`, `getResultByYear(rok)`; **SA** `upsertResult`, `deleteResult` `[admin]` | Zod: year 4 digits, unique; edition ≥1; `url` must be `https://` (warn if not on `sportt.cz` because of CSP `frame-src`) |
| Settings | **RSC** `getSettings()`; **SA** `updateSettings` `[admin]` | `raceDate`, `edition`, `registrationUrl`, `registrationOpen`. Revalidates `/`, `/propozice` |
| Partners | **RSC** `listPartners()`; **SA** `createPartner`, `updatePartner`, `deletePartner`, `reorderPartners` `[admin]` | name (required, used as `alt`), logo (upload, `partners/` prefix), optional `url`, `order` |
| Page content | **RSC** `getPageContent(key)` (merged over defaults, never throws: fails safe to defaults); **SA** `updatePageContent(key, input)` `[admin]` | Per-page Zod schema, rich fields sanitized, replaced S3 images deleted, `revalidatePath` per page (`site` → whole layout). See `08` Part B |

## Tricky bits

### 1. Legacy password verify
The Sayfy backend did **not** use passport-local-mongoose (zive did). It stores one field,
`password = "<hashHex>.<saltHex>"` (`services/password.ts`): pbkdf2, **25 000** iterations,
**keylen 512**, **sha256**, salt = `randomBytes(32).toString('hex')`, and the **hex string itself is
the salt input** (it's never decoded). The parameters match zive's exactly, so the verify function is
the same with a different parser:

```ts
// server/infrastructure/auth/password.ts
import 'server-only'
import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const pbkdf2Async = promisify(pbkdf2)
const P = { iterations: 25_000, keylen: 512, digest: 'sha256' } as const

export async function verifyLegacyPassword(stored: string, supplied: string): Promise<boolean> {
  const [hashHex, salt] = stored.split('.')
  if (!hashHex || !salt) return false
  const expected = Buffer.from(hashHex, 'hex')
  const derived = await pbkdf2Async(supplied, salt, P.iterations, P.keylen, P.digest)
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}

export async function hashLegacyPassword(password: string): Promise<string> {
  const salt = randomBytes(32).toString('hex')
  const hash = (await pbkdf2Async(password, salt, P.iterations, P.keylen, P.digest)).toString('hex')
  return `${hash}.${salt}`
}
```

Legacy compared with `===` on hex strings. The new code uses `timingSafeEqual`. A post-cutover
upgrade to stronger hashing is described in `05`.

### 2. Auth.js config
`src/auth.ts`: Credentials provider. `authorize()` Zod-parses `{ email, password }`, checks the rate
limiter, loads the user **with** `password`, verifies it, and returns `{ id, email, isAdmin }`.
The `jwt`/`session` callbacks copy `id` and `isAdmin`. Session `maxAge` is 8 h (admin-only app) and
the cookie is `httpOnly`, `secure`, `sameSite=lax`. That replaces the legacy `sameSite=none` cookie,
which only worked because of the cross-origin setup.

### 3. Presigned upload flow
```
admin picks file(s)
  → compress in browser (Canvas, longest edge 2560 px, JPEG ~0.82, EXIF-oriented)   [zive image-compression.ts]
  → POST /api/uploads/presign { prefix:'galerie', scope:'2026', files:[{name,type,size}] }
  ← [{ url, key, publicUrl }]
  → PUT file → S3 (parallel, concurrency 4, per-file progress, retry once)           [zive upload-client.ts]
  → SA appendGalleryImages({ galleryId, urls:[publicUrl…] })   ← server re-validates every URL (host + prefix)
  → revalidatePath('/fotogalerie', `/fotogalerie/${slug}`)
```
- **Key format (new):** `<prefix>/<scope>/<uuid>.<ext>`, e.g. `galerie/2026/3f2c….jpg`,
  `aktuality/zavod-zna-sveho-viteze/….jpg`, `propozice/….png`, `partners/….png`. The server
  generates it; client file names never reach the key. Legacy keys like
  `aktuality/závod zná…/foto (1).jpg` → `normalizeStringToUrl` could still contain `?`, `#`, `&`.
- **publicUrl** = `https://${S3_PUBLIC_HOST}/${key}`. Keep the S3 host for continuity, or move new
  uploads to the CloudFront host (open question, `07`). Both stay allow-listed.
- **Editor images** upload **immediately on insert** (same flow, `aktuality`/`propozice` prefix), not
  at save time with blob-URL replacement like legacy `processFilesFromEditor`. That's simpler and
  survives reloads. Images removed from the content are cleaned up on save via `diffImages`.

### 4. S3 deletion that actually works
The legacy `deleteFileFromS3` had **two bugs**: aws-sdk v2 `deleteObject()` without a callback or
`.promise()` **never sends the request**, and it received the **full URL** instead of the key. So
**no image has ever been deleted** from the bucket. New:

```ts
// domain/storage-key.ts (pure, unit-tested)
export function storageKeyFromUrl(url: string, allowedHosts: readonly string[]): string | null {
  const parsed = URL.canParse(url) ? new URL(url) : null
  if (!parsed || !allowedHosts.includes(parsed.hostname)) return null
  return decodeURIComponent(parsed.pathname.replace(/^\//, '')) || null
}
```

Use cases collect keys, call `storage.deleteMany(keys)` (`DeleteObjectsCommand`, ≤1000 per call)
**after** the DB write succeeds. Storage errors are logged and swallowed, never shown to the admin:
an orphaned file is harmless, a dangling DB reference is not. `scripts/s3-orphans.ts` (Phase 7)
lists bucket keys that no document references and deletes them only with `--delete`.

### 5. Slugs
`slugify`: NFD → strip combining marks → lowercase → replace non `[a-z0-9]` runs with `-` → trim
dashes → max 80 chars. `uniqueSlug` appends `-2`, `-3`… on collision. **Existing `aktualitaUrl` /
`galleryUrl` values are never rewritten**, because they're live public URLs. When an admin renames an
item, the slug stays the same unless they tick "aktualizovat URL". If they do, store the old slug in
`previousSlugs[]` (additive field) and have the detail page `permanentRedirect` from it.

### 6. Rich-text sanitising
Start from zive's `lib/sanitize-html.ts`, then apply the **full allow-list from `08` Part A §A3**
(figures with align/width, attachments, tables with spans/widths, brand-palette colours, marks,
callouts, YouTube-nocookie iframes only). One shared config for write + render. Sanitize **on
write** and **on render**, because existing `text` fields were stored raw. Asset tracking
(`filesFromEditor`, `assets`) covers images **and** attachment links.

## Security problems in the legacy code (all fixed by the rewrite)

| # | Severity | Problem | Fix |
|---|---|---|---|
| 1 | **Critical** | `POST /api/upload` has **no auth and no validation**. Anyone can get presigned PUT URLs and host arbitrary files (any type, any size) in `sayfyho-memorial` | Admin-only presign route, MIME/size/prefix validation, server-generated keys |
| 2 | **Critical** | `DELETE /api/gallery/:id` has **no `requireAdmin`**. Anyone can delete any gallery | Guard inside the action |
| 3 | **High** | CORS `origin: true` + `credentials: true` + cookie `sameSite: none` means **any website can make credentialed requests** as a logged-in admin (CSRF: delete/edit content) | Same-origin app, `sameSite=lax`, Server Actions' built-in Origin check, CORS gone |
| 4 | High | Stored HTML rendered with `dangerouslySetInnerHTML`, unsanitized | `sanitize-html` on write + render |
| 5 | Medium | `eval(process.env.JWT_EXPIRY)` | Gone (Auth.js `maxAge` number) |
| 6 | Medium | Every request (IP, user, body) logged to Mongo `logs` forever, body only stripped when a field is literally named `password` (GDPR/data minimisation) | Stop writing; propose purging the collection after cutover (open question) |
| 7 | Medium | No login rate limit; non-constant-time hash compare | Upstash rate limit; `timingSafeEqual` |
| 8 | Low | Admin pages rendered on the client, guard = `router.push('/login')` after render | Server-side guard in `admin/layout.tsx` + in every action |
| 9 | Low | `JWT_SECRET` signed 1 token type; `REFRESH_TOKEN_*` required at boot but never used | `AUTH_SECRET` only |

Plus: explicit CSP + security headers (`next.config.ts`, adapted from zive), with `frame-src` limited
to `https://sportt.cz https://www.sportt.cz https://www.youtube-nocookie.com`. Zod-validate every
action input. Never trust a client-sent URL until `storageKeyFromUrl` accepts its host + prefix.
