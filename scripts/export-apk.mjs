import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";

const root = process.cwd();
const apkSrc = resolve(root, "android/app/build/outputs/apk/debug/app-debug.apk");

if (!existsSync(apkSrc)) {
  console.error("❌ APK 文件未找到，请先构建: " + apkSrc);
  process.exit(1);
}

// 目标 1: 项目根目录 dist-apk/BIBU.apk
const projectOutDir = resolve(root, "dist-apk");
mkdirSync(projectOutDir, { recursive: true });
const projectApk = resolve(projectOutDir, "BIBU.apk");
copyFileSync(apkSrc, projectApk);

// 目标 2: 用户桌面 ~/Desktop/BIBU.apk
const desktopApk = resolve(homedir(), "Desktop/BIBU.apk");
try {
  copyFileSync(apkSrc, desktopApk);
  console.log(`\n🎉 打包完成！APK 已自动复制到桌面:`);
  console.log(`👉 ${desktopApk}`);
} catch (e) {
  console.log(`\n🎉 打包完成！APK 位于: ${projectApk}`);
}

// 自动在访达中高亮选中 APK 文件，方便直接拖进微信
try {
  if (process.platform === "darwin") {
    execSync(`open -R "${desktopApk}" 2>/dev/null || open -R "${projectApk}"`);
    console.log(`📁 访达窗口已自动弹出并高亮选中 APK，可直接拖入微信发送！\n`);
  }
} catch {
  // 静默失败
}
