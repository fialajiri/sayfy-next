"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { importLegacyPartnersAction } from "@/server/actions/partners";

// Shown only while the partners collection is empty.
export function ImportLegacyButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleImport() {
    startTransition(async () => {
      const result = await importLegacyPartnersAction();
      if (!result.ok) toast.error(result.message);
      else toast.success("Původní loga načtena. Doplňte jim odkazy na weby.");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleImport}
      disabled={pending}
    >
      {pending ? "Načítám…" : "Načíst původní loga z webu"}
    </Button>
  );
}
