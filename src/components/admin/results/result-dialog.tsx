"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  useState,
  useTransition,
  type FormEvent,
  type ReactElement,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resultFormSchema, type ResultFormInput } from "@/schemas/race-admin";
import { saveResultAction } from "@/server/actions/results";

type ResultDialogProps = {
  id: string | null;
  defaults: ResultFormInput;
  trigger: ReactElement;
};

const asNumber = {
  setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
};

export function ResultDialog({ id, defaults, trigger }: ResultDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const { register, handleSubmit, formState, setError, reset } =
    useForm<ResultFormInput>({
      resolver: zodResolver(resultFormSchema),
      defaultValues: defaults,
    });
  const errors = formState.errors;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) reset(defaults);
  }

  // stopPropagation: the dialog is portaled, but React bubbles submit through the tree.
  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.stopPropagation();
    void handleSubmit(onSubmit)(event);
  }

  function onSubmit(values: ResultFormInput) {
    startSaving(async () => {
      const result = await saveResultAction(id, values);
      if (!result.ok) {
        for (const field of ["year", "edition", "url", "note"] as const) {
          const message = result.fieldErrors[field]?.[0];
          if (message) setError(field, { message });
        }
        toast.error(result.message);
        return;
      }
      toast.success(`Výsledky ${result.result.year} uloženy.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="light">
        <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
          <DialogHeader>
            <DialogTitle>
              {id ? `Upravit výsledky ${defaults.year}` : "Přidat výsledky"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={errors.year ? true : undefined}>
              <FieldLabel htmlFor="result-year">Rok</FieldLabel>
              <Input
                id="result-year"
                type="number"
                inputMode="numeric"
                {...register("year", asNumber)}
              />
              {errors.year && <FieldError>{errors.year.message}</FieldError>}
            </Field>
            <Field data-invalid={errors.edition ? true : undefined}>
              <FieldLabel htmlFor="result-edition">Ročník</FieldLabel>
              <Input
                id="result-edition"
                type="number"
                inputMode="numeric"
                {...register("edition", asNumber)}
              />
              {errors.edition && (
                <FieldError>{errors.edition.message}</FieldError>
              )}
            </Field>
          </div>
          <Field data-invalid={errors.url ? true : undefined}>
            <FieldLabel htmlFor="result-url">
              Odkaz na výsledkovou listinu
            </FieldLabel>
            <Input
              id="result-url"
              type="url"
              placeholder="https://sportt.cz/racesResults/resultlist/…"
              {...register("url")}
            />
            <FieldDescription>
              Odkazy na sportt.cz se zobrazí přímo na stránce, ostatní jako
              odkaz.
            </FieldDescription>
            {errors.url && <FieldError>{errors.url.message}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="result-note">Poznámka (nepovinná)</FieldLabel>
            <Input id="result-note" {...register("note")} maxLength={200} />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Ukládám…" : "Uložit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
