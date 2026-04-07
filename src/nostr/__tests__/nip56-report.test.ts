import {
  buildReportTags,
  buildReportEvent,
  InvalidReportTargetError,
  REPORT_TYPES,
} from '../nip56-report'
import type { ReportType, ReportTarget } from '../nip56-report'

// Fixtures

const SELLER_PUBKEY = 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899'
const LISTING_EVENT_ID = '1122334455667788990011223344556677889900112233445566778899001122'

const profileTarget: ReportTarget = {
  type: 'profile',
  pubkey: SELLER_PUBKEY,
}

const listingTarget: ReportTarget = {
  type: 'listing',
  pubkey: SELLER_PUBKEY,
  eventId: LISTING_EVENT_ID,
}

// buildReportTags — profile reports

describe('buildReportTags — profile reports', () => {
  it('returns exactly one tag for a profile report', () => {
    const tags = buildReportTags(profileTarget, 'spam')
    expect(tags).toHaveLength(1)
  })

  it('produces a "p" tag as the first element', () => {
    const tags = buildReportTags(profileTarget, 'spam')
    expect(tags[0][0]).toBe('p')
  })

  it('includes the correct pubkey in the p tag', () => {
    const tags = buildReportTags(profileTarget, 'spam')
    expect(tags[0][1]).toBe(SELLER_PUBKEY)
  })

  it('includes the report type in the p tag', () => {
    const tags = buildReportTags(profileTarget, 'spam')
    expect(tags[0][2]).toBe('spam')
  })

  it('does not include an "e" tag for profile reports', () => {
    const tags = buildReportTags(profileTarget, 'spam')
    expect(tags.some(t => t[0] === 'e')).toBe(false)
  })
})

// buildReportTags — listing reports

describe('buildReportTags — listing reports', () => {
  it('returns exactly two tags for a listing report', () => {
    const tags = buildReportTags(listingTarget, 'illegal')
    expect(tags).toHaveLength(2)
  })

  it('first tag is a "p" tag', () => {
    const tags = buildReportTags(listingTarget, 'illegal')
    expect(tags[0][0]).toBe('p')
  })

  it('second tag is an "e" tag', () => {
    const tags = buildReportTags(listingTarget, 'illegal')
    expect(tags[1][0]).toBe('e')
  })

  it('p tag contains the seller pubkey', () => {
    const tags = buildReportTags(listingTarget, 'illegal')
    expect(tags[0][1]).toBe(SELLER_PUBKEY)
  })

  it('e tag contains the listing event ID', () => {
    const tags = buildReportTags(listingTarget, 'illegal')
    expect(tags[1][1]).toBe(LISTING_EVENT_ID)
  })

  it('report type appears in both p and e tags', () => {
    const tags = buildReportTags(listingTarget, 'illegal')
    expect(tags[0][2]).toBe('illegal')
    expect(tags[1][2]).toBe('illegal')
  })
})

// buildReportTags — all seven report types

describe('buildReportTags — all NIP-56 report types', () => {
  it.each(REPORT_TYPES)('correctly uses report type "%s"', (reportType: ReportType) => {
    const tags = buildReportTags(profileTarget, reportType)
    expect(tags[0][2]).toBe(reportType)
  })
})

// buildReportTags — error cases

describe('buildReportTags — error cases', () => {
  it('throws InvalidReportTargetError when listing report is missing eventId', () => {
    expect(() =>
      buildReportTags({ type: 'listing', pubkey: SELLER_PUBKEY }, 'spam'),
    ).toThrow(InvalidReportTargetError)
  })

  it('error message mentions eventId', () => {
    expect(() =>
      buildReportTags({ type: 'listing', pubkey: SELLER_PUBKEY }, 'spam'),
    ).toThrow(/eventId/)
  })

  it('does not throw when profile report has no eventId', () => {
    expect(() =>
      buildReportTags({ type: 'profile', pubkey: SELLER_PUBKEY }, 'impersonation'),
    ).not.toThrow()
  })
})

// buildReportEvent

describe('buildReportEvent', () => {
  it('returns kind 1984', () => {
    const event = buildReportEvent(profileTarget, 'spam')
    expect(event.kind).toBe(1984)
  })

  it('includes the comment as content', () => {
    const event = buildReportEvent(profileTarget, 'spam', 'This account is a bot')
    expect(event.content).toBe('This account is a bot')
  })

  it('defaults content to empty string when no comment provided', () => {
    const event = buildReportEvent(profileTarget, 'spam')
    expect(event.content).toBe('')
  })

  it('created_at is a unix timestamp close to now', () => {
    const before = Math.floor(Date.now() / 1000)
    const event = buildReportEvent(profileTarget, 'spam')
    const after = Math.floor(Date.now() / 1000)
    expect(event.created_at).toBeGreaterThanOrEqual(before)
    expect(event.created_at).toBeLessThanOrEqual(after)
  })

  it('includes correct tags', () => {
    const event = buildReportEvent(profileTarget, 'malware')
    expect(event.tags[0][0]).toBe('p')
    expect(event.tags[0][2]).toBe('malware')
  })
})
