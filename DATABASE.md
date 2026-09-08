# 数据结构与私人空间边界

权威定义：`supabase/migrations/202609070001_initial.sql` 及其后按文件名顺序的 `202609080001`–`202609080018` 增量迁移。

## 表结构

| 表             | 关键字段                                                         | 访问与写入规则                                                                                 |
| -------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| profiles       | id、name、avatar                                                 | 只读本人及同空间伴侣；只能更新本人的昵称和头像类型                                             |
| couples        | id、name、together_since                                         | 只读 / 更新自己的空间；创建走 RPC                                                              |
| couple_members | user_id、couple_id、slot                                         | user_id 主键保证一个账号只在一个空间；slot 只能为 1 或 2；空间内 slot 唯一；禁止客户端直接写入 |
| invitations    | couple_id、code_hash、expires_at                                 | 不向客户端开放表查询；原始码只在创建 / 刷新 RPC 中返回一次                                     |
| messages       | id、couple_id、sender_id、content、created_at                    | 只读自己的空间；只能以本人身份新增；服务端生成时间                                             |
| events         | id、couple_id、created_by、title、target_at、kind、yearly、emoji | 成员新增、双方可删除；注销后 created_by 可为空，保留共同事件                                   |
| photos         | id、couple_id、uploaded_by、path、caption、created_at            | 成员可读；只能登记本人上传；注销后 uploaded_by 可为空，Storage 文件由服务端清理                |
| focus_sessions | user_id、couple_id、activity、ends_at、allow_reminders           | 双方可读；只有本人能开始 / 变更 / 结束本人的专注                                               |
| pings          | id、couple_id、sender_id、kind、created_at                       | 成员可读；客户端不能直接 INSERT；注销后 sender_id 可为空，保留共同互动记录                     |

所有业务表开启 RLS；没有任何业务表给匿名用户读写权限。对象权限使用显式 GRANT / REVOKE，避免仅依赖前端隐藏按钮。

## 双人绑定事务

1. Auth 新用户触发器建立 profile，已有 Auth 用户在迁移时补齐。
2. `create_space()` 校验登录身份，锁定本人 profile，确认无现有成员关系，原子创建空间和 1 号位。
3. 邀请码来自随机 UUID 去除连字符，数据库仅存 SHA-256 摘要，有效期 24 小时。
4. `join_space(invite_code)` 锁定申请人 profile 和目标空间，重新检查邀请码、期限和成员数。
5. 成功后插入 2 号位并消费邀请码。唯一约束、slot 范围和事务共同限制第三位成员。
6. `refresh_invite()` 只在空间未满时可用。生成新码会让旧码失效。

`my_couple_id()` 是固定空 search_path 的 SECURITY DEFINER 查询函数，用于避免成员 RLS 自递归。业务函数也固定空 search_path，明确 schema 引用，依赖 `auth.uid()` 而不是客户端传入的身份。普通调用者没有 invitations 和 memberships 的直接写入权。

本地测试覆盖已绑定成员、第三位用户、无效码、刷新码、过期码和越权直接写入。PGlite 是单连接引擎；真实多连接并发竞争仍应在独立 Supabase 测试项目验收。

## 照片存储

Bucket：`couple-photos`，`public = false`。

文件路径为“空间 UUID / 本人 UUID / 随机 UUID.扩展名”。Storage RLS 限制读取到本人空间，限制上传 / 清理到本人的目录。文件最大 5 MB，只允许 JPEG、PNG、WebP。

加载照片列表时生成 1 小时签名 URL。URL 在有效期内属于持有即可访问的凭证，不能公开转发；HTTP Referrer-Policy 使用 no-referrer。前台每分钟 / 重连 / 返回页面时重新加载数据并刷新链接。

上传文件后登记元数据；若登记失败，尝试清理刚上传的文件。若网络中断导致无法清理，应用显示需要处理的路径。管理员可以在存储桶检查孤立文件，但不能凭前端错误提示盲目删除他人文件。

## Realtime 和提醒

应用订阅 messages、events、photos、focus_sessions、couple_members、couples、profiles 的变更，并经 RLS 重新加载当前成员可见的记录。

pings 订阅限制为当前空间，只对非本人发送的 INSERT 显示接收动画。RPC 持有空间行锁校验 3 秒冷却；提醒类型固定白名单。专注权限必须在服务端满足：

- 对方没有有效专注：仅允许普通哔卟。
- 对方有效专注且没有授权：所有提醒拒绝。
- 对方有效专注且已授权：允许普通哔卟及学习 / 工作 / 休息提醒。

专注授权过期后自动不再视为有效许可，前端无法代替他人开启授权。UsageStats 只在本人 Android 设备明确授权 Usage Access 后读取，数据库不保存设备使用量。

## 已知边界

- 这是数据库访问隔离，不是端到端加密；项目管理员仍有基础设施访问权。
- 当前数据库 schema 可以容纳多个彼此隔离的双人空间；若部署只允许两个特定邮箱注册，还应配置 Auth 注册策略。
- 聊天、日期、照片的写入需返回实际记录；返回零行不能视为成功。
- 初始迁移不包含完整生命周期；后续迁移已提供解除封存和注销准备，注销 Edge Function 的部署、Storage 清理与 Auth 删除仍必须在独立 Supabase 项目验收。
- 未接入外部 API 的全面限流与机器人防护，需按实际项目开启 Auth 限流 / CAPTCHA；邀请码不是适用于公开平台的大规模身份验证方案。

## 后续迁移：封存、注销与匿名化

除初始迁移外，线上数据库必须按文件名顺序应用 `supabase/migrations/202609080001_*.sql` 到 `202609080018_*.sql`。不要只应用最新文件，也不要重复执行已记录的迁移。

- `202609080008_relationship_lifecycle.sql` 的解除关系会撤销成员和邀请、结束共享专注并设置 `couples.closed_at`；共享资料保留但旧成员不再能读取，封存空间不能重新加入。
- `202609080009_account_deletion.sql` 的 `prepare_account_deletion` 在调用者权限下创建一次性注销准备记录、抓取本人照片路径、移除成员关系，并将共享消息 / 事件 / 照片 / 哔卟的作者外键置空。它不使用管理员密钥，也不直接删除 Auth 用户。
- `supabase/functions/delete-account` 才能调用 `auth.admin.deleteUser`，并且只在 JWT 验证、准备记录确认、本人照片 Storage 清理后才删除 Auth 用户。该 Edge Function 必须在 Supabase 服务端部署，并设置服务器私密的 `SUPABASE_SERVICE_ROLE_KEY`；绝不能进入 `.env.local` 的 `VITE_` 变量、网页或 APK。
- 注销是不可逆操作。若照片清理或 Auth 删除失败，响应会明确返回部分完成状态，不应假装成功或让客户端自动重复提交。客户端仅在收到 `deleted: true` 后清理本机快照和待发送队列。
- 共享资料的作者可能显示为“已注销玩家”；这是数据保留策略，不是端到端加密或身份恢复。
