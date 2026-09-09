/**
 * Visual QA contact-sheet generator (dev-only).
 *
 * Run with:  QA_SHEETS=1 npx vitest run scripts/qa/sheets.test.tsx
 *
 * Emits SVG contact sheets (every character × every item) into scripts/qa/out/
 * so they can be rasterized (rsvg-convert) and visually inspected.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { writeFileSync, mkdirSync } from 'node:fs'
import { PixelCharacter } from '../../src/components/pet/PixelCharacter'
import {
  ACCESSORIES_LIST,
  CLOTHES_LIST,
  HATS_LIST,
  WARDROBE_SETS,
  CHARACTER_LIST,
  type CharacterId,
  type Outfit,
} from '../../src/lib/pet'

const OUT = 'scripts/qa/out'
const CELL_W = 84
const CELL_H = 88
const LABEL_H = 16
const SIDE_LABEL_W = 92

function cell(
  charId: CharacterId,
  outfit: Outfit | null,
  col: number,
  row: number,
  size = 80,
): string {
  const x = SIDE_LABEL_W + col * CELL_W
  const y = LABEL_H + row * (CELL_H + 6)
  const inner = renderToStaticMarkup(
    <PixelCharacter character={charId} outfit={outfit} size={size} />,
  )
  // reposition nested svg
  const placed = inner.replace('<svg ', `<svg x="${x}" y="${y}" `)
  const label = `${charId}`
  return `${placed}<text x="${x}" y="${y + CELL_H + 5}" font-size="6" fill="#94a3b8" font-family="monospace">${label}</text>`
}

function sheet(
  name: string,
  cols: Array<{ label: string; outfit: Outfit | null }>,
  chars: CharacterId[] = CHARACTER_LIST.map((c) => c.id),
): void {
  const w = SIDE_LABEL_W + cols.length * CELL_W
  const h = LABEL_H + chars.length * (CELL_H + 6) + 10
  let body = ''
  cols.forEach((c, i) => {
    body += `<text x="${SIDE_LABEL_W + i * CELL_W + 4}" y="11" font-size="7" fill="#e2e8f0" font-family="monospace">${c.label}</text>`
  })
  chars.forEach((charId, r) => {
    body += `<text x="4" y="${LABEL_H + r * (CELL_H + 6) + 40}" font-size="8" fill="#facc15" font-family="monospace">${charId}</text>`
    cols.forEach((c, i) => {
      body += cell(charId, c.outfit, i, r)
    })
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#111318"/>${body}</svg>`
  writeFileSync(`${OUT}/${name}.svg`, svg)
}

describe.skipIf(!process.env.QA_SHEETS)('visual QA sheets', () => {
  it('generates contact sheets for every category', () => {
    mkdirSync(OUT, { recursive: true })

    sheet('hats', [
      { label: 'BASE', outfit: null },
      ...HATS_LIST.map((h) => ({ label: h.id, outfit: { hatId: h.id } as Outfit })),
    ])
    sheet('clothes', [
      { label: 'BASE', outfit: null },
      ...CLOTHES_LIST.map((c) => ({ label: c.id, outfit: { clothesId: c.id } as Outfit })),
    ])
    sheet('accessories', [
      { label: 'BASE', outfit: null },
      ...ACCESSORIES_LIST.map((a) => ({ label: a.id, outfit: { accessoryId: a.id } as Outfit })),
    ])
    sheet(
      'sets',
      WARDROBE_SETS.map((s) => ({ label: s.id, outfit: s.preset })),
    )
    expect(true).toBe(true)
  })
})
