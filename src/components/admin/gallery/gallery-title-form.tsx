"use client";

import {
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  renameGalleryAction,
  type GalleryActionResult,
} from "@/server/actions/galleries";
import type { GalleryRecord } from "@/server/domain/gallery";

export function GalleryTitleForm({
  gallery,
  onSaved,
}: {
  gallery: GalleryRecord;
  onSaved: (g: GalleryRecord) => void;
}) {
  const [title, setTitle] = useState(gallery.title);
  const [updateSlug, setUpdateSlug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function apply(result: GalleryActionResult) {
    if (!result.ok) {
      setError(result.fieldErrors.title?.[0] ?? result.message);
      return;
    }
    setError(null);
    setUpdateSlug(false);
    toast.success("Název uložen.");
    onSaved(result.gallery);
  }
  function handleTitle(event: ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
  }
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () =>
      apply(await renameGalleryAction(gallery.id, { title, updateSlug })),
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card space-y-4 rounded-xl border p-5"
      noValidate
    >
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="gallery-title">Název galerie</FieldLabel>
        <Input
          id="gallery-title"
          value={title}
          onChange={handleTitle}
          aria-invalid={error ? true : undefined}
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <Field orientation="horizontal">
        <Switch
          id="gallery-slug"
          checked={updateSlug}
          onCheckedChange={setUpdateSlug}
        />
        <div>
          <FieldLabel htmlFor="gallery-slug">
            Změnit i adresu stránky
          </FieldLabel>
          <FieldDescription>
            Teď: /fotogalerie/{gallery.slug} (stará adresa bude přesměrovávat)
          </FieldDescription>
        </div>
      </Field>
      <Button type="submit" disabled={pending || title.trim() === ""}>
        {pending ? "Ukládám…" : "Uložit název"}
      </Button>
    </form>
  );
}
