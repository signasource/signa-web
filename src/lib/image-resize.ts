import { AVATAR_MAX_FILE_BYTES, AVATAR_MAX_SIDE, fitWithin } from "@/lib/admin-profile";

/** Reads an image file and returns it as a small JPEG data URL (browser only). */
export async function imageFileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Elegí un archivo de imagen.");
  if (file.size > AVATAR_MAX_FILE_BYTES) throw new Error("La imagen pesa más de 8 MB.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("No pudimos leer esa imagen.");
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height, AVATAR_MAX_SIDE);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No pudimos procesar la imagen.");
  // JPEG has no alpha: paint white so transparent PNGs don't turn black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}
