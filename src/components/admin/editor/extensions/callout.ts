import { mergeAttributes, Node } from "@tiptap/react";

export const CALLOUT_VARIANTS = ["info", "warning"] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    callout: { toggleCallout: (variant: CalloutVariant) => ReturnType };
  }
}

/** Highlighted box ("Důležité" notes in propozice): <div data-callout="info|warning">. */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "paragraph+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "info",
        parseHTML: (el) =>
          el.getAttribute("data-callout") === "warning" ? "warning" : "info",
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-callout": node.attrs.variant }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleCallout:
        (variant) =>
        ({ commands, editor }) =>
          editor.isActive(this.name, { variant })
            ? commands.lift(this.name)
            : commands.wrapIn(this.name, { variant }),
    };
  },
});
