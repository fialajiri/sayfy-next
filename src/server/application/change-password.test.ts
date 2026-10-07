import type { UserWithPassword } from "@/server/domain/auth";
import { changePassword } from "./change-password";

const user: UserWithPassword = {
  id: "1",
  email: "a@b.cz",
  isAdmin: true,
  password: "stored",
};

function deps(currentOk = true) {
  return {
    users: {
      findByIdWithPassword: vi.fn(async () => user),
      setPassword: vi.fn(async () => true),
    },
    passwords: {
      verify: vi.fn(async () => currentOk),
      hash: vi.fn(async () => "new-stored"),
    },
  };
}

const valid = {
  current: "old-password-1",
  next: "brand-new-password",
  confirm: "brand-new-password",
};

describe("changePassword", () => {
  it("hashes and stores the new password", async () => {
    const d = deps();
    expect(await changePassword(d, "1", valid)).toEqual({
      ok: true,
      value: true,
    });
    expect(d.passwords.hash).toHaveBeenCalledWith("brand-new-password");
    expect(d.users.setPassword).toHaveBeenCalledWith("1", "new-stored");
  });

  it("rejects a wrong current password without writing", async () => {
    const d = deps(false);
    const result = await changePassword(d, "1", valid);
    expect(result.ok).toBe(false);
    expect(d.users.setPassword).not.toHaveBeenCalled();
  });

  it("validates length, confirmation and reuse with field errors", async () => {
    const short = await changePassword(deps(), "1", {
      ...valid,
      next: "short",
      confirm: "short",
    });
    const mismatch = await changePassword(deps(), "1", {
      ...valid,
      confirm: "something-else-x",
    });
    const reuse = await changePassword(deps(), "1", {
      current: "same-password-123",
      next: "same-password-123",
      confirm: "same-password-123",
    });
    for (const [result, field] of [
      [short, "next"],
      [mismatch, "confirm"],
      [reuse, "next"],
    ] as const) {
      expect(result.ok).toBe(false);
      if (!result.ok && result.error.kind === "validation")
        expect(result.error.fieldErrors?.[field]).toBeDefined();
    }
  });
});
