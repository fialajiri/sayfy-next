# Phase 7 — Verification, staging, cutover

**Goal:** the new app serves production traffic on the production DB + bucket; Heroku and the old
Vercel project are retired; post-cutover hardening is done.

**Estimate:** ~1–2 days · **Source of truth:** `docs/05` (verification, backups, post-cutover
hardening), `docs/aws/*`.

**Exit criteria:**
- [ ] `verify-migration` passes against a fresh test clone **and** (read-only) against prod.
- [ ] Production deployment is live on `https://www.sayfy.cz` (apex `sayfy.cz` → 308 → `www`); legacy URLs (`/fotogalerie/2023`,
      `/aktuality/<old-slug>`, `/vysledky/2020`, `/login`) all work or redirect.
- [ ] Admin logs in on prod with their existing password; one real edit round-trip (news) works.
- [ ] Legacy services stopped (after a 1–2 week overlap); docs updated with the final state.

## 1. Pre-cutover
- [ ] Fresh `db:clone-to-test`, run all seeds on it, `scripts/verify-migration.ts` (see `05`).
- [ ] Staging deployment (Vercel preview with test DB + test bucket) — full manual QA checklist:
      every public page, every admin flow, both themes, phone + desktop.
- [ ] Production env on Vercel: `MONGODB_URI` (prod, **least-privilege Atlas user**: readWrite on the
      sayfy DB only), `AUTH_SECRET` (new), AWS keys for an IAM user with `docs/aws/iam-uploads-policy.json`
      only, `S3_PUBLIC_HOST`, `NEXT_PUBLIC_SITE_URL=https://www.sayfy.cz`, Upstash.
- [ ] Apply `docs/aws/s3-cors.json` (origin `https://www.sayfy.cz`; localhost only on the test bucket).
- [ ] Atlas snapshot + S3 inventory/versioning on.

## 2. Cutover
- [ ] Run the seeds against prod (`--prod --yes`): results, settings (current real values!),
      propozice slug, partners. All additive; the legacy app ignores them.
- [ ] **Domain move (DNS already on Vercel, nothing to change at the registrar):** in the Vercel
      dashboard remove `www.sayfy.cz` + `sayfy.cz` from the legacy project (`sayfy-frontend-ts`) and
      add them to `sayfy-next` (same team/account, so verification is instant). Recreate the apex →
      `www` 308 redirect on the new project. Expect a few seconds of TLS re-issue. Do it in a quiet
      hour, **not** near 28. 9.
- [ ] Rollback = move the two domains back to the legacy project (keep it deployed until the
      overlap period ends).
- [ ] Smoke test production (Playwright public suite against prod URL), check Vercel logs + CSP reports.
- [ ] Submit `https://www.sayfy.cz/sitemap.xml` in Google Search Console (verify the domain via a
      Vercel DNS TXT record if not verified yet).

## 3. Post-cutover (after the overlap period)
- [ ] Stop the Heroku dyno; archive the two legacy repos (README pointer to `sayfy-next`).
- [ ] Rotate the legacy AWS key (`AWS_S3_BUCKET_ACCESS_KEY`) and the old `JWT_SECRET` / Atlas user.
- [ ] Password hardening: enable transparent re-hash to `scrypt$…` on login (`05`), with tests.
- [ ] `scripts/s3-orphans.ts`: dry run → review → `--delete` (legacy never deleted anything, so expect
      many orphans).
- [ ] Decide on the `logs` collection (open question 6), then drop or archive it.
