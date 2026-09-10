import { describe, expect, it } from 'vitest'
import { fitWithin } from './imageCompress'

describe('photo compression sizing', () => {
  it('scales landscape photos down to the long-edge cap', () => {
    expect(fitWithin(4000, 3000, 2048)).toEqual({ width: 2048, height: 1536, scale: 0.512 })
  })

  it('scales portrait photos down to the long-edge cap', () => {
    expect(fitWithin(3000, 4000, 2048)).toEqual({ width: 1536, height: 2048, scale: 0.512 })
  })

  it('never upscales images already within the cap', () => {
    expect(fitWithin(1024, 768, 2048)).toEqual({ width: 1024, height: 768, scale: 1 })
  })

  it('ignores invalid dimensions or a non-positive cap', () => {
    expect(fitWithin(0, 0, 2048)).toEqual({ width: 0, height: 0, scale: 1 })
    expect(fitWithin(2000, 1000, 0)).toEqual({ width: 2000, height: 1000, scale: 1 })
  })
})
