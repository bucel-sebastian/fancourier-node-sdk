import { describe, expect, it } from 'vitest';
import { makeClient, jsonResponse } from './helpers';

describe('ServicesResource', () => {
  it('lists services', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        status: 'success',
        data: [{ id: 1, name: 'Standard', description: null }],
      }),
    );

    await expect(client.services.list()).resolves.toEqual([
      { id: 1, name: 'Standard', description: null },
    ]);
    expect(calls[0]?.url).toBe('https://api.fancourier.ro/reports/services');
  });

  it('lists service options with clientId and service', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        status: 'success',
        data: [{ id: 'A', name: 'Open on delivery' }],
      }),
    );

    await expect(client.services.options('Standard')).resolves.toEqual([
      { id: 'A', name: 'Open on delivery' },
    ]);
    expect(calls[0]?.url).toContain('/reports/service-options?');
    expect(calls[0]?.url).toContain('clientId=7032158');
    expect(calls[0]?.url).toContain('service=Standard');
  });
});
