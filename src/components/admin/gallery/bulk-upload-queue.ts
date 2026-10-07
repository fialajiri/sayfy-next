// Bulk upload pipeline (pure orchestration, React-free so it's testable):
// chunks of CHUNK files → compress (3 at a time, memory-bound) → presign the
// chunk → PUT (4 at a time) → persist the chunk's successes BEFORE the next
// chunk starts, so a crash 180 photos in loses nothing already uploaded.
import { compressImage } from "../upload/image-compression";
import {
  putToS3,
  requestPresign,
  runWithConcurrency,
} from "../upload/upload-client";

export const CHUNK = 25;
export type QueueStatus =
  "pending" | "compressing" | "uploading" | "saved" | "error";

export type QueueCallbacks = {
  onStatus: (index: number, status: QueueStatus, progress?: number) => void;
  /** Persist one chunk of uploaded URLs; must resolve before the next chunk starts. */
  persist: (urls: string[]) => Promise<boolean>;
};

export type QueueDeps = {
  compress: (file: File) => Promise<File>;
  presign: typeof requestPresign;
  put: typeof putToS3;
};

const realDeps: QueueDeps = {
  compress: compressImage,
  presign: requestPresign,
  put: putToS3,
};

export async function runUploadQueue(
  files: { index: number; file: File }[],
  scope: string,
  callbacks: QueueCallbacks,
  deps: QueueDeps = realDeps,
): Promise<{ saved: number; failed: number }> {
  let saved = 0;
  let failed = 0;
  for (let start = 0; start < files.length; start += CHUNK) {
    const chunk = files.slice(start, start + CHUNK);
    const compressed = await runWithConcurrency(
      chunk,
      3,
      async ({ index, file }) => {
        callbacks.onStatus(index, "compressing");
        try {
          return { index, file: await deps.compress(file) };
        } catch {
          callbacks.onStatus(index, "error");
          return null;
        }
      },
    );
    const ready = compressed.filter(
      (item): item is { index: number; file: File } => item !== null,
    );
    failed += chunk.length - ready.length;
    if (ready.length === 0) continue;

    let presigned: Awaited<ReturnType<typeof requestPresign>>;
    try {
      presigned = await deps.presign(
        "galerie",
        scope,
        ready.map((r) => r.file),
      );
    } catch {
      for (const r of ready) callbacks.onStatus(r.index, "error");
      failed += ready.length;
      continue;
    }

    const uploaded = await runWithConcurrency(ready, 4, async (item, i) => {
      callbacks.onStatus(item.index, "uploading", 0);
      try {
        await deps.put(presigned[i], item.file, (p) =>
          callbacks.onStatus(item.index, "uploading", p),
        );
        return { index: item.index, url: presigned[i].publicUrl };
      } catch {
        callbacks.onStatus(item.index, "error");
        return null;
      }
    });
    const ok = uploaded.filter(
      (u): u is { index: number; url: string } => u !== null,
    );
    failed += ready.length - ok.length;
    if (ok.length === 0) continue;

    if (await callbacks.persist(ok.map((u) => u.url))) {
      for (const u of ok) callbacks.onStatus(u.index, "saved");
      saved += ok.length;
    } else {
      for (const u of ok) callbacks.onStatus(u.index, "error");
      failed += ok.length;
    }
  }
  return { saved, failed };
}
