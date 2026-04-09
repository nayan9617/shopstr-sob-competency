import { useEffect, useMemo, useState } from 'react'
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { REPORT_TYPES, buildReportEvent, type ReportType } from './nostr/nip56-report'
import { searchListingsViaNip50, type ProductData } from './nostr/nip50-search'
import './styles.css'

const DEFAULT_RELAYS = [
  'wss://relay.nostr.band',
  'wss://nostr.wine',
  'wss://relay.damus.io',
]

interface ReportState {
  productId: string
  reportType: ReportType
  comment: string
}

function relaysFromInput(raw: string): string[] {
  return raw
    .split('\n')
    .map(value => value.trim())
    .filter(Boolean)
}

export default function App(): JSX.Element {
  const [query, setQuery] = useState('bitcoin')
  const [relayInput, setRelayInput] = useState(DEFAULT_RELAYS.join('\n'))
  const [results, setResults] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reportState, setReportState] = useState<ReportState | null>(null)
  const [signedPayload, setSignedPayload] = useState<Record<string, unknown> | null>(null)

  const relays = useMemo(() => relaysFromInput(relayInput), [relayInput])
  const searchIdentity = useMemo(() => `${query}::${relays.join('|')}`, [query, relays])

  useEffect(() => {
    const normalized = query.trim()
    if (!normalized) {
      setResults([])
      setError('')
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError('')

    searchListingsViaNip50(normalized, relays, controller.signal)
      .then(items => {
        if (!controller.signal.aborted) {
          setResults(items)
        }
      })
      .catch(cause => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'Search failed')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [searchIdentity, query, relays])

  const handleCreatePayload = (product: ProductData, type: ReportType, comment: string) => {
    const unsigned = buildReportEvent(
      {
        type: 'listing',
        pubkey: product.pubkey,
        eventId: product.id,
      },
      type,
      comment,
    )

    const sk = generateSecretKey()
    const signed = finalizeEvent(
      {
        kind: unsigned.kind,
        pubkey: getPublicKey(sk),
        created_at: unsigned.created_at,
        tags: unsigned.tags,
        content: unsigned.content,
      },
      sk,
    )

    setSignedPayload(signed)
    setReportState(null)
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="badge">Shopstr SoB 2026 Competency Demo</p>
        <h1>NIP-50 Search + NIP-56 Report Builder</h1>
        <p>
          Live relay search for kind 30402 listings. Report action generates a signed kind 1984 JSON
          payload without publishing it.
        </p>
      </header>

      <section className="panel">
        <label htmlFor="search" className="field-label">
          Search Listings
        </label>
        <input
          id="search"
          className="search-input"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Type bitcoin, wallet, camera..."
        />

        <label htmlFor="relays" className="field-label">
          Relays (one per line)
        </label>
        <textarea
          id="relays"
          className="relay-input"
          value={relayInput}
          onChange={event => setRelayInput(event.target.value)}
          rows={4}
        />

        <div className="meta-row">
          <span>{loading ? 'Searching relays...' : `${results.length} results`}</span>
          {error ? <span className="error">{error}</span> : null}
        </div>
      </section>

      <section className="results-grid">
        {results.map(item => {
          const isOpen = reportState?.productId === item.id

          return (
            <article key={item.id} className="card">
              <h2>{item.title || 'Untitled listing'}</h2>
              <p>{item.summary || 'No summary available.'}</p>
              <div className="tag-row">
                {item.tags.map(tag => (
                  <span key={`${item.id}-${tag}`} className="chip">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="card-meta">
                <span>Relay: {item.relay}</span>
                <span>Event: {item.id.slice(0, 12)}...</span>
              </div>

              <button
                className="report-button"
                type="button"
                onClick={() =>
                  setReportState({
                    productId: item.id,
                    reportType: 'spam',
                    comment: '',
                  })
                }
              >
                Report
              </button>

              {isOpen ? (
                <div className="report-form">
                  <label>
                    Reason
                    <select
                      value={reportState.reportType}
                      onChange={event =>
                        setReportState(current =>
                          current
                            ? { ...current, reportType: event.target.value as ReportType }
                            : current,
                        )
                      }
                    >
                      {REPORT_TYPES.map(type => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Comment (optional)
                    <input
                      value={reportState.comment}
                      onChange={event =>
                        setReportState(current =>
                          current ? { ...current, comment: event.target.value } : current,
                        )
                      }
                      placeholder="Why are you reporting this listing?"
                    />
                  </label>

                  <div className="action-row">
                    <button
                      type="button"
                      onClick={() =>
                        handleCreatePayload(item, reportState.reportType, reportState.comment)
                      }
                    >
                      Generate signed JSON
                    </button>
                    <button type="button" className="ghost" onClick={() => setReportState(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          )
        })}
      </section>

      <section className="panel payload-panel">
        <h3>Signed Kind 1984 Payload Preview</h3>
        <pre>{JSON.stringify(signedPayload, null, 2)}</pre>
      </section>
    </main>
  )
}
