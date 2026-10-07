import { fireEvent, render, screen } from "@testing-library/react";
import { YoutubeDialog } from "./dialogs";

describe("editor dialogs inside a form", () => {
  it("submitting a dialog does not submit the surrounding article form", () => {
    const outerSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const onInsert = vi.fn();
    render(
      <form onSubmit={outerSubmit}>
        <YoutubeDialog open onClose={() => undefined} onInsert={onInsert} />
      </form>,
    );
    fireEvent.change(screen.getByLabelText("Odkaz na video"), {
      target: { value: "https://youtu.be/dQw4w9WgXcQ" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Vložit video" }));
    expect(onInsert).toHaveBeenCalledWith("dQw4w9WgXcQ");
    expect(outerSubmit).not.toHaveBeenCalled();
  });
});
