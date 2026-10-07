"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  useState,
  useTransition,
  type FormEvent,
  type ReactElement,
} from "react";
import { Controller, useForm } from "react-hook-form";
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
import { partnerFormSchema, type PartnerFormInput } from "@/schemas/race-admin";
import { savePartnerAction } from "@/server/actions/partners";
import { ImageField } from "../image-field";

type PartnerDialogProps = {
  id: string | null;
  defaults: PartnerFormInput;
  trigger: ReactElement;
};

export function PartnerDialog({ id, defaults, trigger }: PartnerDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const { register, control, handleSubmit, formState, setError, reset } =
    useForm<PartnerFormInput>({
      resolver: zodResolver(partnerFormSchema),
      defaultValues: defaults,
    });
  const errors = formState.errors;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) reset(defaults);
  }
  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.stopPropagation(); // portaled dialog: don't bubble into outer forms
    void handleSubmit(onSubmit)(event);
  }
  function onSubmit(values: PartnerFormInput) {
    startSaving(async () => {
      const result = await savePartnerAction(id, values);
      if (!result.ok) {
        for (const field of ["name", "logoUrl", "url"] as const) {
          const message = result.fieldErrors[field]?.[0];
          if (message) setError(field, { message });
        }
        toast.error(result.message);
        return;
      }
      toast.success("Partner uložen.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="light max-w-xl sm:max-w-xl">
        <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
          <DialogHeader>
            <DialogTitle>
              {id ? "Upravit partnera" : "Nový partner"}
            </DialogTitle>
          </DialogHeader>
          <Field data-invalid={errors.name ? true : undefined}>
            <FieldLabel htmlFor="partner-name">Název</FieldLabel>
            <Input id="partner-name" {...register("name")} />
            <FieldDescription>
              Zobrazí se nevidomým čtenářům místo loga.
            </FieldDescription>
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>
          <Field data-invalid={errors.logoUrl ? true : undefined}>
            <FieldLabel htmlFor="partner-logo">
              Logo (nejlépe PNG s průhledným pozadím)
            </FieldLabel>
            <Controller
              control={control}
              name="logoUrl"
              render={({ field }) => (
                <ImageField
                  id="partner-logo"
                  value={field.value}
                  onChange={field.onChange}
                  prefix="partners"
                  scope="loga"
                  cropAspect={null}
                  compress={false}
                  invalid={Boolean(errors.logoUrl)}
                />
              )}
            />
            {errors.logoUrl && (
              <FieldError>{errors.logoUrl.message}</FieldError>
            )}
          </Field>
          <Field data-invalid={errors.url ? true : undefined}>
            <FieldLabel htmlFor="partner-url">
              Web partnera (nepovinný)
            </FieldLabel>
            <Input
              id="partner-url"
              type="url"
              placeholder="https://…"
              {...register("url")}
            />
            {errors.url && <FieldError>{errors.url.message}</FieldError>}
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
