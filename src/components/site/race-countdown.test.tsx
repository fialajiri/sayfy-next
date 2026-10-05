import { render, screen } from "@testing-library/react";
import { RaceCountdown } from "./race-countdown";

describe("RaceCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-08-24T09:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("exposes a static, screen-reader friendly day count", () => {
    render(<RaceCountdown startIso="2027-09-28T09:00:00.000Z" daysLeft={35} />);
    expect(screen.getByText("Do startu zbývá 35 dní.")).toBeInTheDocument();
  });

  it("renders live tiles from the client clock (35 days, 00:00:00 left)", () => {
    const { container } = render(
      <RaceCountdown startIso="2027-09-28T09:00:00.000Z" daysLeft={35} />,
    );
    const values = [
      ...container.querySelectorAll("ol li span:first-child"),
    ].map((el) => el.textContent);
    expect(values).toEqual(["35", "00", "00", "00"]);
    expect(container.querySelector("ol")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
