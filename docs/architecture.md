# Architecture

This repository intentionally isolates helpers from the Shopstr application so each task can be tested independently.

## Modules

- Search helper module
  - `src/search/listing-search.ts`
  - Pure client-side predicate and list filter utility.

- Relay capability module
  - `src/nostr/relay-capabilities.ts`
  - Fetches NIP-11 metadata and determines whether relays advertise NIP-50.

- NIP-56 report module
  - `src/nostr/nip56-report.ts`
  - Typed helper for building report tags and unsigned report events.

## Testing strategy

- Jest with `ts-jest` runs all tests directly from TypeScript source.
- Each helper module has its own test file.
- Coverage focuses on happy paths, edge cases, and error handling.
