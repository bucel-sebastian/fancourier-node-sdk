/**
 * Live-API integration: authentication end-to-end.
 *
 * Opt-in (env-gated): see `helpers.ts`. Skipped when credentials are absent.
 */
import { beforeAll, describe, expect, it } from 'vitest';

import type { FancourierClient } from '../../src';
import { createClient, hasCredentials, TEST_TIMEOUT_MS } from './helpers';

describe.skipIf(!hasCredentials())('live API: authentication', () => {
  let client: FancourierClient;

  beforeAll(() => {
    client = createClient();
  });

  it('ensureToken() returns a non-empty token', async () => {
    const token = await client.ensureToken();

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  }, TEST_TIMEOUT_MS);
});
