"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ImagePlusIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  IMAGE_ACCEPT,
  runWithConcurrency,
  uploadFile,
  type UploadPrefix,
} from "./upload/upload-client";

type ImageListFieldProps = {
  id: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max: number;
  prefix: UploadPrefix;
  scope: string;
};

function move(list: string[], from: number, to: number): string[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// Ordered photo list (news photo gallery, ≤10). Reorder with buttons — keyboard
// accessible, no drag library (docs/04 §Galleries).
export function ImageListField({
  id,
  value,
  onChange,
  max,
  prefix,
  scope,
}: ImageListFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const remaining = max - value.length;

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].slice(0, remaining);
    event.target.value = "";
    if (files.length === 0) return;
    setUploading(files.length);
    const urls = await runWithConcurrency(files, 3, async (file) => {
      try {
        return await uploadFile(file, prefix, scope);
      } catch {
        return null;
      } finally {
        setUploading((n) => n - 1);
      }
    });
    const ok = urls.filter((url): url is string => url !== null);
    if (ok.length < files.length)
      toast.error(`${files.length - ok.length} fotku/y se nepodařilo nahrát.`);
    onChange([...value, ...ok]);
  }

  function handleAction(event: MouseEvent<HTMLButtonElement>) {
    const { action, index } = event.currentTarget.dataset;
    const i = Number(index);
    if (action === "remove") onChange(value.filter((_, j) => j !== i));
    if (action === "left") onChange(move(value, i, i - 1));
    if (action === "right") onChange(move(value, i, i + 1));
  }
  function handlePick() {
    input.current?.click();
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {value.map((url, i) => (
            <li
              key={url}
              className="bg-muted group relative aspect-[4/3] overflow-hidden rounded-lg border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
              <img
                src={url}
                alt={`Fotografie ${i + 1}`}
                className="size-full object-cover"
              />
              <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  data-action="left"
                  data-index={i}
                  onClick={handleAction}
                  disabled={i === 0}
                  aria-label={`Posunout fotografii ${i + 1} doleva`}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  data-action="remove"
                  data-index={i}
                  onClick={handleAction}
                  aria-label={`Odebrat fotografii ${i + 1}`}
                >
                  <XIcon />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  data-action="right"
                  data-index={i}
                  onClick={handleAction}
                  disabled={i === value.length - 1}
                  aria-label={`Posunout fotografii ${i + 1} doprava`}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          id={id}
          type="button"
          variant="outline"
          onClick={handlePick}
          disabled={remaining <= 0 || uploading > 0}
        >
          <ImagePlusIcon data-icon="inline-start" />
          Přidat fotky
        </Button>
        <span className="text-muted-foreground text-sm" aria-live="polite">
          {uploading > 0
            ? `Nahrávám ${uploading}…`
            : `${value.length} / ${max}`}
        </span>
      </div>
      <input
        ref={input}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        onChange={handleFiles}
      />
    </div>
  );
}
