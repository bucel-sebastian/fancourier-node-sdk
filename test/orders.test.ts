import { describe, expect, it } from 'vitest';
import { FancourierError, type CreateCourierOrderRequest } from '../src';
import { jsonBody, jsonResponse, makeClient } from './helpers';

const orderPayload: CreateCourierOrderRequest = {
  info: {
    packages: { parcel: 1 },
    weight: 2,
    dimensions: { length: 10, width: 10, height: 10 },
    orderType: 'Standard',
    pickupDate: '2026-11-20',
    pickupHours: { first: '09:00', second: '16:00' },
  },
};

describe('OrdersResource', () => {
  it('creates a courier order and injects clientId', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({ status: 'success', data: { id: 17895017 } }),
    );

    await expect(client.orders.create(orderPayload)).resolves.toEqual({ id: 17895017 });
    expect(calls[0]?.init.method).toBe('POST');
    expect(calls[0]?.url).toBe('https://api.fancourier.ro/order');
    expect(jsonBody<{ clientId: number }>(calls[0]!).clientId).toBe(7032158);
  });

  it('deletes a courier order', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({ status: 'success', data: 'Order deleted' }),
    );

    await expect(client.orders.delete(17895017)).resolves.toMatchObject({ status: 'success' });
    expect(calls[0]?.init.method).toBe('DELETE');
    expect(calls[0]?.url).toContain('/order?');
    expect(calls[0]?.url).toContain('id=17895017');
  });

  it('rejects an API-level failure when deleting an order', async () => {
    const { client } = makeClient(() =>
      jsonResponse({ status: 'fail', message: 'Order not found' }),
    );

    await expect(client.orders.delete(1)).rejects.toBeInstanceOf(FancourierError);
    await expect(client.orders.delete(1)).rejects.toThrow('Order not found');
  });

  it('lists orders for a date', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        status: 'success',
        total: 1,
        perPage: 100,
        currentPage: 1,
        data: [{ info: { id: 1, orderType: 'Standard' } }],
      }),
    );

    const report = await client.orders.reports({ date: '2026-11-19', page: 1, perPage: 50 });
    expect(report.total).toBe(1);
    expect(calls[0]?.url).toContain('date=2026-11-19');
    expect(calls[0]?.url).toContain('perPage=50');
  });

  it('lists order events and tracks orders', async () => {
    let call = 0;
    const { client, calls } = makeClient(() => {
      call += 1;
      if (call === 1) {
        return jsonResponse({ status: 'success', data: [{ id: 1, name: 'Picked up' }] });
      }
      return jsonResponse({
        status: 'success',
        data: [{ orderId: 17895017, events: [{ id: 1, name: 'Picked up' }] }],
      });
    });

    await expect(client.orders.events({ language: 'en' })).resolves.toHaveLength(1);
    const tracking = await client.orders.tracking({
      order: [17895017],
      language: 'ro',
    });

    expect(tracking[0]?.orderId).toBe(17895017);
    expect(calls[0]?.url).toContain('language=en');
    expect(calls[1]?.url).toContain('order%5B%5D=17895017');
  });
});
