/**
 * 从照片文件里识别拍摄日期，用于上传照片时自动填入「回忆发生日期」。
 *
 * JPEG 优先读取 EXIF 的拍摄时间（DateTimeOriginal → DateTimeDigitized → DateTime），
 * 其他格式或读取失败时退回文件系统时间（File.lastModified，属于猜测）。
 * 日期限定在 1980-01-01 到本地明天之间：更早或明显更远的未来多半是
 * 相机时钟错误 / 伪造元数据，直接放弃并让用户手动填写。
 */

export type PhotoDateSource = 'exif' | 'file'

export type PhotoDateResult = {
  /** 形如 YYYY-MM-DD 的拍摄日期；未识别到可信日期时为空 */
  date: string | null
  /** 日期来源：exif=照片内嵌拍摄时间；file=按文件修改时间猜测 */
  source: PhotoDateSource
}

export const PHOTO_DATE_MIN = '1980-01-01'

const EXIF_DATE_TAGS = [0x9003, 0x9004, 0x0132] as const // DateTimeOriginal / DateTimeDigitized / DateTime

function localDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** 仅接受看起来合理的日期：格式正确、真实存在、1980 年后且不超过明天（容忍跨时区）。 */
function dateInRange(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  if (date < PHOTO_DATE_MIN) return false
  const now = new Date()
  const latest = localDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))
  if (date > latest) return false
  const parsed = new Date(`${date}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}

function dateFromMs(ms: number): string | null {
  if (!Number.isFinite(ms) || ms <= 0) return null
  return localDateString(new Date(ms))
}

function asciiAt(view: DataView, offset: number, length: number): string | null {
  if (offset < 0 || offset + length > view.byteLength) return null
  let out = ''
  for (let i = 0; i < length; i++) out += String.fromCharCode(view.getUint8(offset + i))
  return out
}

/** 解析 Exif 子 IFD 里的 ASCII 日期标签，返回 9003/9004/0132 中按优先级最早的一个。 */
function exifDateTime(
  view: DataView,
  ifdStart: number,
  end: number,
  littleEndian: boolean,
  tiffStart: number,
) {
  if (ifdStart + 2 > end) return null
  const count = view.getUint16(ifdStart, littleEndian)
  let p = ifdStart + 2
  const found = new Map<number, string | null>()
  for (let i = 0; i < count; i++) {
    if (p + 12 > end) return null
    const tag = view.getUint16(p, littleEndian)
    const type = view.getUint16(p + 2, littleEndian)
    const length = view.getUint32(p + 4, littleEndian)
    const valueField = p + 8
    if (EXIF_DATE_TAGS.includes(tag as (typeof EXIF_DATE_TAGS)[number]) && type === 2) {
      // TIFF 里的偏移相对 TIFF 头，需加上 tiffStart 才是缓冲区里的绝对位置
      const stringAt =
        length <= 4 ? valueField : tiffStart + view.getUint32(valueField, littleEndian)
      const text = asciiAt(view, stringAt, Math.min(length, 32))
      const match = text ? /^(\d{4}):(\d{2}):(\d{2})/.exec(text.trim()) : null
      found.set(tag, match ? `${match[1]}-${match[2]}-${match[3]}` : null)
    }
    p += 12
  }
  for (const tag of EXIF_DATE_TAGS) {
    const date = found.get(tag)
    if (date) return date
  }
  return null
}

/** 从 TIFF 头开始解析；返回形如 YYYY-MM-DD 的拍摄日期或 null。 */
function parseExif(view: DataView, tiffStart: number, end: number): string | null {
  if (tiffStart + 8 > end) return null
  const order = view.getUint16(tiffStart)
  if (order !== 0x4949 && order !== 0x4d4d) return null
  const littleEndian = order === 0x4949
  if (view.getUint16(tiffStart + 2, littleEndian) !== 0x2a) return null
  const ifd0 = tiffStart + view.getUint32(tiffStart + 4, littleEndian)
  if (ifd0 + 2 > end) return null
  const count = view.getUint16(ifd0, littleEndian)
  let p = ifd0 + 2
  let exifIfd: number | null = null
  for (let i = 0; i < count; i++) {
    if (p + 12 > end) return null
    if (view.getUint16(p, littleEndian) === 0x8769) {
      exifIfd = tiffStart + view.getUint32(p + 8, littleEndian)
      break
    }
    p += 12
  }
  if (exifIfd === null) return null
  return exifDateTime(view, exifIfd, end, littleEndian, tiffStart)
}

/** 扫描 JPEG 段，找到带 "Exif\0\0" 的 APP1 段并解析。 */
function readJpegExifDate(file: File): Promise<string | null> {
  return file
    .arrayBuffer()
    .then((buffer) => {
      const view = new DataView(buffer)
      if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null
      let i = 2
      while (i + 4 <= view.byteLength) {
        if (view.getUint8(i) !== 0xff) {
          i += 1
          continue
        }
        const marker = view.getUint8(i + 1)
        // 无长度字段的独立标记
        if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0xd8 || marker === 0x01) {
          i += 2
          continue
        }
        const length = view.getUint16(i + 2)
        if (length < 2) return null
        if (marker === 0xe1) {
          const payloadStart = i + 4
          return payloadStart + 6 <= view.byteLength &&
            asciiAt(view, payloadStart, 6) === 'Exif\u0000\u0000'
            ? parseExif(view, payloadStart + 6, i + 2 + length)
            : null
        }
        i += 2 + length
      }
      return null
    })
    .catch(() => null)
}

/**
 * 读取照片的拍摄日期。EXIF 优先；没有可信 EXIF 时按文件修改时间猜测；
 * 两者都不合理时返回空日期（同时保留来源，方便界面提示）。
 */
export async function readPhotoDate(file: File): Promise<PhotoDateResult> {
  const exifDate = file.type === 'image/jpeg' ? await readJpegExifDate(file) : null
  if (exifDate && dateInRange(exifDate)) return { date: exifDate, source: 'exif' }
  const fileDate = dateFromMs(file.lastModified)
  if (fileDate && dateInRange(fileDate)) return { date: fileDate, source: 'file' }
  return { date: null, source: exifDate ? 'exif' : 'file' }
}
