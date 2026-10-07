"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  staticPageFormSchema,
  type StaticPageFormInput,
} from "@/schemas/static-page";
import { updatePropoziceAction } from "@/server/actions/static-pages";
import { RichTextEditor } from "../editor/rich-text-editor";
import { useUnsavedGuard } from "../news/use-unsaved-guard";

export function PropoziceForm({ defaults }: { defaults: StaticPageFormInput }) {
  const [saving, startSaving] = useTransition();
  const form = useForm<StaticPageFormInput>({
    resolver: zodResolver(staticPageFormSchema),
    defaultValues: defaults,
  });
  const { register, control, handleSubmit, formState, reset, setError } = form;
  useUnsavedGuard(formState.isDirty && !saving);

  function onSubmit(values: StaticPageFormInput) {
    startSaving(async () => {
      const result = await updatePropoziceAction(values);
      if (!result.ok) {
        toast.error(result.message);
        if (result.fieldErrors.title?.[0])
          setError("title", { message: result.fieldErrors.title[0] });
        return;
      }
      reset(values); // now clean — the guard stops warning
      toast.success("Propozice uloženy.");
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 pb-24"
      noValidate
    >
      <Field data-invalid={formState.errors.title ? true : undefined}>
        <FieldLabel htmlFor="title">Nadpis</FieldLabel>
        <Input id="title" {...register("title")} />
        {formState.errors.title && (
          <FieldError>{formState.errors.title.message}</FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel id="propozice-text-label" htmlFor="propozice-text">
          Text
        </FieldLabel>
        <Controller
          control={control}
          name="text"
          render={({ field }) => (
            <RichTextEditor
              id="propozice-text"
              labelledBy="propozice-text-label"
              value={field.value}
              onChange={field.onChange}
              upload={{ prefix: "propozice", scope: "propozice" }}
            />
          )}
        />
      </Field>
      <div className="bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur md:left-(--sidebar-width)">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-10">
          {formState.isDirty && (
            <span className="text-muted-foreground mr-auto text-sm">
              Neuložené změny
            </span>
          )}
          <a
            href="/propozice"
            target="_blank"
            rel="noopener"
            className="text-primary text-sm font-medium hover:underline"
          >
            Zobrazit na webu ↗
          </a>
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "Ukládám…" : "Uložit propozice"}
          </Button>
        </div>
      </div>
    </form>
  );
}
