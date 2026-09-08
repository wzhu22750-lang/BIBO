# 哔卟哔卟 · BIBU!

两个人的私人像素空间。React + TypeScript + Vite，使用 Supabase Auth / Database / Storage / Realtime，适配 Vercel，并包含可构建的 Capacitor Android 工程与 Kotlin 原生能力层。

**当前交付：持续升级中的可运行版本。** 不配置后端即可探索本地演示；真实模式的数据适配器、增量迁移、Android 原生能力和本机恢复路径已编写。本仓库没有写入任何 Supabase 凭据，也没有替你创建云项目或部署 Vercel。

> 网页关闭、手机锁屏或系统挂起时，当前版本不能保证提醒送达。没有实现远程 FCM/Push、已读回执或端到端加密；Android 本机通知和本机定时提醒不等同于远程推送。演示中的小橘、小桃和三张照片是示例，不是真实伴侣数据。

## 1. 先运行起来

需要 Node.js 22.12 或更高版本。

```sh
npm install
npm run dev
```

终端会显示预览地址，默认端口 5173。如端口占用，Vite 会输出实际使用的端口。

没有配置环境变量时，进入**本地演示**：

- 六个页面都可操作：小窝、悄悄话、值得期待、照片墙、专注陪伴、空间设置。
- 发送文字 / Emoji、创建和删除日期、上传图片、保存昵称和恋爱起始日、启动和结束专注。
- 数据只保存在当前浏览器的 `bibu-demo-v1` localStorage 中。同源标签页会同步演示数据，但这不是两台设备的真实聊天。
- 哔卟按钮模拟接收效果，不会给真实用户发送提醒。
- 演示上传单张限 1.5 MB，浏览器存储配额用尽会报错而不是假装保存成功。
- 清除演示数据：浏览器开发者工具 → Application → Local Storage，只删除 `bibu-demo-v1` 后刷新。请勿误删其他应用或真实登录的存储。

## 2. 连接自己的 Supabase

### 创建数据库和私有存储桶

1. 创建一个 Supabase 项目。
2. 在 SQL Editor 或 Supabase CLI 按文件名顺序执行 `supabase/migrations/202609070001_initial.sql` 和 `supabase/migrations/202609080001_*.sql` 至 `202609080018_*.sql`。每个迁移只执行一次；不要把新增迁移单独跳过。
3. 初始 SQL 创建 9 张业务表、RLS 策略、Auth 用户触发器、基础业务 RPC、私有 `couple-photos` 存储桶并加入 Realtime；后续增量迁移继续添加 Ping/回忆字段、幂等消息、分页、生命周期和注销准备 RPC。
4. 如果使用 Supabase CLI 管理项目，也可在链接项目后通过 `supabase db push` 应用迁移；不要对同一数据库重复在 SQL Editor 和 CLI 中执行同一迁移。

#### 共享项目数据库维护（无需 CLI）

共享项目（ref `zqwzdoejxsfscisudacu`）的 Access Token 已保存在本机两处（权限 600，均已 git 忽略）：

- `supabase/.temp/access-token`（项目本地）
- `~/.supabase/access-token`（Supabase CLI 标准位置，装了 CLI 后 `supabase login` 自动读取）

对线上库执行 SQL / 应用新迁移时，不需要安装 CLI，直接用 Management API：

```sh
curl -X POST "https://api.supabase.com/v1/projects/zqwzdoejxsfscisudacu/database/query" \
  -H "Authorization: Bearer $(cat supabase/.temp/access-token)" \
  -H "Content-Type: application/json" \
  -d '{"query":"select 1;"}'
```

迁移应用原则：**已应用过的迁移不要重跑**（`202609070001_initial.sql` 含普通 `create function`，重复执行会报错；后续迁移对已有函数使用 `create or replace` 可安全重入）。

初始迁移**不是幂等重置脚本**。如部分执行过，先检查已有对象和迁移历史，不要删表重来。已有 Auth 用户会补齐默认 profile。

### 浏览器凭据（开箱即用）

