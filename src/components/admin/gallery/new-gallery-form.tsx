"use client";

import { useRouter } from "next/navigation";
import {
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createGalleryAction } from "@/server/actions/galleries";

// Create first, then upload in the manager (create-then-append, docs/plans/phase-4).
export function NewGalleryForm({ suggestion }: { suggestion: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(suggestion);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
  }
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createGalleryAction({ title, updateSlug: false });
      if (!result.ok) {
        setError(result.fieldErrors.title?.[0] ?? result.message);
        return;
      }
      router.push(`/admin/fotogalerie/${result.gallery.id}`);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card max-w-md space-y-5 rounded-xl border p-6"
      noValidate
    >
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="new-gallery-title">Název galerie</FieldLabel>
        <Input
          id="new-gallery-title"
          value={title}
          onChange={handleChange}
          aria-invalid={error ? true : undefined}
          autoFocus
        />
        <FieldDescription>
          Galerie se obvykle jmenují podle roku závodu.
        </FieldDescription>
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <Button type="submit" size="lg" disabled={pending || title.trim() === ""}>
        {pending ? "Vytvářím…" : "Vytvořit a přidat fotky"}
      </Button>
    </form>
  );
}
