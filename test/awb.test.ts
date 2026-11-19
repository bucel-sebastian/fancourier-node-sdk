import { describe, expect, it } from 'vitest';
import {
  FancourierError,
  type CreateAwbRequest,
  type CreateExternalAwbRequest,
} from '../src';
import { binaryResponse, jsonBody, jsonResponse, makeClient, textResponse } from './helpers';

const recipient = {
  name: 'Ion Popescu',
  contactPerson: 'Ion Popescu',
  phone: '0712345678',
  email: 'ion@example.test',
  address: {
    county: 'Bucuresti',
    locality: 'Bucuresti',
    street: 'Calea Victoriei',
    streetNo: '1',
    zipCode: '010061',
  },
};

const internalPayload: CreateAwbRequest = {
  shipments: [
    {
      info: {
        service: 'Standard',
        packages: { parcel: 1, envelope: 0 },
        weight: 2,
        cod: 0,
        payment: 'recipient',
        dimensions: { length: 10, width: 20, height: 30 },
        options: ['X'],
      },
      recipient,
    },
  ],
};

describe('AwbResource', () => {
  it('creates an internal AWB and injects clientId', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        response: [
          {
            awbNumber: 2233300120284,
            tariff: 29.7,
            vat: 5.64,
            packages: 1,
            errors: null,
          },
        ],
      }),
    );

    const results = await client.awb.createInternal(internalPayload);

    expect(results[0]?.awbNumber).toBe(2233300120284);
    expect(calls[0]?.init.method).toBe('POST');
    expect(calls[0]?.url).toBe('https://api.fancourier.ro/intern-awb');
    expect(calls[0]?.init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
    });
    expect(jsonBody<{ clientId: number }>(calls[0]!).clientId).toBe(7032158);
  });

  it('rejects an API-level failure in a 200 AWB response', async () => {
    const { client } = makeClient(() =>
      jsonResponse({ status: 'error', message: 'Invalid county' }),
    );

    await expect(client.awb.create(internalPayload)).rejects.toBeInstanceOf(FancourierError);
    await expect(client.awb.create(internalPayload)).rejects.toThrow('Invalid county');
  });

  it('creates an external AWB from a bare-array response', async () => {
    const payload: CreateExternalAwbRequest = {
      shipments: [
        {
          info: {
            service: 'Export',
            deliveryMode: 'rutier',
            contentType: 'document',
            packages: { parcel: 1 },
            weight: 1,
            payment: 'recipient',
          },
          recipient: {
            name: 'Jane Doe',
            phone: '+359123456789',
            address: {
              country: 'Bulgaria',
              region: 'Sofia',
              locality: 'Sofia',
              street: 'Vitosha',
              streetNo: '1',
              zipCode: '1000',
            },
          },
        },
      ],
    };
    const { client, calls } = makeClient(() =>
      jsonResponse([{ awbNumber: 987654321, errors: null }]),
    );

    const results = await client.awb.createExternal(payload);
    expect(results[0]?.awbNumber).toBe(987654321);
    expect(calls[0]?.url).toBe('https://api.fancourier.ro/extern-awb');
    expect(jsonBody<{ clientId: number }>(calls[0]!).clientId).toBe(7032158);
  });

  it('deletes an AWB using the DELETE query form', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({ status: 'success', data: 'AWB-ul a fost sters cu succes' }),
    );

    await expect(client.awb.delete('2233300120284')).resolves.toMatchObject({
      status: 'success',
    });
    expect(calls[0]?.init.method).toBe('DELETE');
    expect(calls[0]?.url).toContain('/awb?');
    expect(calls[0]?.url).toContain('clientId=7032158');
    expect(calls[0]?.url).toContain('awb=2233300120284');
  });

  it('downloads PDF, HTML and ZPL labels', async () => {
    const { client, calls } = makeClient((call) => {
      if (call.url.includes('zpl=1')) {
        return textResponse('^XA^FD123^FS^XZ');
      }
      if (call.url.includes('pdf=1')) {
        return binaryResponse([37, 80, 68, 70]);
      }
      return textResponse('<html>label</html>');
    });

    const pdf = await client.awb.label({ awbs: [2233300120284] }, { format: 'A5' });
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(calls[0]?.url).toContain('awbs%5B%5D=2233300120284');
    expect(calls[0]?.url).toContain('pdf=1');
    expect(calls[0]?.url).toContain('format=A5');
    expect(calls[0]?.url).toContain('language=ro');

    await expect(client.awb.labelHtml({ awbs: ['2233300120284'] })).resolves.toContain('<html>');
    await expect(
      client.awb.labelZpl({ awbs: ['2233300120284'] }, { dpi: 203 }),
    ).resolves.toContain('^XA');
    expect(calls[2]?.url).toContain('zpl=1');
    expect(calls[2]?.url).toContain('dpi=203');
  });

  it('estimates an internal tariff with nested query parameters', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        status: 'success',
        data: {
          extraKmCost: 0,
          weightCost: 24.5,
          insuranceCost: 0,
          optionsCost: 0,
          fuelCost: 1.69,
          costNoVAT: 26.19,
          vat: 4.98,
          total: 31.17,
        },
      }),
    );

    const tariff = await client.awb.internalTariff({
      info: {
        service: 'Standard',
        payment: 'recipient',
        weight: 2,
        packages: { parcel: 1 },
      },
      recipient: { locality: 'Bucuresti', county: 'Bucuresti' },
    });

    expect(tariff.total).toBe(31.17);
    expect(calls[0]?.url).toContain('info%5Bservice%5D=Standard');
    expect(calls[0]?.url).toContain('recipient%5Bcounty%5D=Bucuresti');
    expect(calls[0]?.url).not.toContain('sender');
  });

  it('estimates an external tariff', async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse({
        status: 'success',
        data: {
          extraKmCost: 0,
          weightCost: 100,
          insuranceCost: 0,
          optionsCost: 0,
          fuelCost: 7,
          costNoVAT: 107,
          vat: 20.33,
          total: 127.33,
        },
      }),
    );

    const tariff = await client.awb.externalTariff({
      info: {
        service: 'Export',
        deliveryMode: 'aerian',
        documentType: 'non document',
        weight: 5,
        dimensions: { length: 10, width: 10, height: 10 },
        packages: { parcel: 1 },
      },
      recipient: { country: 'Bulgaria' },
    });

    expect(tariff.total).toBe(127.33);
    expect(calls[0]?.url).toContain('info%5BdeliveryMode%5D=aerian');
    expect(calls[0]?.url).toContain('recipient%5Bcountry%5D=Bulgaria');
  });
});
