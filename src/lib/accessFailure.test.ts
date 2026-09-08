import { describe, expect, it } from 'vitest'
import { accessFailure } from './accessFailure'
describe('explicit access revocation', () => {
  it('recognizes HTTP and database authorization failures', () => {
    for (const error of [
      { status: 401 },
      { status: 403 },
      { code: '42501' },
      { code: 'PGRST301' },
      { code: 'PGRST302' },
      { code: 'PGRST303' },
    ])
      expect(accessFailure(error)).toBe(true)
  })
  it('does not confuse transport, schema and validation failures with revoked access', () => {
    for (const error of [
      null,
      'offline',
      new TypeError('Failed to fetch'),
      { code: '23514' },
      { code: '42P01' },
      { status: 500 },
      { message: 'permission denied' },
    ])
      expect(accessFailure(error)).toBe(false)
  })
})
