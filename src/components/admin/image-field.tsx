"use client";

import { ImagePlusIcon, ReplaceIcon, Trash2Icon } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  IMAGE_ACCEPT,
  uploadFile,
  type UploadPrefix,
} from "./upload/upload-client";

type ImageFieldProps = {
  id: string;
  value: string;
  onChange: (url: string) => void;
  prefix: UploadPrefix;
  scope: string;
  invalid?: boolean;
  describedBy?: string;
};

// Single image: preview, upload (click or drop), replace, remove (docs/04).
export function ImageField({
  id,
  value,
  onChange,
  prefix,
  scope,
  invalid,
  describedBy,
}: ImageFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function upload(file: File) {
    setProgress(0);
    try {
      onChange(await uploadFile(file, prefix, scope, setProgress));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nahrání se nepodařilo.",
      );
    } finally {
      setProgress(null);
    }
  }

  function handlePick() {
    input.current?.click();
  }
  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void upload(file);
    event.target.value = "";
  }
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    const file = [...event.dataTransfer.files].find((f) =>
      f.type.startsWith("image/"),
    );
    if (file) void upload(file);
  }
  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(true);
  }
  function handleDragLeave() {
    setDragOver(false);
  }
  function handleRemove() {
    onChange("");
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "bg-card flex flex-col gap-4 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center",
        dragOver && "border-primary bg-primary/5",
        invalid && "border-destructive",
      )}
    >
      <div className="bg-muted relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg sm:w-56">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary uploaded size
          <img
            src={value}
            alt="Náhled hlavního obrázku"
            className="size-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center text-sm">
            Bez obrázku
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            id={id}
            type="button"
            variant="outline"
            onClick={handlePick}
            disabled={progress !== null}
            aria-describedby={describedBy}
          >
            {value ? (
              <ReplaceIcon data-icon="inline-start" />
            ) : (
              <ImagePlusIcon data-icon="inline-start" />
            )}
            {value ? "Vyměnit obrázek" : "Nahrát obrázek"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleRemove}
              disabled={progress !== null}
            >
              <Trash2Icon data-icon="inline-start" />
              Odebrat
            </Button>
          )}
        </div>
        {progress !== null ? (
          <Progress value={progress} aria-label="Průběh nahrávání" />
        ) : (
          <p className="text-muted-foreground text-xs">
            JPG, PNG nebo WebP. Velké fotky se před nahráním automaticky zmenší.
            Můžete je sem i přetáhnout.
          </p>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        onChange={handleFile}
      />
    </div>
  );
}
