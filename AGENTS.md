# BIBU！工作区规则

## 1. 图标一律用矢量 SVG

所有图标与装饰走项目内的 SVG 方案，界面里出现的是矢量图形：

- 优先复用现成组件：`src/components/PixelArt.tsx` 的 `Icon`、`src/components/EventArt.tsx`、`src/lib/pet/wardrobeAssets.tsx`、`pixelarticons`
- 缺图标就手写 SVG，沿用像素风：`viewBox` + `shapeRendering="crispEdges"` + 硬边缘色块
- 文案里需要符号时用 SVG 或纯文本（例如 `♥`、`→`、`×`），不要用 emoji 字符

**完成标准**：本次改动涉及的所有图标都能在 DOM 里找到对应的 `<svg>` 或已有图标组件。

## 2. APK 走热更新

`capacitor.config.json` 的 `server.url` 指向生产站点 `https://www.515171.xyz`，APK 启动即加载线上最新前端。

- 改网页 → 推送 `main` → Vercel 部署 → APK 打开就是新版，不重新打包
- 修改 `capacitor.config.json` 后，确认 `server` 段仍在且 `server.url` 未变
- 只有原生层（Kotlin 插件、权限、图标）改动才需要重新打包 APK

**完成标准**：`capacitor.config.json` 中 `server.url === "https://www.515171.xyz"`。
