"use client";

import { FormProvider } from "react-hook-form";
import type { SiteContent } from "@/schemas/page-content/site";
import { ContentSaveBar } from "./content-save-bar";
import { ContentSection } from "./content-section";
import { ImageRefInput } from "./image-ref-input";
import { KeywordsInput } from "./keywords-input";
import { TextInput } from "./text-input";
import { usePageContentForm } from "./use-page-content-form";

// Keywords are edited one per line; blank lines are dropped on save.
function prepare(values: SiteContent): SiteContent {
  const keywords = values.seo.keywords.map((k) => k.trim()).filter(Boolean);
  return { ...values, seo: { ...values.seo, keywords } };
}

export function SiteContentForm({ values }: { values: SiteContent }) {
  const { form, saving, onSubmit, restoreDefaults } = usePageContentForm(
    "site",
    values,
    { prepare },
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6 pb-24" noValidate>
        <ContentSection
          title="Sociální sítě"
          description="Ikony v hlavičce a patičce. Prázdné pole ikonu skryje."
        >
          <TextInput
            name="facebookUrl"
            label="Facebook"
            type="url"
            placeholder="https://www.facebook.com/…"
          />
          <TextInput
            name="instagramUrl"
            label="Instagram"
            type="url"
            placeholder="https://www.instagram.com/…"
          />
        </ContentSection>
        <ContentSection
          title="Vyhledávače a sdílení"
          description="Jak web vypadá ve výsledcích Googlu a při sdílení odkazu."
        >
          <TextInput name="seo.description" label="Popis webu" multiline />
          <KeywordsInput />
          <ImageRefInput
            name="seo.ogImage"
            label="Obrázek při sdílení (Facebook, WhatsApp…)"
            scope="web"
            cropAspect="16:9"
          />
        </ContentSection>
        <ContentSection title="Patička">
          <TextInput name="footerTagline" label="Krátký text v patičce" />
        </ContentSection>
        <ContentSaveBar
          dirty={form.formState.isDirty}
          saving={saving}
          viewHref="/"
          onRestoreDefaults={restoreDefaults}
        />
      </form>
    </FormProvider>
  );
}
