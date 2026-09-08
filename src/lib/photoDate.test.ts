import { describe, expect, it } from 'vitest'
import { PHOTO_DATE_MIN, readPhotoDate } from './photoDate'

/** 构造一个最小的 JPEG 文件：SOI + APP1("Exif\0\0" + TIFF/IFD) + EOI。 */
function buildJpeg(exifDate: string | null, lastModified: number, type = 'image/jpeg'): File {
  const bytes: number[] = [0xff, 0xd8] // SOI

  if (exifDate) {
    // TIFF little-endian
    const tiff: number[] = [0x49, 0x49, 0x2a, 0x00]
    const ifd0Offset = 8
    const exifIfdOffset = ifd0Offset + 2 + 12
    const stringOffset = exifIfdOffset + 2 + 12
    tiff.push(...u32(ifd0Offset))
    tiff.push(...u16(1)) // IFD0 条目数
    // ExifIFDPointer (0x8769), LONG, 值=exifIfdOffset
    tiff.push(...u16(0x8769), ...u16(4), ...u32(1), ...u32(exifIfdOffset))
    tiff.push(...u16(1)) // Exif IFD 条目数
    // DateTimeOriginal (0x9003), ASCII, 值=字符串偏移
    const text = `${exifDate} 13:20:00\u0000`
    tiff.push(...u16(0x9003), ...u16(2), ...u32(text.length), ...u32(stringOffset))
    tiff.push(...[...text].map((c) => c.charCodeAt(0)))

    const payload = [...'Exif\u0000\u0000'].map((c: string) => c.charCodeAt(0)).concat(tiff)
    // JPEG 段长度字段为大端序（与 TIFF 内部的小端字段无关）
    const segmentLength = payload.length + 2
    bytes.push(0xff, 0xe1, (segmentLength >> 8) & 0xff, segmentLength & 0xff, ...payload)
  }

  bytes.push(0xff, 0xd9) // EOI
  return new File([new Uint8Array(bytes)], 'photo.jpg', { type, lastModified })
}

function u16(value: number): number[] {
  // TIFF little-endian 两字节
  return [value & 0xff, (value >> 8) & 0xff]
}
function u32(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >>> 24) & 0xff]
}

describe('readPhotoDate', () => {
  it('prefers EXIF DateTimeOriginal over file modification time', async () => {
    const file = buildJpeg('2024:05:01', new Date(2020, 0, 2).getTime())
    await expect(readPhotoDate(file)).resolves.toEqual({ date: '2024-05-01', source: 'exif' })
  })

  it('falls back to file modification time when JPEG has no EXIF', async () => {
    const file = buildJpeg(null, new Date(2025, 6, 8).getTime())
    await expect(readPhotoDate(file)).resolves.toEqual({ date: '2025-07-08', source: 'file' })
  })

  it('falls back for non-JPEG formats', async () => {
    const file = buildJpeg(null, new Date(2023, 2, 3).getTime(), 'image/png')
    await expect(readPhotoDate(file)).resolves.toEqual({ date: '2023-03-03', source: 'file' })
  })

  it('ignores implausible EXIF dates and still trusts a sane file time', async () => {
    const future = buildJpeg('2099:01:01', new Date(2023, 0, 1).getTime())
    await expect(readPhotoDate(future)).resolves.toEqual({ date: '2023-01-01', source: 'file' })
    const ancient = buildJpeg('1901:01:01', new Date(2023, 0, 1).getTime())
    await expect(readPhotoDate(ancient)).resolves.toEqual({ date: '2023-01-01', source: 'file' })
  })

  it('rejects made-up dates like February 30th', async () => {
    const file = buildJpeg('2024:02:30', new Date(2023, 0, 1).getTime())
    await expect(readPhotoDate(file)).resolves.toEqual({ date: '2023-01-01', source: 'file' })
  })

  it('returns an empty date when neither EXIF nor file time is usable', async () => {
    const stale = buildJpeg(null, 0)
    expect((await readPhotoDate(stale)).date).toBeNull()
    const futureFile = buildJpeg(null, new Date(2100, 0, 1).getTime())
    expect((await readPhotoDate(futureFile)).date).toBeNull()
  })

  it('exposes the lowest plausible bound', () => {
    expect(PHOTO_DATE_MIN).toBe('1980-01-01')
  })
})
