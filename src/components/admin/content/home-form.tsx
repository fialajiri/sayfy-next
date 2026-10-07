"use client";

import { FormProvider } from "react-hook-form";
import type { HomeContent } from "@/schemas/page-content/home";
import { ContentSaveBar } from "./content-save-bar";
import { ContentSection } from "./content-section";
import { ImageRefInput } from "./image-ref-input";
import { LinkInput } from "./link-input";
import { TextInput } from "./text-input";
import { usePageContentForm } from "./use-page-content-form";
import { VideoInput } from "./video-input";

const FACTS = [0, 1, 2] as const;

export function HomeContentForm({ values }: { values: HomeContent }) {
  const { form, saving, onSubmit, restoreDefaults } = usePageContentForm(
    "home",
    values,
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6 pb-24" noValidate>
        <ContentSection
          title="Úvodní video"
          description="Horní část úvodní stránky."
        >
          <TextInput
            name="hero.kicker"
            label="Nadpis nad názvem"
            description="{edition} se nahradí číslem ročníku, {year} rokem."
          />
          <TextInput name="hero.title" label="Název" />
          <TextInput name="hero.subtitle" label="Podtitulek" multiline />
          <div className="grid gap-5 md:grid-cols-2">
            <VideoInput
              name="hero.video.mp4Url"
              label="Video (MP4)"
              accept="video/mp4"
              scope="hero"
            />
            <VideoInput
              name="hero.video.webmUrl"
              label="Video (WebM)"
              accept="video/webm"
              scope="hero"
              optional
            />
          </div>
          <ImageRefInput
            name="hero.video.poster"
            label="Úvodní snímek videa (než se načte)"
            scope="hero"
            cropAspect="16:9"
          />
          <LinkInput
            name="hero.secondaryCta"
            label="Druhé tlačítko (vedle registrace)"
          />
        </ContentSection>
        <ContentSection title="Tři fakta" description="Pruh pod videem.">
          {FACTS.map((i) => (
            <div key={i} className="grid gap-4 sm:grid-cols-2">
              <TextInput
                name={`facts.${i}.value`}
                label={`Fakt ${i + 1} — hodnota`}
              />
              <TextInput
                name={`facts.${i}.label`}
                label={`Fakt ${i + 1} — popisek`}
              />
            </div>
          ))}
        </ContentSection>
        <ContentSection title="Vzpomínka na Sayfyho">
          <TextInput name="memorial.quote" label="Citát" />
          <ImageRefInput
            name="memorial.portrait"
            label="Portrét"
            scope="sayfy"
            cropAspect="1:1"
          />
          <TextInput
            name="memorial.linkLabel"
            label="Text odkazu na stránku Sayfy"
          />
        </ContentSection>
        <ContentSection title="Nadpisy sekcí">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="sections.newsTitle" label="Aktuality" />
            <TextInput name="sections.resultsTitle" label="Výsledky" />
            <TextInput name="sections.galleryTitle" label="Fotogalerie" />
            <TextInput name="sections.partnersTitle" label="Partneři" />
          </div>
        </ContentSection>
        <ContentSection title="Výzva na konci stránky">
          <TextInput name="finishCta.title" label="Nadpis" />
          <TextInput name="finishCta.text" label="Text" multiline />
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
