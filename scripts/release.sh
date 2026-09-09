#!/usr/bin/env bash
# 构建正式签名 release APK。
# 签名凭据从 .env.release（gitignored）读取，也可直接已 export 到环境中。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.release ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.release
  set +a
fi

missing=()
for var in BIBO_RELEASE_KEYSTORE BIBO_RELEASE_STORE_PASSWORD BIBO_RELEASE_KEY_ALIAS BIBO_RELEASE_KEY_PASSWORD; do
  if [[ -z "${!var:-}" ]]; then missing+=("$var"); fi
done
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "缺少签名环境变量: ${missing[*]}"
  echo "请先创建 .env.release（参考项目说明），并确认 keystore 存在"
  exit 1
fi
if [[ ! -f "${BIBO_RELEASE_KEYSTORE}" ]]; then
  echo "BIBO_RELEASE_KEYSTORE 指向的文件不存在: ${BIBO_RELEASE_KEYSTORE}"
  exit 1
fi

echo "== release 预检 =="
node scripts/check-android-release.mjs

echo "== 构建 =="
npm run build
npx cap sync android
(cd android && ./gradlew assembleRelease)

APK="android/app/build/outputs/apk/release/app-release.apk"
if [[ ! -f "$APK" ]]; then
  echo "未找到产物: $APK"
  exit 1
fi

VERSION_NAME="${BIBO_VERSION_NAME:-0.1.0}"
VERSION_CODE="${BIBO_VERSION_CODE:-1}"
mkdir -p output
OUT="output/bibo-release-${VERSION_NAME}-v${VERSION_CODE}.apk"
cp "$APK" "$OUT"

echo "== 签名校验 =="
APKSIGNER="$(find "$HOME/Library/Android/sdk/build-tools" -name apksigner -type f 2>/dev/null | sort -V | tail -1 || true)"
if [[ -n "$APKSIGNER" ]]; then
  "$APKSIGNER" verify --print-certs "$OUT"
else
  echo "未找到 apksigner，可手动校验: "
  echo "  keytool -printcert -jarfile $OUT"
fi

echo
echo "✅ release APK: $OUT"
echo "   版本: $VERSION_NAME (code $VERSION_CODE)"
echo "   安装: adb install -r $OUT"