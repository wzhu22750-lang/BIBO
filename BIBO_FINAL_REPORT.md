# BIBO 产品级工程收尾报告

日期：2026 年 9 月 8 日

## 1. Overall Status

**Needs Attention**

当前工作树已经从“功能基本可用”推进到“本地构建、核心前端可靠性、Android 原生边界、照片缓存和托管 Push/数据库加固均有明确证据”的状态。没有发现本地代码范围内必须立即阻止构建的 P0；但在把 APK 交给真实用户长期安装前，仍必须完成真实 Firebase / Supabase 托管环境、双设备 Push 和物理 Android 设备验收。

## 2. 本轮主要修复

### P0

- 未发现新的 P0。

### P1

- **照片本地缓存**：新增 `src/lib/imageCache.ts`、`src/components/CachedImage.tsx`。使用 IndexedDB 持久保存私有照片 Blob，稳定键不包含短时 signed URL token；同一照片并发请求共享 Promise；64 MB 总上限、5 MB 单文件上限、LRU 淘汰、24 小时后台重验证、缓存替换通知和清理代际保护。
- **离线照片显示**：离线空间快照不保存 signed URL，但 `CachedImage` 会按空间、Storage path、创建时间读取已有本地 Blob；没有缓存时才需要网络 signed URL。
- **照片删除与生命周期**：照片删除支持传入分页照片对象；退出登录、账号注销、解除关系、确认删除时清理本地照片缓存。
- **上传幂等**：在线和离线照片上传统一进入固定 ID 的 `create_photo_once` 队列；兼容 API 入口也转向相同的幂等路径，避免响应丢失时孤儿文件和重复回忆。
- **FCM 前台抑制清理**：`send-message-push` 与 `send-ping-push` 不再使用 `last_seen_at` 或隐藏的 120 秒前台抑制窗口；每个有效 Android token 都进入发送目标，避免把时间窗口误当成送达保证。
- **专注授权竞态**：新增 `202609080019_reliability_hardening.sql`，通过 `set_focus_session` / `end_focus_session` 与 `send_ping` 共用 couple 行锁，串行化授权变化和 Ping 判断。
- **注销响应丢失恢复**：注销前写入本机 pending marker；如果服务器已完成删除但最后 HTTP 响应丢失，下一次启动会清理本机快照、照片缓存、待发队列、草稿、Push 和提醒，并明确把本地清理失败显示为 warning。
- **消息发送失败可恢复**：新增 `MessageOutboxPanel`，当前空间的 pending / blocked 消息可见，支持重试和二次确认移除；Chat 页面也显示同步错误。
- **Android APK 信任边界**：移除生产 `capacitor.config.json` 的远程 `server.url`，APK 默认加载本地 `dist`，避免远程网站脚本直接获得原生桥上下文。
- **通知隐私**：Push 频道升级为 `bibo_love_v3` / `bibo_messages_v2`，设置 PRIVATE 锁屏可见性；本机、FCM 默认和本机提醒均使用 `ic_stat_bibo` 状态栏图标。
- **日期时间 Picker**：新增 `PixelDatePicker`、`PixelTimePicker`、`PixelDateTimePicker`，替换所有 HTML `date` / `datetime-local` 输入，不再调用 OEM Picker；数据库仍使用原有日期和时间格式。

### P2

- 已修复 skip link 被 hash 路由解释成 Home 的问题。
- 已增加 Android back handler：优先关闭 Dialog、更多菜单，再回退 hash 路由，最后退出应用。
- 已修复 BIBU 长按滑动发送的 pointer capture 和 pointerup/click 双发送竞态。
- 已把 Auth、Onboarding、Loading 入口补上 safe-area padding。
- 已增加本机提醒的内联通知权限状态和申请入口。
- 已增加已获授权设备的静默 Push 补登记；首次权限仍由设置页主动申请。
- 已清理移动端顶部重复 BIBU 文本的伪元素问题。

### P3

- 修复本轮涉及文件的 Prettier 格式问题；`format:check` 当前通过。
- 保留 Vite 大 chunk warning，未用提高阈值的方式掩盖；后续可拆分路由或懒加载。
- Android Kotlin 仍有既有 API deprecation warning，但不影响编译。

## 3. 重要修改文件

