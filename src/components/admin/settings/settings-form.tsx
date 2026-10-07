"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  settingsFormSchema,
  type SettingsFormInput,
} from "@/schemas/race-admin";
import { updateSettingsAction } from "@/server/actions/settings";

export function SettingsForm({
  defaults,
  derivedEdition,
}: {
  defaults: SettingsFormInput;
  derivedEdition: number | null;
}) {
  const [saving, startSaving] = useTransition();
  const { register, control, handleSubmit, formState, reset, setError } =
    useForm<SettingsFormInput>({
      resolver: zodResolver(settingsFormSchema),
      defaultValues: defaults,
    });
  const errors = formState.errors;

  function onSubmit(values: SettingsFormInput) {
    startSaving(async () => {
      const result = await updateSettingsAction(values);
      if (!result.ok) {
        toast.error(result.message);
        for (const field of ["registrationUrl", "editionOverride"] as const) {
          const message = result.fieldErrors[field]?.[0];
          if (message) setError(field, { message });
        }
        return;
      }
      reset(values);
      toast.success("Nastavení uloženo.");
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card max-w-xl space-y-6 rounded-xl border p-6"
      noValidate
    >
      <Field orientation="horizontal">
        <Controller
          control={control}
          name="registrationOpen"
          render={({ field }) => (
            <Switch
              id="registrationOpen"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <div>
          <FieldLabel htmlFor="registrationOpen">
            Registrace otevřená
          </FieldLabel>
          <FieldDescription>
            Když je zapnuto, na webu se zobrazuje tlačítko „Registrace“.
          </FieldDescription>
        </div>
      </Field>
      <Field data-invalid={errors.registrationUrl ? true : undefined}>
        <FieldLabel htmlFor="registrationUrl">
          Odkaz na registraci (sportt.cz)
        </FieldLabel>
        <Input
          id="registrationUrl"
          type="url"
          {...register("registrationUrl")}
          aria-invalid={errors.registrationUrl ? true : undefined}
        />
        {errors.registrationUrl && (
          <FieldError>{errors.registrationUrl.message}</FieldError>
        )}
      </Field>
      <Field data-invalid={errors.editionOverride ? true : undefined}>
        <FieldLabel htmlFor="editionOverride">Ročník (nepovinné)</FieldLabel>
        <Input
          id="editionOverride"
          type="number"
          min={1}
          inputMode="numeric"
          placeholder={derivedEdition ? String(derivedEdition) : ""}
          {...register("editionOverride", {
            setValueAs: (v: string) =>
              v === "" || v === null ? null : Number(v),
          })}
        />
        <FieldDescription>
          Prázdné = spočítá se automaticky z výsledků
          {derivedEdition ? ` (teď ${derivedEdition}.)` : ""}. Vyplňte jen, když
          se nějaký rok nejelo.
        </FieldDescription>
        {errors.editionOverride && (
          <FieldError>{errors.editionOverride.message}</FieldError>
        )}
      </Field>
      <p className="text-muted-foreground text-sm">
        Datum a čas závodu se nenastavují: závod je vždy 28. září v 11:00.
      </p>
      <Button type="submit" size="lg" disabled={saving || !formState.isDirty}>
        {saving ? "Ukládám…" : "Uložit nastavení"}
      </Button>
    </form>
  );
}
