"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ContentSaveBarProps = {
  dirty: boolean;
  saving: boolean;
  viewHref: string;
  onRestoreDefaults: () => void;
};

export function ContentSaveBar({
  dirty,
  saving,
  viewHref,
  onRestoreDefaults,
}: ContentSaveBarProps) {
  const [confirming, setConfirming] = useState(false);

  function handleRestoreClick() {
    if (!confirming) return setConfirming(true);
    setConfirming(false);
    onRestoreDefaults();
  }
  function handleBlur() {
    setConfirming(false);
  }

  return (
    <div className="bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur md:left-(--sidebar-width)">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-10">
        {dirty && (
          <span className="text-muted-foreground mr-auto text-sm">
            Neuložené změny
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={handleRestoreClick}
          onBlur={handleBlur}
          disabled={saving}
        >
          {confirming ? "Opravdu? Klikněte znovu" : "Obnovit výchozí texty"}
        </Button>
        <a
          href={viewHref}
          target="_blank"
          rel="noopener"
          className="text-primary text-sm font-medium hover:underline"
        >
          Zobrazit na webu ↗
        </a>
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Ukládám…" : "Uložit"}
        </Button>
      </div>
    </div>
  );
}
