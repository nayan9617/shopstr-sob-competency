/**
 * relay-capabilities.ts
 *
 * Helpers for evaluating whether relays advertise NIP-50 support.
 *
 * This module can be imported in tests or run directly from the CLI:
 *   npm run relay:check -- wss://relay.nostr.band wss://nostr.wine
 */

export interface Nip11Document {
  supported_nips?: number[]
  [key: string]: unknown
}

export interface RelayCapabilityResult {
  relay: string
  httpUrl: string
  nip11Fetched: boolean
  supportsNip50: boolean
  supportedNips: number[] | null
  latencyMs: number | null
  error?: string
}

/** Converts ws/wss relay URL to the HTTP URL used for NIP-11 fetches. */
export function relayWsToHttp(relayUrl: string): string {
  const url = new URL(relayUrl)
  if (url.protocol === 'wss:') url.protocol = 'https:'
  if (url.protocol === 'ws:') url.protocol = 'http:'
  return url.toString()
}

/** Returns true when a NIP-11 document advertises NIP-50 support. */
export function relaySupportsNip50(doc: Pick<Nip11Document, 'supported_nips'>): boolean {
  return Array.isArray(doc.supported_nips) && doc.supported_nips.includes(50)
}

/** Fetches a relay NIP-11 document with the required Accept header. */
export async function fetchNip11(
  relayUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Nip11Document> {
  const httpUrl = relayWsToHttp(relayUrl)
  const response = await fetchImpl(httpUrl, {
    headers: {
      Accept: 'application/nostr+json',
    },
  })

  if (!response.ok) {
    throw new Error(`NIP-11 request failed with ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as Nip11Document
}

/** Evaluates one relay for NIP-50 support and basic response metadata. */
export async function evaluateRelayCapability(
  relayUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RelayCapabilityResult> {
  const httpUrl = relayWsToHttp(relayUrl)
  const started = Date.now()

  try {
    const doc = await fetchNip11(relayUrl, fetchImpl)
    const latencyMs = Date.now() - started

    return {
      relay: relayUrl,
      httpUrl,
      nip11Fetched: true,
      supportsNip50: relaySupportsNip50(doc),
      supportedNips: Array.isArray(doc.supported_nips) ? doc.supported_nips : null,
      latencyMs,
    }
  } catch (error) {
    const latencyMs = Date.now() - started
    return {
      relay: relayUrl,
      httpUrl,
      nip11Fetched: false,
      supportsNip50: false,
      supportedNips: null,
      latencyMs,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/** Evaluates multiple relays sequentially for deterministic output ordering. */
export async function evaluateRelays(
  relays: string[],
  fetchImpl: typeof fetch = fetch,
): Promise<RelayCapabilityResult[]> {
  const results: RelayCapabilityResult[] = []

  for (const relay of relays) {
    results.push(await evaluateRelayCapability(relay, fetchImpl))
  }

  return results
}

function asDisplayTable(results: RelayCapabilityResult[]): string {
  const header = ['Relay', 'NIP-11 Fetched', 'NIP-50', 'Latency', 'Error']
  const rows = results.map(result => [
    result.relay,
    result.nip11Fetched ? 'yes' : 'no',
    result.supportsNip50 ? 'yes' : 'no',
    result.latencyMs === null ? 'n/a' : `${result.latencyMs}ms`,
    result.error ?? '',
  ])

  const allRows = [header, ...rows]
  const widths = header.map((_, colIdx) =>
    Math.max(...allRows.map(row => row[colIdx].length)),
  )

  return allRows
    .map((row, rowIdx) => {
      const line = row
        .map((cell, colIdx) => cell.padEnd(widths[colIdx], ' '))
        .join(' | ')
      if (rowIdx === 0) {
        const sep = widths.map(w => '-'.repeat(w)).join('-|-')
        return `${line}\n${sep}`
      }
      return line
    })
    .join('\n')
}

async function runCli(): Promise<void> {
  const defaultRelays = [
    'wss://relay.nostr.band',
    'wss://nostr.wine',
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://purplepag.es',
  ]

  const relays = process.argv.slice(2)
  const targets = relays.length > 0 ? relays : defaultRelays
  const results = await evaluateRelays(targets)

  console.log(asDisplayTable(results))
}

if (require.main === module) {
  runCli().catch(error => {
    console.error(error)
    process.exit(1)
  })
}
