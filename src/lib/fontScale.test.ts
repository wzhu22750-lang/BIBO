import { describe, expect, it } from 'vitest'
import { clampScale, fontScaleTiers } from './fontScale'

describe('fontScale helpers', () => {
  it('clamps out-of-range or NaN scales', () => {
    expect(clampScale(1)).toBe(1)
    expect(clampScale(1.3)).toBe(1.3)
    expect(clampScale(0.5)).toBe(0.85)
    expect(clampScale(5)).toBe(3)
    expect(clampScale(Number.NaN)).toBe(1)
    expect(clampScale(Infinity)).toBe(1)
  })

  it('returns correct tier flags for growing scales', () => {
    expect(fontScaleTiers(1)).toEqual({ grow: false, big: false, xl: false, xxl: false })
    expect(fontScaleTiers(1.1)).toEqual({ grow: false, big: false, xl: false, xxl: false })
    expect(fontScaleTiers(1.15)).toEqual({ grow: true, big: false, xl: false, xxl: false })
    expect(fontScaleTiers(1.3)).toEqual({ grow: true, big: true, xl: false, xxl: false })
    expect(fontScaleTiers(1.5)).toEqual({ grow: true, big: true, xl: true, xxl: false })
    expect(fontScaleTiers(2)).toEqual({ grow: true, big: true, xl: true, xxl: true })
  })
})
