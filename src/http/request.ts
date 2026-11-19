// Explicitly pull in Node's type definitions: the tsup dts build creates its
// TypeScript program without a config path, so automatic `@types` discovery
// (which `tsc --noEmit` performs) does not happen there.
/// <reference types="node" />

import { USER_AGENT } from '../constants';
import { errorFromResponse, FancourierError } from '../errors';
import { buildQuery, encodeForm } from './query';

/** How the response payload should be decoded. */
export type ResponseType = 'json' | 'binary' | 'text';

/** Default per-request timeout (30s). */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Options accepted by {@link request}. */
export interface HttpRequestOptions {
  method: string;
  url: string;
  /** Query string parameters; `undefined`/`null` values are skipped. */
  query?: Record<string, unknown>;
  /** Body encoded as `application/x-www-form-urlencoded` (bracket notation). */
  formBody?: Record<string, unknown>;
  /** Body encoded as JSON. Takes precedence over `formBody` when both are set. */
  jsonBody?: unknown;
  headers?: Record<string, string>;
  /** Timeout in milliseconds; defaults to {@link DEFAULT_TIMEOUT_MS}. */
  timeoutMs?: number;
  /** Defaults to `'json'`. */
  responseType?: ResponseType;
  /** Injectable fetch so callers/tests can avoid the network. */
  fetchImpl?: typeof fetch;
}

function buildUrl(url: string, query?: Record<string, unknown>): string {
  if (query === undefined) {
    return url;
  }
  const search = buildQuery(query);
  if (search === '') {
    return url;
  }
  return url.includes('?') ? `${url}&${search}` : `${url}?${search}`;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

/**
 * Minimal fetch pipeline: query serialization, form/JSON bodies, default
 * headers, an `AbortController` timeout and typed error mapping for non-2xx
 * responses.
 */
export async function request<T = unknown>(opts: HttpRequestOptions): Promise<T> {
  const url = buildUrl(opts.url, opts.query);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': USER_AGENT,
    ...opts.headers,
  };

  let body: string | undefined;
  if (opts.jsonBody !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.jsonBody);
  } else if (opts.formBody !== undefined) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = encodeForm(opts.formBody);
  }

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: opts.method,
      headers,
      body,
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new FancourierError(
        `Request timed out after ${timeoutMs}ms: ${opts.method} ${url}`,
        { cause: error },
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text();
    throw errorFromResponse(response.status, text, response.headers);
  }

  const responseType = opts.responseType ?? 'json';

  if (responseType === 'binary') {
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer) as unknown as T;
  }

  const text = await response.text();
  if (text.trim() === '') {
    return undefined as T;
  }

  if (responseType === 'text') {
    return text as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new FancourierError(`Failed to parse JSON response: ${opts.method} ${url}`, {
      cause: error,
      raw: text,
    });
  }
}
