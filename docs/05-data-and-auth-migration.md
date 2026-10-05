# 05 — Data & auth migration

**Requirement:** keep the current MongoDB data and S3 images. Existing admins must log in with their
current passwords, and existing image URLs and public slugs must keep working. **Zero destructive
migration.** The only DB writes are *additive* (new collections, one new field on one document), so
the legacy app can keep running against the same database during the parallel run.

## Keep MongoDB? — Yes

| Factor | MongoDB (keep) | Postgres (switch) |
|---|---|---|
| Data continuity | ✅ point at the same Atlas cluster | ❌ export → transform → import |
| Passwords | ✅ `hash.salt` verified in place | ❌ migrate rows |
| Shape | ✅ flat docs with URL arrays, no relations at all | overkill |
| Volume | tiny (dozens of news, ~10 galleries, 1 static page, 1–2 users) | no pressure |
| Parity with zive-teplice | ✅ same stack, same modules | ❌ |

## Legacy collections and fields (keep identical)

Types come from `../sayfy-backend-ts/src/models/**`. **Confirm the real collection names in Atlas
first** (`npm run db:check`, script reused from zive), then pin them.

```ts
// users — admins only. NOTE: no `username` in the schema (UserAttrs had it; strict mode dropped it).
const userSchema = new Schema({
  email:    { type: String, required: true },
  password: { type: String, required: true, select: false },   // "<hashHex>.<saltHex>" — see §Auth
  isAdmin:  { type: Boolean, default: false },
}, { timestamps: true })
export const User = model('User', userSchema, 'users')

// aktualitas — news
const aktualitaSchema = new Schema({
  title:           { type: String, required: true },
  text:            { type: String },                 // HTML (Tiptap), legacy rows unsanitized
  mainPhoto:       { type: String, required: true },  // FULL URL, e.g. https://sayfyho-memorial.s3.eu-central-1.amazonaws.com/<key>
  photoGallery:    [{ type: String }],                // full URLs (≤10)
  filesFromEditor: [{ type: String }],                // full URLs of images inserted in `text`
  aktualitaUrl:    { type: String },                  // slug — public URL, never rewritten
  previousSlugs:   [{ type: String }],                // NEW, additive, optional (rename redirects)
}, { timestamps: true })
export const Aktualita = model('Aktualita', aktualitaSchema, 'aktualitas')

// galleries
const gallerySchema = new Schema({
  title:      { type: String, required: true, unique: true },  // in practice the year, e.g. "2023"
  images:     [{ type: String }],                               // full URLs; images[0] is the cover
  galleryUrl: { type: String },                                 // slug
}, { timestamps: true })
export const Gallery = model('Gallery', gallerySchema, 'galleries')

// staticpages — only propozice (_id 635c21aea369bc4f74025d04)
const staticPageSchema = new Schema({
  title:  { type: String, required: true },
  text:   { type: String },
  assets: [{ type: String }],                         // full URLs of editor images
  slug:   { type: String, index: true },              // NEW, additive: "propozice"
}, { timestamps: true })
export const StaticPage = model('StaticPage', staticPageSchema, 'staticpages')
```

Do **not** declare `toJSON` transforms. Repositories map documents to plain DTOs (`id: string`,
ISO dates) explicitly, which is also what lets RSC → client props serialise cleanly.

### Data-quality quirks to handle (don't "fix" them in the DB)
- **News slugs may contain punctuation** (`normalizeStringToUrl` only replaced whitespace) and are
  **stale after a title edit** (the pre-save hook wrote `staticPageUrl` by mistake). Look slugs up
  exactly as stored, with `decodeURIComponent` on the route param. New slugs use the strict `slugify`.
- **Gallery images may reference objects that no longer exist,** or that exist with odd keys. Treat
  any URL on an allowed host as valid; render a neutral placeholder `onError` in the lightbox.
- **The FE model had `perex`,** which doesn't exist in the DB. Drop it. The excerpt is derived from
  `text` (strip tags, first ~160 chars) for cards and meta descriptions.
- **Legacy `update` wrote `video` and `imagesFromEditor`** (not in the schema, so dropped).
  `filesFromEditor` was never updated on edit. Recompute it from `text` on every save.
- **Image URLs are full S3 URLs.** Some may be on the CloudFront host. Both are allow-listed and
  `storageKeyFromUrl` handles both.

## New collections (additive)

