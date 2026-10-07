"use client";

import { get, useFormContext } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TextInputProps = {
  name: string;
  label: string;
  description?: string;
  multiline?: boolean;
  type?: "text" | "url" | "email" | "tel";
  placeholder?: string;
};

/** A registered text field inside a FormProvider; `name` is a dotted path. */
export function TextInput({
  name,
  label,
  description,
  multiline,
  type = "text",
  placeholder,
}: TextInputProps) {
  const { register, formState } = useFormContext();
  const error = get(formState.errors, name) as { message?: string } | undefined;
  const id = `field-${name.replaceAll(".", "-")}`;
  const descriptionId = description ? `${id}-description` : undefined;
  const props = {
    id,
    placeholder,
    "aria-describedby": descriptionId,
    "aria-invalid": error ? true : undefined,
    ...register(name),
  };

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? (
        <Textarea rows={3} {...props} />
      ) : (
        <Input type={type} {...props} />
      )}
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      {error?.message && <FieldError>{error.message}</FieldError>}
    </Field>
  );
}
