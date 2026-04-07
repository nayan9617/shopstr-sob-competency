/**
 * nip56-report.ts
 *
 * Typed helpers for constructing NIP-56 kind:1984 report events.
 *
 * NIP-56 Reference: https://github.com/nostr-protocol/nips/blob/master/56.md
 *
 * Report events (kind:1984) let users flag objectionable content or actors.
 * The event structure uses "p" tags to reference pubkeys and "e" tags to
 * reference specific events (listings). Both tags include the report reason
 * as a third element.
 *
 * This module is intentionally framework-agnostic — no React, no Nostr
 * client imports — so it can be tested in pure Jest without mocking the DOM.
 */

// Types

/**
 * The seven report reasons defined by NIP-56.
 * Use plain-language labels in UI; use these string literals when constructing events.
 */
export type ReportType =
  | 'nudity' // Depictions of nudity or pornography
  | 'malware' // Malware or phishing links
  | 'profanity' // Offensive or hateful language
  | 'illegal' // Illegal content (varies by jurisdiction)
  | 'spam' // Unsolicited advertising or spam
  | 'impersonation' // Impersonating another person or account
  | 'other' // Any other reason

/** All valid NIP-56 report type values as an array (useful for validation). */
export const REPORT_TYPES: ReportType[] = [
  'nudity',
  'malware',
  'profanity',
  'illegal',
  'spam',
  'impersonation',
  'other',
]

/**
 * Describes what is being reported.
 *
 * For a profile report: provide pubkey only.
 * For a listing report: provide both pubkey (the seller) and eventId (the listing).
 */
export interface ReportTarget {
  /** 'profile' | 'listing' */
  type: 'profile' | 'listing'
  /**
   * Hex pubkey of the person being reported.
   * Always required — even for listing reports we tag the author.
   */
  pubkey: string
  /**
   * Hex event ID of the listing being reported.
   * Required when type === 'listing'. Ignored for profile reports.
   */
  eventId?: string
}

/**
 * The unsigned event template for a NIP-56 report.
 * Callers sign and publish this through their Nostr client.
 */
export interface ReportEventTemplate {
  kind: 1984
  content: string
  tags: string[][]
  created_at: number
}

// Errors

export class InvalidReportTargetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidReportTargetError'
  }
}

// Core helpers

/**
 * Builds the tags array for a NIP-56 kind:1984 report event.
 *
 * Tag structure:
 *   - ["p", <pubkey>, <reportType>]          — always present
 *   - ["e", <eventId>, <reportType>]         — only for listing reports
 *
 * @throws {InvalidReportTargetError} if target.type is 'listing' and eventId is missing.
 *
 * @example
 * // Profile report
 * buildReportTags({ type: 'profile', pubkey: 'abc...' }, 'spam')
 * // → [["p", "abc...", "spam"]]
 *
 * // Listing report
 * buildReportTags({ type: 'listing', pubkey: 'abc...', eventId: 'def...' }, 'illegal')
 * // → [["p", "abc...", "illegal"], ["e", "def...", "illegal"]]
 */
export function buildReportTags(
  target: ReportTarget,
  reportType: ReportType,
): string[][] {
  if (target.type === 'listing' && !target.eventId) {
    throw new InvalidReportTargetError(
      'eventId is required for listing reports (target.type === "listing")',
    )
  }

  const tags: string[][] = [['p', target.pubkey, reportType]]

  if (target.type === 'listing' && target.eventId) {
    tags.push(['e', target.eventId, reportType])
  }

  return tags
}

/**
 * Builds a complete unsigned NIP-56 kind:1984 report event template.
 * The caller is responsible for signing and publishing.
 *
 * @param target      What/who is being reported.
 * @param reportType  The NIP-56 reason category.
 * @param comment     Optional free-text explanation (becomes event content).
 * @returns           Unsigned event template ready for signing.
 */
export function buildReportEvent(
  target: ReportTarget,
  reportType: ReportType,
  comment = '',
): ReportEventTemplate {
  return {
    kind: 1984,
    content: comment,
    tags: buildReportTags(target, reportType),
    created_at: Math.floor(Date.now() / 1000),
  }
}
