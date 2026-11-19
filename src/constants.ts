/** SDK version, kept in sync with package.json. */
export const VERSION = '1.0.0';

/** Production FanCourier API origin (no trailing slash). */
export const PROD_BASE_URL = 'https://api.fancourier.ro';

/** Default request timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** User-Agent sent with every request. */
export const USER_AGENT = `fancourier-node-sdk/${VERSION}`;
