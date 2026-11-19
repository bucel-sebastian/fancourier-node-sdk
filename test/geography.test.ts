import { describe, expect, it } from 'vitest';
import { makeClient, jsonResponse } from './helpers';

describe('GeographyResource', () => {
  it('lists counties', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({ status: 'success', data: [{ id: 1, name: 'Alba' }] }),
    );

    await expect(client.geography.counties()).resolves.toEqual([{ id: 1, name: 'Alba' }]);
    expect(calls[0]?.url).toBe('https://api.fancourier.ro/reports/counties');
  });

  it('lists localities filtered by county', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        status: 'success',
        data: [{ id: 10, name: 'Bucuresti', county: 'Bucuresti', agency: 'BU', exteriorKm: 0 }],
      }),
    );

    const localities = await client.geography.localities({ county: 'Bucuresti' });
    expect(localities).toHaveLength(1);
    expect(calls[0]?.url).toContain('/reports/localities?');
    expect(calls[0]?.url).toContain('county=Bucuresti');
  });

  it('returns paginated streets', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        status: 'success',
        total: 1,
        perPage: 1000,
        currentPage: 1,
        data: [{ id: 1, street: 'Victoriei', locality: 'Bucuresti', county: 'Bucuresti' }],
      }),
    );

    const streets = await client.geography.streets({
      county: 'Bucuresti',
      locality: 'Bucuresti',
      page: 1,
    });
    expect(streets.total).toBe(1);
    expect(streets.data[0]?.street).toBe('Victoriei');
    expect(calls[0]?.url).toContain('page=1');
  });

  it('lists countries and external geography', async () => {
    let call = 0;
    const { client } = makeClient(() => {
      call += 1;
      if (call === 1) {
        return jsonResponse({
          status: 'success',
          data: [{ id: 1, name: 'Bulgaria', deliveryMode: 'rutier', code: 'BG' }],
        });
      }
      if (call === 2) {
        return jsonResponse({ status: 'success', data: [{ id: 2, name: 'Sofia' }] });
      }
      return jsonResponse({
        status: 'success',
        total: 1,
        perPage: 100,
        currentPage: 1,
        data: [{ id: 3, name: 'Sofia', county: 'Sofia', country: 'Bulgaria' }],
      });
    });

    await expect(client.geography.countries()).resolves.toHaveLength(1);
    await expect(client.geography.externalCounties({ country: 'Bulgaria' })).resolves.toEqual([
      { id: 2, name: 'Sofia' },
    ]);
    const localities = await client.geography.externalLocalities({
      country: 'Bulgaria',
      county: 'Sofia',
    });
    expect(localities.data[0]?.country).toBe('Bulgaria');
  });
});
