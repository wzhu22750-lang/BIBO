# 哔卟哔卟 · BIBU!

两个人的私人像素空间。React + TypeScript + Vite，使用 Supabase Auth / Database / Storage / Realtime，适配 Vercel，并预留 Capacitor Android 配置。

**当前交付：第一阶段可运行 MVP。** 不配置后端即可探索本地演示；真实模式的数据适配器和数据库迁移已编写。本仓库没有写入任何 Supabase 凭据，也没有替你创建云项目或部署 Vercel。

> 网页关闭、手机锁屏或系统挂起时，当前版本不能保证提醒送达。没有实现后台推送、已读回执或端到端加密。演示中的小橘、小桃和三张照片是示例，不是真实伴侣数据。

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
2. 在 SQL Editor 执行 `supabase/migrations/202609070001_initial.sql`，执行一次即可。
3. SQL 会创建 9 张业务表、RLS 策略、Auth 用户触发器、4 个业务 RPC、私有 `couple-photos` 存储桶，并将相关业务表加入 Realtime publication。
4. 如果使用 Supabase CLI 管理项目，也可在链接项目后通过 `supabase db push` 应用迁移；不要对同一数据库重复在 SQL Editor 和 CLI 中执行同一迁移。

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

### 配置邮箱登录

1. 在 Supabase Auth 开启 Email 登录，配置 Site URL 和允许的 Redirect URLs。
2. 本地开发允许你的实际开发地址，如 `http://localhost:5173`。如果用 `127.0.0.1` 访问，也要添加对应地址。
3. 生产环境填写 Vercel 的实际 HTTPS 域名，不要把任意第三方域名加入白名单。
4. 在应用输入邮箱获取魔法链接，在同一设备打开邮件完成登录。
5. 第一位玩家创建空间，页面转到「空间设置」，复制 24 小时有效的邀请码。
6. 第二位玩家用自己的邮箱登录，输入邀请码。绑定事务成功后，两人的页面都会刷新；第三位用户不能加入此空间。

真实使用建议配置自有 SMTP，并按 Supabase 当前项目设置检查邮件发送配额、Auth rate limits 和 CAPTCHA。若只允许两个固定邮箱注册，可先在后台创建这两名用户，再关闭公开注册；本应用的空间隔离本身不等于全站注册白名单。

### 提醒的真实边界

- 哔卟通过受限 RPC 写入 `pings`，对方通过 Supabase Postgres Changes 接收。
- 对方页面在线且 Realtime 正常连接时出现全屏像素 / Emoji 提醒。
- 在每个设备的「空间设置」点击“声音与震动”可主动授权并试听。刷新、重新登录或离开当前工作区后需再次授权。
- 声音使用 Web Audio；震动只在浏览器支持 Vibration API 时生效，iOS 等设备可能不支持。
- `send_ping` 在数据库事务内执行 3 秒冷却；无伴侣不能发送。
- 对方正在专注且未授权提醒时，服务器拒绝哔卟。学习 / 工作 / 休息提醒要求对方处于有效专注状态并已授权。
- “已发出”只代表数据库接受了请求，不表示对方已收到或已读。
- 当前无 Web Push、FCM、Service Worker 后台提醒或离线哔卟补发。请勿用于紧急联络。

## 3. 部署到 Vercel

1. 将本仓库推送到你自己的 Git 仓库，在 Vercel 导入。
2. 选择 Vite；构建命令 `npm run build`，输出目录 `dist`。仓库的 `vercel.json` 已包含相应设置、SPA 回退和基础响应头。
3. 在 Vercel 环境变量中填写与本地同名的两个公开变量，选择需要生效的 Production / Preview 环境。
4. 部署后将生产 HTTPS 域名配置为 Supabase Auth Site URL，并加入 Redirect URLs。
5. 验证两个不同账号、两个浏览器的绑定、聊天、照片权限和提醒。

Preview 环境建议使用独立 Supabase 测试项目，避免预览版本操作生产私密数据。无需填写任何服务端管理员密钥。

