<div align="center">

<!-- wordmark: pure shields.io static badge, no hosted assets needed -->
![](https://img.shields.io/badge/FANCOURIER-Node.js%20SDK-00529B?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=003B70)

# FanCourier Courier SDK for Node.js

**TypeScript-first client for the FanCourier courier API (Romania).**

*AWBs · Tariffs · Labels · Pickup points · Geography · Courier orders · Tracking · Reports*

[![npm version](https://img.shields.io/npm/v/fancourier-node-sdk.svg?color=cb3837)](https://www.npmjs.com/package/fancourier-node-sdk)
[![node >= 20](https://img.shields.io/badge/node-%E2%89%A5%2020-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![CI](https://github.com/bucel-sebastian/fancourier-node-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/bucel-sebastian/fancourier-node-sdk/actions/workflows/ci.yml)
[![downloads](https://img.shields.io/npm/dm/fancourier-node-sdk.svg)](https://www.npmjs.com/package/fancourier-node-sdk)
[![license: MIT](https://img.shields.io/npm/l/fancourier-node-sdk.svg)](https://opensource.org/license/mit)

</div>

---

## Contents

[Features](#features) · [Installation](#installation) · [Quickstart](#quickstart) · [Guides](#guides) · [Error handling](#error-handling) · [Configuration](#configuration) · [Testing and CI](#testing-and-ci) · [Contributing](#contributing) · [License](#license)

---

## Features

| | |
|:---|:---|
| ⚡ **Zero runtime dependencies** — native `fetch`, Node.js >= 20 | 🧩 **Full documented API coverage** across six namespaces (`awb`, `geography`, `pickupPoints`, `orders`, `reports`, `services`) |
| 🔐 **Automatic auth** — lazy login, token cache, single-flight refresh and one retry on `401` | 🧾 **PHP-style bracket encoding** — pass plain nested objects; the SDK sends the `info[service]=...`, `awbs[]=...` bodies the API expects |
| 🏷️ **Binary labels** — PDF, HTML and ZPL as `Buffer`/`string` | 🧯 **Typed error hierarchy** — HTTP status mapped to `ValidationError`, `AuthenticationError`, `RateLimitError`, … |
| 📦 **Dual ESM + CJS builds** with bundled type declarations | 🧪 **38 unit tests** plus an opt-in live-API integration suite |

## Installation

```bash
npm install fancourier-node-sdk
```

> **Requires Node.js >= 20** — the SDK uses the built-in `fetch`; there is nothing else to install.

## Quickstart

```ts
import { Fancourier } from 'fancourier-node-sdk';

const client = new Fancourier({
  clientId: 7032158,
  username: 'your-username',
  password: 'your-password',
});

const services = await client.services.list();
console.log(services.map((service) => service.name));
```

> **Tip** Credentials are passed directly to the constructor. The SDK never loads `.env` files or reads environment variables. `FancourierClient` is also exported as the underlying class name.

Auth is handled for you: the token is fetched lazily on the first call, cached, refreshed before it expires, and reacquired once after a `401`.

## Guides

| Guide | What it covers |
|---|---|
| [AWB lifecycle](#awb-lifecycle) | Create internal/export AWBs, estimate tariffs, download labels, cancel |
| [Geography and pickup points](#geography-and-pickup-points) | Counties, localities, streets, countries, FANbox/PayPoint/FAN office |
| [Courier orders](#courier-orders) | Create/cancel pickup orders, list orders, order events and tracking |
| [Tracking and reports](#tracking-and-reports) | AWB tracking, shipping slips, bank transfers, confirmations, branches |
| [Configuration](#configuration) | All client options, base URLs, timeouts, `fetchImpl` |
| [Error handling](#error-handling) | Error hierarchy, API envelopes, retry behavior |

> **Tip** The full method reference is generated with `npm run docs` into `docs/api/index.html` (open it locally in a browser).

## AWB lifecycle

### Create an internal AWB

```ts
const [awb] = await client.awb.create({
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
      recipient: {
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
      },
    },
  ],
});

console.log(awb.awbNumber, awb.tariff);
```

`client.awb.createInternal()` is the explicit name; `create()` is an alias. `clientId` is injected automatically unless you override it in the payload.

### Create an export AWB

```ts
const [exportAwb] = await client.awb.createExternal({
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
});
```

### Estimate a tariff

```ts
const tariff = await client.awb.internalTariff({
  info: {
    service: 'Standard',
    payment: 'recipient',
    weight: 1,
    packages: { parcel: 1 },
  },
  recipient: { locality: 'Bucuresti', county: 'Bucuresti' },
});

console.log(tariff.costNoVAT, tariff.vat, tariff.total);
```

Use `client.awb.externalTariff()` for export estimates.

### Download labels

```ts
import { writeFile } from 'node:fs/promises';

const pdf = await client.awb.label(
  { awbs: [awb.awbNumber!] },
  { format: 'A4', language: 'ro' },
);
await writeFile('awb.pdf', pdf);

const html = await client.awb.labelHtml({ awbs: [awb.awbNumber!] });
const zpl = await client.awb.labelZpl({ awbs: [awb.awbNumber!] }, { dpi: 203 });
```

### Cancel an AWB

```ts
await client.awb.delete(2233300120284);
```

## Geography and pickup points

```ts
const counties = await client.geography.counties();
const localities = await client.geography.localities({ county: 'Bucuresti' });
const streets = await client.geography.streets({
  county: 'Bucuresti',
  locality: 'Bucuresti',
  page: 1,
  perPage: 100,
});

const fanboxes = await client.pickupPoints.list({ type: 'fanbox' });
const paypoints = await client.pickupPoints.list({ type: 'paypoint' });
const office = await client.pickupPoints.get('FAN0033');
```

Export geography is available through `client.geography.countries()`, `externalCounties()` and `externalLocalities()`.

## Courier orders

```ts
const order = await client.orders.create({
  info: {
    packages: { parcel: 1 },
    weight: 2,
    dimensions: { length: 10, width: 10, height: 10 },
    orderType: 'Standard',
    pickupDate: '2026-11-20',
    pickupHours: { first: '09:00', second: '16:00' },
    observations: 'Call before arrival',
  },
});

console.log(order.id);

await client.orders.delete(order.id);
```

Order reports, events and tracking are available through `client.orders.reports()`, `events()` and `tracking()`.

## Tracking and reports

```ts
const tracking = await client.reports.trackAwb({
  awb: [2233300120284],
  language: 'ro',
});

const slip = await client.reports.shippingSlip({
  date: '2026-11-19',
  page: 1,
  perPage: 100,
});

const transfers = await client.reports.bankTransfers({ date: '2026-11-19' });
const confirmations = await client.reports.awbConfirmations({ awb: [2233300120284] });
```

`client.reports` also exposes `awbEvents()` and `branches()`.

## Error handling

Every SDK error extends `FancourierError` and is chosen by HTTP status. The API's error envelope is unwrapped onto `.message`/`.code`; the HTTP status is on `.status` and the parsed body on `.raw`.

| | Class | Raised on |
|:---:|---|---|
| 🧩 | `FancourierError` | Base class — also timeouts and JSON parse failures |
| 🚫 | `ValidationError` | 400 — malformed request (details in `.raw`) |
| 🔑 | `AuthenticationError` | 401 — invalid credentials/token |
| 🔒 | `PermissionError` | 403 — authenticated but not allowed |
| ❓ | `NotFoundError` | 404 — resource does not exist |
| ⏳ | `RateLimitError` | 429 — exposes `.retryAfter` (seconds) |
| 🔥 | `ServerError` | 5xx — API failed to process the request |

```ts
import { RateLimitError, ValidationError } from 'fancourier-node-sdk';

try {
  await client.awb.create(payload);
} catch (err) {
  if (err instanceof ValidationError) console.error(err.message, err.raw);
  else if (err instanceof RateLimitError) console.error('retry after', err.retryAfter, 's');
  else throw err;
}
```

The SDK does not retry rate limits or server errors automatically; retry those in application code after the indicated delay.

## Configuration

Options accepted by `new Fancourier(...)`:

| Option | Type | Default | Description |
|---|---|---|---|
| `clientId` | `number \| string` | — (required) | FanCourier client id; injected into requests by default |
| `username` | `string` | — (required) | API username, sent to `POST /login` |
| `password` | `string` | — (required) | API password, sent to `POST /login` |
| `baseUrl` | `string` | `https://api.fancourier.ro` | Full base URL, useful for proxies/tests |
| `timeoutMs` | `number` | `30000` | Per-request timeout in milliseconds |
| `token` | `string` | — | Pre-existing bearer token; skips the first login |
| `tokenExpiresAt` | `string \| Date` | — | Expiry for a pre-existing token |
| `fetchImpl` | `typeof fetch` | `globalThis.fetch` | Injectable fetch for tests or custom runtimes |

Tokens can be persisted between processes and passed back through the `token` and `tokenExpiresAt` constructor options.

## Testing and CI

```bash
npm test                # unit suite (vitest, mocked fetch, no network)
npm run test:coverage   # unit suite + v8 coverage
```

The live-API integration suite is opt-in and skips itself without credentials. It is the only part of the project that reads environment variables; normal SDK usage never does:

```bash
FANCOURIER_CLIENT_ID=7032158 \
FANCOURIER_USER=clienttest \
FANCOURIER_PASSWORD=testing \
npm run test:integration
```

Set `FANCOURIER_BASE_URL` to target a proxy or sandbox. The integration suite is read-only: it authenticates, lists catalogues and estimates a tariff. It never creates or cancels real AWBs.

CI (`.github/workflows/ci.yml`) runs lint, typecheck and the unit suite on Node 20, 22 and 24 for every push/PR; the integration job runs only when the `FANCOURIER_CLIENT_ID`, `FANCOURIER_USER` and `FANCOURIER_PASSWORD` repository secrets are configured.

## Contributing

Bug reports and feature requests are welcome in [GitHub Issues](https://github.com/bucel-sebastian/fancourier-node-sdk/issues); pull requests are encouraged — run `npm run lint`, `npm run typecheck` and `npm test` before opening one.

## License

Released under the [MIT](LICENSE) license.

---

<div align="center">

`npm install fancourier-node-sdk`

</div>
