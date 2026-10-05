# Phase 0 — Scaffold, tooling, design foundation

**Status: ✅ Done (2026-10-05).** All checks green (`typecheck`, `lint`, `test` 8 tests, `format:check`,
`build`). Verified in a real browser at 1440 and 390 px: no horizontal overflow, mobile menu dialog
accessible, security headers + CSP present, **no CSP violations in production**, `/login` → 308, and the
styleguide 404s in production. Not done yet: the Vercel preview deploy (needs your Vercel project).

**Goal:** an empty but **fully themed** app that builds, lints, tests and deploys to a Vercel
preview. The brand tokens, fonts, dark mode and base components are in place, so Phase 1 can build
pages directly in the final design.

**Estimate:** ~1–1.5 days · **Source of truth:** `docs/01-architecture.md`, `docs/02-libraries.md`,
`docs/06-design-system.md`. Reference implementation: `../../zive-teplice/zive-teplice-next`.

**Exit criteria:**
- [x] `npm run build`, `typecheck`, `lint`, `test`, `format:check` all green.
- [x] `/admin/styleguide` (dev-only) renders every colour token (light + dark), the type scale,
      buttons, inputs, cards, the bib card and the checker band.
- [ ] Vercel preview deployment works *(pending: needs the Vercel project)*; security headers present (`curl -I`) ✅ verified on `next start`.

## ⚠️ Key gotchas
1. **This is Next 16, not your training data.** Read `node_modules/next/dist/docs/01-app/**` before
   writing framework code (`proxy.ts` instead of `middleware.ts`, async `params`/`searchParams`,
   caching model). Copy zive's `AGENTS.md` rule into this repo.
2. **Pins:** `typescript@6.0.3`, `eslint@9.39.5` (see `02`). `create-next-app` will install the latest
   versions, so downgrade those two immediately and commit the lockfile.
3. **Fonts need `latin-ext`.** Without it, Czech diacritics fall back to a system font mid-word.
4. **Vitest 5 / jest-dom 7** are newer than zive's. Port the config, then read the migration notes
   if anything breaks.
5. **CSP in dev:** Turbopack HMR needs `eval`, so use Report-Only in dev and enforce in prod (zive's
   approach).

## 1. Project
- [x] `npx create-next-app@latest sayfy-next --ts --app --tailwind --eslint --src-dir --import-alias "@/*"`
      (run in `../`, or init into this folder keeping `docs/`).
- [x] `git init`, `.gitignore` (`.env*`, `.next`, `.playwright-mcp`), first commit with docs.
- [x] `package.json` `engines.node >=24`, `browserslist` as in zive, scripts as in zive
      (`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `format`, `format:check`,
      `db:check`, `db:clone-to-test`, `prepare`).
- [x] Copy from zive: `.prettierrc.json`, `.prettierignore`, `eslint.config.mjs`, `vitest.config.ts`,
      `vitest.setup.ts`, `.husky/pre-commit`, `lint-staged` config.
- [x] `CLAUDE.md` + `AGENTS.md` adapted from zive (project description, Sayfy specifics: `hash.salt`
      password format, pinned collections, S3 host list, "read docs/ first").

## 2. UI foundation
- [x] `npx shadcn@latest init` → `base-nova`, lucide, CSS variables. `components.json` like zive.
- [x] Copy zive's `components/ui/*` (button, badge, dialog, input, pagination, popover, skeleton,
      sonner). Generate: `label field textarea switch select alert-dialog sheet dropdown-menu table
      card tooltip separator progress calendar sidebar`.
- [x] `lib/utils.ts` `cn()`.

## 3. Design tokens (`src/app/globals.css`)
- [x] `@theme` with the palette from `06` §2 (OKLCH), mapped to shadcn semantic tokens for `:root`
      and `.dark`. **Hero/footer surfaces always use the asphalt tokens.**
- [x] Fluid type scale, radius, shadow, easing and duration tokens.
- [x] `@layer base`: `focus-visible` ring (sayfy-700 / signal on dark), `::selection`,
      `scroll-padding-top` for the sticky header, `prefers-reduced-motion` global reset.
- [x] Utilities: `.checker-band` (conic-gradient), `.kicker` (slanted signal bar), `.bib` card base.
- [x] Verify the contrast pairs from `06` §2 with the final OKLCH values. Document any deltas there.

## 4. Fonts & root layout
- [x] `next/font/google`: Barlow Condensed (700, 800, italic), Geist, Geist Mono, all
      `subsets: ['latin','latin-ext']`, exposed as CSS variables in `@theme` (`--font-display`, …).
- [x] `app/layout.tsx`: `<html lang="cs">`, `ThemeProvider` (next-themes, `attribute="class"`),
      `<Toaster/>`, default `metadata` (title template `%s · Sayfyho Memorial`, legacy
      description + keywords, `metadataBase` from `NEXT_PUBLIC_SITE_URL`).
- [x] `(site)/layout.tsx` with a placeholder `site-header` (logo, nav links, socials, Sheet on mobile)
      and `site-footer` (nav, socials, codeFactory credit `main@codefactory.cz`, theme toggle).
- [x] Copy brand assets from `../sayfy-frontend-ts/public` → `public/` (logos, Sayfy photos, icons
      asterisk/cross, video + webm, favicon). **Don't** copy `public/data/*.json`, `aktualita-image-*`
      placeholders, the unsplash photo, or the editor SVG icons.

## 5. `next.config.ts`
- [x] `serverExternalPackages: ['mongoose']`.
- [x] `images.remotePatterns`: `sayfyho-memorial.s3.eu-central-1.amazonaws.com`,
      `d3o6i10cj9gxf0.cloudfront.net`, plus `S3_PUBLIC_HOST` from env (zive pattern).
- [x] Headers: zive's set + CSP with `frame-src https://sportt.cz https://www.sportt.cz
      https://www.youtube-nocookie.com`, `media-src 'self'` (+ CloudFront if the video moves),
      `connect-src 'self' blob: https://<bucket>.s3.<region>.amazonaws.com`.
- [x] `redirects()`: legacy admin paths + `/login` (see `04` route map).

## 6. Env
- [x] `.env.example`:
  ```
  MONGODB_URI=            # TEST db for local dev (name contains "test")
  MONGODB_URI_PROD=       # only for scripts/clone-prod-to-test.ts
  AUTH_SECRET=            # npx auth secret
  AWS_REGION=eu-central-1
  AWS_BUCKET_NAME=sayfyho-memorial
  AWS_ACCESS_KEY_ID=
  AWS_SECRET_ACCESS_KEY=
  S3_PUBLIC_HOST=sayfyho-memorial.s3.eu-central-1.amazonaws.com
  NEXT_PUBLIC_SITE_URL=http://localhost:3000   # production: https://www.sayfy.cz
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  ```
- [x] `lib/env.ts`: a Zod-parsed server env (server-only), failing fast with a clear message.

## 7. Styleguide
- [x] `app/admin/styleguide/page.tsx`: `notFound()` in production. Renders tokens, type, components
      in all states, the bib, checker and kicker motifs, light/dark side by side.

## Tests
- [x] A smoke test that `cn()` merges, plus an `env` parse test (missing var → readable error).