应用已内置哔卟哔卟共享 Supabase 项目（URL + 公开 Publishable Key），**所有用户默认使用同一数据库，无需配置环境变量**。开发时直接 `npm install && npm run dev` 即可，打包 APK 也不需要带任何 env。

仅当你想指向其他 Supabase 项目时才需要覆盖：

```sh
cp .env.example .env.local
```

在 `.env.local` 中填写：

```dotenv
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=你的公开PublishableKey
```

- 内置/填写的都是浏览器公开的 Publishable Key；仍使用 legacy keys 的项目可填写 `anon` key。
- **绝不能填 `service_role`、secret key、数据库密码。** Vite 中 `VITE_` 开头的变量都会进入浏览器构建。
- `.env.local` 已被 Git 忽略；留空则回退到内置共享数据库。

### 配置邮箱登录（必做一次）

在 Supabase 后台 **Authentication → URL Configuration** 配置以下三项（这样 Web 和 APK 的邮箱验证链接都能回跳）：

1. **Site URL**：`https://www.515171.xyz`
2. **Redirect URLs** 添加：
   - `https://www.515171.xyz`（线上 Web）
   - `http://localhost:5173`（本地开发）
   - `love.bibu.space://`（安卓 App 深链接，与 `capacitor.config.json` 的 appId 对应）
3. Email 登录保持开启即可。

应用已内置共享 Supabase 项目并启用 **PKCE** 流程：验证链接只带一次性 code，不暴露 token。Web 由 `detectSessionInUrl` 自动完成；安卓端由 Manifest 中的 `love.bibu.space://` intent-filter + `@capacitor/app` 的 `appUrlOpen` 监听完成回调，代码位置在 `src/App.tsx`。

登录流程：

1. 在应用输入邮箱获取魔法链接，在同一设备打开邮件完成登录。
2. 第一位玩家创建空间，页面转到「空间设置」，复制 24 小时有效的邀请码。
3. 第二位玩家用自己的邮箱登录，输入邀请码。绑定事务成功后，两人的页面都会刷新；第三位用户不能加入此空间。

真实使用建议配置自有 SMTP，并按 Supabase 当前项目设置检查邮件发送配额、Auth rate limits 和 CAPTCHA。若只允许两个固定邮箱注册，可先在后台创建这两名用户，再关闭公开注册；本应用的空间隔离本身不等于全站注册白名单。

### 提醒的真实边界

- 哔卟通过受限 RPC 写入 `pings`，对方通过 Supabase Postgres Changes 接收。
- 对方页面在线且 Realtime 正常连接时出现全屏像素 / Emoji 提醒。
- 在每个设备的「空间设置」点击“声音与震动”可主动授权并试听。刷新、重新登录或离开当前工作区后需再次授权。
- 声音使用 Web Audio；震动只在浏览器支持 Vibration API 时生效，iOS 等设备可能不支持。
- `send_ping` 在数据库事务内执行 3 秒冷却；无伴侣不能发送。
- 对方正在专注且未授权提醒时，服务器拒绝哔卟。学习 / 工作 / 休息提醒要求对方处于有效专注状态并已授权。
- “已发出”只代表数据库接受了请求，不表示对方已收到或已读。
- 仓库已提供 FCM 服务端发送模板：`send-ping-push`（Ping）与 `send-message-push`（聊天消息）均只接受带 `x-bibo-webhook-secret` 的数据库 Webhook，服务端读取伴侣的 Android token 后走 FCM HTTP v1；前台消息由 Supabase Realtime 呈现，App 前台活跃心跳会让服务端跳过仍在应用内的设备，避免重复通知。但这些函数尚未部署、Webhook 尚未配置、仓库也没有 Firebase 配置：token 登记不等于远程消息已发送或送达。请勿用于紧急联络。

## 3. 部署到 Vercel

