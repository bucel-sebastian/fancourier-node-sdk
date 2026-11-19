/**
 * Live-API integration: non-committing tariff estimate.
 *
 * Opt-in (env-gated): see `helpers.ts`. Skipped when credentials are absent.
 */
import { beforeAll, describe, expect, it } from 'vitest';

import type { FancourierClient } from '../../src';
import { createClient, hasCredentials, TEST_TIMEOUT_MS } from './helpers';

describe.skipIf(!hasCredentials())('live API: tariff estimate', () => {
  let client: FancourierClient;

  beforeAll(() => {
    client = createClient();
  });

  it('estimates an internal Standard shipment', async () => {
    const counties = await client.geography.counties();
    const county = counties.find((item) => item.name === 'Bucuresti') ?? counties[0];
    expect(county).toBeDefined();

    const localities = await client.geography.localities({ county: county!.name });
    const locality = localities[0];
    expect(locality).toBeDefined();

    const tariff = await client.awb.internalTariff({
      info: {
        service: 'Standard',
        payment: 'recipient',
        weight: 1,
        packages: { parcel: 1 },
      },
      recipient: {
        locality: locality!.name,
        county: county!.name,
      },
    });

    expect(typeof tariff.total).toBe('number');
    expect(tariff.total).toBeGreaterThan(0);
    expect(tariff.total).toBeCloseTo(tariff.costNoVAT + tariff.vat, 2);
  }, TEST_TIMEOUT_MS);
});
