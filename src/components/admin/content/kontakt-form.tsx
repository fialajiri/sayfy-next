"use client";

import { PlusIcon } from "lucide-react";
import { FormProvider, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { KontaktContent } from "@/schemas/page-content/kontakt";
import { ContentSaveBar } from "./content-save-bar";
import { ContentSection } from "./content-section";
import { ListItemControls } from "./list-item-controls";
import { RichTextInput } from "./rich-text-input";
import { TextInput } from "./text-input";
import { usePageContentForm } from "./use-page-content-form";

const MAX_CONTACTS = 6;

export function KontaktContentForm({ values }: { values: KontaktContent }) {
  const { form, saving, onSubmit, restoreDefaults } = usePageContentForm(
    "kontakt",
    values,
  );
  // keyName: our items carry their own `id`, which RHF would otherwise shadow.
  const contacts = useFieldArray({
    control: form.control,
    name: "contacts",
    keyName: "fieldKey",
  });

  function handleAdd() {
    contacts.append({
      id: crypto.randomUUID(),
      name: "",
      role: "",
      phone: "",
      email: "",
    });
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6 pb-24" noValidate>
        <ContentSection title="Úvod">
          <TextInput name="title" label="Nadpis" />
          <TextInput name="lead" label="Podnadpis" />
        </ContentSection>
        <ContentSection
          title="Kontakty"
          description={`Nejvýše ${MAX_CONTACTS}.`}
        >
          <ol className="space-y-4">
            {contacts.fields.map((contact, i) => (
              <li
                key={contact.fieldKey}
                className="space-y-4 rounded-lg border p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">Kontakt {i + 1}</h3>
                  <ListItemControls
                    label={`kontakt ${i + 1}`}
                    index={i}
                    count={contacts.fields.length}
                    min={1}
                    onMove={contacts.move}
                    onRemove={contacts.remove}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput name={`contacts.${i}.name`} label="Jméno" />
                  <TextInput
                    name={`contacts.${i}.role`}
                    label="Role (nepovinná)"
                    placeholder="např. hlavní pořadatelka"
                  />
                  <TextInput
                    name={`contacts.${i}.phone`}
                    label="Telefon"
                    type="tel"
                  />
                  <TextInput
                    name={`contacts.${i}.email`}
                    label="E-mail"
                    type="email"
                  />
                </div>
              </li>
            ))}
          </ol>
          {contacts.fields.length < MAX_CONTACTS && (
            <Button type="button" variant="outline" onClick={handleAdd}>
              <PlusIcon data-icon="inline-start" />
              Přidat kontakt
            </Button>
          )}
        </ContentSection>
        <ContentSection title="Místo konání">
          <TextInput name="place.label" label="Název místa" />
          <TextInput name="place.mapUrl" label="Odkaz na mapu" type="url" />
        </ContentSection>
        <ContentSection title="Doplňující text">
          <RichTextInput
            name="extra"
            label="Text pod kontakty (nepovinný)"
            scope="kontakt"
          />
        </ContentSection>
        <ContentSaveBar
          dirty={form.formState.isDirty}
          saving={saving}
          viewHref="/kontakt"
          onRestoreDefaults={restoreDefaults}
        />
      </form>
    </FormProvider>
  );
}
