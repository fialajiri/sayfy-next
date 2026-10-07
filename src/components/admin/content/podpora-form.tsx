"use client";

import Link from "next/link";
import { FormProvider } from "react-hook-form";
import type { PodporaContent } from "@/schemas/page-content/podpora";
import { ContentSaveBar } from "./content-save-bar";
import { ContentSection } from "./content-section";
import { RichTextInput } from "./rich-text-input";
import { TextInput } from "./text-input";
import { usePageContentForm } from "./use-page-content-form";

export function PodporaContentForm({ values }: { values: PodporaContent }) {
  const { form, saving, onSubmit, restoreDefaults } = usePageContentForm(
    "podpora",
    values,
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6 pb-24" noValidate>
        <ContentSection title="Stránka Podpora">
          <TextInput name="title" label="Nadpis" />
          <RichTextInput
            name="lead"
            label="Úvodní text (nepovinný)"
            scope="podpora"
            description="Zobrazí se nad logy partnerů."
          />
          <p className="text-muted-foreground text-sm">
            Loga a jejich pořadí upravíte v sekci{" "}
            <Link
              href="/admin/partneri"
              className="text-primary hover:underline"
            >
              Partneři
            </Link>
            .
          </p>
        </ContentSection>
        <ContentSaveBar
          dirty={form.formState.isDirty}
          saving={saving}
          viewHref="/podpora"
          onRestoreDefaults={restoreDefaults}
        />
      </form>
    </FormProvider>
  );
}