1. 将本仓库推送到你自己的 Git 仓库，在 Vercel 导入。
2. 选择 Vite；构建命令 `npm run build`，输出目录 `dist`。仓库的 `vercel.json` 已包含相应设置、SPA 回退和基础响应头。
3. 在 Vercel 环境变量中填写与本地同名的两个公开变量，选择需要生效的 Production / Preview 环境。
4. 部署后将生产 HTTPS 域名配置为 Supabase Auth Site URL，并加入 Redirect URLs。
5. 验证两个不同账号、两个浏览器的绑定、聊天、照片权限和提醒。

Preview 环境建议使用独立 Supabase 测试项目，避免预览版本操作生产私密数据。无需填写任何服务端管理员密钥。

## 4. 以后打包 Android

当前已生成 Android 工程，并提供 `npm run android:sync` / `npm run android:build`。工程使用 Capacitor 8、Kotlin 原生插件和 `src/native/index.ts` Web fallback；本地可构建调试 APK，但通知、AlarmManager、UsageStats 和厂商后台策略仍需真实设备验收。

常用命令：

```sh
npm run android:sync
npm run android:build
# Android Studio 可选：npx cap open android
```

随后在 Android Studio 配置应用 ID、签名、SDK 和 APK 输出。这只是进入原生开发的步骤，不是“现在已能登录并可靠推送”的承诺。上架前还需：

- 实现并验证魔法链接的 App Deep Link 回调。
- Android 已接入 Push Notifications 客户端登记接口；仍需在 Android 模块放入 Firebase 配置，并部署只在服务端使用密钥的发送函数。没有这些配置时注册会明确失败，不影响本机通知。
- 根据实际设备选择 Haptics 等原生适配器。
- 若加入屏幕时间统计，只读取**本人**经明确授权的设备统计；专注锁定也只能作用于本人设备，随时可撤销。
- 当前版本不会请求其他 App 使用情况、无障碍控制、屏幕录制、相机或麦克风权限。

## 5. 工程结构

```text
src/
  components/         共用像素图形、按钮、面板、弹窗、导航、提醒特效
  pages/              六个功能页和邮箱登录 / 双人绑定页
  hooks/useSpace.ts   演示 / 真实数据切换、加载、Realtime、变更操作
  lib/
    api.ts            Supabase 数据访问和图片验证
    supabase.ts       公开配置和完整错误信息处理
    dates.ts          自然日、周年日期和共同倒计时排序
    demo.ts           与真实数据隔离的本地演示
    notifications.ts  用户主动授权的声音 / 震动反馈
    types.ts          应用数据类型
  styles.css          统一 tokens、组件样式和响应式断点
supabase/
  migrations/         可执行 PostgreSQL 迁移
  tests/              本地 PostgreSQL RLS / RPC 测试
public/demo/          仅供演示的本地图片素材
capacitor.config.json
vercel.json
```

导航使用轻量 hash 路由，没有为六页应用引入额外路由和状态管理框架。数据库状态不在组件里伪造：变更需要返回实际记录才算成功；加载失败会显示错误，保留已加载数据并标注可能过期。

## 6. 检查项目

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

- Vitest：日期计算、闰年周年、排序、图片大小 / 格式，以及真实 PostgreSQL 语义下的 RLS / RPC 权限测试。
- 数据库测试使用 PGlite 与最小 Supabase 系统表替身，不会访问线上账号。
- **本地数据库测试不等于已验证托管 Supabase 的 Auth 邮件、Realtime 订阅、Storage HTTP API、真实并发或云项目配置。** 上线前请按 `VERIFICATION.md` 完成双账号验收。
- `npm run format` / `npm run format:check` 用于统一 TypeScript、CSS、JSON 和文档格式。

## 7. 当前边界与产品化说明

