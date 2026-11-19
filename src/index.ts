export { DEFAULT_TIMEOUT_MS, PROD_BASE_URL, USER_AGENT, VERSION } from './constants';

export { FancourierClient, FancourierClient as Fancourier } from './client';
export type { ClientRequestOptions, FancourierClientOptions } from './client';

export {
  FancourierError,
  AuthenticationError,
  PermissionError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  ServerError,
} from './errors';
export type { FancourierErrorOptions } from './errors';

export { buildQuery, encodeForm } from './http/query';
export type { ResponseType } from './http/request';

export * from './types';
export * from './resources';
