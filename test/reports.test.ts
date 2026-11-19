import { describe, expect, it } from 'vitest';
import { jsonResponse, makeClient } from './helpers';

describe('ReportsResource', () => {
  it('returns a paginated shipping slip', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        status: 'success',
        total: 1,
        perPage: 100,
        currentPage: 1,
        data: [{ info: { awbNumber: 2233300120284, cost: 29.7 } }],
      }),
    );

    const slip = await client.reports.shippingSlip({ date: '2026-11-19', perPage: 100 });
    expect(slip.data[0]?.info.awbNumber).toBe(2233300120284);
    expect(calls[0]?.url).toContain('/reports/awb?');
    expect(calls[0]?.url).toContain('clientId=7032158');
    expect(calls[0]?.url).toContain('date=2026-11-19');
  });

  it('lists the AWB event catalogue', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({ status: 'success', data: [{ id: 1, name: 'In transit' }] }),
    );

    await expect(client.reports.awbEvents({ language: 'en' })).resolves.toHaveLength(1);
    expect(calls[0]?.url).toContain('/reports/awb-events?');
    expect(calls[0]?.url).toContain('language=en');
  });

  it('tracks AWBs', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        status: 'success',
        data: [
          {
            awbNumber: 2233300120284,
            events: [{ id: 1, name: 'Delivered', location: 'Bucuresti' }],
          },
        ],
      }),
    );

    const tracking = await client.reports.trackAwb({
      awb: [2233300120284, 2233300120285],
      language: 'ro',
    });

    expect(tracking[0]?.awbNumber).toBe(2233300120284);
    expect(calls[0]?.url).toContain('awb%5B%5D=2233300120284');
    expect(calls[0]?.url).toContain('awb%5B%5D=2233300120285');
  });

  it('returns paginated bank transfers', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        status: 'success',
        total: 1,
        perPage: 100,
        currentPage: 1,
        data: [{ info: { awbNumber: 2233300120284, amountCollected: 29.7 } }],
      }),
    );

    const transfers = await client.reports.bankTransfers({ date: '2026-11-19' });
    expect(transfers.data[0]?.info.amountCollected).toBe(29.7);
    expect(calls[0]?.url).toContain('/reports/bank-transfers?');
  });

  it('returns AWB confirmations', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        status: 'success',
        data: [{ awbNumber: 2233300120284, confirmation: { name: 'Delivered' } }],
      }),
    );

    const confirmations = await client.reports.awbConfirmations({ awb: [2233300120284] });
    expect(confirmations).toHaveLength(1);
    expect(calls[0]?.url).toContain('/reports/get-awb-confirmations?');
    expect(calls[0]?.url).toContain('awb%5B%5D=2233300120284');
  });

  it('lists branches with optional filters', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({ status: 'success', data: [{ id: 1, name: 'Bucuresti' }] }),
    );

    await expect(
      client.reports.branches({ county: 'Bucuresti', city: 'Bucuresti' }),
    ).resolves.toHaveLength(1);
    expect(calls[0]?.url).toContain('/reports/branches?');
    expect(calls[0]?.url).toContain('county=Bucuresti');
    expect(calls[0]?.url).toContain('city=Bucuresti');
  });
});
