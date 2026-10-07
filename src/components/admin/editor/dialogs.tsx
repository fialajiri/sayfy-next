"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { youtubeId } from "./youtube-url";

type DialogShellProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
  submitLabel: string;
};

function DialogShell({
  open,
  title,
  onClose,
  onSubmit,
  children,
  submitLabel,
}: DialogShellProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // The dialog is portaled, but React bubbles events through the COMPONENT
    // tree — without this, submitting the dialog also submits the article form.
    event.stopPropagation();
    onSubmit();
  }
  function handleOpenChange(next: boolean) {
    if (!next) onClose();
  }
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="light">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Zrušit
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type LinkValue = { href: string; newTab: boolean };

export function LinkDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: LinkValue;
  onClose: () => void;
  onSave: (value: LinkValue) => void;
}) {
  const [href, setHref] = useState(initial.href);
  const [newTab, setNewTab] = useState(initial.newTab);
  const valid =
    href === "" || /^(https?:\/\/|mailto:|tel:|\/)/.test(href.trim());

  function handleSave() {
    if (valid) onSave({ href: href.trim(), newTab });
  }

  return (
    <DialogShell
      open={open}
      title="Odkaz"
      onClose={onClose}
      onSubmit={handleSave}
      submitLabel={href ? "Uložit odkaz" : "Odebrat odkaz"}
    >
      <Field data-invalid={valid ? undefined : true}>
        <FieldLabel htmlFor="link-href">Adresa</FieldLabel>
        <Input
          id="link-href"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="https://… nebo /vysledky"
          autoFocus
        />
        {valid ? (
          <FieldDescription>Prázdné pole odkaz odebere.</FieldDescription>
        ) : (
          <FieldError>
            Zadejte adresu začínající https://, mailto:, tel: nebo /.
          </FieldError>
        )}
      </Field>
      <Field orientation="horizontal">
        <Switch
          id="link-new-tab"
          checked={newTab}
          onCheckedChange={setNewTab}
        />
        <FieldLabel htmlFor="link-new-tab">Otevřít v novém okně</FieldLabel>
      </Field>
    </DialogShell>
  );
}

export function YoutubeDialog({
  open,
  onClose,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (id: string) => void;
}) {
  const [url, setUrl] = useState("");
  const id = youtubeId(url);

  function handleInsert() {
    if (id) onInsert(id);
  }

  return (
    <DialogShell
      open={open}
      title="Video z YouTube"
      onClose={onClose}
      onSubmit={handleInsert}
      submitLabel="Vložit video"
    >
      <Field data-invalid={url && !id ? true : undefined}>
        <FieldLabel htmlFor="yt-url">Odkaz na video</FieldLabel>
        <Input
          id="yt-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtu.be/…"
          autoFocus
        />
        {url && !id && (
          <FieldError>Tohle nevypadá jako odkaz na YouTube.</FieldError>
        )}
      </Field>
      {id && (
        <iframe
          title="Náhled videa"
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          className="aspect-video w-full rounded-lg border"
        />
      )}
    </DialogShell>
  );
}

export type ImageDetails = { alt: string; caption: string };

export function ImageDetailsDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: ImageDetails;
  onClose: () => void;
  onSave: (value: ImageDetails) => void;
}) {
  const [alt, setAlt] = useState(initial.alt);
  const [caption, setCaption] = useState(initial.caption);

  function handleSave() {
    onSave({ alt: alt.trim(), caption: caption.trim() });
  }

  return (
    <DialogShell
      open={open}
      title="Popis obrázku"
      onClose={onClose}
      onSubmit={handleSave}
      submitLabel="Uložit"
    >
      <Field>
        <FieldLabel htmlFor="img-alt">Alternativní text (povinný)</FieldLabel>
        <Input
          id="img-alt"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          maxLength={300}
          autoFocus
        />
        <FieldDescription>
          Co je na obrázku — čtou ho nevidomí a vyhledávače.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="img-caption">
          Popisek pod obrázkem (nepovinný)
        </FieldLabel>
        <Input
          id="img-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={200}
        />
      </Field>
    </DialogShell>
  );
}
