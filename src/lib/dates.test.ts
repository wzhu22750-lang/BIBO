import { describe, expect, it } from 'vitest'
import { daysUntil, nextOccurrence, sortedEvents, togetherDays } from './dates'
import { validatePhoto } from './api'
describe('calendar arithmetic', () => {
  it('counts completed local calendar days, starting at zero', () => {
    expect(togetherDays('2026-09-07', new Date('2026-09-07T23:59:00'))).toBe(0)
    expect(togetherDays('2026-09-06', new Date('2026-09-07T00:01:00'))).toBe(1)
    expect(togetherDays('2026-09-08', new Date('2026-09-07T12:00:00'))).toBe(0)
  })
  it('shows today rather than rounding hours into tomorrow', () => {
    expect(daysUntil('2026-09-07T23:00:00', false, new Date('2026-09-07T01:00:00'))).toBe(0)
    expect(daysUntil('2026-09-08T01:00:00', false, new Date('2026-09-07T23:00:00'))).toBe(1)
  })
  it('rolls annual anniversaries forward but keeps today', () => {
    expect(nextOccurrence('2020-09-06T12:00:00', true, new Date('2026-09-07')).getFullYear()).toBe(
      2027,
    )
    expect(daysUntil('2020-09-07T12:00:00', true, new Date('2026-09-07T23:00:00'))).toBe(0)
  })
  it('observes leap-day anniversaries on Feb 28 in non-leap years', () => {
    const next = nextOccurrence('2024-02-29T12:00:00', true, new Date('2027-01-01T12:00:00'))
    expect(next.getMonth()).toBe(1)
    expect(next.getDate()).toBe(28)
  })
  it('orders upcoming dates nearest-first, then past dates newest-first', () => {
    const values = [12, 3, 9, 1].map((n) => ({
      target_at: `2026-09-${String(n).padStart(2, '0')}T12:00:00`,
      yearly: false,
    }))
    expect(
      sortedEvents(values, new Date('2026-09-07T12:00:00')).map((e) =>
        new Date(e.target_at).getDate(),
      ),
    ).toEqual([9, 12, 3, 1])
  })
})
describe('photo input boundary', () => {
  it('accepts supported photos', () =>
    expect(() => validatePhoto({ type: 'image/jpeg', size: 1024 })).not.toThrow())
  it('rejects SVG and files over 5 MB', () => {
    expect(() => validatePhoto({ type: 'image/svg+xml', size: 100 })).toThrow('请选择')
    expect(() => validatePhoto({ type: 'image/png', size: 5242881 })).toThrow('5 MB')
  })
})
