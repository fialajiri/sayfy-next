"use client";

import { useState, type ChangeEvent, type MouseEvent } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ASPECTS, aspectValue, type AspectId } from "./aspect";
import type { CropPixels } from "./image-crop";

type ImageCropDialogProps = {
  imageUrl: string;
  initialAspect: AspectId;
  onCrop: (crop: CropPixels) => void;
  onSkip: () => void;
  onCancel: () => void;
};

// Adapted from zive-teplice-next: adds aspect presets and "use without cropping".
export function ImageCropDialog({
  imageUrl,
  initialAspect,
  onCrop,
  onSkip,
  onCancel,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<AspectId>(initialAspect);
  const [natural, setNatural] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [pixels, setPixels] = useState<Area | null>(null);

  function handleCropComplete(_area: Area, area: Area) {
    setPixels(area);
  }
  function handleMediaLoaded(size: {
    naturalWidth: number;
    naturalHeight: number;
  }) {
    setNatural({ width: size.naturalWidth, height: size.naturalHeight });
  }
  function handleZoom(event: ChangeEvent<HTMLInputElement>) {
    setZoom(Number(event.target.value));
  }
  function handleAspect(event: MouseEvent<HTMLButtonElement>) {
    setAspect(event.currentTarget.dataset.aspect as AspectId);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }
  function handleConfirm() {
    if (pixels) onCrop(pixels);
  }
  function handleOpenChange(open: boolean) {
    if (!open) onCancel();
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="light max-w-2xl gap-4 sm:max-w-2xl">
        <DialogTitle className="text-lg">Oříznout obrázek</DialogTitle>
        <DialogDescription>
          Posuňte a přibližte výřez. Velké fotky se po oříznutí ještě
          automaticky zmenší.
        </DialogDescription>
        <div
          role="group"
          aria-label="Poměr stran"
          className="flex flex-wrap gap-1.5"
        >
          {ASPECTS.map((option) => (
            <button
              key={option.id}
              type="button"
              data-aspect={option.id}
              onClick={handleAspect}
              aria-pressed={aspect === option.id}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                aspect === option.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="bg-asphalt-950 relative h-[min(60vh,26rem)] w-full overflow-hidden rounded-lg">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspectValue(aspect, natural)}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            onMediaLoaded={handleMediaLoaded}
          />
        </div>
        <div className="flex items-center gap-3">
          <label
            htmlFor="crop-zoom"
            className="text-muted-foreground text-sm whitespace-nowrap"
          >
            Přiblížení
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={handleZoom}
            className="accent-primary w-full"
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            className="mr-auto"
          >
            Použít bez oříznutí
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Zrušit
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!pixels}>
            Oříznout a nahrát
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
