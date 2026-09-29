type Json = unknown;

const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (key: string) => key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

function isPlainObject(value: Json): value is Record<string, Json> {
  return (
    typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype
  );
}

function mapKeys(value: Json, fn: (key: string) => string): Json {
  if (Array.isArray(value)) return value.map((item) => mapKeys(item, fn));
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [fn(k), mapKeys(v, fn)]));
  }
  return value;
}

/** Request bodies: camelCase → snake_case (the API's JSON convention). */
export const keysToSnake = <T>(value: unknown): T => mapKeys(value, toSnake) as T;

/** Responses: snake_case → camelCase. */
export const keysToCamel = <T>(value: unknown): T => mapKeys(value, toCamel) as T;
