import type { UserWithPassword } from "@/server/domain/auth";
import { authenticateAdmin } from "./authenticate";

const admin: UserWithPassword = {
  id: "1",
  email: "Admin@Sayfy.cz",
  isAdmin: true,
  password: "stored",
};
const editor: UserWithPassword = { ...admin, id: "2", isAdmin: false };

function deps(user: UserWithPassword | null, passwordOk: boolean) {
  const findByEmailWithPassword = vi.fn(async () => user);
  return {
    users: { findByEmailWithPassword },
    passwords: { verify: vi.fn(async () => passwordOk) },
    findByEmailWithPassword,
  };
}

describe("authenticateAdmin", () => {
  it("returns the session user for a valid admin, normalising the email", async () => {
    const d = deps(admin, true);
    const result = await authenticateAdmin(d, {
      email: "  ADMIN@sayfy.cz ",
      password: "x",
    });
    expect(result).toEqual({
      ok: true,
      value: { id: "1", email: "Admin@Sayfy.cz", isAdmin: true },
    });
    expect(d.findByEmailWithPassword).toHaveBeenCalledWith("admin@sayfy.cz");
  });

  it("fails identically for unknown email, wrong password, non-admin and bad input", async () => {
    const failure = { ok: false, error: { kind: "invalid_credentials" } };
    expect(
      await authenticateAdmin(deps(null, true), {
        email: "a@b.cz",
        password: "x",
      }),
    ).toEqual(failure);
    expect(
      await authenticateAdmin(deps(admin, false), {
        email: "a@b.cz",
        password: "x",
      }),
    ).toEqual(failure);
    expect(
      await authenticateAdmin(deps(editor, true), {
        email: "a@b.cz",
        password: "x",
      }),
    ).toEqual(failure);
    expect(
      await authenticateAdmin(deps(admin, true), {
        email: "not-an-email",
        password: "x",
      }),
    ).toEqual(failure);
    expect(
      await authenticateAdmin(deps(admin, true), {
        email: "a@b.cz",
        password: "",
      }),
    ).toEqual(failure);
  });
});
