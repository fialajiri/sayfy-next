"use client";

import type { Editor } from "@tiptap/react";
import { BaselineIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Brand palette only (docs/08 §A2) — the sanitizer strips any other colour.
const COLORS = [
  { label: "Černá (výchozí)", value: null, swatch: "#141a17" },
  { label: "Zelená", value: "#1b7a57", swatch: "#1b7a57" },
  { label: "Zlatá", value: "#7a5b0f", swatch: "#7a5b0f" },
  { label: "Červená", value: "#c2410c", swatch: "#c2410c" },
] as const;

export function ColorPicker({
  editor,
  disabled,
}: {
  editor: Editor;
  disabled: boolean;
}) {
  function handlePick(event: React.MouseEvent<HTMLButtonElement>) {
    const value = event.currentTarget.dataset.color;
    const chain = editor.chain().focus();
    (value ? chain.setColor(value) : chain.unsetColor()).run();
  }

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        aria-label="Barva textu"
        className="text-foreground/80 hover:bg-muted inline-flex size-9 items-center justify-center rounded-md disabled:opacity-40"
      >
        <BaselineIcon className="size-4" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="light w-auto p-2">
        <div className="flex gap-1.5" role="group" aria-label="Barva textu">
          {COLORS.map((color) => (
            <button
              key={color.label}
              type="button"
              data-color={color.value ?? ""}
              onClick={handlePick}
              aria-label={color.label}
              title={color.label}
              className="size-8 rounded-full border-2 border-white shadow-[0_0_0_1px_var(--border)]"
              style={{ backgroundColor: color.swatch }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
