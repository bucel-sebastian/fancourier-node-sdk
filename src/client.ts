import { PROD_BASE_URL } from './constants';
import { AuthenticationError, messageFromBody } from './errors';
import { request as httpRequest, type ResponseType } from './http/request';
import { AwbResource } from './resources/awb';
import { GeographyResource } from './resources/geography';
import { OrdersResource } from './resources/orders';
import { PickupPointsResource } from './resources/pickup-points';
import { ReportsResource } from './resources/reports';
import { ServicesResource } from './resources/services';
import type { ClientId, LoginResponse } from './types';

/** Refresh the cached token this long (ms) before it actually expires. */
const REFRESH_MARGIN_MS = 60_000;

/** Fallback lifetime when the API omits/minimises `expiresAt`. */
const FALLBACK_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

/** Construction options for {@link FancourierClient}. */
export interface FancourierClientOptions {
  /** FanCourier client id. */
  clientId: ClientId;
  username: string;
  password: string;
  /** Full base URL; defaults to `https://api.fancourier.ro`. */
  baseUrl?: string;
  /** Per-request timeout in milliseconds (default 30s). */
  timeoutMs?: number;
  /** Pre-existing bearer token; when omitted, login is performed lazily. */
  token?: string;
  /** Expiry for a pre-existing token (`YYYY-MM-DD HH:mm:ss` or a Date). */
  tokenExpiresAt?: string | Date;
  /** Injectable fetch so callers/tests can avoid the network. */
  fetchImpl?: typeof fetch;
}

/** Options for the low-level {@link FancourierClient.request} escape hatch. */
export interface ClientRequestOptions {
  method: string;
  /** API path, with or without a leading slash (e.g. `/reports/counties`). */
  path: string;
  query?: Record<string, unknown>;
  /** Form body encoded as `application/x-www-form-urlencoded`. */
  formBody?: Record<string, unknown>;
  /** JSON body; takes precedence over `formBody`. */
  jsonBody?: unknown;
  headers?: Record<string, string>;
  responseType?: ResponseType;
}

interface AuthSession {
  token: string;
  /** Epoch ms after which the token must be refreshed; `Infinity` when unknown. */
  expireAt: number;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function parseExpiry(value: string | Date | undefined): number {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? Date.now() + FALLBACK_TOKEN_LIFETIME_MS : value.getTime();
  }
  if (typeof value === 'string') {
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const parsed = Date.parse(normalized);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return Date.now() + FALLBACK_TOKEN_LIFETIME_MS;
}

/**
 * Entry point of the SDK: handles authentication (lazy, single-flight,
 * auto-refresh) and exposes the resource namespaces.
 */
export class FancourierClient {
  /** AWB creation, labels, cancellation and tariffs. */
  readonly awb: AwbResource;
  /** Romanian and international geography lookups. */
  readonly geography: GeographyResource;
  /** Courier pickup orders and order reports. */
  readonly orders: OrdersResource;
  /** FANbox / PayPoint / FAN-office locations. */
  readonly pickupPoints: PickupPointsResource;
  /** AWB, bank-transfer, order and branch reports. */
  readonly reports: ReportsResource;
  /** Delivery services and their options. */
  readonly services: ServicesResource;

  /** FanCourier client id used by resources. */
  readonly clientId: ClientId;

  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly timeoutMs?: number;
  private readonly fetchImpl?: typeof fetch;

  private session: AuthSession | null = null;
  private authInFlight: Promise<string> | null = null;

