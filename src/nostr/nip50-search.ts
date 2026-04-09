import { matchesSearchPredicate } from '../search/listing-search'

export interface NostrEvent {
  id: string
  pubkey: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
}

/**
 * Minimal listing shape aligned to Shopstr parser output and search expectations.
 */
export interface ProductData {
  id: string
  pubkey: string
  title: string
  summary: string
  tags: string[]
  createdAt: number
  relay: string
  rawEvent: NostrEvent
}

const DEFAULT_TIMEOUT_MS = 3500

function readFirstTag(tags: string[][], key: string): string {
  const found = tags.find(tag => tag[0] === key)
  return found?.[1] ?? ''
}

function readMultiTag(tags: string[][], key: string): string[] {
  return tags.filter(tag => tag[0] === key && typeof tag[1] === 'string').map(tag => tag[1])
}

function toProductData(event: NostrEvent, relay: string): ProductData | null {
  if (event.kind !== 30402) return null

  const title = readFirstTag(event.tags, 'title')
  const summary = readFirstTag(event.tags, 'summary') || event.content || ''
  const tags = readMultiTag(event.tags, 't')

  return {
    id: event.id,
    pubkey: event.pubkey,
    title,
    summary,
    tags,
    createdAt: event.created_at,
    relay,
    rawEvent: event,
  }
}

async function queryRelay(
  relay: string,
  query: string,
  signal?: AbortSignal,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<ProductData[]> {
  return new Promise(resolve => {
    if (signal?.aborted) {
      resolve([])
      return
    }

    const ws = new WebSocket(relay)
    const subId = `shopstr-sob-${Math.random().toString(16).slice(2)}`
    const items: ProductData[] = []
    const seen = new Set<string>()
    let settled = false

    const finish = () => {
      if (settled) return
      settled = true

      clearTimeout(timer)
      signal?.removeEventListener('abort', abortHandler)

      try {
        ws.send(JSON.stringify(['CLOSE', subId]))
      } catch {
        // no-op
      }

      try {
        ws.close()
      } catch {
        // no-op
      }

      resolve(items)
    }

    const abortHandler = () => finish()
    signal?.addEventListener('abort', abortHandler, { once: true })

    const timer = window.setTimeout(() => finish(), timeoutMs)

    ws.onopen = () => {
      if (signal?.aborted) {
        finish()
        return
      }

      ws.send(
        JSON.stringify([
          'REQ',
          subId,
          {
            kinds: [30402],
            search: query,
            limit: 20,
          },
        ]),
      )
    }

    ws.onerror = () => finish()
    ws.onclose = () => finish()

    ws.onmessage = message => {
      let payload: unknown

      try {
        payload = JSON.parse(message.data as string)
      } catch {
        return
      }

      if (!Array.isArray(payload) || payload.length < 2) return

      const type = payload[0]
      const responseSubId = payload[1]
      if (responseSubId !== subId) return

      if (type === 'EOSE') {
        finish()
        return
      }

      if (type !== 'EVENT' || payload.length < 3) return

      const rawEvent = payload[2] as NostrEvent
      if (seen.has(rawEvent.id)) return
      seen.add(rawEvent.id)

      const parsed = toProductData(rawEvent, relay)
      if (!parsed) return

      // Keep a defensive local predicate pass so behavior stays aligned with Task 1 helper.
      if (!matchesSearchPredicate(parsed, query)) return
      items.push(parsed)
    }
  })
}

/**
 * Searches NIP-99 listing events (kind 30402) using NIP-50 relay-side search.
 * Includes AbortSignal support to cancel stale user-typing requests.
 */
export async function searchListingsViaNip50(
  query: string,
  relays: string[],
  signal?: AbortSignal,
): Promise<ProductData[]> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return []

  const settled = await Promise.all(relays.map(relay => queryRelay(relay, normalizedQuery, signal)))

  const dedupedById = new Map<string, ProductData>()
  for (const relayItems of settled) {
    for (const item of relayItems) {
      if (!dedupedById.has(item.id)) {
        dedupedById.set(item.id, item)
      }
    }
  }

  return [...dedupedById.values()].sort((a, b) => b.createdAt - a.createdAt)
}
