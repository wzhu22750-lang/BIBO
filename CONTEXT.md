# BIBU！项目上下文（CONTEXT）

> ⚠️ 临时文档：用于 AI 模型切换时的上下文交接，交接完成后需删除，勿长期保留。
>
> 为 AI 助手快速建立完整认识而维护。权威细节看 DEVELOPMENT.md / DATABASE.md / DESIGN_SYSTEM.md / CURRENT_STATUS.md，本文件只讲“全貌 + 关键不变式”。

## 0. 一句话

BIBU！（哔卟哔卟）是情侣二人专属的像素游戏小窝：悄悄话、恋爱里程碑倒计时、私密照片墙、专注陪伴、萌宠衣橱，加上 6 种情绪化的双向「哔卟」通知。

## 1. 技术栈与铁律

- **前端**：React 19 + TypeScript + Vite 8（Vitest + PGlite 测试）。移动容器为 Capacitor 8 / Android（Kotlin 原生插件）。
- **后端**：Supabase（PostgreSQL + RLS + Storage + Realtime + 3 个 Edge Functions）。生产线 `www.515171.xyz`（Vercel）。
- **AGENTS.md 铁律 1**：界面图标一律矢量 SVG（`viewBox` + `shapeRendering="crispEdges"`），复用 `Icon` / `EventArt` / `PixelPal` / `pixelarticons`，文案不用 emoji 字符。
- **AGENTS.md 铁律 2**：APK 走热更新——`capacitor.config.json` 的 `server.url` 固定为 `https://www.515171.xyz`；只改网页 → 推 `main` → Vercel 部署 → APK 打开即新版，不重新打包。改 `capacitor.config.json` 后必须确认 `server.url` 未变。

## 2. 领域模型（核心概念）

- **Space（小宇宙）**：`Space = { me, partner, couple, messages, events, photos, pings, focus }`（`src/lib/types.ts`）。前端一切状态围绕它。
- **双人绑定**：一个账号最多属于一个空间（`couple_members.user_id` 主键）；`slot` 只能是 1/2；邀请码 24h 有效、库中只存 SHA-256 摘要、一次性；创建/加入/刷新/撤销全部走 RPC（`create_space` / `join_space` / `refresh_invite` / `revoke_invitation`）。
- **照片图标**：照片可带像素图标 `photos.emoji`（形如 `icon:cat`），默认 `DEFAULT_PHOTO_ART = 'icon:heart'`。**凡是展示照片图标的地方都必须用 `photo.emoji || DEFAULT_PHOTO_ART`，且与 `Photos.tsx` 保持同步**（曾因时间线硬编码 `"heart"` 而不一致，已修复）。
- **事件（期待）**：`events` 分 `anniversary` / `countdown`，支持 `yearly`（每年纪念，2/29 按 2/28 处理）。
- **哔卟 Ping**：6 种情绪（哔卟哔卟/想你/抱一下/快来/晚安/我回来啦）+ 专注期 3 种提醒（去学习/去工作/休息一下）。服务端 3 秒行锁冷却，专注授权拦截。
- **每日任务**：`daily_tasks` 一天一条（`(couple_id, task_date)` 唯一），双人各自独立完成（`daily_task_completions`）。

## 3. 架构与数据流

```
Auth(PKCE 邮箱) → useSpace 加载 loadSpace() 快照 → Realtime 订阅 9 张表 + pings INSERT
写路径：全部「意图先落盘」：
  ├─ 在线：fixed-ID 幂等 RPC（*_once：send_message_once / create_event_once / uploadPhotoOnce / create_photo_once）
  ├─ 离线/在线均可：IndexedDB outbox（消息 / 事件 / 照片三套）→ 联网后 flush → 服务端回执精确比对 → 才删队列行
  └─ 演示模式：localStorage 快照 readDemo/saveDemo，`local()` 直接改空间
```

- **`useSpace`（src/hooks/useSpace.ts，713 行）**是唯一核心 controller：持有 `space` 状态 + `stateRef`/`version.current` 防过期写入；`mutate(remote, update)` 在线先远程再 reload，演示直接本地；所有动作（消息/事件/照片/专注/ping/档案/注销/解绑）都挂在它上面。
- **离线快照**：`localStorage 'bibo-space-cache-v1:'`，TTL 24h、≤2MB、严格 `validSpace` 校验白名单字段；`networkFailure()` 才允许读缓存恢复；**鉴权/权限错误必须清缓存、绝不展示旧数据**。
- **照片链路**：私有 bucket `couple-photos`，路径 `{couple_id}/{user_id}/{uuid}.{ext}`（jpg/png/webp）；上传前本地静默压缩（长边 1280px、WebP q0.72，压缩失败/变大保留原文件）；读取用 1h 签名 URL + IndexedDB LRU 64MB 图片缓存（`imageCache.ts`，entry ≤5MB，24h 重验证）；删除走 `photo_deletion_target` RPC 前置校验（防越权删文件）后删 Storage 再删行。
- **Realtime**：`useSpaceRealtime` 订阅 messages/events/photos/focus_sessions/couple_members/couples/profiles/daily_tasks/daily_task_completions 全事件 + pings 按 couple_id 过滤 INSERT；统一节流调度（`reloadScheduler`），联网/前台/每 60s 刷新。

## 4. 模块地图

