"use client";

import type { ChangeEvent } from "react";
import { useController } from "react-hook-form";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

/** `seo.keywords` as one keyword per line (blank lines removed on save). */
export function KeywordsInput() {
  const { field } = useController({ name: "seo.keywords" });
  const keywords = field.value as string[];

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    field.onChange(event.target.value.split("\n"));
  }

  return (
    <Field>
      <FieldLabel htmlFor="field-seo-keywords">Klíčová slova</FieldLabel>
      <Textarea
        id="field-seo-keywords"
        rows={5}
        value={keywords.join("\n")}
        onChange={handleChange}
        onBlur={field.onBlur}
      />
      <FieldDescription>Jedno na řádek, nejvýše 20.</FieldDescription>
    </Field>
  );
}