  constructor(options: FancourierClientOptions) {
    this.baseUrl = stripTrailingSlash(options.baseUrl ?? PROD_BASE_URL);
    this.clientId = options.clientId;
    this.username = options.username;
    this.password = options.password;
    this.timeoutMs = options.timeoutMs;
    this.fetchImpl = options.fetchImpl;

    if (options.token !== undefined && options.token !== '') {
      this.session = {
        token: options.token,
        expireAt:
          options.tokenExpiresAt === undefined
            ? Number.POSITIVE_INFINITY
            : parseExpiry(options.tokenExpiresAt),
      };
    }

    this.awb = new AwbResource(this);
    this.geography = new GeographyResource(this);
    this.orders = new OrdersResource(this);
    this.pickupPoints = new PickupPointsResource(this);
    this.reports = new ReportsResource(this);
    this.services = new ServicesResource(this);
  }

  /**
   * Returns a valid auth token, authenticating lazily. Concurrent callers
   * share a single in-flight `POST /login` call and the cached token is
   * refreshed ~60s before expiry.
   */
  ensureToken(): Promise<string> {
    const session = this.session;
    if (session !== null && Date.now() < session.expireAt - REFRESH_MARGIN_MS) {
      return Promise.resolve(session.token);
    }
    if (this.authInFlight === null) {
      this.authInFlight = this.authenticate().finally(() => {
        this.authInFlight = null;
      });
    }
    return this.authInFlight;
  }

  /** Forces a fresh login and returns the new token. */
  login(): Promise<string> {
    this.session = null;
    return this.authenticate();
  }

  /** Returns the cached token, if any (does not perform a login). */
  getToken(): string | undefined {
    return this.session?.token;
  }

  /** Returns the cached token expiry, if known. */
  getTokenExpiresAt(): Date | undefined {
    return this.session === null || !Number.isFinite(this.session.expireAt)
      ? undefined
      : new Date(this.session.expireAt);
  }

  /** Replaces the cached token. Useful for token persistence between runs. */
  setToken(token: string, expiresAt?: string | Date): void {
    this.session = {
      token,
      expireAt: expiresAt === undefined ? Number.POSITIVE_INFINITY : parseExpiry(expiresAt),
    };
  }

  /** Clears the cached token; the next request logs in again. */
  clearToken(): void {
    this.session = null;
  }

  /**
   * Low-level request escape hatch: prefixes the configured base URL,
   * attaches `Authorization: Bearer <token>` and transparently re-authenticates
   * + retries exactly once on 401 (the login call itself is never retried).
   */
  async request<T = unknown>(options: ClientRequestOptions): Promise<T> {
    const token = await this.ensureToken();
    try {
      return await this.dispatch<T>(options, token);
    } catch (error) {
      if (!(error instanceof AuthenticationError)) {
        throw error;
      }
      this.session = null;
      const freshToken = await this.ensureToken();
      return this.dispatch<T>(options, freshToken);
    }
  }

  private async dispatch<T>(options: ClientRequestOptions, token: string): Promise<T> {
    const path = options.path.startsWith('/') ? options.path : `/${options.path}`;
    return httpRequest<T>({
      method: options.method,
      url: `${this.baseUrl}${path}`,
      query: options.query,
      formBody: options.formBody,
      jsonBody: options.jsonBody,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      responseType: options.responseType,
      timeoutMs: this.timeoutMs,
      fetchImpl: this.fetchImpl,
    });
  }

  /**
   * `POST /login` — uses the raw pipeline (not `this.request`) so a 401 here
   * can never trigger the retry-once path.
   */
  private async authenticate(): Promise<string> {
    const auth = await httpRequest<LoginResponse>({
      method: 'POST',
      url: `${this.baseUrl}/login`,
      formBody: {
        username: this.username,
        password: this.password,
      },
      timeoutMs: this.timeoutMs,
      fetchImpl: this.fetchImpl,
    });

    if (
      auth.status !== 'success' ||
      typeof auth.data?.token !== 'string' ||
      auth.data.token === ''
    ) {
      throw new AuthenticationError(messageFromBody(auth) ?? 'FanCourier login failed', {
        raw: auth,
      });
    }

    this.session = {
      token: auth.data.token,
      expireAt: parseExpiry(auth.data.expiresAt),
    };
    return auth.data.token;
  }
}
