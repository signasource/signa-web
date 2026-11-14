import { ApiError } from "@/lib/api/client";

/** Spanish copy for a failed sign-editor request (the API answers in English). */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 409) {
      return /already in use/i.test(err.message)
        ? "Ya existe otra seña con ese nombre."
        : /reports/i.test(err.message)
          ? "La seña tiene reportes de usuarios y no se puede eliminar."
          : "La seña se usa en lecciones: sacala de ellas antes de eliminarla.";
    }
    if (err.status === 413) return "El archivo supera los 50 MB.";
    if (err.status === 400 && /front \.mp4/i.test(err.message))
      return "Primero subí el video de frente; el lateral va después.";
    if (err.status === 400 && /lateral/i.test(err.message))
      return "El video lateral tiene que ser un .mp4.";
    if (err.status === 400 && /glb|mp4/i.test(err.message))
      return "Solo se aceptan archivos .glb (3D) o .mp4 (video).";
    if (err.status === 400 && /youtube/i.test(err.message))
      return "El link de YouTube no es válido.";
    if (err.status === 400 && /meaning/i.test(err.message))
      return "El nombre solo puede tener letras, números, espacios, guiones y guion bajo.";
    if (err.status === 404) return "La seña ya no existe.";
  }
  return fallback;
}
