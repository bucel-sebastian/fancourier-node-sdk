import { describe, expect, it } from 'vitest';
import { makeClient, jsonResponse } from './helpers';

describe('PickupPointsResource', () => {
  it('defaults to fanbox pickup points', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        status: 'success',
        data: [
          {
            id: 'FAN0033',
            name: 'FANbox Kaufland Militari',
            address: {
              locality: 'Bucuresti',
              county: 'Bucuresti',
              street: 'Strada',
              streetNo: '3',
            },
          },
        ],
      }),
    );

    const points = await client.pickupPoints.list();
    expect(points[0]?.id).toBe('FAN0033');
    expect(calls[0]?.url).toContain('/reports/pickup-points?');
    expect(calls[0]?.url).toContain('type=fanbox');
  });

  it('gets a pickup point by id', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        status: 'success',
        data: [{ id: 'PAY001', name: 'PayPoint', address: {} }],
      }),
    );

    const point = await client.pickupPoints.get('PAY001');
    expect(point?.name).toBe('PayPoint');
    expect(calls[0]?.url).toContain('id=PAY001');
    expect(calls[0]?.url).not.toContain('type=');
  });
});
