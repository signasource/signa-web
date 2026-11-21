/**
 * Loose contact-phone check: only digits, spaces, `+`, `-`, `.` and parentheses, with 8 to 15
 * digits (E.164 max). Accepts local ("11 1234-5678") and international ("+54 9 11 1234-5678") forms.
 */
export function validatePhone(value: string): boolean {
  const trimmed = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "").length;
  return digits >= 8 && digits <= 15;
}
