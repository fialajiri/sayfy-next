import type { Editor } from "@tiptap/react";

// Named editor commands, so the toolbar has no inline handlers and the command
// set can be tested on its own. Each focuses the editor first.
export function commands(editor: Editor) {
  const c = () => editor.chain().focus();
  return {
    bold: () => c().toggleBold().run(),
    italic: () => c().toggleItalic().run(),
    underline: () => c().toggleUnderline().run(),
    strike: () => c().toggleStrike().run(),
    superscript: () => c().toggleSuperscript().run(),
    subscript: () => c().toggleSubscript().run(),
    highlight: () => c().toggleHighlight().run(),
    clearFormatting: () => c().unsetAllMarks().clearNodes().run(),
    paragraph: () => c().setParagraph().run(),
    h2: () => c().toggleHeading({ level: 2 }).run(),
    h3: () => c().toggleHeading({ level: 3 }).run(),
    h4: () => c().toggleHeading({ level: 4 }).run(),
    bulletList: () => c().toggleBulletList().run(),
    orderedList: () => c().toggleOrderedList().run(),
    alignLeft: () => c().setTextAlign("left").run(),
    alignCenter: () => c().setTextAlign("center").run(),
    alignRight: () => c().setTextAlign("right").run(),
    alignJustify: () => c().setTextAlign("justify").run(),
    blockquote: () => c().toggleBlockquote().run(),
    calloutInfo: () => c().toggleCallout("info").run(),
    calloutWarning: () => c().toggleCallout("warning").run(),
    horizontalRule: () => c().setHorizontalRule().run(),
    hardBreak: () => c().setHardBreak().run(),
    unlink: () => c().unsetLink().run(),
    insertTable: () =>
      c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    undo: () => c().undo().run(),
    redo: () => c().redo().run(),
    // table (bubble menu)
    addColumnBefore: () => c().addColumnBefore().run(),
    addColumnAfter: () => c().addColumnAfter().run(),
    deleteColumn: () => c().deleteColumn().run(),
    addRowBefore: () => c().addRowBefore().run(),
    addRowAfter: () => c().addRowAfter().run(),
    deleteRow: () => c().deleteRow().run(),
    mergeOrSplit: () => c().mergeOrSplit().run(),
    toggleHeaderRow: () => c().toggleHeaderRow().run(),
    toggleHeaderColumn: () => c().toggleHeaderColumn().run(),
    deleteTable: () => c().deleteTable().run(),
  };
}

export type EditorCommands = ReturnType<typeof commands>;
