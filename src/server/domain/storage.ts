// Object-storage port + pure key/URL rules (docs/03 §3–4). No AWS imports.

export type PresignedUpload = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  /** Headers the browser must send so the signature matches. */
  requiredHeaders: Record<string, string>;
};

export type StoragePort = {
  presignUpload(params: {
    key: string;
    contentType: string;
    size: number;
  }): Promise<PresignedUpload>;
  /** Deletes what it may; returns how many keys were skipped by the dev guard. */
  deleteMany(
    keys: readonly string[],
  ): Promise<{ deleted: number; skipped: number }>;
  publicUrl(key: string): string;
};

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export function extensionFor(contentType: string): string | null {
  return EXTENSIONS[contentType] ?? null;
}

/**
 * New key format: `[envPrefix]<prefix>/<scope>/<uuid>.<ext>` — server-generated,
 * client file names never reach the key. `envPrefix` is "dev/" outside
 * production so local testing never mixes with (or deletes) live objects.
 */
export function buildUploadKey(parts: {
  envPrefix: string;
  prefix: string;
  scope: string;
  id: string;
  extension: string;
}): string {
  return `${parts.envPrefix}${parts.prefix}/${parts.scope}/${parts.id}.${parts.extension}`;
}

/** Outside production only keys under the env prefix may be deleted. */
export function isDeletableKey(key: string, envPrefix: string): boolean {
  return envPrefix === "" || key.startsWith(envPrefix);
}