- 像素猫 / 兔作为头像，可改昵称；尚未提供头像上传。
- 每个账号只能属于一个空间，每个空间最多两位；设置页支持明确确认的解除并封存、重新创建/加入新空间；封存不等于云端删除。
- 账号注销代码位于 `supabase/functions/delete-account`，必须在服务器部署 Edge Function 并配置 `SUPABASE_SERVICE_ROLE_KEY`；该密钥绝不能进入 Vite 或 APK。注销会匿名化共享记录、清理该账号上传的 Storage 文件并删除 Auth 用户，失败阶段会明确返回，未部署函数时客户端不会假装成功。部署模板见该目录 README。
- 聊天默认最近 200 条；真实模式支持 `message_history` 游标分页和本机 IndexedDB 待发送队列。照片页支持 `photo_history` 分页与事件筛选；首页仍使用轻量快照。
- 日期可以创建、编辑和经确认删除；真实模式的创建/编辑/删除通过事件操作队列恢复。
- 照片支持上传、文字/发生日期/事件/聊天关联、编辑和上传者确认删除；不自动压缩、不移除 EXIF、不支持 HEIC。真实单张上限 5 MB，私有链接有效期 1 小时并会定时刷新。
- 照片上传成功、元数据写入失败时，会尝试清理本人的孤立文件；清理失败会显示具体路径，不冒充上传成功。
- 一起天数使用自然日差：开始当天为第 0 天；每年 2 月 29 日在非闰年按 2 月 28 日纪念。
- 普通倒计时包含具体时刻，列表按目标时间排序，首页展示本地自然日差；当天均显示“就是今天”。过期事件保留在后面。
- 专注保存本人声明的活动、截止时间和提醒授权；Android 明确授权 Usage Access 后可在本人设备读取今日屏幕交互/指定 App 前台时长，数值为设备事件估算，不上传给伴侣。关闭页面后计时仍由时间戳决定，超时授权自动失效。
- 尚无分析 SDK、广告、公开照片链接或用户在线状态推断；“实时已连接”指本机订阅连接，不代表另一台设备在线。
- Android 原生层已包含系统通知、非精确定时提醒、UsageStats、本机 Focus 查询和可选 Push token 登记；`supabase/functions/send-ping-push` 与 `send-message-push` 提供 FCM HTTP v1 服务端发送模板（消息通知走独立渠道 `bibo_messages_v1`，点击经 `#chat?message=<id>` Deep Link 回到对应聊天），但需自行配置 Webhook、Firebase service account 和 secrets；远程发送/跨设备回执/厂商后台可靠性仍未交付，真实 FCM 链路未验证。

## 素材与设计

像素角色、图标、花朵和 favicon 均为项目内 SVG / CSS 绘制，不使用参考图中的角色或水印素材。像素字体使用本地打包的 Press Start 2P（SIL OFL）；中文正文使用系统字体以保证可读性。

三张示例照片来自 Unsplash，并保存为本地演示素材，不会把私人照片发送到图片第三方。素材标识见 `public/demo/SOURCES.md`。完整设计规范见 `DESIGN_SYSTEM.md`；权限模型见 `DATABASE.md`。

### 纪念日与 BIBO 底栏更新

纪念日页已增加真实恋爱里程碑、多色倒计时卡片、自绘像素小兔 / 小狗及 SVG 图标选择器。手机底栏中间为 BIBO 哔卟按钮；照片墙、专注陪伴和设置通过右侧「更多」进入，桌面仍保留原侧栏。

`pixelarticons` 已作为 npm 依赖安装，只按需导入所用 SVG，不加载整套图标或字体。新建事件存储 `icon:dog` 等短标识，兼容现有数据库字段，无需为本轮 UI 更新执行额外 SQL。旧图标记录自动显示为 SVG，原有聊天中的 Emoji 内容不会被改写。

「添加期待」目前提供 **64 个全彩像素 SVG 图标**，支持小伙伴、恋爱日常、旅行自然、节日纪念、成长目标五类筛选，以及中文 / 英文关键词搜索。不仅包含送信小兔、出游小狗、橘子小猫、抱抱小熊、围巾企鹅、机灵狐狸、快乐青蛙、散步小鸭、吐泡泡鱼和快乐机甲等 10 款生动小伙伴，还涵盖自驾汽车、轮渡、篝火、晴空、热茶、苹果、信件、皇冠、钻石、钟声、金库、能量药水等丰富恋爱生活场景，均以复古多色像素图层呈现。选择后会保留当前选中项，切换分类或搜索不会重置已选图标。
