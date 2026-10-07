"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { useState, type ChangeEvent, type MouseEvent } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GalleryImagesGridProps = {
  images: string[];
  busy: boolean;
  onChange: (images: string[]) => void;
};

function move(list: string[], from: number, to: number): string[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// First photo = cover. Every change saves immediately (parent action).
export function GalleryImagesGrid({
  images,
  busy,
  onChange,
}: GalleryImagesGridProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const url = event.currentTarget.value;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }
  function handleAction(event: MouseEvent<HTMLButtonElement>) {
    const { action, index } = event.currentTarget.dataset;
    const i = Number(index);
    if (action === "cover") onChange(move(images, i, 0));
    if (action === "left") onChange(move(images, i, i - 1));
    if (action === "right") onChange(move(images, i, i + 1));
  }
  function handleDeleteSelected() {
    onChange(images.filter((url) => !selected.has(url)));
    setSelected(new Set());
  }
  function handleSelectAll() {
    setSelected(selected.size === images.length ? new Set() : new Set(images));
  }

  if (images.length === 0)
    return (
      <p className="text-muted-foreground">Galerie zatím nemá žádné fotky.</p>
    );

  return (
    <section aria-labelledby="photos-heading" className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="photos-heading" className="text-lg font-semibold">
          Fotky ({images.length})
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
        >
          {selected.size === images.length ? "Zrušit výběr" : "Vybrat vše"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={selected.size === 0 || busy}
              />
            }
          >
            <Trash2Icon data-icon="inline-start" />
            Smazat vybrané ({selected.size})
          </AlertDialogTrigger>
          <AlertDialogContent className="light">
            <AlertDialogHeader>
              <AlertDialogTitle>Smazat {selected.size} fotek?</AlertDialogTitle>
              <AlertDialogDescription>
                Fotky zmizí z galerie i z úložiště. Tuto akci nelze vrátit.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Zrušit</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleDeleteSelected}
              >
                Smazat
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {images.map((url, i) => (
          <li
            key={url}
            className={cn(
              "bg-card relative overflow-hidden rounded-lg border [contain-intrinsic-size:auto_200px] [content-visibility:auto]",
              selected.has(url) && "ring-primary ring-2",
            )}
          >
            <label className="block cursor-pointer">
              <input
                type="checkbox"
                value={url}
                checked={selected.has(url)}
                onChange={handleSelect}
                className="absolute top-2 left-2 z-10 size-5"
                aria-label={`Vybrat fotku ${i + 1}`}
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of any legacy size */}
              <img
                src={url}
                alt={`Fotka ${i + 1}`}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </label>
            {i === 0 && (
              <span className="bg-signal text-ink absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-semibold">
                Titulní
              </span>
            )}
            <div className="flex items-center justify-between gap-1 p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                data-action="left"
                data-index={i}
                onClick={handleAction}
                disabled={busy || i === 0}
                aria-label={`Posunout fotku ${i + 1} doleva`}
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-action="cover"
                data-index={i}
                onClick={handleAction}
                disabled={busy || i === 0}
              >
                <StarIcon data-icon="inline-start" />
                Titulní
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                data-action="right"
                data-index={i}
                onClick={handleAction}
                disabled={busy || i === images.length - 1}
                aria-label={`Posunout fotku ${i + 1} doprava`}
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
