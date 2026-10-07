// Every exported server action must refuse callers without an admin session.
// Server actions are public HTTP endpoints — the admin layout is not a security
// boundary. New action modules are picked up automatically.
import { readdirSync } from "node:fs";
import { join } from "node:path";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Public by design: login/logout. Helpers that aren't actions are skipped too.
const PUBLIC_MODULES = new Set(["auth.ts"]);
const NOT_ACTIONS = new Set([
  "guards.ts",
  "admin-hint.ts",
  "redirect-target.ts",
]);

const modules = readdirSync(__dirname).filter(
  (file) =>
    file.endsWith(".ts") &&
    !file.endsWith(".test.ts") &&
    !PUBLIC_MODULES.has(file) &&
    !NOT_ACTIONS.has(file),
);

describe("server action guard coverage", () => {
  it("finds the action modules", () => {
    expect(modules.length).toBeGreaterThan(0);
  });

  it.each(modules)(
    "%s: every export refuses an anonymous caller",
    async (file) => {
      const mod: Record<string, unknown> = await import(join(__dirname, file));
      const actions = Object.entries(mod).filter(
        ([, value]) => typeof value === "function",
      );
      expect(actions.length).toBeGreaterThan(0);
      for (const [name, action] of actions) {
        const result = await (
          action as (...args: unknown[]) => Promise<unknown>
        )(undefined, new FormData());
        expect(JSON.stringify(result), `${file} → ${name}`).toMatch(
          /Nemáte oprávnění|"forbidden"/,
        );
      }
    },
  );
});
