"use client";

import { FilmIcon } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Controller, get, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { uploadFile } from "../upload/upload-client";

type VideoInputProps = {
  name: string;
  label: string;
  accept: "video/mp4" | "video/webm";
  scope: string;
  optional?: boolean;
};

/** One video file (≤60 MB, media/ prefix, uploaded as is). */
export function VideoInput({
  name,
  label,
  accept,
  scope,
  optional,
}: VideoInputProps) {
  const { control, formState } = useFormContext();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const error = get(formState.errors, name) as { message?: string } | undefined;
  const id = `field-${name.replaceAll(".", "-")}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const url = String(field.value ?? "");
        async function handleFile(event: ChangeEvent<HTMLInputElement>) {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setProgress(0);
          try {
            field.onChange(
              await uploadFile(file, "media", scope, setProgress, {
                compress: false,
              }),
            );
          } catch (uploadError) {
            toast.error(
              uploadError instanceof Error
                ? uploadError.message
                : "Nahrání se nepodařilo.",
            );
          } finally {
            setProgress(null);
          }
        }
        function handlePick() {
          input.current?.click();
        }
        function handleRemove() {
          field.onChange("");
        }
        return (
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                id={id}
                type="button"
                variant="outline"
                onClick={handlePick}
                disabled={progress !== null}
              >
                <FilmIcon data-icon="inline-start" />
                {url ? "Vyměnit video" : "Nahrát video"}
              </Button>
              {url && optional && (
                <Button type="button" variant="ghost" onClick={handleRemove}>
                  Odebrat
                </Button>
              )}
              <span className="text-muted-foreground min-w-0 truncate text-xs">
                {url
                  ? decodeURIComponent(url.split("/").pop() ?? "")
                  : "Bez videa"}
              </span>
            </div>
            {progress !== null && (
              <Progress value={progress} aria-label="Průběh nahrávání videa" />
            )}
            <FieldDescription>
              {accept === "video/mp4"
                ? "MP4 (H.264), nejvýše 60 MB. Krátká smyčka bez zvuku."
                : "WebM, nepovinný — menší soubor pro moderní prohlížeče."}
            </FieldDescription>
            {error?.message && <FieldError>{error.message}</FieldError>}
            <input
              ref={input}
              type="file"
              accept={accept}
              hidden
              onChange={handleFile}
            />
          </Field>
        );
      }}
    />
  );
}
