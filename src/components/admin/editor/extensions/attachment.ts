import { mergeAttributes, Node } from "@tiptap/react";

export type AttachmentAttrs = {
  href: string;
  name: string;
  size: string;
  mime: string;
};

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    attachment: { insertAttachment: (attrs: AttachmentAttrs) => ReturnType };
  }
}

/**
 * Downloadable file chip (PDF, DOC, XLS…). Inline atom, serialised as
 * <a data-attachment href download>name</a>. Also parses the legacy editor's
 * `a.editor--file` links so old propozice attachments become chips.
 */
export const Attachment = Node.create({
  name: "attachment",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      href: { default: "" },
      name: { default: "", parseHTML: (el) => el.textContent?.trim() ?? "" },
      size: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-size") ?? "",
      },
      mime: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-mime") ?? "",
      },
    };
  },

  parseHTML() {
    // Above the Link mark's default (50), otherwise every <a> becomes a plain link.
    return [
      { tag: "a[data-attachment]", priority: 1000 },
      { tag: "a.editor--file", priority: 1000 },
    ];
  },

  renderHTML({ node }) {
    const { href, name, size, mime } = node.attrs as AttachmentAttrs;
    return [
      "a",
      mergeAttributes({
        href,
        "data-attachment": "",
        "data-size": size,
        "data-mime": mime,
        download: "",
        target: "_blank",
        rel: "noopener noreferrer",
        class: "attachment-chip",
      }),
      name || "soubor",
    ];
  },

  addCommands() {
    return {
      insertAttachment:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
