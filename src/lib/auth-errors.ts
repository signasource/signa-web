import { ApiError } from "@/lib/api/client";

/** Domain errors returned verbatim by the backend (GlobalExceptionHandler → ErrorResponse). */
const AUTH_ERROR_MAP: Record<string, string> = {
  // Login
  "Invalid credentials": "El email o la contraseña son incorrectos.",

  // Register (users)
  "Email already in use": "Ese email ya está registrado.",
  "Username already in use": "Ese nombre de usuario ya está en uso.",

  // Register (organizations)
  "An organization with this name already exists":
    "Ya existe una organización registrada con ese nombre.",
  "An organization with this CUIT already exists":
    "Ya existe una organización registrada con ese CUIT.",

  // Password reset
  "Invalid or expired code": "El código no es válido o venció. Pedí uno nuevo.",

  // Generic
  "Too many requests": "Demasiados intentos. Esperá unos minutos y volvé a intentarlo.",
  "Internal server error": "Ocurrió un error inesperado. Intentalo de nuevo.",
};

/**
 * Field validation errors returned as "<field>: <jakarta message>" by GlobalExceptionHandler
 * (MethodArgumentNotValidException, only the first field error is surfaced).
 */
function translateFieldError(field: string, detail: string): string | null {
  const isPattern = /match/i.test(detail);
  const isSize = /size|between/i.test(detail);
  const isBlank = /blank|empty|null/i.test(detail);
  const isEmail = /well-formed|email/i.test(detail);

  switch (field) {
    case "contactEmail":
    case "email":
      return "Ingresá un email válido.";
    case "code":
      return "Ingresá el código de 6 dígitos que te enviamos.";
    case "adminPassword":
    case "newPassword":
    case "password":
      if (isBlank) return "Ingresá una contraseña.";
      if (isSize || isPattern) return "La contraseña debe tener al menos 8 caracteres.";
      return "Revisá la contraseña.";
    case "orgName":
      if (isBlank) return "Ingresá el nombre de la organización.";
      if (isSize) return "El nombre de la organización debe tener entre 2 y 100 caracteres.";
      return "Revisá el nombre de la organización.";
    case "adminName":
      if (isBlank) return "Ingresá el nombre del responsable.";
      return "Revisá el nombre del responsable.";
    case "cuit":
      if (isBlank) return "Ingresá el CUIT de la organización.";
      return "El CUIT no es válido.";
    case "identifier":
      return "Ingresá tu email o usuario.";
    default:
      return null;
  }
  void isEmail;
}

/**
 * Turns a raw backend error into a Spanish user-facing message.
 * Accepts ApiError instances or anything else (network failures, etc.).
 * Returns `fallback` when no specific translation is available.
 */
export function mapAuthError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;

  const raw = err.message;

  if (AUTH_ERROR_MAP[raw]) return AUTH_ERROR_MAP[raw];

  // "<field>: <jakarta validation message>"
  const fieldMatch = /^(\w+):\s*(.+)$/.exec(raw);
  if (fieldMatch) {
    const translated = translateFieldError(fieldMatch[1] ?? "", fieldMatch[2] ?? "");
    if (translated) return translated;
  }

  // "CUIT must have 11 digits" (domain error from service, not field-prefixed)
  if (/cuit/i.test(raw) && /digit/i.test(raw)) return "El CUIT debe tener 11 dígitos.";

  return fallback;
}
