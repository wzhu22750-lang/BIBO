import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const failures = []
const warnings = []

function text(path) {
  return readFileSync(resolve(root, path), 'utf8')
}

const capacitor = JSON.parse(text('capacitor.config.json'))
if (capacitor.server)
  failures.push('capacitor.config.json 仍包含 server；生产 APK 必须使用本地 dist')
if (capacitor.appId !== 'love.bibu.space') failures.push(`appId 异常：${capacitor.appId}`)

const manifest = text('android/app/src/main/AndroidManifest.xml')
if (!manifest.includes('android:resource="@drawable/ic_stat_bibo"'))
  failures.push('AndroidManifest 默认通知小图标不是 @drawable/ic_stat_bibo')
if (!existsSync(resolve(root, 'android/app/src/main/res/drawable-mdpi/ic_stat_bibo.png')))
  failures.push('缺少 Android 通知状态栏图标资源')

const gradle = text('android/app/build.gradle')
const versionCode =
  process.env.BIBU_VERSION_CODE ||
  process.env.BIBO_VERSION_CODE ||
  /versionCode\s+(\d+)/.exec(gradle)?.[1] ||
  '1'
const versionName =
  process.env.BIBU_VERSION_NAME?.trim() ||
  process.env.BIBO_VERSION_NAME?.trim() ||
  /versionName\s+["']([^"']+)["']/.exec(gradle)?.[1] ||
  '0.1.0'
if (!/^\d+$/.test(versionCode) || Number(versionCode) < 1) failures.push('versionCode 缺失或无效')
if (versionName === '1.0')
  warnings.push(`versionName 当前为 ${versionName}；发布前应按版本策略更新`)

const keystorePath = process.env.BIBU_RELEASE_KEYSTORE || process.env.BIBO_RELEASE_KEYSTORE
const signingValues = [
  keystorePath,
  process.env.BIBU_RELEASE_STORE_PASSWORD || process.env.BIBO_RELEASE_STORE_PASSWORD,
  process.env.BIBU_RELEASE_KEY_ALIAS || process.env.BIBO_RELEASE_KEY_ALIAS,
  process.env.BIBU_RELEASE_KEY_PASSWORD || process.env.BIBO_RELEASE_KEY_PASSWORD,
]
if (!signingValues.every((value) => value && value.trim())) {
  failures.push('缺少正式 release signing 环境变量；不会把 unsigned APK 当作可发布包')
} else if (!existsSync(resolve(keystorePath))) {
  failures.push('BIBU_RELEASE_KEYSTORE 指向的签名文件不存在')
}

const getuiAppId = process.env.GETUI_APP_ID?.trim()
if (!getuiAppId) {
  failures.push('缺少 GETUI_APP_ID 环境变量（个推客户端 App Id，APK 构建必填）')
}

for (const warning of warnings) console.warn(`WARN: ${warning}`)
if (failures.length) {
  console.error('Android release gate: NOT READY')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Android release gate: READY')