- `src/lib/imageCache.ts`、`src/components/CachedImage.tsx`：持久照片缓存、single-flight、LRU、失效和离线读取。
- `src/lib/imageCache.test.ts`：稳定键、并发请求、401/403 signed URL 重试、并发请求、删除后重下、clear 与下载竞态、inline demo、离线缓存读取测试。
- `src/components/PixelPickers.tsx`：应用内日期、时间和日期时间选择器。
- `src/components/MessageOutboxPanel.tsx`：当前空间消息队列恢复 UI。
- `src/pages/Photos.tsx`、`src/hooks/useSpace.ts`、`src/lib/api.ts`：照片加载、删除、上传幂等和生命周期清理。
- `src/lib/accountDeletionRecovery.ts`：注销响应丢失后的本机隐私清理恢复。
- `src/App.tsx`、`src/components/BottomNav.tsx`、`src/components/Shell.tsx`：Push 补登记、Auth 冷启动、Android Back、skip link、长按和移动端状态。
- `src/native/index.ts`、`android/app/src/main/java/love/bibu/space/BiboDevicePlugin.kt`、`BiboReminders.kt`、`AndroidManifest.xml`：权限、通知频道、锁屏可见性、通知图标、Intent 消费边界。
- `supabase/functions/send-message-push/index.ts`、`send-ping-push/index.ts`、`_shared/*Push.ts`：无时间抑制的 token 发送链路和新频道。
- `supabase/migrations/202609080019_reliability_hardening.sql`：Focus 锁、照片元数据写权限和 greeting 约束。
- `README.md`、`DATABASE.md`、`BIBO_UPGRADE_PROGRESS.md`：迁移链、Android 本地 bundle、缓存和未验收边界说明。

## 4. 托管 Supabase 状态

- 项目 `zqwzdoejxsfscisudacu` 状态为 ACTIVE_HEALTHY。
- `send-message-push` 与 `send-ping-push` 已从当前工作树部署，远程回读为 send-message-push ACTIVE version 9、send-ping-push ACTIVE version 10。
- 无 secret 的 endpoint POST 均返回 HTTP 401，Webhook 鉴权路径可达且未触发发送。
- 远程 `delete-account` 已部署为 ACTIVE version 1、verify_jwt=true；未经认证调用返回 `UNAUTHORIZED_NO_AUTH_HEADER`，真实注销仍需数据库迁移和 Auth/Storage 回读。
- 远程 `supabase_migrations.schema_migrations` 表不存在，不能用 CLI migration history 作为证据；已先查询现有 schema/grants，再通过 `supabase db query --linked --file` 直接应用 019/020。应用后已回读 Focus RPC、greeting NOT NULL/约束、authenticated direct table privileges、heartbeat 函数删除；远程 messages/pings 触发器仍为 enabled。

## 5. Android 状态

| 能力                | 当前状态                                                                                                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date / Time Picker  | 已替换为应用内 Pixel picker；未调用 HTML/OEM 原生 Picker                                                                                                                                           |
| FCM 客户端          | token 登记、刷新监听、前台 received 转系统通知和点击路由已实现；本机已注入匹配包名的 Firebase client config；Android 35 模拟器在授予通知权限后由官方插件实际生成 FCM token，但未绑定到真实登录账号 |
| FCM 服务端          | send-message-push version 9、send-ping-push version 10，源码回读匹配本地；Webhook 尚未触发验收，FCM secret 只确认名称存在                                                                          |
| 本机 Notification   | 已有独立提醒渠道、权限检查、状态记录和点击路由；本机 Builder 与 FCM payload 明确 PRIVATE，真实锁屏仍需验收                                                                                         |
| Reminder            | AlarmManager 非精确定时、SharedPreferences、取消、重启/升级/系统时间恢复已存在；时区语义仍是绝对时间戳                                                                                             |
| Permission          | `POST_NOTIFICATIONS`、Usage Access 有明确状态；提醒页增加通知权限恢复入口                                                                                                                          |
| Icon                | Launcher 与专用 `ic_stat_bibo` 分离；通知使用专用状态栏图标                                                                                                                                        |
| Theme / System bars | Edge-to-edge 和 Web safe-area 仍需 API 35/36、刘海屏、手势/三键导航实机验收；入口页面已补 safe-area                                                                                                |
| WebView             | 生产配置不再绑定可变远程 `server.url`；Android bundle 已确认包含缓存代码                                                                                                                           |
| Build               | Debug APK 与临时 smoke signing 的 release APK 均可构建；生产签名密钥与发布流水线仍未提供                                                                                                           |

## 6. 数据与隐私

- 迁移链现在是初始迁移加 `202609080001` 至 `202609080020`，必须按文件名顺序应用。
- 直写 `photos` 元数据的客户端 INSERT 已撤销；上传使用 `create_photo_once`。
- Focus 直接表写入已撤销；客户端使用锁定 couple 行的 RPC。
- 私有照片 Bucket、Storage RLS、签名 URL 和空间边界未改成 Public，也没有把管理员密钥放入前端或 APK。
- IndexedDB 照片缓存是设备本地副本，不是端到端加密；云端删除不能远程抹除已下载副本。退出、注销、解绑和删除路径会主动清理应用管理的缓存，但本地系统备份或人工复制不在应用控制范围内。

## 7. 照片加载链路与缓存

