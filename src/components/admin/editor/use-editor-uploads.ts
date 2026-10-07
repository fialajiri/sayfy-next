"use client";

import { NodeSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { useState } from "react";
import { toast } from "sonner";
import { uploadFile, type UploadPrefix } from "../upload/upload-client";

export type EditorUploadTarget = {
  prefix: Extract<UploadPrefix, "aktuality" | "propozice" | "stranky">;
  scope: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Nahrání se nepodařilo.";
}

// A selected node (e.g. the image just inserted) would be REPLACED by the next
// insert, so collapse to just after it first. Exported for the YouTube insert too.
export function chainAtInsertPoint(editor: Editor, position?: number) {
  const chain = editor.chain().focus();
  if (position !== undefined) return chain.setTextSelection(position);
  const { selection } = editor.state;
  return selection instanceof NodeSelection
    ? chain.setTextSelection(selection.to)
    : chain;
}

// Files upload immediately (not at save time like the legacy editor), so a
// failed save never loses them and a reload keeps the content consistent.
export function useEditorUploads(target: EditorUploadTarget) {
  const [pending, setPending] = useState(0);

  async function run<T>(task: () => Promise<T>): Promise<T | null> {
    setPending((n) => n + 1);
    try {
      return await task();
    } catch (error) {
      toast.error(errorMessage(error));
      return null;
    } finally {
      setPending((n) => n - 1);
    }
  }

  async function insertImages(
    editor: Editor,
    files: File[],
    position?: number,
  ) {
    for (const file of files) {
      const src = await run(() =>
        uploadFile(file, target.prefix, target.scope),
      );
      if (!src) continue;
      chainAtInsertPoint(editor, position).setImage({ src, alt: "" }).run();
    }
  }

  async function replaceImage(editor: Editor, file: File) {
    const src = await run(() => uploadFile(file, target.prefix, target.scope));
    if (src) editor.chain().focus().updateAttributes("image", { src }).run();
  }

  async function insertAttachment(editor: Editor, file: File) {
    const href = await run(() => uploadFile(file, "soubory", target.scope));
    if (!href) return;
    chainAtInsertPoint(editor)
      .insertAttachment({
        href,
        name: file.name,
        size: formatSize(file.size),
        mime: file.type,
      })
      .insertContent(" ")
      .run();
  }

  return { pending, insertImages, replaceImage, insertAttachment };
}
