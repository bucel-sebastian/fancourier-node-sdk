import { FancourierError, messageFromBody } from '../errors';

/** Response envelope used by most FanCourier report endpoints. */
export interface StatusEnvelope<T> {
  status: string;
  data: T;
}

/** Paginated response envelope. */
export interface PaginatedEnvelope<T> {
  status: string;
  total: number;
  perPage: number;
  currentPage: number;
  data: T[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Throws when a 200 response contains an API-level failure. FanCourier
 * inconsistently uses `status: "error"` / `status: "fail"` with a `message`
 * field for some operations.
 */
export function assertSuccess(body: unknown, context: string): void {
  if (!isRecord(body) || typeof body.status !== 'string') {
    return;
  }
  if (body.status.toLowerCase() === 'success') {
    return;
  }
  throw new FancourierError(messageFromBody(body) ?? `${context} failed`, { raw: body });
}

/** Unwraps `{ status, data }`, validating the status first. */
export function unwrapData<T>(body: unknown, context: string): T {
  assertSuccess(body, context);
  if (!isRecord(body) || !('data' in body)) {
    throw new FancourierError(`${context} response did not include data`, { raw: body });
  }
  return body.data as T;
}

/** Validates a paginated envelope and returns it unchanged. */
export function asPaginated<T>(
  body: unknown,
  context: string,
): PaginatedEnvelope<T> {
  assertSuccess(body, context);
  if (!isRecord(body) || !Array.isArray(body.data)) {
    throw new FancourierError(`${context} response did not include a data array`, {
      raw: body,
    });
  }
  return body as unknown as PaginatedEnvelope<T>;
}