```text
Supabase photos metadata
  -> createSignedUrls，仅作为首次下载/重验证来源
  -> CachedImage
  -> IndexedDB Blob cache / Object URL
  -> React PhotoCard、PhotoViewer、Home、Chat linked photo、Timeline
```

- 缓存键：`photo:<couple_id>:<path>:<created_at>`。
- 总容量：64 MB。
- 单文件上限：5 MB，与当前上传上限一致。
- 淘汰：IndexedDB 以 `lastAccessAt` 做 LRU；内存 Object URL 也有数量上限。
- 失效：照片 metadata generation、确认删除、退出登录、账号注销、关系解除；超过 24 小时会后台使用新的 signed URL 重验证并替换 Blob/Object URL。遇到 401/403 时会通过 `refreshPhotoUrl` 获取新的 signed URL 再重试。
- 并发：同一缓存键共享 pending Promise，不会由多个组件重复下载三次。
- 未做图片压缩、缩略图、WebP 转码或 EXIF 清除；这是有意保留的产品边界，后续需在确认画质和隐私要求后另行设计。

## 8. 实际执行的测试

- `npm ci`：通过；依赖 audit 为 0 vulnerabilities。
- `npm run typecheck`：通过。
- `npm test`：38 个测试文件、253 项通过。
- `npm run format:check`：通过。
- `npm run build`：通过；有 Vite 大 chunk warning。
- `ANDROID_HOME=$HOME/Library/Android/sdk ANDROID_SDK_ROOT=$HOME/Library/Android/sdk npm run android:build`：通过。
- 使用临时 smoke keystore、`BIBO_VERSION_CODE=2`、`BIBO_VERSION_NAME=0.1.0` 执行 `npm run android:release:build`：通过；`apksigner` 确认 V2 签名，`aapt2` 确认 package `love.bibu.space`、versionCode 2、versionName 0.1.0。
- `android/./gradlew testDebugUnitTest`：通过；本次 Android 构建实际执行了 `processDebugGoogleServices`。
- Android 35 模拟器安装并启动 Debug APK；`dumpsys package` 观察到 `FirebaseInitProvider`、`FirebaseInstanceIdReceiver` 和 `FirebaseMessagingService`。通过 CDP 调用官方 PushNotifications 插件，在程序化授予 POST_NOTIFICATIONS 后实际收到一个 FCM token；该 token 未写入远程设备表，未发送真实 Push。
- `supabase/tests/policies.test.ts`：32 项通过，包含 019 迁移后的 Focus RPC、照片写入和注销相关边界。
- Chrome 本地演示：实际打开事件编辑表单，打开日期选择弹窗，看到年/月/日 select，确认后回填日期；时间入口显示时/分自定义按钮。未观察到 HTML date/time OEM 控件。

## 9. 仍然必须解决的发布前问题

1. 已部署的 Push Function 已回读为远程 version 9/10（message/ping）；远程 messages/pings AFTER INSERT 触发器已回读且 webhook secret digest 匹配，但仍需两台真实 Android 设备的前台/后台/锁屏/进程被杀/点击通知验收。
2. `delete-account` 已部署为 version 1、verify_jwt=true，并通过未授权边界检查；019/020 已直接应用并回读关键 schema；旧 Push heartbeat 函数已删除，仍需测试账号验证 Storage 清理、Auth 删除回读和响应丢失恢复。
3. 019/020 已通过 Management API SQL 执行并回读约束/权限；仍需在托管项目使用真实认证会话验证多连接并发 Focus 授权、Storage HTTP、Realtime、RLS、Webhook 和 Auth 删除回读。
4. 在 API 35/36 和至少一台真实 OEM 手机上验证 POST_NOTIFICATIONS、锁屏 PRIVATE 文案、通知图标、Doze、强行停止、重启、时区/DST 和手势/三键导航。
5. 提供正式 release signing、版本发布流水线和正式发布产物；当前已用临时 smoke keystore 验证 release 签名链，不代表生产签名。
6. `npm run android:release:check` 已加入发布门禁；本机注入匹配的 Firebase client config 和临时签名参数后门禁通过，默认 versionName 已改为 0.1.0；`android:release:build` 已产出 V2 签名 smoke APK。配置文件和签名参数均不得提交。
7. 重新评估照片压缩、缩略图和 EXIF 清除，尤其是在真实照片大小和隐私要求确认后。
8. Push 目前仍是 best-effort：前台 received 转系统通知已实现，Push Function 已部署（send-message-push version 9、send-ping-push version 10），但没有 message/token 级发送幂等记录和端到端 delivery receipt；仍需真实 Webhook 和设备验收。
9. 当前仍没有图片内容 hash 或 Storage `updated_at` 元数据，因此同一 path 被外部替换时最晚在 24 小时重验证窗口更新；这是可接受的保守失效策略，但不是实时替换保证。
