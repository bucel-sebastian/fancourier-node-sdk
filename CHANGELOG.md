# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-19

### Added

- Initial TypeScript SDK for the FanCourier API.
- Lazy, single-flight authentication with token caching, expiry-aware refresh and
  one automatic re-authentication on `401`.
- Internal and export AWB creation, cancellation, PDF/HTML/ZPL labels and tariff
  estimates.
- Romanian and international geography lookups: counties, localities, streets,
  countries and external localities.
- FANbox, PayPoint and FAN-office pickup-point lookups.
- Courier pickup orders: create, cancel, list, event catalogue and tracking.
- Reports: shipping slips, AWB events, AWB tracking, bank transfers, AWB
  confirmations and branches.
- Typed error hierarchy with HTTP status mapping and `Retry-After` support.
- Dual ESM/CJS builds, generated type declarations, unit tests and opt-in live
  API integration tests.

[0.1.0]: https://github.com/bucel-sebastian/fancourier-node-sdk/releases/tag/v0.1.0
