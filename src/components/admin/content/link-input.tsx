"use client";

import { TextInput } from "./text-input";

/** `{ label, href }` pair; href may be /path, https://, mailto: or tel:. */
export function LinkInput({ name, label }: { name: string; label: string }) {
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <TextInput name={`${name}.label`} label="Text tlačítka" />
      <TextInput
        name={`${name}.href`}
        label="Odkaz"
        description="Např. /propozice nebo https://…"
      />
    </fieldset>
  );
}
