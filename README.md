<div align="center">

<!-- Static shield.io badge, no hosted assets required. -->
![](https://img.shields.io/badge/FANCOURIER-Node.js%20SDK-00529B?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=003B70)

# FanCourier Courier SDK for Node.js

**TypeScript-first client for the FanCourier API (Romania).**

*AWBs · Tariffs · Labels · Pickup points · Geography · Courier orders · Tracking · Reports*

[![Node >= 20](https://img.shields.io/badge/node-%E2%89%A5%2020-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![CI](https://github.com/bucel-sebastian/fancourier-node-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/bucel-sebastian/fancourier-node-sdk/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/license/mit)

</div>

---

## Contents

[Features](#features) · [Installation](#installation) · [Quickstart](#quickstart) · [Resources](#resources) · [Examples](#examples) · [Configuration](#configuration) · [Authentication](#authentication) · [Error handling](#error-handling) · [Testing](#testing) · [License](#license)

---

## Features

| | |
|:---|:---|
| ⚡ **Zero runtime dependencies** — native `fetch`, Node.js >= 20 | 🧩 **Full documented API coverage** across seven namespaces |
| 🔐 **Automatic auth** — lazy login, token cache, single-flight refresh and one retry on `401` | 🧾 **PHP-style bracket encoding** — send the `info[service]`, `awbs[]` query bodies the API expects |
| 📦 **Dual ESM + CJS builds** with bundled type declarations | 🧪 **38 unit tests** plus an opt-in live-API integration suite |
| 🏷️ **Binary labels** — PDF, HTML and ZPL as `Buffer`/`string` | 🧯 **Typed errors** for `400`, `401`, `403`, `404`, `429` and `5xx` |

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

Credentials are passed directly to the constructor. The SDK does not load `.env` files or read environment variables. `FancourierClient` is also exported as the underlying class name.

Authentication is performed lazily on the first request. The token is cached and refreshed automatically.

## Resources

| Namespace | What it covers |
|---|---|
| `client.awb` | Create internal/export AWBs, delete AWBs, download labels, estimate tariffs |
| `client.geography` | Romanian counties, localities, streets; export countries and external geography |
| `client.pickupPoints` | FANbox, PayPoint and FAN-office locations |
| `client.orders` | Create/cancel courier pickup orders, list orders, order events and tracking |
| `client.reports` | Shipping slips, AWB events, AWB tracking, bank transfers, confirmations, branches |
| `client.services` | Delivery services and their available options |

The low-level `client.request()` escape hatch is available for endpoints added to the API after this release.

## Examples

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

`client.awb.createInternal()` is the explicit name; `create()` is an alias.

### Create an export AWB

```ts
const [awb] = await client.awb.createExternal({
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

### Look up geography and pickup points

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
const point = await client.pickupPoints.get('FAN0033');
```

### Create a courier order

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
```

### Track AWBs and read reports

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

### Cancel an AWB or order

```ts
await client.awb.delete(2233300120284);
await client.orders.delete(17895017);
```

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

Invalid or API-level failures (HTTP `200` with `status: "error"`) are surfaced as typed errors.

## Authentication

FanCourier uses a bearer token obtained from `POST /login`:

1. The first request performs the login with `username` and `password`.
2. The token and its `expiresAt` value are cached.
3. Concurrent calls share one in-flight login.
4. The token is refreshed 60 seconds before expiry.
5. A `401` response clears the token, logs in again and retries the request exactly once.

Manual control is available:

```ts
const token = await client.ensureToken(); // login if needed
client.setToken(token, '2026-11-20 06:00:00');
client.clearToken();
const fresh = await client.login(); // force a new login
```

Tokens can be persisted between processes and passed back through the `token` and `tokenExpiresAt` constructor options.

## Error handling

Every SDK error extends `FancourierError`; the HTTP status is on `.status`, the parsed body on `.raw`, and the optional cause on `.cause`.

| Class | Raised on |
|---|---|
| `FancourierError` | Base class; also timeouts and JSON parse failures |
| `ValidationError` | `400` — malformed request |
| `AuthenticationError` | `401` — invalid credentials or expired token |
| `PermissionError` | `403` — authenticated but not allowed |
| `NotFoundError` | `404` — resource does not exist |
| `RateLimitError` | `429` — exposes `.retryAfter` (seconds) |
| `ServerError` | `5xx` — FanCourier failed to process the request |

```ts
import { RateLimitError, ValidationError } from 'fancourier-node-sdk';

try {
  await client.awb.create(payload);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(error.message, error.raw);
  } else if (error instanceof RateLimitError) {
    console.error('retry after', error.retryAfter, 'seconds');
  } else {
    throw error;
  }
}
```

The SDK does not retry rate limits or server errors automatically; retry those in application code after the indicated delay.

## Testing

```bash
npm test                # unit suite (mocked fetch, no network)
npm run test:coverage   # unit suite with v8 coverage
npm run typecheck
npm run lint
npm run build
```

The live-API integration suite is opt-in and skips itself without credentials. It is the only part of the project that reads environment variables; normal SDK usage never does:

```bash
FANCOURIER_CLIENT_ID=7032158 \
FANCOURIER_USER=clienttest \
FANCOURIER_PASSWORD=testing \
npm run test:integration
```

Set `FANCOURIER_BASE_URL` to target a proxy or sandbox. The integration suite is read-only: it authenticates, lists catalogues and estimates a tariff. It never creates or cancels real AWBs.

CI (`.github/workflows/ci.yml`) runs lint, typecheck and the unit suite on Node 20, 22 and 24. The integration job runs only when the `FANCOURIER_CLIENT_ID`, `FANCOURIER_USER` and `FANCOURIER_PASSWORD` repository secrets are configured.

## Contributing

Bug reports and feature requests are welcome in [GitHub Issues](https://github.com/bucel-sebastian/fancourier-node-sdk/issues). Before opening a pull request, run `npm run lint`, `npm run typecheck` and `npm test`.

---

<div align="center">

Released under the [MIT](LICENSE) license.

`npm install fancourier-node-sdk`

</div>
