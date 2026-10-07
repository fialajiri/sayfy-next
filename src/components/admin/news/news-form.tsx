"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { newsFormSchema, type NewsFormInput } from "@/schemas/news";
import {
  createNewsAction,
  updateNewsAction,
  type NewsActionResult,
} from "@/server/actions/news";
import { RichTextEditor } from "../editor/rich-text-editor";
import { ImageField } from "../image-field";
import { ImageListField } from "../image-list-field";
import { toScope } from "../upload/upload-client";
import { slugPreview } from "./slug-preview";
import { useUnsavedGuard } from "./use-unsaved-guard";

type NewsFormProps = { id?: string; slug?: string; defaults: NewsFormInput };

export function NewsForm({ id, slug, defaults }: NewsFormProps) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const form = useForm<NewsFormInput>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: defaults,
  });
  const { register, control, handleSubmit, setError, formState } = form;
  const errors = formState.errors;
  const title = useWatch({ control, name: "title" });
  const updateSlug = useWatch({ control, name: "updateSlug" });
  const scope = toScope(slug ?? (title || "aktualita"));
  useUnsavedGuard(formState.isDirty && !saving);

  function applyResult(result: NewsActionResult) {
    if (result.ok) {
      toast.success(id ? "Aktualita uložena." : "Aktualita vytvořena.");
      router.push("/admin/aktuality");
      router.refresh();
      return;
    }
    toast.error(result.message);
    for (const [field, messages] of Object.entries(result.fieldErrors)) {
      if (field in defaults && messages?.[0])
        setError(field as keyof NewsFormInput, { message: messages[0] });
    }
  }

  function onSubmit(values: NewsFormInput) {
    startSaving(async () =>
      applyResult(
        id
          ? await updateNewsAction(id, values)
          : await createNewsAction(values),
      ),
    );
  }

  const newSlug = slugPreview(title);
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 pb-24"
      noValidate
    >
      <Field data-invalid={errors.title ? true : undefined}>
        <FieldLabel htmlFor="title">Nadpis</FieldLabel>
        <Input
          id="title"
          {...register("title")}
          aria-invalid={errors.title ? true : undefined}
        />
        {errors.title && <FieldError>{errors.title.message}</FieldError>}
      </Field>

      {id && slug && (
        <Field orientation="horizontal">
          <Controller
            control={control}
            name="updateSlug"
            render={({ field }) => (
              <Switch
                id="updateSlug"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <div>
            <FieldLabel htmlFor="updateSlug">
              Změnit i adresu stránky
            </FieldLabel>
            <FieldDescription>
              Teď: /aktuality/{slug}
              {updateSlug && newSlug !== slug && (
                <> → /aktuality/{newSlug} (stará adresa bude přesměrovávat)</>
              )}
            </FieldDescription>
          </div>
        </Field>
      )}

      <Field data-invalid={errors.perex ? true : undefined}>
        <FieldLabel htmlFor="perex">Perex (krátký úvod, nepovinný)</FieldLabel>
        <Textarea id="perex" rows={3} {...register("perex")} />
        <FieldDescription>
          Zobrazí se nad hlavním obrázkem a v náhledu aktuality.
        </FieldDescription>
        {errors.perex && <FieldError>{errors.perex.message}</FieldError>}
      </Field>

      <Field data-invalid={errors.mainPhoto ? true : undefined}>
        <FieldLabel htmlFor="mainPhoto">Hlavní obrázek</FieldLabel>
        <Controller
          control={control}
          name="mainPhoto"
          render={({ field }) => (
            <ImageField
              id="mainPhoto"
              value={field.value}
              onChange={field.onChange}
              prefix="aktuality"
              scope={scope}
              invalid={Boolean(errors.mainPhoto)}
            />
          )}
        />
        {errors.mainPhoto && (
          <FieldError>{errors.mainPhoto.message}</FieldError>
        )}
      </Field>

      <Field data-invalid={errors.text ? true : undefined}>
        <FieldLabel id="text-label" htmlFor="text">
          Text
        </FieldLabel>
        <Controller
          control={control}
          name="text"
          render={({ field }) => (
            <RichTextEditor
              id="text"
              labelledBy="text-label"
              value={field.value}
              onChange={field.onChange}
              upload={{ prefix: "aktuality", scope }}
              invalid={Boolean(errors.text)}
            />
          )}
        />
        {errors.text && <FieldError>{errors.text.message}</FieldError>}
      </Field>

      <Field data-invalid={errors.photoGallery ? true : undefined}>
        <FieldLabel htmlFor="photoGallery">
          Fotogalerie (nejvýše 10 fotek)
        </FieldLabel>
        <Controller
          control={control}
          name="photoGallery"
          render={({ field }) => (
            <ImageListField
              id="photoGallery"
              value={field.value}
              onChange={field.onChange}
              max={10}
              prefix="aktuality"
              scope={scope}
            />
          )}
        />
        {errors.photoGallery && (
          <FieldError>{errors.photoGallery.message}</FieldError>
        )}
      </Field>

      <div className="bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur md:left-(--sidebar-width)">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-10">
          {formState.isDirty && (
            <span className="text-muted-foreground mr-auto text-sm">
              Neuložené změny
            </span>
          )}
          <Button type="button" variant="outline" onClick={router.back}>
            Zrušit
          </Button>
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "Ukládám…" : id ? "Uložit změny" : "Vytvořit aktualitu"}
          </Button>
        </div>
      </div>
    </form>
  );
}
