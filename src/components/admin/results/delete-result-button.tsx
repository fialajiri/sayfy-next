"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteResultAction } from "@/server/actions/results";

export function DeleteResultButton({ id, year }: { id: string; year: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteResultAction(id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`Výsledky ${year} smazány.`);
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Smazat výsledky ${year}`}
            disabled={pending}
          />
        }
      >
        <Trash2Icon />
      </AlertDialogTrigger>
      <AlertDialogContent className="light">
        <AlertDialogHeader>
          <AlertDialogTitle>Smazat výsledky {year}?</AlertDialogTitle>
          <AlertDialogDescription>
            Stránka /vysledky/{year} přestane existovat. Výsledková listina na
            sportt.cz zůstane.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Zrušit</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            Smazat
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
