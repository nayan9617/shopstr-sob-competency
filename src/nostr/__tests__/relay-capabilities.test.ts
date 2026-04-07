import {
  relayWsToHttp,
  relaySupportsNip50,
  fetchNip11,
  evaluateRelayCapability,
  evaluateRelays,
} from '../relay-capabilities'

describe('relayWsToHttp', () => {
  it('converts wss protocol to https', () => {
    expect(relayWsToHttp('wss://relay.nostr.band')).toBe('https://relay.nostr.band/')
  })

  it('converts ws protocol to http', () => {
    expect(relayWsToHttp('ws://localhost:7777')).toBe('http://localhost:7777/')
  })
})

describe('relaySupportsNip50', () => {
  it('returns true when supported_nips includes 50', () => {
    expect(relaySupportsNip50({ supported_nips: [1, 11, 50] })).toBe(true)
  })

  it('returns false when supported_nips omits 50', () => {
    expect(relaySupportsNip50({ supported_nips: [1, 11] })).toBe(false)
  })

  it('returns false when supported_nips is missing', () => {
    expect(relaySupportsNip50({})).toBe(false)
  })
})

describe('fetchNip11', () => {
  it('sends Accept: application/nostr+json header', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ supported_nips: [50] }),
    })

    await fetchNip11('wss://relay.nostr.band', fetchMock as unknown as typeof fetch)

    expect(fetchMock).toHaveBeenCalledWith('https://relay.nostr.band/', {
      headers: { Accept: 'application/nostr+json' },
    })
  })

  it('throws for non-2xx responses', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    })

    await expect(
      fetchNip11('wss://relay.nostr.band', fetchMock as unknown as typeof fetch),
    ).rejects.toThrow('NIP-11 request failed with 500 Server Error')
  })
})

describe('evaluateRelayCapability', () => {
  it('returns fetched=true and supportsNip50=true when relay advertises 50', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ supported_nips: [1, 50] }),
    })

    const result = await evaluateRelayCapability(
      'wss://relay.nostr.band',
      fetchMock as unknown as typeof fetch,
    )

    expect(result.nip11Fetched).toBe(true)
    expect(result.supportsNip50).toBe(true)
    expect(result.supportedNips).toEqual([1, 50])
    expect(typeof result.latencyMs).toBe('number')
  })

  it('returns fetched=false and error message when request fails', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('network down'))

    const result = await evaluateRelayCapability(
      'wss://relay.nostr.band',
      fetchMock as unknown as typeof fetch,
    )

    expect(result.nip11Fetched).toBe(false)
    expect(result.supportsNip50).toBe(false)
    expect(result.error).toContain('network down')
  })
})

describe('evaluateRelays', () => {
  it('evaluates all relays and preserves input ordering', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ supported_nips: [50] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ supported_nips: [1] }) })

    const results = await evaluateRelays(
      ['wss://relay.nostr.band', 'wss://relay.damus.io'],
      fetchMock as unknown as typeof fetch,
    )

    expect(results).toHaveLength(2)
    expect(results[0].relay).toBe('wss://relay.nostr.band')
    expect(results[1].relay).toBe('wss://relay.damus.io')
    expect(results[0].supportsNip50).toBe(true)
    expect(results[1].supportsNip50).toBe(false)
  })
})
