# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Whenever working with any third-party library, look up the official documentation (context7 MCP or
the DocsExplorer subagent) — most of this stack is newer than your training data.

@AGENTS.md

> **This is Next.js 16.4, not the version in your training data.** Read the bundled guides in
> `node_modules/next/dist/docs/` before writing framework code (16.3 omitted them; 16.4 ships them again).
> Heed deprecation notices (`src/proxy.ts` replaces `middleware.ts`, async `params`/`searchParams`).

## Commands

```bash
npm run dev            # dev server (Turbopack)
npm run build          # production build
npm run typecheck      # next typegen && tsc --noEmit (typegen creates LayoutProps/PageProps)
npm run lint           # eslint
npm test               # vitest run
npm run test:watch     # vitest watch
npm run format         # prettier --write .
npm run format:check   # prettier --check .
```

Single test: `npx vitest run src/lib/env.test.ts` · `npx vitest run -t "name"`. Tests live next to
source as `*.test.ts(x)` (jsdom, globals on, jest-dom matchers). Pre-commit runs lint-staged
(eslint --fix + prettier) and typecheck.

## What this project is

One Next.js App Router app (frontend + backend) that **replaces two legacy projects** for the
**Sayfyho Memorial** MTB race (`https://www.sayfy.cz`):

- `../sayfy-backend-ts` — Express 4 + Mongoose 6 + custom JWT cookies (Heroku)
- `../sayfy-frontend-ts` — Next 12 Pages Router + SCSS (Vercel, currently serving www.sayfy.cz)

The MongoDB Atlas data and the `sayfyho-memorial` S3 bucket are kept **as-is**. Copy is Czech;
public URLs are identical to the legacy site. It also ships a **full redesign** and makes
**everything admin-editable** (like zive-teplice).

**Read `docs/` before implementing — it is the source of truth.** Status lives in
`docs/plans/phase-*.md` (checkboxes). Current: **Phase 2 done** (admin login + shell), next is Phase 3 (Aktuality CRUD + uploads + full editor).

- `docs/01-architecture.md` — layering, folders, data flow, what to reuse from zive-teplice
- `docs/03-backend-plan.md` — endpoint map, uploads, S3 cleanup, legacy security holes to fix
- `docs/05-data-and-auth-migration.md` — pinned collections, `hash.salt` password format
- `docs/06-design-system.md` — palette, type, motifs, page designs
- `docs/08-content-editing.md` — rich-text editor spec + admin-editable page content model
- `docs/07-roadmap.md` — phases + open questions

Reuse from `../../zive-teplice/zive-teplice-next` wherever the docs say so (upload kit, presign
route, guards, rate limiter, DB connection, lightbox, page-content CMS pattern). Its rich-text editor
is **not** sufficient — see `docs/08`.

## Architecture

```
app/**                 Presentation — RSC pages, route handlers, server actions (thin)
server/application     Use cases: orchestration + DTOs, no framework imports
server/domain          Entities, value objects, pure rules, port interfaces (zero deps)
server/infrastructure  Mongoose models/repos, S3, password crypto, rate limiter
server/container.ts    Composition root
```

Pages/actions call use cases, never Mongoose. Every infrastructure/container/action module imports `'server-only'` (domain + application stay pure).
Public reads = RSC + ISR; admin writes = server actions + Zod + `requireAdmin()` + `revalidatePath`.

## Conventions specific to this repo

- **Path alias** `@/*` → `src/*`.
- **UI:** shadcn/ui `base-nova` on **Base UI** (`@base-ui/react`, `render` prop — not Radix
  `asChild`). `cn()` comes from shadcn's **`cn` package** (replaces clsx + tailwind-merge), re-exported
  by `@/lib/utils`. Generated `components/ui/*` strings were translated to Czech — keep it that way
  when adding components.
- **Design tokens** in `src/app/globals.css`: brand palette (`asphalt-*`, `paper`, `ink`, `sayfy-*`,
  `signal`, `gold-*`), fluid type (`text-hero`, `text-display-1..3`), utilities `font-display-upper`,
  `kicker`, `checker-band`, `bib`. **Always-dark sections** (header, hero, footer, results): add the
  `dark` class to the section. `.light` forces light tokens. Contrast pairs are verified (docs/06 §2):
  never white text on `sayfy-500`, never `gold-400` on light.
- **Fonts:** Barlow Condensed (`font-display`, brand headings), Geist (`font-sans`/`font-heading`, UI),
  Geist Mono (numbers). All `latin-ext`. `next/font` options must be inline literals.
- **No visitor-facing copy literals in JSX** from Phase 1 on — page copy comes from `pagecontents`
  with defaults (docs/08 §B4). UI chrome (button labels, aria) is fine.
- **Legacy password compat:** single `password` field `"<hashHex>.<saltHex>"`, pbkdf2 25000 / 512 /
  sha256, salt = hex **string**. Unit-test against a real (redacted) stored value.
- **Pinned deps:** TypeScript **6.x** (not 7 — typescript-eslint peer `<6.1`), ESLint **9.x** (not 10
  — eslint-plugin-react peer). `next-auth@beta`. Don't bump blindly.
- **Known audit noise:** 5 "high" findings are one dev-only chain (`eslint-config-next` →
  `fast-glob` → `micromatch` → `braces@3.0.3`, no patched release exists). Never run
  `npm audit fix --force` (it "fixes" by downgrading to Next 14).
- **CSP** (`next.config.ts`): enforced in production, Report-Only in dev (Turbopack HMR uses eval —
  the dev console `unsafe-eval` reports are expected). `frame-src` allows only sportt.cz +
  youtube-nocookie.
- `/styleguide` is dev-only (404 in production) — visual QA for tokens/components.
- Env: copy `.env.example` → `.env.local`. Local `MONGODB_URI` must be the **test** DB
  (`sayfyho-memorial-test`, refresh with `npm run db:clone-to-test -- --yes`; `MONGODB_URI_PROD` is only
  read by that script). `npm run db:check` (read-only), `npm run db:seed` (test-only guard).
- **Race schedule is fixed:** 28. 9. at 11:00 Prague, computed in `server/domain/race-status.ts`.
  Never store a race date.
- **Legacy data quirks:** news slugs contain `!` `,` `.`, so look them up exactly as stored (decode the route
  param). S3 keys contain spaces, so URLs pass through `encodeImageUrl` in the repositories.
- **Never put a `loading.tsx` above a route that calls `notFound()`**: streaming makes the 404 a 200.
- **Auth:** every admin page calls `requireAdminPage(path)`, and every server action/route handler calls
  `requireAdmin()` (`server/actions/guards.ts`). The layout and `src/proxy.ts` are NOT security
  boundaries. `guard-coverage.test.ts` enforces it for every module in `server/actions/` (login/logout
  are the only public ones). No client SessionProvider; the public shortcut uses the `sayfy-admin` hint cookie.
- Test admin: `test-admin@example.test` / `TEST_ADMIN_PASSWORD` (test DB only). `scripts/create-admin.ts`.
- Use cases live in `server/application` (pure, take ports as args); `server/container.ts` wires repos.
  Page copy comes from `getPageContent(container.pageContent, key)`.
