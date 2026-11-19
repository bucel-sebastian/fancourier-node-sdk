/** Common options accepted by every {@link FancourierError}. */
export interface FancourierErrorOptions {
  /** HTTP status of the failed response, when the error came from one. */
  status?: number;
  /** API error code from an `errorCode`/`code` field, when present. */
  code?: number | string;
  /** Parsed response body, when one could be obtained. */
  raw?: unknown;
  /** Underlying cause (for example a JSON parse failure or a network error). */
  cause?: unknown;
}

/**
 * Base class for every error raised by the SDK.
 *
 * ES2022-safe prototype handling keeps `instanceof` working across the
 * subclass chain even when the package is compiled to CJS.
 */
export class FancourierError extends Error {
  readonly status?: number;
  readonly code?: number | string;
  readonly raw?: unknown;

  constructor(message: string, options: FancourierErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = 'FancourierError';
    this.status = options.status;
    this.code = options.code;
    this.raw = options.raw;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 401 — missing or invalid credentials/token. */
export class AuthenticationError extends FancourierError {
  constructor(message: string, options: FancourierErrorOptions = {}) {
    super(message, options);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 403 — authenticated, but not allowed to perform the operation. */
export class PermissionError extends FancourierError {
  constructor(message: string, options: FancourierErrorOptions = {}) {
    super(message, options);
    this.name = 'PermissionError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 400 — malformed request. Details stay available through `.raw`. */
export class ValidationError extends FancourierError {
  constructor(message: string, options: FancourierErrorOptions = {}) {
    super(message, options);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 404 — the addressed resource does not exist. */
export class NotFoundError extends FancourierError {
  constructor(message: string, options: FancourierErrorOptions = {}) {
    super(message, options);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 429 — rate limited; `retryAfter` is the `Retry-After` header in seconds. */
export class RateLimitError extends FancourierError {
  readonly retryAfter?: number;

  constructor(
    message: string,
    options: FancourierErrorOptions & { retryAfter?: number } = {},
  ) {
    super(message, options);
    this.name = 'RateLimitError';
    this.retryAfter = options.retryAfter;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 5xx — the API failed to process an otherwise valid request. */
export class ServerError extends FancourierError {
  constructor(message: string, options: FancourierErrorOptions = {}) {
    super(message, options);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const STATUS_TEXT: Readonly<Record<number, string | undefined>> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

function getHeader(
  headers: Headers | Record<string, string> | undefined,
  name: string,
): string | undefined {
  if (headers === undefined) {
    return undefined;
  }
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name) ?? undefined;
  }
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers as Record<string, string>)) {
    if (key.toLowerCase() === wanted) {
      return value;
    }
  }
  return undefined;
}

function parseRetryAfter(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const seconds = Number.parseInt(value, 10);
  return Number.isNaN(seconds) ? undefined : seconds;
}

function statusMessage(status: number): string {
  const reason = STATUS_TEXT[status];
  return reason === undefined ? `HTTP ${status}` : `HTTP ${status} ${reason}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Extracts a useful message from the various error envelopes FanCourier uses:
 * `{status:'error', message}`, `{errorMessage}`, `{error}`, and the per-field
 * `errors` object returned by AWB creation.
 */
export function messageFromBody(body: unknown): string | undefined {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  if (!isRecord(body)) {
    return undefined;
  }

  for (const key of ['errorMessage', 'message', 'error'] as const) {
    const value = body[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  const errors = body.errors;
  if (typeof errors === 'string' && errors.trim() !== '') {
    return errors;
  }
  if (isRecord(errors)) {
    const parts = Object.entries(errors)
      .map(([field, value]) => `${field}: ${String(value)}`)
      .join('; ');
    return parts === '' ? undefined : parts;
  }

  return undefined;
}

/** Extracts `errorCode`/`code` from a parsed response body. */
export function codeFromBody(body: unknown): number | string | undefined {
  if (!isRecord(body)) {
    return undefined;
  }
  const code = body.errorCode ?? body.code;
  return typeof code === 'number' || typeof code === 'string' ? code : undefined;
}

/**
 * Maps a failed HTTP response to a typed error.
 *
 * `body` may be the raw response text (it is JSON-parsed tolerantly) or an
 * already-parsed value; non-JSON bodies never throw. `headers` is only used to
 * pick up `Retry-After` for 429 responses.
 */
export function errorFromResponse(
  status: number,
  body: unknown,
  headers?: Headers | Record<string, string>,
): FancourierError {
  let parsed: unknown = body;
  let text: string | undefined;
  let isJson = false;

  if (typeof body === 'string') {
    text = body;
    try {
      parsed = JSON.parse(body);
      isJson = true;
    } catch {
      parsed = undefined;
    }
  }

  const message =
    messageFromBody(parsed) ??
    (!isJson && text !== undefined && text.trim() !== '' ? text : undefined) ??
    statusMessage(status);

  const options: FancourierErrorOptions = {
    status,
    code: codeFromBody(parsed),
    raw: isRecord(parsed) ? parsed : undefined,
  };

  switch (status) {
    case 400:
      return new ValidationError(message, options);
    case 401:
      return new AuthenticationError(message, options);
    case 403:
      return new PermissionError(message, options);
    case 404:
      return new NotFoundError(message, options);
    case 429:
      return new RateLimitError(message, {
        ...options,
        retryAfter: parseRetryAfter(getHeader(headers, 'retry-after')),
      });
    default:
      if (status >= 500 && status < 600) {
        return new ServerError(message, options);
      }
      return new FancourierError(message, options);
  }
}
