import { describe, expect, it } from 'vitest'
import { isOutfitEmpty, normalizeOutfit, normalizeOutfits } from './normalize'

describe('normalizeOutfit', () => {
  it('handles empty or non-object inputs safely', () => {
    expect(normalizeOutfit(null)).toEqual({})
    expect(normalizeOutfit(undefined)).toEqual({})
    expect(normalizeOutfit('string')).toEqual({})
    expect(normalizeOutfit(123)).toEqual({})
    expect(normalizeOutfit([])).toEqual({})
    expect(normalizeOutfit({})).toEqual({})
  })

  it('preserves valid wardrobe item IDs in their respective layers', () => {
    const valid = {
      clothesId: 'c_blue_hoodie',
      hatId: 'h_red_beret',
      accessoryId: 'a_heart_balloon',
      specialId: 'a_sparkle_aura',
    }
    expect(normalizeOutfit(valid)).toEqual(valid)
  })

  it('removes non-existent or unknown wardrobe IDs', () => {
    const input = {
      clothesId: 'c_non_existent_sweater',
      hatId: 'h_red_beret',
      accessoryId: 'a_fake_bag',
    }
    expect(normalizeOutfit(input)).toEqual({
      hatId: 'h_red_beret',
    })
  })

  it('rejects layer mismatch (e.g. hat assigned to clothesId)', () => {
    const mismatch = {
      clothesId: 'h_red_beret', // This is a hat, not clothes
      hatId: 'c_blue_hoodie', // This is clothes, not a hat
    }
    expect(normalizeOutfit(mismatch)).toEqual({})
  })

  it('identifies empty outfits correctly', () => {
    expect(isOutfitEmpty({})).toBe(true)
    expect(isOutfitEmpty({ clothesId: undefined })).toBe(true)
    expect(isOutfitEmpty({ clothesId: 'c_blue_hoodie' })).toBe(false)
  })
})

describe('normalizeOutfits', () => {
  it('handles non-object root inputs gracefully', () => {
    expect(normalizeOutfits(null)).toEqual({})
    expect(normalizeOutfits(undefined)).toEqual({})
    expect(normalizeOutfits('invalid')).toEqual({})
    expect(normalizeOutfits([1, 2, 3])).toEqual({})
  })

  it('removes unknown character keys while keeping valid ones', () => {
    const input = {
      cat: { clothesId: 'c_blue_hoodie' },
      dinosaur: { clothesId: 'c_blue_hoodie' }, // Unknown character
      alien: { hatId: 'h_red_beret' }, // Unknown character
      duck: { hatId: 'h_duck_beanie' },
    }
    const result = normalizeOutfits(input)
    expect(result).toEqual({
      cat: { clothesId: 'c_blue_hoodie' },
      duck: { hatId: 'h_duck_beanie' },
    })
    expect('dinosaur' in result).toBe(false)
    expect('alien' in result).toBe(false)
  })

  it('omits characters that have empty outfits to maintain compact JSON', () => {
    const input = {
      cat: { clothesId: 'c_blue_hoodie' },
      duck: {}, // empty
      bunny: { clothesId: 'c_non_existent' }, // all invalid items -> becomes empty
    }
    const result = normalizeOutfits(input)
    expect(result).toEqual({
      cat: { clothesId: 'c_blue_hoodie' },
    })
    expect('duck' in result).toBe(false)
    expect('bunny' in result).toBe(false)
  })
})
