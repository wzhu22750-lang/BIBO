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

## 3. Supabase 改动直连线上库自己改

线上项目 ref `zqwzdoejxsfscisudacu`，`supabase/.temp/access-token` 里的 `sbp_` token 能直接执行 SQL。要加迁移、改函数、修数据就自己接上去做完，不停在「请你去 Dashboard 执行」。

```bash
TOKEN=$(tr -d '\n' < supabase/.temp/access-token)
node -e 'const fs=require("fs");fs.writeFileSync("/tmp/q.json",JSON.stringify({query:fs.readFileSync(process.argv[1],"utf8")}))' supabase/migrations/<file>.sql
curl -s -w '\nhttp=%{http_code}\n' -X POST \
  "https://api.supabase.com/v1/projects/zqwzdoejxsfscisudacu/database/query" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data-binary @/tmp/q.json
```

- 迁移先落盘到 `supabase/migrations/`，再把同一份 SQL 整份执行到线上，两边始终同一份内容
- `supabase db push` / `migration list` 走直连 PG 会报 `LegacyDbConnectError`（没有 DB 密码），一律用上面的 Management API
- DDL 之后补 `notify pgrst, 'reload schema'`，让 PostgREST 立刻认出新签名
- 校验新签名：拿 `src/lib/supabase.ts` 里的 `DEFAULT_KEY`（anon key）调一次该 RPC，返回 `42501 permission denied` 即已生效；返回 `PGRST202` 说明 schema cache 还没刷新
- 删表、删数据这类不可逆操作先讲清影响再动手

**完成标准**：本次涉及的新迁移已在线上执行，且线上库函数签名/表结构与 `supabase/migrations/` 一致（核验 `pg_proc` 与授权，而不是只看 HTTP 201）。
