"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setRegistrationOpenAction } from "@/server/actions/settings";

// Dashboard quick switch. Optimistic: flips instantly, rolls back on failure.
export function RegistrationToggle({ open }: { open: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(open);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    startTransition(async () => {
      setOptimistic(next);
      const result = await setRegistrationOpenAction(next);
      if (!result.ok) toast.error(result.message);
      else
        toast.success(
          next
            ? "Registrace je otevřená — tlačítko se zobrazuje na webu."
            : "Registrace je uzavřená.",
        );
    });
  }

  return (
    <label className="inline-flex items-center gap-3">
      <Switch
        checked={optimistic}
        onCheckedChange={handleChange}
        disabled={pending}
      />
      <span className="text-sm font-medium">
        {optimistic ? "Registrace otevřená" : "Registrace uzavřená"}
      </span>
    </label>
  );
}
