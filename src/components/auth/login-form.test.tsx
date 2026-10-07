import { render, screen } from "@testing-library/react";
import { LoginForm } from "./login-form";

vi.mock("@/server/actions/auth", () => ({ loginAction: vi.fn() }));

describe("LoginForm", () => {
  it("has labelled fields with password-manager friendly autocomplete", () => {
    render(<LoginForm next="/admin" />);
    expect(screen.getByLabelText("E-mail")).toHaveAttribute(
      "autocomplete",
      "username",
    );
    expect(screen.getByLabelText("Heslo")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.getByRole("button", { name: "Přihlásit se" })).toBeEnabled();
  });

  it("has an alert region for errors", () => {
    render(<LoginForm next="/admin" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
