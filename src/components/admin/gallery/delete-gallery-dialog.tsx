"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ChangeEvent } from "react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { deleteGalleryAction } from "@/server/actions/galleries";

// Deleting removes up to hundreds of photos for good — require retyping the name.
export function DeleteGalleryDialog({
  id,
  title,
  count,
}: {
  id: string;
  title: string;
  count: number;
}) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();

  function handleTyped(event: ChangeEvent<HTMLInputElement>) {
    setTyped(event.target.value);
  }
  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGalleryAction(id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`Galerie „${title}“ smazána.`);
      router.push("/admin/fotogalerie");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button type="button" variant="destructive" />}
      >
        Smazat galerii
      </AlertDialogTrigger>
      <AlertDialogContent className="light">
        <AlertDialogHeader>
          <AlertDialogTitle>Smazat galerii „{title}“?</AlertDialogTitle>
          <AlertDialogDescription>
            Smaže se galerie i všech {count} fotek z úložiště. Tuto akci nelze
            vrátit.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor="confirm-title">
            Pro potvrzení napište název galerie
          </FieldLabel>
          <Input
            id="confirm-title"
            value={typed}
            onChange={handleTyped}
            autoComplete="off"
          />
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>Zrušit</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={typed.trim() !== title || pending}
          >
            Smazat natrvalo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
