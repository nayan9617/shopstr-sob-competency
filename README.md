# shopstr-sob-competency

Standalone competency implementation for three Shopstr SoB tasks.

## Tasks implemented

- Task 1: Pure listing search helper and Jest tests
- Task 2: Relay NIP-50 capability helper, tests, and evaluation write-up
- Task 3: NIP-56 report tag/event helper and Jest tests

## Project structure

- `src/search/listing-search.ts`
- `src/search/__tests__/listing-search.test.ts`
- `src/nostr/relay-capabilities.ts`
- `src/nostr/__tests__/relay-capabilities.test.ts`
- `src/nostr/nip56-report.ts`
- `src/nostr/__tests__/nip56-report.test.ts`
- `RELAY_EVALUATION.md`
- `docs/architecture.md`

## Install

```bash
npm install
```

## Run tests

```bash
npm test
```

## Run relay capability check

This checks NIP-11 metadata and whether relays advertise NIP-50 support.

```bash
npm run relay:check
```

You can also pass explicit relays:

```bash
npm run relay:check -- wss://relay.nostr.band wss://nostr.wine wss://relay.damus.io
```
