import { matchesSearchPredicate, filterListings } from '../listing-search'
import type { SearchableProduct } from '../listing-search'

// Fixtures

const bitcoin: SearchableProduct = {
  title: 'Bitcoin Hardware Wallet',
  summary: 'A secure cold storage device for your sats',
  tags: ['hardware', 'security', 'bitcoin'],
}

const coffee: SearchableProduct = {
  title: 'Single-Origin Coffee Beans',
  summary: 'Ethopian Yirgacheffe, roasted fresh',
  tags: ['coffee', 'food'],
}

const noFields: SearchableProduct = {}

const partialFields: SearchableProduct = {
  title: 'Vintage Camera',
  // no summary, no tags
}

// matchesSearchPredicate

describe('matchesSearchPredicate', () => {
  describe('empty / whitespace query', () => {
    it('returns true for empty string', () => {
      expect(matchesSearchPredicate(bitcoin, '')).toBe(true)
    })

    it('returns true for whitespace-only string', () => {
      expect(matchesSearchPredicate(bitcoin, '   ')).toBe(true)
    })

    it('returns true for a product with no fields when query is empty', () => {
      expect(matchesSearchPredicate(noFields, '')).toBe(true)
    })
  })

  describe('title matching', () => {
    it('matches on exact title', () => {
      expect(matchesSearchPredicate(bitcoin, 'Bitcoin Hardware Wallet')).toBe(true)
    })

    it('matches on partial title', () => {
      expect(matchesSearchPredicate(bitcoin, 'Hardware')).toBe(true)
    })

    it('is case insensitive on title', () => {
      expect(matchesSearchPredicate(bitcoin, 'BITCOIN')).toBe(true)
      expect(matchesSearchPredicate(bitcoin, 'bitcoin')).toBe(true)
      expect(matchesSearchPredicate(bitcoin, 'BiTcOiN')).toBe(true)
    })
  })

  describe('summary matching', () => {
    it('matches on partial summary', () => {
      expect(matchesSearchPredicate(bitcoin, 'cold storage')).toBe(true)
    })

    it('is case insensitive on summary', () => {
      expect(matchesSearchPredicate(bitcoin, 'COLD STORAGE')).toBe(true)
    })
  })

  describe('tag matching', () => {
    it('matches on an exact tag', () => {
      expect(matchesSearchPredicate(bitcoin, 'security')).toBe(true)
    })

    it('matches on partial tag', () => {
      expect(matchesSearchPredicate(bitcoin, 'secu')).toBe(true)
    })

    it('is case insensitive on tags', () => {
      expect(matchesSearchPredicate(bitcoin, 'HARDWARE')).toBe(true)
    })
  })

  describe('non-matching cases', () => {
    it('returns false when query matches no field', () => {
      expect(matchesSearchPredicate(bitcoin, 'coffee')).toBe(false)
    })

    it('returns false for product with no fields and non-empty query', () => {
      expect(matchesSearchPredicate(noFields, 'bitcoin')).toBe(false)
    })

    it('does not match a different product', () => {
      expect(matchesSearchPredicate(coffee, 'wallet')).toBe(false)
    })
  })

  describe('undefined field safety', () => {
    it('does not throw when title is undefined', () => {
      expect(() =>
        matchesSearchPredicate({ summary: 'test' }, 'camera'),
      ).not.toThrow()
    })

    it('does not throw when summary is undefined', () => {
      expect(() =>
        matchesSearchPredicate({ title: 'Camera' }, 'lens'),
      ).not.toThrow()
    })

    it('does not throw when tags is undefined', () => {
      expect(() =>
        matchesSearchPredicate({ title: 'Camera' }, 'photo'),
      ).not.toThrow()
    })

    it('does not throw when all fields are undefined', () => {
      expect(() => matchesSearchPredicate(noFields, 'anything')).not.toThrow()
    })

    it('matches title when only title is present', () => {
      expect(matchesSearchPredicate(partialFields, 'vintage')).toBe(true)
    })
  })

  describe('leading/trailing whitespace in query', () => {
    it('trims whitespace from query before matching', () => {
      expect(matchesSearchPredicate(bitcoin, '  bitcoin  ')).toBe(true)
    })
  })
})

// filterListings

describe('filterListings', () => {
  const catalog = [bitcoin, coffee, partialFields, noFields]

  it('returns all products for empty query', () => {
    expect(filterListings(catalog, '')).toHaveLength(4)
  })

  it('returns only matching products', () => {
    const results = filterListings(catalog, 'bitcoin')
    expect(results).toHaveLength(1)
    expect(results[0]).toBe(bitcoin)
  })

  it('returns empty array when nothing matches', () => {
    expect(filterListings(catalog, 'zzznotfound')).toHaveLength(0)
  })

  it('returns multiple matches when appropriate', () => {
    // both bitcoin and camera have titles
    const results = filterListings(catalog, 'a') // matches many
    expect(results.length).toBeGreaterThan(1)
  })
})
