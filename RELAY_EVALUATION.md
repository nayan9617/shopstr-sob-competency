# NIP-50 Relay Evaluation for Shopstr

## Method
Each relay's NIP-11 document was fetched via HTTP with `Accept: application/nostr+json`.
The `supported_nips` array was checked for the value `50`.
A test search query (`{"kinds": [30402], "search": "bitcoin", "limit": 5}`) should be sent
to each NIP-50-supporting relay to verify actual behavior.

## Results

| Relay | NIP-11 Fetched | NIP-50 in supported_nips | Test Query Response | Latency |
|---|---|---|---|---|
| wss://relay.nostr.band | ❌ | ❌ | N/A (NIP-11 fetch failed in this run) | ~7678ms |
| wss://nostr.wine | ✅ | ✅ | Not executed by this helper | ~1168ms |
| wss://relay.damus.io | ✅ | ❌ | N/A | ~1509ms |
| wss://nos.lol | ✅ | ❌ | N/A | ~878ms |
| wss://purplepag.es | ✅ | ❌ | N/A | ~860ms |

## Recommendations
- `nostr.wine` is a confirmed NIP-50-capable candidate in this run.
- `relay.nostr.band` should be treated as potentially useful but intermittent due to fetch failures.
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
