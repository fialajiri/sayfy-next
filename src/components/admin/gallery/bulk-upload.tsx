"use client";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  UploadCloudIcon,
} from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { pluralize } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  IMAGE_ACCEPT,
  MAX_ORIGINAL_IMAGE_BYTES,
} from "../upload/upload-client";
import { runUploadQueue, type QueueStatus } from "./bulk-upload-queue";

const MAX_PER_BATCH = 200;
type Item = {
  file: File;
  preview: string;
  status: QueueStatus;
  progress: number;
};

type BulkUploadProps = {
  scope: string;
  /** Saves one uploaded chunk; the caller keeps its own state fresh from it. */
  persist: (urls: string[]) => Promise<boolean>;
};

function photos(count: number): string {
  return `${count} ${pluralize(count, { one: "fotku", few: "fotky", other: "fotek" })}`;
}

const STATUS_LABEL: Record<QueueStatus, string> = {
  pending: "Čeká",
  compressing: "Zmenšuji",
  uploading: "Nahrávám",
  saved: "Uloženo",
  error: "Chyba",
};

export function BulkUpload({ scope, persist }: BulkUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const done = items.filter((i) => i.status === "saved").length;
  const failed = items.filter((i) => i.status === "error").length;
  const percent = items.length
    ? Math.round(
        items.reduce(
          (sum, i) => sum + (i.status === "saved" ? 100 : i.progress),
          0,
        ) / items.length,
      )
    : 0;

  function add(files: File[]) {
    const accepted = files.filter(
      (f) => f.type.startsWith("image/") && f.size <= MAX_ORIGINAL_IMAGE_BYTES,
    );
    const room = MAX_PER_BATCH - items.length;
    if (accepted.length < files.length || accepted.length > room) {
      toast.warning(
        `Některé soubory byly vynechány (jen obrázky do 40 MB, nejvýše ${MAX_PER_BATCH} najednou).`,
      );
    }
    const next = accepted.slice(0, room).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const,
      progress: 0,
    }));
    setItems((prev) => [...prev, ...next]);
  }

  function update(index: number, status: QueueStatus, progress = 0) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, status, progress } : item,
      ),
    );
  }

  async function start() {
    const targets = items
      .map((item, index) => ({ index, file: item.file, status: item.status }))
      .filter((t) => t.status !== "saved");
    if (targets.length === 0) return;
    setRunning(true);
    for (const t of targets) update(t.index, "pending");
    const result = await runUploadQueue(targets, scope, {
      onStatus: update,
      persist,
    });
    setRunning(false);
    if (result.failed > 0)
      toast.error(
        `${photos(result.failed)} se nepodařilo nahrát. Můžete je zkusit znovu.`,
      );
    else toast.success(`Nahráno: ${photos(result.saved)}.`);
    // Successes are already saved in the gallery — drop them from the queue.
    setItems((prev) => {
      for (const item of prev)
        if (item.status === "saved") URL.revokeObjectURL(item.preview);
      return prev.filter((item) => item.status !== "saved");
    });
  }

  function handleStart() {
    void start();
  }
  function handlePick() {
    input.current?.click();
  }
  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    add([...(event.target.files ?? [])]);
    event.target.value = "";
  }
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (!running) add([...event.dataTransfer.files]);
  }
  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(true);
  }
  function handleDragLeave() {
    setDragOver(false);
  }
  function handleClear() {
    for (const item of items) URL.revokeObjectURL(item.preview);
    setItems([]);
  }

  return (
    <section aria-labelledby="bulk-heading" className="space-y-4">
      <h2 id="bulk-heading" className="text-lg font-semibold">
        Přidat fotky
      </h2>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "bg-card flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center",
          dragOver && "border-primary bg-primary/5",
        )}
      >
        <UploadCloudIcon
          className="text-muted-foreground size-10"
          aria-hidden="true"
        />
        <p>Přetáhněte fotky sem, nebo</p>
        <Button
          type="button"
          variant="outline"
          onClick={handlePick}
          disabled={running}
        >
          Vyberte soubory
        </Button>
        <p className="text-muted-foreground text-xs">
          Až {MAX_PER_BATCH} fotek najednou. Před nahráním se automaticky zmenší
          (max. 2560 px).
        </p>
      </div>
      <input
        ref={input}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        onChange={handleFiles}
      />

      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleStart} disabled={running}>
              {running
                ? "Nahrávám…"
                : failed > 0
                  ? `Zkusit znovu (${items.length})`
                  : `Nahrát ${photos(items.length)}`}
            </Button>
            {!running && (
              <Button type="button" variant="ghost" onClick={handleClear}>
                Vyprázdnit
              </Button>
            )}
            <span className="text-muted-foreground text-sm" aria-live="polite">
              {done} uloženo{failed > 0 && `, ${failed} chyb`}
            </span>
          </div>
          {running && (
            <Progress value={percent} aria-label="Celkový průběh nahrávání" />
          )}
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-10">
            {items.map((item) => (
              <li
                key={item.preview}
                className="bg-muted relative aspect-square overflow-hidden rounded-md"
                title={`${item.file.name}: ${STATUS_LABEL[item.status]}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img
                  src={item.preview}
                  alt={item.file.name}
                  className={cn(
                    "size-full object-cover",
                    item.status === "error" && "opacity-50",
                  )}
                />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 py-0.5 text-[0.65rem] text-white">
                  {item.status === "saved" && (
                    <CheckCircle2Icon className="size-3" aria-hidden="true" />
                  )}
                  {item.status === "error" && (
                    <AlertCircleIcon className="size-3" aria-hidden="true" />
                  )}
                  {(item.status === "compressing" ||
                    item.status === "uploading") && (
                    <Loader2Icon
                      className="size-3 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {item.status === "uploading"
                    ? `${item.progress} %`
                    : STATUS_LABEL[item.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
