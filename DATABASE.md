# BIBU！数据结构与安全边界

权威数据定义位于 `supabase/migrations/202609070001_initial.sql` 及其后按文件名顺序的 `202609080001`–`202609080020` 增量迁移脚本。

---

## 一、核心表结构与权限规则

| 表名                   | 关键字段                                                                                        | 访问与写入规则                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `profiles`             | id, name, avatar                                                                                | 只读本人及同空间伴侣；只能更新本人的昵称和形象                                                                 |
| `couples`              | id, name, together_since, greeting_title, greeting_subtitle, closed_at                          | 只读 / 更新自己的空间；创建与解除关系走 RPC                                                                    |
| `couple_members`       | user_id, couple_id, slot                                                                        | `user_id` 主键保证一个账号只属于一个空间；`slot` 只能为 1 或 2；空间内 slot 唯一；禁止客户端直接写入           |
| `invitations`          | couple_id, code_hash, expires_at                                                                | 不向客户端开放表查询；原始邀请码只在创建 / 刷新 RPC 中返回一次                                                 |
| `messages`             | id, couple_id, sender_id, content, created_at                                                   | 只读自己的空间；只能以本人身份新增；服务端生成时间；支持游标分页                                               |
| `events`               | id, couple_id, created_by, title, target_at, kind, yearly, emoji, category                      | 空间成员可读写、双方可删除；注销后 created_by 可为空，保留共同事件                                             |
| `photos`               | id, couple_id, uploaded_by, path, caption, created_at, occurred_on, story, event_id, message_id | 成员可读；只能登记本人上传；客户端撤销直接 INSERT，必须走 `create_photo_once` RPC；注销后 uploaded_by 可置空   |
| `focus_sessions`       | user_id, couple_id, activity, ends_at, allow_reminders                                          | 双方可读；客户端撤销直接写权限，只能通过带空间锁的 RPC `set_focus_session` 与 `end_focus_session` 变更本人专注 |
| `pings`                | id, couple_id, sender_id, kind, created_at                                                      | 成员可读；客户端禁止直接 INSERT，必须走 `send_ping` RPC（包含服务端 3 秒行锁冷却与专注授权检查）               |
| `device_installations` | user_id, device_token, platform, app_version, updated_at                                        | 伴侣推送设备登记表；通过 RPC 原子转移与清理                                                                    |

> **安全准则**：所有业务表均开启 RLS（Row Level Security）；任何业务表都不对匿名角色（`anon`）开放读写权限。对象权限采用显式 GRANT / REVOKE。

---

## 二、双人绑定原子事务

1. **自动 Profile 建立**：Auth 新用户触发器自动建立 profile，已有 Auth 用户在迁移时补齐。
2. **空间创建**：`create_space()` 校验登录身份，锁定本人 profile，确认无现有成员关系，原子创建空间和 1 号位。
3. **安全邀请码**：邀请码为随机 UUID 去除连字符，数据库仅存 SHA-256 摘要，有效期 24 小时。
4. **加入空间**：`join_space(invite_code)` 锁定申请人 profile 和目标空间，严格校验邀请码哈希、有效期和当前成员数。
5. **排他保障**：成功加入后插入 2 号位并消费邀请码。唯一约束、slot 范围和数据库事务共同防止第三人加入。
6. **刷新邀请码**：`refresh_invite()` 仅在空间尚未满员时可用，生成新邀请码会自动废弃旧码。
7. **函数上下文安全**：核心查询与业务函数固定 `set search_path = ''` 并声明为 `SECURITY DEFINER`，内部依赖 `auth.uid()` 判定身份，防止提权与路径注入。

---

## 三、私有照片存储 (Storage)

- **Bucket 名称**：`couple-photos`，配置为 `public = false`。
- **文件存储路径**：`{couple_id}/{user_id}/{random_uuid}.{ext}`。
- **Storage 权限控制**：Storage RLS 严格限制读取权限仅限同空间成员，上传与删除权限仅限本人目录；单张文件上限 5 MB，限定图片格式（JPEG, PNG, WebP）。
- **临时签名 URL**：照片列表按需生成 1 小时有效期 Signed URL，前端配合 `Referrer-Policy: no-referrer`。
- **幂等上传与孤儿文件防范**：前端上传统一进入 `create_photo_once` RPC 队列；若文件已上传至 Storage 但元数据登记失败，客户端自动触发回退清理。

---

## 四、Realtime 与双向提醒机制

- **实时数据订阅**：客户端监听 `messages`、`events`、`photos`、`focus_sessions`、`couple_members`、`couples`、`profiles` 变更。
- **Ping 接收与防打扰**：`pings` 订阅过滤为当前空间，仅对伴侣发送的实时 INSERT 播放特效；服务端对专注模式做严格权限校验：
  - 对方无有效专注：仅允许普通哔卟/恋爱情绪。
  - 对方正在专注且未授权提醒：全部提醒请求拒绝。
  - 对方正在专注且已授权提醒：允许普通哔卟以及学习/工作/休息提醒。
- **设备隐私边界**：Android 端的屏幕使用时间（UsageStats）仅在用户本地明确授权后在设备内部读取，不向云端数据库上传设备使用明细。

---

## 五、关系封存与账户注销 (Lifecycle)

- **关系解除与封存**：`202609080008_relationship_lifecycle.sql` 中的解除关系 RPC 会撤销成员与邀请、关闭专注并标记 `couples.closed_at`。封存空间不可重新激活。
- **账户注销准备**：`202609080009_account_deletion.sql` 中的 `prepare_account_deletion` 在用户权限下生成注销凭证、锁定照片路径、移除成员关系，并将共同记录的作者字段置空（保留共同回忆，保护伴侣体验）。
- **服务端完全注销**：`supabase/functions/delete-account` 负责清理 Storage 中本人照片文件，并通过私密 `SUPABASE_SERVICE_ROLE_KEY` 调用 `auth.admin.deleteUser` 完全销毁 Auth 账号。

---

## 六、线上托管环境状态 (Production Status)

- **默认项目 Ref**：`zqwzdoejxsfscisudacu`
- **增量迁移状态**：已按序应用至 `202609080020_reliability_hardening`。已撤销客户端直写 photos 和 focus_sessions 的权限；`greeting_title` / `greeting_subtitle` 已生效 NOT NULL 与长度约束。
- **已部署 Edge Functions**：
  - `send-message-push` (ACTIVE)
  - `send-ping-push` (ACTIVE)
  - `delete-account` (ACTIVE, verify_jwt = true)
- **数据库 Webhook**：`messages` 与 `pings` 表已配置 AFTER INSERT 触发器，调用推送 Edge Function；请求头鉴权支持 `x-bibu-webhook-secret`（及向后兼容的 `x-bibo-webhook-secret`）。
