"use client";

import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import { useRef, useState, type ChangeEvent } from "react";
import { RichText } from "@/components/site/rich-text";
import { cn } from "@/lib/utils";
import { DOCUMENT_ACCEPT, IMAGE_ACCEPT } from "../upload/upload-client";
import {
  ImageBubbleMenu,
  LinkBubbleMenu,
  TableBubbleMenu,
} from "./bubble-menus";
import {
  ImageDetailsDialog,
  LinkDialog,
  YoutubeDialog,
  type ImageDetails,
  type LinkValue,
} from "./dialogs";
import { editorExtensions } from "./extensions";
import { Toolbar } from "./toolbar";
import {
  chainAtInsertPoint,
  useEditorUploads,
  type EditorUploadTarget,
} from "./use-editor-uploads";

type RichTextEditorProps = {
  id: string;
  value: string;
  onChange: (html: string) => void;
  upload: EditorUploadTarget;
  labelledBy?: string;
  invalid?: boolean;
};

type OpenDialog = "link" | "youtube" | "image" | null;

function missingAltCount(editor: Editor): number {
  let missing = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "image" && !String(node.attrs.alt ?? "").trim())
      missing++;
  });
  return missing;
}

export function RichTextEditor({
  id,
  value,
  onChange,
  upload,
  labelledBy,
  invalid,
}: RichTextEditorProps) {
  const uploads = useEditorUploads(upload);
  const [preview, setPreview] = useState(false);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false, // SSR-safe (Next): render after hydration
    extensions: editorExtensions({ onFiles: uploads.insertImages }),
    content: value,
    editorProps: {
      attributes: {
        id,
        class: "rich-text min-h-80 max-w-none px-5 py-4 outline-none",
        ...(labelledBy ? { "aria-labelledby": labelledBy } : {}),
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  const stats = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            words: e.storage.characterCount.words() as number,
            missingAlt: missingAltCount(e),
          }
        : { words: 0, missingAlt: 0 },
  });

  if (!editor)
    return (
      <div
        className="bg-card min-h-96 animate-pulse rounded-xl border"
        aria-busy="true"
      />
    );

  // Declared after the guard as consts so TypeScript keeps `editor` narrowed.
  const ed = editor;
  const handleImageFiles = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files)
      void uploads.insertImages(ed, [...event.target.files]);
    event.target.value = "";
  };
  const handleReplaceFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void uploads.replaceImage(ed, file);
    event.target.value = "";
  };
  const handleAttachmentFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void uploads.insertAttachment(ed, file);
    event.target.value = "";
  };
  const handleLinkSave = ({ href, newTab }: LinkValue) => {
    const chain = ed.chain().focus().extendMarkRange("link");
    (href
      ? chain.setLink({ href, target: newTab ? "_blank" : null })
      : chain.unsetLink()
    ).run();
    setDialog(null);
  };
  const handleYoutubeInsert = (videoId: string) => {
    chainAtInsertPoint(ed)
      .setYoutubeVideo({ src: `https://www.youtube.com/watch?v=${videoId}` })
      .run();
    setDialog(null);
  };
  const handleImageDetails = (details: ImageDetails) => {
    ed.chain().focus().updateAttributes("image", details).run();
    setDialog(null);
  };
  const closeDialog = () => setDialog(null);
  const openImageDetails = () => setDialog("image");
  const openLink = () => setDialog("link");
  const pickReplacement = () => replaceInput.current?.click();
  const toolbarActions = {
    preview,
    onTogglePreview: () => setPreview((p) => !p),
    onImage: () => imageInput.current?.click(),
    onAttachment: () => fileInput.current?.click(),
    onYoutube: () => setDialog("youtube"),
    onLink: openLink,
  };
  const words = stats?.words ?? 0;
  const missingAlt = stats?.missingAlt ?? 0;

  const link = editor.getAttributes("link") as {
    href?: string;
    target?: string;
  };
  const image = editor.getAttributes("image") as {
    alt?: string;
    caption?: string;
  };

  return (
    <div
      className={cn(
        "bg-card overflow-clip rounded-xl border",
        invalid && "border-destructive",
      )}
    >
      <Toolbar editor={editor} actions={toolbarActions} />
      {preview ? (
        <div className="px-5 py-4">
          <RichText html={editor.getHTML()} className="max-w-none" />
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}
      <ImageBubbleMenu
        editor={editor}
        onEditDetails={openImageDetails}
        onReplace={pickReplacement}
      />
      <LinkBubbleMenu editor={editor} onEdit={openLink} />
      <TableBubbleMenu editor={editor} />
      <footer
        className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2 text-xs"
        aria-live="polite"
      >
        <span>{words} slov</span>
        {uploads.pending > 0 && (
          <span className="text-primary">Nahrávám {uploads.pending}…</span>
        )}
        {missingAlt > 0 && (
          <span className="text-destructive">
            Chybí popis u {missingAlt} obrázku/ů — klikněte na obrázek a doplňte
            ho.
          </span>
        )}
      </footer>
      <input
        ref={imageInput}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        onChange={handleImageFiles}
      />
      <input
        ref={replaceInput}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        onChange={handleReplaceFile}
      />
      <input
        ref={fileInput}
        type="file"
        accept={DOCUMENT_ACCEPT}
        hidden
        onChange={handleAttachmentFile}
      />
      {dialog === "link" && (
        <LinkDialog
          open
          initial={{ href: link.href ?? "", newTab: link.target === "_blank" }}
          onClose={closeDialog}
          onSave={handleLinkSave}
        />
      )}
      {dialog === "youtube" && (
        <YoutubeDialog
          open
          onClose={closeDialog}
          onInsert={handleYoutubeInsert}
        />
      )}
      {dialog === "image" && (
        <ImageDetailsDialog
          open
          initial={{ alt: image.alt ?? "", caption: image.caption ?? "" }}
          onClose={closeDialog}
          onSave={handleImageDetails}
        />
      )}
    </div>
  );
}

export { missingAltCount };
