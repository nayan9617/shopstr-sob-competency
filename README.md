# shopstr-sob-competency

Live Demo: https://shopstr-competency.vercel.app/

Standalone competency implementation for three Shopstr SoB tasks.

These helpers are the foundation for the NIP-50 search and NIP-56 reporting work proposed for SoB 2026. `listing-search.ts` mirrors the client-side predicate behavior used for marketplace fallback and relevance checks, `relay-capabilities.ts` implements the relay evaluation flow from Task 2, and `nip56-report.ts` provides typed report-construction helpers that can be dropped into Shopstr's Nostr utility layer with minimal adaptation.

## Tasks implemented

- Task 1: Pure listing search helper and Jest tests
- Task 2: Relay NIP-50 capability helper, tests, and evaluation write-up
- Task 3: NIP-56 report tag/event helper and Jest tests
- Task 4: Minimal frontend demo (Vite + React + TypeScript) showing live NIP-50 search and signed NIP-56 payload preview

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

## Run frontend demo

```bash
npm run dev
```

Then open the local URL shown by Vite (typically `http://localhost:5173`).

## Build frontend demo

```bash
npm run build
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

## What mentors can verify quickly

- Search bar triggers `searchListingsViaNip50(query, relays, signal)` with abort handling.
- Results show raw listing data from relays in a readable card layout.
- Clicking Report builds and signs a kind `1984` payload using `buildReportEvent`, but does not publish it.
- `RELAY_EVALUATION.md` documents relay capability observations and recommendations.

## Vercel deploy (GitHub import)

- Go to Vercel and choose **Add New Project**.
- Import `nayan9617/shopstr-sob-competency`.
- Framework preset: `Vite` (auto-detected).
- Build command: `npm run build`.
- Output directory: `dist`.
- Click Deploy and paste the generated URL into the Live Demo line at the top of this README.
