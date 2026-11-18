export type BlockFieldDef = [key: string, type: string, label: string];

export type BlockTypeDef = {
  label: string;
  bg: string;
  xp: boolean;
  wide: boolean;
  fields: BlockFieldDef[];
};

/**
 * Editor definition of every lesson block. Field keys MUST match the backend's block config records
 * (`content/dto/config/*Config.java`), in camelCase here because the API client converts keys: a
 * mismatch makes the field render empty and silently drops the value on save.
 */
export const BLOCK_TYPES: Record<string, BlockTypeDef> = {
  INFO: {
    label: "Información",
    bg: "bg-fill-dark",
    xp: false,
    wide: true,
    fields: [
      ["title", "text", "Título"],
      ["text", "textarea", "Texto"],
    ],
  },
  INTRODUCE_SIGN: {
    label: "Presentar seña",
    bg: "bg-primary-light",
    xp: true,
    wide: false,
    fields: [["meaning", "sign", "Seña"]],
  },
  SELECT_MEANING: {
    label: "Elegir significado",
    bg: "bg-course-teal-light",
    xp: true,
    wide: false,
    fields: [
      ["sign", "sign", "Seña correcta"],
      ["options", "words", "Opciones de significado"],
    ],
  },
  SELECT_SIGN: {
    label: "Elegir seña",
    bg: "bg-avatar-blue-light",
    xp: true,
    wide: false,
    fields: [
      ["word", "text", "Palabra"],
      ["options", "signs", "Señas opcionales"],
    ],
  },
  CONTEXT_RESPONSE: {
    label: "Respuesta en contexto",
    bg: "bg-shop-amber-light",
    xp: true,
    wide: false,
    fields: [
      ["question", "text", "Pregunta"],
      ["answer", "text", "Respuesta correcta"],
      ["options", "words", "Opciones"],
    ],
  },
  MATCH: {
    label: "Emparejar",
    bg: "bg-avatar-wine-light",
    xp: true,
    wide: false,
    fields: [["concepts", "signs", "Conceptos"]],
  },
  VISUAL_RECOGNITION: {
    label: "Reconocimiento visual",
    bg: "bg-avatar-green-light",
    xp: true,
    wide: false,
    fields: [
      ["signSequence", "signs", "Secuencia"],
      ["options", "signs", "Opciones"],
    ],
  },
  PERFORM_SIGN: {
    label: "Hacer la seña",
    bg: "bg-danger-light",
    xp: true,
    wide: false,
    fields: [["signs", "signs", "Seña a realizar"]],
  },
  SPELL_NAME: {
    label: "Deletrear nombre",
    bg: "bg-avatar-teal-light",
    xp: true,
    wide: false,
    fields: [],
  },
  INVISIBLE_SIGNS: {
    label: "Señas invisibles",
    bg: "bg-fill",
    xp: false,
    wide: false,
    fields: [["signs", "signs", "Señas"]],
  },
};

/** Problems that would publish an unusable block: any field the editor shows must be filled in. */
export function blockConfigIssues(type: string, config: Record<string, unknown>): string[] {
  const def = BLOCK_TYPES[type];
  if (!def) return [`tipo de bloque desconocido (${type}).`];
  const issues: string[] = [];
  for (const [key, fieldType, label] of def.fields) {
    const value = config[key];
    const empty = Array.isArray(value)
      ? value.length === 0
      : typeof value !== "string" || value.trim() === "";
    if (empty) issues.push(`falta completar "${label}" (${def.label}).`);
    else if (fieldType === "signs" || fieldType === "words") {
      if ((value as unknown[]).some((v) => typeof v !== "string" || v.trim() === ""))
        issues.push(`"${label}" tiene un valor vacío (${def.label}).`);
    }
  }
  return issues;
}
