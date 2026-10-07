"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { RichTextEditor } from "../editor/rich-text-editor";

type RichTextInputProps = {
  name: string;
  label: string;
  scope: string;
  description?: string;
};

export function RichTextInput({
  name,
  label,
  scope,
  description,
}: RichTextInputProps) {
  const { control } = useFormContext();
  const id = `field-${name.replaceAll(".", "-")}`;

  return (
    <Field>
      <FieldLabel id={`${id}-label`} htmlFor={id}>
        {label}
      </FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <RichTextEditor
            id={id}
            labelledBy={`${id}-label`}
            value={String(field.value ?? "")}
            onChange={field.onChange}
            upload={{ prefix: "stranky", scope }}
          />
        )}
      />
    </Field>
  );
}
