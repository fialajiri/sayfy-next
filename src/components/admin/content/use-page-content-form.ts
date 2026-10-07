"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm, type FieldValues, type Path } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import {
  PAGE_CONTENT,
  type PageContent,
  type PageKey,
} from "@/schemas/page-content";
import { updatePageContentAction } from "@/server/actions/page-content";
import { useUnsavedGuard } from "../news/use-unsaved-guard";

type Options<T> = { prepare?: (values: T) => T };

// Shared state for every /admin/obsah form: Zod validation with the page's
// schema, save via the action (server errors mapped back onto fields), reset
// to the legacy defaults, and the leave-page guard.
export function usePageContentForm<K extends PageKey>(
  key: K,
  values: PageContent<K>,
  options: Options<PageContent<K>> = {},
) {
  type Values = PageContent<K> & FieldValues;
  const schema = PAGE_CONTENT[key].schema as unknown as z.ZodType<
    Values,
    Values
  >;
  const [saving, startSaving] = useTransition();
  const validate = zodResolver(schema);
  const prepare = options.prepare;
  const form = useForm<Values>({
    // `prepare` runs BEFORE validation (e.g. dropping blank keyword lines),
    // and the submitted data is the prepared version.
    resolver: prepare
      ? (raw, context, resolverOptions) =>
          validate(prepare(raw) as Values, context, resolverOptions)
      : validate,
    defaultValues: values as never,
  });
  useUnsavedGuard(form.formState.isDirty && !saving);

  function save(prepared: Values) {
    startSaving(async () => {
      const result = await updatePageContentAction(key, prepared);
      if (!result.ok) {
        for (const [path, messages] of Object.entries(result.fieldErrors)) {
          if (messages[0])
            form.setError(path as Path<Values>, { message: messages[0] });
        }
        toast.error(result.message);
        return;
      }
      form.reset(prepared); // clean again — the guard stops warning
      toast.success("Uloženo. Změny jsou na webu.");
    });
  }

  function restoreDefaults() {
    // Fills the form only; nothing is stored until the admin presses Save.
    form.reset(PAGE_CONTENT[key].defaults as never, {
      keepDefaultValues: true,
    });
    toast.info("Výchozí texty doplněny — uložte je, pokud vám vyhovují.");
  }

  function handleInvalid() {
    toast.error(
      "Formulář obsahuje chyby — zkontrolujte červeně označená pole.",
    );
  }

  return {
    form,
    saving,
    onSubmit: form.handleSubmit(save, handleInvalid),
    restoreDefaults,
  };
}
