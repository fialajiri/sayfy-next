"use client";

import type { ChangeEvent } from "react";
import { Controller, get, useFormContext } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ImageRef } from "@/schemas/page-content/shared";
import type { AspectId } from "../crop/aspect";
import { ImageField } from "../image-field";

type ImageRefInputProps = {
  name: string;
  label: string;
  scope: string;
  cropAspect?: AspectId | null;
  /** Removing the image stores null (optional chapter images). */
  nullable?: boolean;
};

/** Image + its alt text, stored as `{ url, alt }` (uploads go to stranky/). */
export function ImageRefInput({
  name,
  label,
  scope,
  cropAspect = "original",
  nullable,
}: ImageRefInputProps) {
  const { control, formState } = useFormContext();
  const error = get(formState.errors, name) as
    { message?: string; url?: { message?: string } } | undefined;
  const id = `field-${name.replaceAll(".", "-")}`;
  const message = error?.url?.message ?? error?.message;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const image = field.value as ImageRef | null;
        function handleUrl(url: string) {
          if (!url && nullable) return field.onChange(null);
          field.onChange({ url, alt: image?.alt ?? "" });
        }
        function handleAlt(event: ChangeEvent<HTMLInputElement>) {
          field.onChange({ url: image?.url ?? "", alt: event.target.value });
        }
        return (
          <Field data-invalid={message ? true : undefined}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <ImageField
              id={id}
              value={image?.url ?? ""}
              onChange={handleUrl}
              prefix="stranky"
              scope={scope}
              cropAspect={cropAspect}
              invalid={Boolean(message)}
            />
            {image && (
              <div className="grid gap-1.5">
                <FieldLabel
                  htmlFor={`${id}-alt`}
                  className="text-sm font-normal"
                >
                  Popis obrázku pro nevidomé (alt)
                </FieldLabel>
                <Input
                  id={`${id}-alt`}
                  value={image.alt}
                  onChange={handleAlt}
                  onBlur={field.onBlur}
                />
              </div>
            )}
            {message && <FieldError>{message}</FieldError>}
          </Field>
        );
      }}
    />
  );
}