```ts
// results — replaces public/data/vysledky.json (8 entries, 2017–2026)
{ year: Number /* unique */, edition: Number, url: String, note?: String, timestamps }
// seed: scripts/seed-results.ts reads ../sayfy-frontend-ts/public/data/vysledky.json (rok→year, rocnik→edition)

// settings — singleton { _id: "site" }
{ raceDate: Date,            // next race, default 28. 9. of the next year at 10:00 Europe/Prague (confirm start time)
  edition: Number,           // ročník of the next race (17 for 2027)
  registrationUrl: String,   // e.g. https://sportt.cz/register/1544
  registrationOpen: Boolean,
  updatedAt }
// seed: raceDate 2027-09-28, edition 17, registrationUrl from register-button.tsx, registrationOpen false

// partners — replaces public/logos/support/*-transparent.png (9 logos)
{ name: String, logoUrl: String, url?: String, order: Number, timestamps }
// seed: scripts/seed-partners.ts uploads the 9 PNGs to S3 `partners/` — names + links must be supplied (see 07 open questions)
```

```ts
// pagecontents — one doc per page: _id ∈ "site" | "home" | "sayfy" | "kontakt" | "podpora"
// Schemas, DTOs and defaults (= today's hard-coded legacy copy) are in docs/08-content-editing.md §B2.
// No seed needed: the repository merges stored data over the defaults. A doc appears on first admin save.
```

The **ročník numbering isn't continuous with years** (12 = 2020, then 13 = 2023, because 2021/22 were
skipped), so `edition` is stored, never computed from the year.

## Auth compatibility

Format (`../sayfy-backend-ts/src/services/password.ts`):

```
password = hex(pbkdf2(plain, saltHex, 25000, 512, 'sha256')) + "." + saltHex
           └─ 1024 hex chars ──────────────────────────────┘     └─ 64 hex chars ┘
```

- Same pbkdf2 parameters as zive's passport-local-mongoose hashes. The difference is storage: one
  `password` field with `hash.salt`, not separate `hash`/`salt` fields.
- **Unit test against a real (redacted) hash from the DB.** Capture one admin's stored value + a
  known password in the **test copy** (reset it there with `scripts/create-admin.ts --reset`).
  This is the single most important test in the project.
- New passwords (change password, create-admin) use the **same format** during the parallel run, so
  the legacy app can still verify them.

### Post-cutover hardening (Phase 7, after the legacy backend is off)
25 000 pbkdf2 iterations is far below today's recommendation (OWASP: 600 000 for PBKDF2-SHA256).
Once nothing else reads `users.password`:
1. Introduce a prefixed format, e.g. `scrypt$N=131072,r=8,p=1$<salt>$<hash>` (Node's built-in
   `crypto.scrypt`, no dependency).
2. On successful login with a legacy value, **re-hash transparently** and store the new format.
3. `verify` dispatches on the prefix. The un-prefixed value means legacy.

This can't be done earlier, because the legacy backend would lock admins out.

## Test database (do this before any write)

Reuse zive's `scripts/clone-prod-to-test.ts` (mongodump → mongorestore with ns remap → sanitise):
- Target DB name must contain `test` (the script enforces this), e.g. `sayfy-next-test`.
- Sanitise: there's barely any PII here (admin emails only). Optionally set a known
  `TEST_ADMIN_PASSWORD` on the copy so login can be tested.
- **Don't copy `logs`** (`--nsExclude '<db>.logs'`). It's large and full of IPs.
- The app's `.env.local` `MONGODB_URI` points at the **test** DB. `MONGODB_URI_PROD` is only used by
  the clone script.
- Point dev uploads at a **separate test bucket** (or a `test/` prefix with its own IAM policy) so
  experiments don't pollute `sayfyho-memorial`.

## Verification script (Phase 7)
`scripts/verify-migration.ts` (read-only): counts per collection vs. the legacy API responses;
every user has a parsable `password`; every news item has `title`, `mainPhoto`, a unique
`aktualitaUrl`; every gallery has a unique `galleryUrl`; the `staticpages` doc with
`slug:"propozice"` exists; `settings` singleton present; every stored image URL is on an allowed
host (report, don't fail, for missing objects: HEAD a sample).

## Backups before cutover
Atlas snapshot (or `mongodump`) right before switching DNS, plus an S3 inventory listing (or enable
bucket versioning) before the first `s3-orphans --delete` run, which is the **only** destructive
storage operation in the plan.
