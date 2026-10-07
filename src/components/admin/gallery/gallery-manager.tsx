"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  appendGalleryImagesAction,
  updateGalleryImagesAction,
} from "@/server/actions/galleries";
import type { GalleryRecord } from "@/server/domain/gallery";
import { toScope } from "../upload/upload-client";
import { BulkUpload } from "./bulk-upload";
import { DeleteGalleryDialog } from "./delete-gallery-dialog";
import { GalleryImagesGrid } from "./gallery-images-grid";
import { GalleryTitleForm } from "./gallery-title-form";

export function GalleryManager({ initial }: { initial: GalleryRecord }) {
  const router = useRouter();
  const [gallery, setGallery] = useState(initial);
  const [saving, startSaving] = useTransition();

  // Persist one uploaded chunk; the latest record (updatedAt) comes back.
  async function persist(urls: string[]): Promise<boolean> {
    const result = await appendGalleryImagesAction(gallery.id, { urls });
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }
    setGallery(result.gallery);
    return true;
  }

  function handleImagesChange(images: string[]) {
    startSaving(async () => {
      const result = await updateGalleryImagesAction(gallery.id, {
        images,
        expectedUpdatedAt: gallery.updatedAt,
      });
      if (!result.ok) {
        toast.error(result.message);
        if (result.conflict) router.refresh();
        return;
      }
      setGallery(result.gallery);
    });
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <GalleryTitleForm gallery={gallery} onSaved={setGallery} />
        <div className="flex flex-wrap gap-3">
          <a
            href={`/fotogalerie/${encodeURIComponent(gallery.slug)}`}
            target="_blank"
            rel="noopener"
            className="text-primary text-sm font-medium hover:underline"
          >
            Zobrazit na webu ↗
          </a>
          <DeleteGalleryDialog
            id={gallery.id}
            title={gallery.title}
            count={gallery.images.length}
          />
        </div>
      </div>
      <BulkUpload scope={toScope(gallery.slug)} persist={persist} />
      <GalleryImagesGrid
        images={gallery.images}
        busy={saving}
        onChange={handleImagesChange}
      />
    </div>
  );
}