| 目录 | 内容 |
|---|---|
| `src/pages/` | Home（小窝）、Chat（悄悄话）、Events（值得期待）、Photos（照片墙）、Focus（专注）、Wardrobe（衣橱）、Settings（设置）、Auth（登录/引导） |
| `src/components/` | 白盒组件；关键：`EventArt.tsx`（64 款图标渲染中枢）、`PixelArt.tsx`（Icon/PixelPal/PixelFlower）、`ui.tsx`（Button/Panel/Modal/Empty/PageHeading/PixelSelect/useToast/useTask）、`PixelPickers.tsx`（像素日历/时间选择器）、`RelationshipTimeline.tsx`、`LoveMilestones.tsx`、`EventArtPicker.tsx`、outbox 面板们、`pet/`（衣橱渲染） |
| `src/hooks/` | `useSpace`（核心 controller）、`useBibu`（哔卟发射+冷却）、outbox hooks（message/event/photo 三套：入队→flush→重试）、`usePhotoPages`（照片页分页）、`useMessageHistory`（游标历史）、`useNow`、`useSpaceRealtime` |
| `src/lib/` | `supabase.ts`（client + must/errorText）、`api.ts`（全部读写，含 *_once 幂等 RPC）、`outbox.ts`/`eventOutbox.ts`/`photoOutbox.ts`（IndexedDB 队列）、`spaceCache.ts`/`imageCache.ts`、`dates.ts`（自然日）、`timeline.ts`、`memories.ts`、`ping.ts`、`eventArt.ts`（64 款图标配置+分组/关键词搜索）、`pet/`（16 角色 + 63 件装备 + 兼容矩阵 + 锚点 + wardrobeAssets 矢量稿）、`dailyTask*`、`pushRegistration.ts`、`accountDeletionRecovery.ts`、`reloadScheduler.ts`、`requestDeadline.ts` |
| `src/native/index.ts` | `BibuNative` 契约 + Web fallback：notifications / permissions / vibration / reminders / push / screenTime / deepLinks；所有输入在前端做白名单校验（ID 为正整数、文本截断、route 只允许 `#home|chat|events|photos|focus|settings`，不会执行任意 URL） |
| `android/` | Kotlin 插件 `love.bibu.space.BiboDevicePlugin` + `BiboReminders`(AlarmManager) + `UsageWindow`(UsageStats) + `DeepLinkPolicy` + `NotificationIcons` + `ReminderPolicy` |
| `supabase/` | migrations（`202609070001` 初始 + `20260908/09/10` 系列增量，最新 `202609100001`：照片 5MB→10MB + photos.emoji）、functions（`send-message-push` / `send-ping-push` / `delete-account`）、tests（PGlite） |

## 5. 关键不变式（改动时别踩）

1. **写不直插**：`messages`/`events`/`photos`/`pings`/`focus_sessions` 客户端无直接 INSERT/UPDATE/DELETE 权限，必须走 RPC（多数要求固定 UUID 幂等）。
2. **Fixed-ID 幂等**：outbox 的每行都以 `crypto.randomUUID()` 作为业务 id，重试同 id；服务端回执必须与本地行**逐字段比对**（`confirmedOutboxRow`）才删除队列行；歧义失败（超时/网络）保留 UUID 供同路径重试，只有明确的服务器拒绝（400 系且有 code）才回滚已上传的 Storage 文件。
3. **RLS 全开**：业务表全部 RLS，`anon` 无读写；核心函数 `SECURITY DEFINER` + `set search_path = ''`。
4. **照片路径格式**：`{couple_id}/{user_id}/{uuid}.{ext}`，删除前 RPC 验证 `uploaded_by === 本人`。
5. **图标一致性（本次修过）**：照片图标展示统一 `emoji || DEFAULT_PHOTO_ART`，且必须走 `EventArt` 渲染链（避免多套渲染漂移）。
6. **日期语义**：在一起当天为第 0 天（自然日 UTC 对齐 `dayNumber`）；事件按天算 `nextOccurrence`（yearly 2/29→2/28）。
7. **返回键层级**：dialog[open] → `.dock-more` → 路由回退 → 退出。
8. **声音偏好**：只在用户点击手势里 `enableFeedback()`；退出/刷新持久化。
9. **构建版本**：`__BIBU_BUILD__`（Vercel commit SHA 前 7 位）注入 `vite.config.ts`，用于线上对比版本；设置页可复制诊断信息。

## 6. 当前状态

- **完成度**：前端全功能 100%，离线/缓存 95%，数据库/RLS 95%，Edge Functions 已部署，Android 原生层 85%。
- **发布阻塞项**（CURRENT_STATUS.md）：正式 release keystore 签名环境变量、`google-services.json`、真实双机 FCM 送达验收、线上 Webhook→Edge Function 端到端核验。
- **已接受问题**：Vite 单包 >500kB（建议 code-splitting）；Kotlin 旧 API 警告（刻意保留向前兼容）；部分同色系装扮对比度偏低（有黑描边兜底）。
- **未做**：复杂 SW 预缓存、国际化、自定义头像照片上传（目前统一 16 款像素小动物）。

## 7. 常用命令

```bash
npm run dev        # 本地 5173（无环境变量时自动进演示模式；默认共享 Supabase 公钥开箱即用）
npm run typecheck  # tsc -b
npm test           # Vitest（含 PGlite 数据库用例）
npm run build      # tsc -b && vite build
npm run format     # prettier 全量
npm run android:sync / android:build / android:release:check
```