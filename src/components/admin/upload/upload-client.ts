// Browser-side upload kit (adapted from zive-teplice-next): compress → presign
// → PUT straight to S3 with progress. Pure client I/O; the presign route
// re-validates everything server-side.
import { compressImage } from "./image-compression";

export type UploadPrefix =
  | "aktuality"
  | "galerie"
  | "propozice"
  | "partners"
  | "stranky"
  | "soubory"
  | "media";

type Presigned = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  requiredHeaders: Record<string, string>;
};

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
export const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.txt";
export const MAX_ORIGINAL_IMAGE_BYTES = 40 * 1024 * 1024;

export class UploadError extends Error {}

async function readError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
    )
      return body.error;
  } catch {
    // fall through
  }
  return "Nahrání se nepodařilo.";
}

export async function requestPresign(
  prefix: UploadPrefix,
  scope: string,
  files: File[],
): Promise<Presigned[]> {
  const response = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prefix,
      scope,
      files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
    }),
  });
  if (!response.ok) throw new UploadError(await readError(response));
  const data: { uploads?: Presigned[] } = await response.json();
  if (!data.uploads || data.uploads.length !== files.length)
    throw new UploadError("Nahrání se nepodařilo.");
  return data.uploads;
}

export function putToS3(
  upload: Presigned,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", upload.uploadUrl);
    for (const [name, value] of Object.entries(upload.requiredHeaders))
      xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new UploadError(`S3 (${xhr.status})`));
    xhr.onerror = () => reject(new UploadError("Chyba sítě při nahrávání."));
    xhr.send(file);
  });
}

/** Scope = a slug-like folder segment the presign route accepts. */
export function toScope(value: string): string {
  const scope = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return scope || "obecne";
}

/** Upload one file (images are compressed first) and return its public URL. */
export async function uploadFile(
  file: File,
  prefix: UploadPrefix,
  scope: string,
  onProgress?: (percent: number) => void,
  options: { compress?: boolean } = {},
): Promise<string> {
  // Logos must keep PNG transparency, so they skip the JPEG re-encode.
  const isImage = file.type.startsWith("image/") && options.compress !== false;
  if (isImage && file.size > MAX_ORIGINAL_IMAGE_BYTES)
    throw new UploadError("Obrázek je příliš velký.");
  const prepared = isImage ? await compressImage(file) : file;
  const [presigned] = await requestPresign(prefix, toScope(scope), [prepared]);
  await putToS3(presigned, prepared, onProgress);
  return presigned.publicUrl;
}

// Bounded parallelism that never rejects: each slot resolves to its own outcome.
export async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, i: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function slot(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, slot),
  );
  return results;
}
