/**
 * Live-API integration: read-only catalogues.
 *
 * Opt-in (env-gated): see `helpers.ts`. Skipped when credentials are absent.
 */
import { beforeAll, describe, expect, it } from 'vitest';

import type { FancourierClient } from '../../src';
import { createClient, hasCredentials, TEST_TIMEOUT_MS } from './helpers';

describe.skipIf(!hasCredentials())('live API: read-only catalogues', () => {
  let client: FancourierClient;

  beforeAll(() => {
    client = createClient();
  });

  it('services.list() returns at least one service', async () => {
    const services = await client.services.list();

    expect(Array.isArray(services)).toBe(true);
    expect(services.length).toBeGreaterThan(0);
    expect(typeof services[0]?.name).toBe('string');
  }, TEST_TIMEOUT_MS);

  it('services.options() returns the options of a service', async () => {
    const services = await client.services.list();
    const options = await client.services.options(services[0]!.name);

    expect(Array.isArray(options)).toBe(true);
  }, TEST_TIMEOUT_MS);

  it('geography.counties() returns Romanian counties', async () => {
    const counties = await client.geography.counties();

    expect(counties.length).toBeGreaterThan(0);
    expect(counties.some((county) => county.name === 'Bucuresti')).toBe(true);
  }, TEST_TIMEOUT_MS);

  it('pickupPoints.list() returns FANboxes', async () => {
    const points = await client.pickupPoints.list({ type: 'fanbox' });

    expect(Array.isArray(points)).toBe(true);
    expect(points.length).toBeGreaterThan(0);
    expect(typeof points[0]?.id).toBe('string');
  }, TEST_TIMEOUT_MS);
});
