# Supabase 远程漂移审计

日期：2026 年 9 月 8 日

## 初始只读状态（部署前）

只读执行：

```text
supabase projects list
supabase functions list --project-ref zqwzdoejxsfscisudacu
supabase functions download --project-ref zqwzdoejxsfscisudacu --use-api send-message-push
supabase functions download --project-ref zqwzdoejxsfscisudacu --use-api send-ping-push
```

项目状态为 ACTIVE_HEALTHY。远程已部署两个 Function：

- `send-message-push`：ACTIVE，version 6
- `send-ping-push`：ACTIVE，version 6

远程函数源码已下载到临时目录进行只读比较，没有覆盖当前工作树。

## 初始发现的漂移

远程 version 6 与当前工作树不同：

1. 远程仍使用旧的通知频道：
   - `bibo_messages_v1`
   - `bibo_love_v2`
2. 远程仍包含 `isDeviceRecentlyActive` 和 `last_seen_at` 前台时间过滤。
3. 当前工作树已经按本轮用户要求移除隐藏的 120 秒前台抑制逻辑。
4. 当前工作树已经升级通知频道，并加入 FCM payload 的 PRIVATE visibility。
5. 当前工作树收紧了失效 token 判断，不再把普通 `INVALID_ARGUMENT` 自动当成失效 token。

因此在初始审计时：**本地代码修复尚未进入远程 Edge Function。** 该状态已在后续部署更新中改变；当前线上状态见文末更新段。

## 数据库状态限制

尝试只读获取远程 migration history 时，Supabase CLI 在连接远程 Postgres 时返回连接终止错误，未把失败误报成迁移已应用或未应用。

本地新增迁移仍为：

```text
supabase/migrations/202609080019_reliability_hardening.sql
```

初始审计时它尚未被证明确认；后续已通过 Management API SQL 直接应用并回读关键 schema。

## 当时待办动作

初始审计时需要在获得部署授权后，按以下顺序执行并回读：

1. 在独立测试项目应用全部迁移至 019。
2. 验证 Focus RPC、照片元数据写权限和 RLS。
3. 部署两个更新后的 Edge Function。
4. 回读远程 Function version/source digest。
5. 配置并验证 Webhook、FCM service account 和 secret。
6. 用两台 Android 设备验证前台、后台、锁屏、进程被杀和通知点击。

本文件记录远程漂移与后续部署证据；本轮没有执行数据库迁移推送或 secret 写入。

## 2026-09-08 更新

- 已在不修改数据库的前提下部署 `send-message-push` 与 `send-ping-push` 当前工作树版本。
- 远程 `functions list` 回读为 send-message-push ACTIVE version 9、send-ping-push ACTIVE version 10；下载后的源码已确认包含：
  - `bibo_messages_v2` / `bibo_love_v3`
  - PRIVATE FCM visibility
  - 不使用 `last_seen_at` / 120 秒前台抑制
  - 收紧的失效 token 判断
  - 通用通知标题和正文
- 远程 Secrets 只读列表显示 `BIBO_WEBHOOK_SECRET`、`FCM_SERVICE_ACCOUNT_JSON`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_URL` 等名称存在；没有读取或输出 secret 值。
- 对两个已部署 endpoint 发送无 secret 的 POST，均收到 HTTP 401 `Webhook 未授权`，证明当前版本的 Webhook 鉴权边界可达；没有用未授权请求触发发送。
- 初次只读审计时远程函数列表没有 `delete-account`；随后已部署当前工作树版本，远程回读为 ACTIVE version 1、verify_jwt=true。仍需在已应用 009/019 迁移的测试项目上做认证注销回读。
- `supabase migration list --project-ref zqwzdoejxsfscisudacu --dns-resolver https` 仍因远程数据库主机 DNS 解析失败而无法读取 migration history；没有执行 `db push`。

## Remote database verification after 019/020

- `public.couples.greeting_title` / `greeting_subtitle` are `NOT NULL` with the 1–40 / 1–100 checks.
- `authenticated` retains SELECT only for `focus_sessions`; direct INSERT/UPDATE/DELETE are false. For `photos`, authenticated retains SELECT/DELETE but direct INSERT/UPDATE are false; photo creation is via `create_photo_once`.
- `set_focus_session` and `end_focus_session` exist with authenticated execute and anon execute false.
- `touch_device_activity()` and `touch_device_activity(text)` no longer exist after 020.
- `public.messages` and `public.pings` have enabled AFTER INSERT triggers calling the two webhook functions. A digest-only comparison confirmed the trigger secret matches the remote `BIBO_WEBHOOK_SECRET` secret metadata; the secret value is intentionally not recorded.
- The remote database currently reports two Android device-installation rows. No synthetic message/Ping was inserted, so no unapproved notification was sent to those devices.
