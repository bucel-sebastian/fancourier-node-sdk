/**
 * Serializes nested query/form data using PHP-style bracket notation.
 *
 * - `{ info: { service: 'Standard' } }` -> `info[service]=Standard`
 * - `{ awbs: ['1', '2'] }` -> `awbs[]=1&awbs[]=2`
 * - Existing `[]` keys are kept (`awbs[]` -> repeated `awbs[]`).
 */
export function buildQuery(params: Record<string, unknown> = {}): string {
  const parts: string[] = [];
  append(params, '', parts);
  return parts.join('&');
}

function append(value: unknown, prefix: string, parts: string[]): void {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    if (prefix === '') {
      return;
    }
    const key = prefix.endsWith('[]') ? prefix : `${prefix}[]`;
    for (const item of value) {
      if (item === undefined || item === null) {
        continue;
      }
      if (typeof item === 'object') {
        append(item, key, parts);
      } else {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
      }
    }
    return;
  }

  if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      append(item, prefix === '' ? key : `${prefix}[${key}]`, parts);
    }
    return;
  }

  if (prefix === '') {
    return;
  }
  parts.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
}

/** Same encoding as {@link buildQuery}, for `application/x-www-form-urlencoded` bodies. */
export function encodeForm(params: Record<string, unknown>): string {
  return buildQuery(params);
}
