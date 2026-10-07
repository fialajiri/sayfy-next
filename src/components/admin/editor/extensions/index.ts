import FileHandler from "@tiptap/extension-file-handler";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Youtube from "@tiptap/extension-youtube";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import type { Editor, Extensions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Attachment } from "./attachment";
import { Callout } from "./callout";
import { FigureImage } from "./figure-image";

export const ACCEPTED_DROP_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

type ExtensionOptions = {
  placeholder?: string;
  /** Called for files dropped or pasted into the editor. Omit to disable. */
  onFiles?: (editor: Editor, files: File[], position?: number) => void;
};

// One extension list shared by the editor and the round-trip tests (docs/08 §A3).
export function editorExtensions({
  placeholder = "Začněte psát…",
  onFiles,
}: ExtensionOptions = {}): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      code: false,
      codeBlock: false,
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        protocols: ["http", "https", "mailto", "tel"],
      },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
    }),
    Subscript,
    Superscript,
    TextStyle,
    Color,
    Highlight,
    FigureImage,
    Attachment,
    Callout,
    TableKit.configure({ table: { resizable: false } }),
    Youtube.configure({
      nocookie: true,
      modestBranding: true,
      width: 640,
      height: 360,
    }),
    Placeholder.configure({ placeholder }),
    CharacterCount,
    ...(onFiles
      ? [
          FileHandler.configure({
            allowedMimeTypes: ACCEPTED_DROP_MIME,
            onDrop: (editor, files, position) =>
              onFiles(editor, files, position),
            onPaste: (editor, files) => onFiles(editor, files),
          }),
        ]
      : []),
  ];
}
