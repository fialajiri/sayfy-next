"use client";

import { PlusIcon } from "lucide-react";
import { FormProvider, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { SayfyContent } from "@/schemas/page-content/sayfy";
import { ContentSaveBar } from "./content-save-bar";
import { ContentSection } from "./content-section";
import { ImageRefInput } from "./image-ref-input";
import { LinkInput } from "./link-input";
import { ListItemControls } from "./list-item-controls";
import { PhotoListInput } from "./photo-list-input";
import { RichTextInput } from "./rich-text-input";
import { TextInput } from "./text-input";
import { usePageContentForm } from "./use-page-content-form";

const MAX_CHAPTERS = 12;

export function SayfyContentForm({ values }: { values: SayfyContent }) {
  const { form, saving, onSubmit, restoreDefaults } = usePageContentForm(
    "sayfy",
    values,
  );
  // keyName: chapters carry their own `id` (anchor), which RHF would shadow.
  const chapters = useFieldArray({
    control: form.control,
    name: "chapters",
    keyName: "fieldKey",
  });

  function handleAdd() {
    chapters.append({
      id: crypto.randomUUID().slice(0, 8),
      title: "",
      body: "",
      image: null,
    });
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6 pb-24" noValidate>
        <ContentSection title="Úvod stránky">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="name" label="Jméno" />
            <TextInput name="nickname" label="Přezdívka" />
            <TextInput name="born" label="Narozen" placeholder="8. 2. 1991" />
            <TextInput name="died" label="Zemřel" placeholder="28. 9. 2008" />
          </div>
          <ImageRefInput
            name="portrait"
            label="Portrét"
            scope="sayfy"
            cropAspect="1:1"
          />
        </ContentSection>
        <ContentSection
          title="Kapitoly příběhu"
          description="Každá kapitola má nadpis, text a volitelně fotku."
        >
          <ol className="space-y-5">
            {chapters.fields.map((chapter, i) => (
              <li
                key={chapter.fieldKey}
                className="space-y-4 rounded-lg border p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">Kapitola {i + 1}</h3>
                  <ListItemControls
                    label={`kapitolu ${i + 1}`}
                    index={i}
                    count={chapters.fields.length}
                    min={1}
                    onMove={chapters.move}
                    onRemove={chapters.remove}
                  />
                </div>
                <TextInput name={`chapters.${i}.title`} label="Nadpis" />
                <RichTextInput
                  name={`chapters.${i}.body`}
                  label="Text"
                  scope="sayfy"
                />
                <ImageRefInput
                  name={`chapters.${i}.image`}
                  label="Fotka (nepovinná)"
                  scope="sayfy"
                  cropAspect="4:3"
                  nullable
                />
              </li>
            ))}
          </ol>
          {chapters.fields.length < MAX_CHAPTERS && (
            <Button type="button" variant="outline" onClick={handleAdd}>
              <PlusIcon data-icon="inline-start" />
              Přidat kapitolu
            </Button>
          )}
        </ContentSection>
        <ContentSection title="Citát">
          <TextInput name="quote.text" label="Text" />
          <TextInput name="quote.attribution" label="Autor" />
        </ContentSection>
        <ContentSection
          title="Fotografie"
          description="Pás fotek na konci stránky (otevírají se ve velkém náhledu)."
        >
          <PhotoListInput
            name="photos"
            max={40}
            scope="sayfy"
            altPrefix="David „Sayfy“ Seifrt, fotografie"
          />
        </ContentSection>
        <ContentSection title="Závěr">
          <TextInput name="closing.text" label="Text" multiline />
          <LinkInput name="closing.link" label="Odkaz" />
        </ContentSection>
        <ContentSaveBar
          dirty={form.formState.isDirty}
          saving={saving}
          viewHref="/sayfy"
          onRestoreDefaults={restoreDefaults}
        />
      </form>
    </FormProvider>
  );
}
