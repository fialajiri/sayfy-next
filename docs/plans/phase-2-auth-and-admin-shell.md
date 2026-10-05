# Phase 2 — Auth + admin shell

**Goal:** existing admins log in with their **current** password; the `/admin` area is
server-guarded and has its final shell (sidebar, dashboard skeleton, account page).

**Estimate:** ~1.5–2 days · **Source of truth:** `docs/03` §1–2, `docs/05` §Auth. Reuse zive:
`src/auth.ts`, `server/actions/guards.ts`, `server/application/rate-limit.ts` + Upstash adapter,
`components/auth/login-form.tsx`, `change-password-form.tsx`, `logout-button.tsx`.

**Exit criteria:**
- [ ] A real admin account from the test copy logs in with its known password. A wrong password
      and an unknown email give the **same** generic error.
- [ ] `/admin/*` without a session → redirect to `/prihlaseni?next=…`; a non-admin user (create one
      in the test DB with `isAdmin:false`) → 403 page.
- [ ] The 6th failed attempt within 15 min (IP or email) is rate-limited with a Czech message.
- [ ] `verifyLegacyPassword` test against a real stored value passes.

## ⚠️ Key gotchas
1. **The format is `hash.salt` in one `password` field,** not zive's separate `hash`/`salt`. Split
   on the **first** `.` (hex never contains dots). Salt = the hex **string**, not decoded bytes.
2. **`password` is `select:false`.** Only `findByEmailWithPassword` selects it, and it's never in a DTO.
3. **Guards live in every action and the presign route,** not just in the layout. Server actions are
   public HTTP endpoints.
4. **Email lookup:** legacy stored emails as typed. Normalise to lowercase+trim for the **query**
   using a case-insensitive collation/regex-escaped match, but don't rewrite stored values.
5. **Auth.js v5 beta:** read its current docs for the `authorize` error API (`CredentialsSignin`
   subclass) and the Next 16 integration. Zive's file is a working reference for beta.31; verify on
   beta.32.
6. **Keep new hashes in the legacy format** until cutover (the legacy backend must still verify them).

## 1. Crypto + repository
- [ ] `infrastructure/auth/password.ts`: `verifyLegacyPassword`, `hashLegacyPassword` (`03` §1).
- [ ] `UserRepository.findByEmailWithPassword`, `findById`, `updatePassword`.

## 2. Auth.js
- [ ] `src/auth.ts`: Credentials provider; `authorize` → Zod parse → rate limit → lookup → verify →
      `{ id, email, isAdmin }`. Callbacks put `id` and `isAdmin` in the token/session. Session
      `maxAge: 8h`. `pages.signIn: '/prihlaseni'`.
- [ ] Type augmentation for `Session['user']` (`id`, `isAdmin`).
- [ ] `app/api/auth/[...nextauth]/route.ts`.
- [ ] `server/actions/auth.ts`: `loginAction` (useActionState, generic errors, honours a **same-origin
      relative** `next` param only), `logoutAction`.

## 3. Rate limit
- [ ] Copy zive's `RateLimiter` port, `checkRateLimit`, and the Upstash adapter (sliding window 5/15 min,
      keys `ip:` + `id:`). If env is missing in dev, fall back to an allow-all limiter with a console
      warning. **Production must fail closed** (refuse to start the limiter → log an error and use a
      conservative in-memory limiter).

## 4. Guards + admin shell
- [ ] `server/actions/guards.ts` `requireAdmin()` (copy zive, `session.user.isAdmin`).
- [ ] `app/admin/layout.tsx`: `auth()` → redirect/403. `SessionProvider`. shadcn `Sidebar` with the
      nav from `06` §10, "Zobrazit web ↗", logout.
- [ ] `app/admin/page.tsx`: dashboard skeleton (race-status card reading settings, counts).
- [ ] `app/admin/ucet/page.tsx`: change password (current + new ≥12 + confirm) →
      `changePasswordAction` (`requireAdmin`, verify current, `hashLegacyPassword`).
- [ ] `(auth)/prihlaseni/page.tsx` designed per `06` (asphalt card), redirect to `/admin` when already
      logged in.
- [ ] Optional `proxy.ts`: coarse redirect for `/admin/:path*` without a session cookie.

## 5. Public admin shortcut
- [ ] `components/site/admin-shortcut.tsx` (client): `useSession()`. When admin, a floating pill
      "Upravit" linking to the admin page for the current entity (pages pass `editHref`). Wrap only
      this island in a `SessionProvider` so public pages stay static.

## 6. Scripts
- [ ] `scripts/create-admin.ts --email x [--reset]`: prompts for the password (no echo), writes the
      legacy format, refuses non-test DBs without `--prod --yes`.

## Tests
- [ ] `password.test.ts`: real redacted stored value + known password verifies; wrong password fails;
      malformed values (`""`, no dot, odd hex) → false, no throw; round-trip; format assertion
      (1024 hex `.` 64 hex).
- [ ] `authenticate` use case: unknown email and wrong password → same error; rate-limited →
      distinct error; non-admin user can log in but `requireAdmin` rejects.
- [ ] `guards.test.ts` + a table-driven test that every export of `server/actions/*` (except auth)
      returns `forbidden` without a session.
- [ ] `login-form` component test: errors are announced (`role="alert"`), pending state.
