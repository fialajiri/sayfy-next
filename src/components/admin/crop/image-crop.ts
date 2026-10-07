// Adapted from zive-teplice-next: draw the chosen crop rectangle to a canvas.
// Flattens transparency onto white first (zive's version would turn a
// transparent PNG's background black when encoding to JPEG).
import { canvasToBlob } from "../upload/image-compression";

export type CropPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function cropToFile(
  source: File,
  crop: CropPixels,
): Promise<File> {
  const bitmap = await createImageBitmap(source, {
    imageOrientation: "from-image",
  });
  try {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(crop.width));
    canvas.height = Math.max(1, Math.round(crop.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      bitmap,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const blob = await canvasToBlob(canvas, 0.92);
    if (!blob) throw new Error("Cropped image encode failed.");
    const name = source.name.replace(/\.[^./\\]+$/, "") || "obrazek";
    return new File([blob], `${name}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
