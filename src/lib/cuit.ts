/** CUIT/CUIL validation for Argentine tax IDs (format: XX-XXXXXXXX-X, 11 digits). */

export function validateCuit(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0);
  const rem = sum % 11;
  if (rem === 1) return false;
  const check = rem === 0 ? 0 : 11 - rem;
  return check === Number(digits[10]);
}

/** Formats a raw digit string as XX-XXXXXXXX-X while the user types. */
export function formatCuit(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}
