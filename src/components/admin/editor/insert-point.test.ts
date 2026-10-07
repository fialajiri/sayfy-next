import { Editor } from "@tiptap/react";
import { editorExtensions } from "./extensions";
import { chainAtInsertPoint } from "./use-editor-uploads";

describe("chainAtInsertPoint", () => {
  it("inserts after a selected image instead of replacing it", () => {
    const editor = new Editor({
      extensions: editorExtensions(),
      content: "<p>a</p>",
    });
    editor
      .chain()
      .focus("end")
      .setImage({ src: "https://x/a.jpg", alt: "" })
      .run();
    expect(editor.state.selection.constructor.name).toBe("NodeSelection");
    chainAtInsertPoint(editor)
      .insertAttachment({
        href: "https://x/p.pdf",
        name: "p.pdf",
        size: "1 kB",
        mime: "application/pdf",
      })
      .run();
    const html = editor.getHTML();
    expect(html).toContain('src="https://x/a.jpg"');
    expect(html).toContain("p.pdf");
    expect(html.indexOf("a.jpg")).toBeLessThan(html.indexOf("p.pdf"));
    editor.destroy();
  });
});
