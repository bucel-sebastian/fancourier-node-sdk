/**
 * Shared helpers for the opt-in live-API integration suite.
 *
 * HOW TO RUN
 * ----------
 *   FANCOURIER_CLIENT_ID=7032158 \
 *   FANCOURIER_USER=clienttest \
 *   FANCOURIER_PASSWORD=testing \
 *   npm run test:integration
 *
 * Without credentials every suite skips, so `npm test` and CI runs without
 * secrets stay green. The suite is read-only: it authenticates, lists
 * catalogues and estimates a tariff; it never creates or cancels AWBs.
 */

import { FancourierClient } from '../../src';

/** Per-request timeout for live calls (below the per-test vitest timeout). */
export const REQUEST_TIMEOUT_MS = 15_000;

/** Per-test vitest timeout for network calls. */
export const TEST_TIMEOUT_MS = 20_000;

export interface IntegrationCredentials {
  clientId: number;
  username: string;
  password: string;
  baseUrl?: string;
}

/**
 * Reads credentials from the environment. Returns `null` when any required
 * variable is absent — the value every suite gates on. Safe at module scope:
 * it only reads env vars and never touches the network.
 */
export function credentials(): IntegrationCredentials | null {
  const rawClientId = process.env.FANCOURIER_CLIENT_ID;
  const username = process.env.FANCOURIER_USER;
  const password = process.env.FANCOURIER_PASSWORD;

  if (
    rawClientId === undefined ||
    rawClientId === '' ||
    username === undefined ||
    username === '' ||
    password === undefined ||
    password === ''
  ) {
    return null;
  }

  const clientId = Number(rawClientId);
  if (!Number.isFinite(clientId)) {
    throw new Error('FANCOURIER_CLIENT_ID must be numeric');
  }

  return {
    clientId,
    username,
    password,
    baseUrl: process.env.FANCOURIER_BASE_URL || undefined,
  };
}

/** True when the opt-in credentials are present. */
export function hasCredentials(): boolean {
  return credentials() !== null;
}

/**
 * Builds a client for the live API. Only call this inside a
 * `describe.skipIf(!hasCredentials())` body, never at module top-level.
 */
export function createClient(): FancourierClient {
  const creds = credentials();
  if (creds === null) {
    throw new Error(
      'Integration credentials are missing: set FANCOURIER_CLIENT_ID, ' +
        'FANCOURIER_USER and FANCOURIER_PASSWORD to run the integration suite.',
    );
  }
  return new FancourierClient({ ...creds, timeoutMs: REQUEST_TIMEOUT_MS });
}