## 4. 以后打包 Android

已提供 `capacitor.config.json`，其中 `webDir` 为 `dist`。当前**未安装原生依赖、未生成 Android 工程、未构建 APK**。

决定进入原生阶段后再执行：

```sh
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

随后在 Android Studio 配置应用 ID、签名、SDK 和 APK 输出。这只是进入原生开发的步骤，不是“现在已能登录并可靠推送”的承诺。上架前还需：

- 实现并验证魔法链接的 App Deep Link 回调。
- 接入明确授权的原生通知 / FCM，配置安全的服务器发送端，不能把管理员密钥放进 APK。
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

## 7. 第一阶段有意保持简单的地方

- 像素猫 / 兔作为头像，可改昵称；尚未提供头像上传。
- 每个账号只能属于一个空间，每个空间最多两位；暂不提供解绑、换伴侣或账号数据清除流程。
- 聊天只加载最近 200 条；照片只加载最近 200 张。数据没有被删除，历史分页留待后续。
- 日期可以创建和经确认删除；尚未提供编辑已有事件的表单。
- 照片暂不提供删除、自动压缩、EXIF 移除或 HEIC 转换。真实单张上限 5 MB，私有链接有效期 1 小时并会定时刷新。
- 照片上传成功、元数据写入失败时，会尝试清理本人的孤立文件；清理失败会显示具体路径，不冒充上传成功。
- 一起天数使用自然日差：开始当天为第 0 天；每年 2 月 29 日在非闰年按 2 月 28 日纪念。
- 普通倒计时包含具体时刻，列表按目标时间排序，首页展示本地自然日差；当天均显示“就是今天”。过期事件保留在后面。
- 专注只保存本人声明的活动、截止时间和提醒授权，不测量实际屏幕行为。关闭页面后计时仍由时间戳决定，超时授权自动失效。
- 尚无分析 SDK、广告、公开照片链接或用户在线状态推断；“实时已连接”指本机订阅连接，不代表另一台设备在线。

## 素材与设计

像素角色、图标、花朵和 favicon 均为项目内 SVG / CSS 绘制，不使用参考图中的角色或水印素材。像素字体使用本地打包的 Press Start 2P（SIL OFL）；中文正文使用系统字体以保证可读性。

三张示例照片来自 Unsplash，并保存为本地演示素材，不会把私人照片发送到图片第三方。素材标识见 `public/demo/SOURCES.md`。完整设计规范见 `DESIGN_SYSTEM.md`；权限模型见 `DATABASE.md`。

### 纪念日与 BIBO 底栏更新

纪念日页已增加真实恋爱里程碑、多色倒计时卡片、自绘像素小兔 / 小狗及 SVG 图标选择器。手机底栏中间为 BIBO 哔卟按钮；照片墙、专注陪伴和设置通过右侧「更多」进入，桌面仍保留原侧栏。

`pixelarticons` 已作为 npm 依赖安装，只按需导入所用 SVG，不加载整套图标或字体。新建事件存储 `icon:dog` 等短标识，兼容现有数据库字段，无需为本轮 UI 更新执行额外 SQL。旧图标记录自动显示为 SVG，原有聊天中的 Emoji 内容不会被改写。

「添加期待」目前提供 **64 个全彩像素 SVG 图标**，支持小伙伴、恋爱日常、旅行自然、节日纪念、成长目标五类筛选，以及中文 / 英文关键词搜索。不仅包含送信小兔、出游小狗、橘子小猫、抱抱小熊、围巾企鹅、机灵狐狸、快乐青蛙、散步小鸭、吐泡泡鱼和快乐机甲等 10 款生动小伙伴，还涵盖自驾汽车、轮渡、篝火、晴空、热茶、苹果、信件、皇冠、钻石、钟声、金库、能量药水等丰富恋爱生活场景，均以复古多色像素图层呈现。选择后会保留当前选中项，切换分类或搜索不会重置已选图标。
