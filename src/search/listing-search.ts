/**
 * listing-search.ts
 *
 * Client-side search predicate for NIP-99 marketplace listings.
 *
 * This helper is extracted from Shopstr's marketplace component so it can be:
 *  1. Unit-tested in isolation
 *  2. Used as a fallback when relay-side NIP-50 search is unavailable
 *  3. Combined with NIP-50 results for deduplication and re-ranking
 *
 * It intentionally has zero side effects and no imports — pure function.
 */

/** Minimal shape of a Shopstr listing needed for search matching. */
export interface SearchableProduct {
  /** Listing title (NIP-99 "title" tag) */
  title?: string
  /** Short description (NIP-99 "summary" tag or event content) */
  summary?: string
  /** Category/hashtags (NIP-99 "t" tags) */
  tags?: string[]
  /** Seller pubkey — included so callers can filter by seller */
  pubkey?: string
}

/**
 * Returns true if a listing matches a user-typed search query.
 *
 * Matching rules (in priority order):
 *  - Empty or whitespace-only query always matches (shows all listings)
 *  - Case-insensitive substring match on title
 *  - Case-insensitive substring match on summary
 *  - Case-insensitive substring match on any tag
 *
 * Missing fields (undefined/null) are treated as non-matching, never throw.
 *
 * @param product  The listing to test. May have undefined fields.
 * @param query    The raw search string typed by the user.
 * @returns        true if the listing should be included in results.
 */
export function matchesSearchPredicate(
  product: SearchableProduct,
  query: string,
): boolean {
  const q = query.trim().toLowerCase()

  // Empty query — show everything
  if (!q) return true

  if (product.title?.toLowerCase().includes(q)) return true
  if (product.summary?.toLowerCase().includes(q)) return true
  if (product.tags?.some(tag => tag.toLowerCase().includes(q))) return true

  return false
}

/**
 * Filters a list of products by a search query.
 * Convenience wrapper around matchesSearchPredicate.
 *
 * @param products  Array of listings to filter.
 * @param query     The user's search string.
 * @returns         Subset of products that match the query.
 */
export function filterListings(
  products: SearchableProduct[],
  query: string,
): SearchableProduct[] {
  return products.filter(p => matchesSearchPredicate(p, query))
}
