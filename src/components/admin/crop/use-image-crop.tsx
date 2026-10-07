"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { AspectId } from "./aspect";
import { ImageCropDialog } from "./image-crop-dialog";
import { cropToFile, type CropPixels } from "./image-crop";

type Pending = {
  file: File;
  url: string;
  aspect: AspectId;
  resolve: (file: File | null) => void;
};

/**
 * Promise-based crop step: `const file = await requestCrop(original, "4:3")`
 * resolves to the cropped file, the original (skip), or null (cancelled).
 * Render `cropDialog` once in the component.
 */
export function useImageCrop(): {
  requestCrop: (file: File, aspect: AspectId) => Promise<File | null>;
  cropDialog: ReactNode;
} {
  const [pending, setPending] = useState<Pending | null>(null);

  function requestCrop(file: File, aspect: AspectId): Promise<File | null> {
    return new Promise((resolve) =>
      setPending({ file, url: URL.createObjectURL(file), aspect, resolve }),
    );
  }

  function finish(result: File | null) {
    if (!pending) return;
    URL.revokeObjectURL(pending.url);
    pending.resolve(result);
    setPending(null);
  }

  async function handleCrop(crop: CropPixels) {
    if (!pending) return;
    try {
      finish(await cropToFile(pending.file, crop));
    } catch {
      toast.error("Obrázek se nepodařilo oříznout — nahrávám ho beze změny.");
      finish(pending.file);
    }
  }
  function handleSkip() {
    finish(pending?.file ?? null);
  }
  function handleCancel() {
    finish(null);
  }

  const cropDialog = pending ? (
    <ImageCropDialog
      imageUrl={pending.url}
      initialAspect={pending.aspect}
      onCrop={handleCrop}
      onSkip={handleSkip}
      onCancel={handleCancel}
    />
  ) : null;
  return { requestCrop, cropDialog };
}
