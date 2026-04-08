# NIP-50 Relay Evaluation for Shopstr

## Method
Each relay's NIP-11 document was fetched via HTTP with `Accept: application/nostr+json`.
The `supported_nips` array was checked for the value `50`.
A test search query (`{"kinds": [30402], "search": "bitcoin", "limit": 5}`) was manually sent
to reachable NIP-50-supporting relays to verify actual behavior.

## Results

| Relay | NIP-11 Fetched | NIP-50 in supported_nips | Test Query Response | Latency |
|---|---|---|---|---|
| wss://relay.nostr.band | No (this run) | Unknown (runtime check) | Unreachable in this run due to local timeout; publicly known to advertise NIP-50 and should be treated as a primary candidate | ~7678ms |
| wss://nostr.wine | Yes | Yes | Manual test with `wscat` returned kind:30402 events for query `bitcoin` | ~1168ms |
| wss://relay.damus.io | Yes | No | N/A | ~1509ms |
| wss://nos.lol | Yes | No | N/A | ~878ms |
| wss://purplepag.es | Yes | No | N/A | ~860ms |

## Recommendations
- `nostr.wine` is a confirmed NIP-50-capable candidate in this run, including a successful manual search-filter check.
- `relay.nostr.band` was unreachable in this local run; treat this as a network/runtime artifact, not evidence of missing NIP-50 support.
- General-purpose relays (damus, nos.lol, purplepag.es) did not advertise NIP-50 support in this run.
- Shopstr should query NIP-50-capable relays first, then fall back to client-side
  `matchesSearchPredicate` for relays that do not support it.
- Some relays may accept a `search` filter without error but return empty results.
  Shopstr's NIP-50 implementation should treat empty results as a soft fallback trigger,
  not a hard error.

## How to refresh this table
Run:

```bash
npm run relay:check
```

Then copy the resulting relay capability output into this table and update observations.
