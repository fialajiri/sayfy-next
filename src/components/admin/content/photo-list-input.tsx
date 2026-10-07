"use client";

import { ImagePlusIcon } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ImageRef } from "@/schemas/page-content/shared";
import {
  IMAGE_ACCEPT,
  runWithConcurrency,
  uploadFile,
} from "../upload/upload-client";
import { ListItemControls } from "./list-item-controls";

type PhotoListInputProps = {
  name: string;
  max: number;
  scope: string;
  altPrefix: string;
};

/** Ordered `ImageRef[]` (e.g. the Sayfy photo strip): bulk add, alt, reorder. */
export function PhotoListInput({
  name,
  max,
  scope,
  altPrefix,
}: PhotoListInputProps) {
  const { control, register } = useFormContext();
  const photos = useFieldArray({ control, name });
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const remaining = max - photos.fields.length;

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].slice(0, remaining);
    event.target.value = "";
    setUploading(files.length);
    const urls = await runWithConcurrency(files, 3, async (file) => {
      try {
        return await uploadFile(file, "stranky", scope);
      } catch {
        return null;
      } finally {
        setUploading((n) => n - 1);
      }
    });
    const uploaded = urls.filter((url): url is string => url !== null);
    if (uploaded.length < files.length)
      toast.error(
        `${files.length - uploaded.length} fotek se nepodařilo nahrát.`,
      );
    const count = photos.fields.length;
    photos.append(
      uploaded.map((url, i): ImageRef => ({
        url,
        alt: `${altPrefix} ${count + i + 1}`,
      })),
    );
  }
  function handlePick() {
    input.current?.click();
  }

  return (
    <div className="space-y-4">
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.fields.map((photo, i) => (
          <li key={photo.id} className="overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
            <img
              src={(photo as unknown as ImageRef).url}
              alt=""
              className="bg-muted aspect-[4/3] w-full object-cover"
            />
            <div className="space-y-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Fotka {i + 1}</span>
                <ListItemControls
                  label={`fotku ${i + 1}`}
                  index={i}
                  count={photos.fields.length}
                  onMove={photos.move}
                  onRemove={photos.remove}
                />
              </div>
              <Input
                aria-label={`Popis fotky ${i + 1} (alt)`}
                {...register(`${name}.${i}.alt`)}
              />
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handlePick}
          disabled={remaining <= 0 || uploading > 0}
        >
          <ImagePlusIcon data-icon="inline-start" />
          {uploading > 0 ? `Nahrávám ${uploading}…` : "Přidat fotky"}
        </Button>
        <span className="text-muted-foreground text-xs">
          {photos.fields.length} / {max}
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
