# BIBU！· 哔卟哔卟

> 两个人，一整个小宇宙。双人专属的像素游戏空间。

BIBU！是一款专为情侣打造的私人像素互动应用。包含即时悄悄话、恋爱里程碑、私密照片回忆墙、专注陪伴、萌宠衣橱定制以及随时随地双向发射的恋爱情绪提醒。

---

## 一、技术栈

- **前端框架**：React 19 + TypeScript + Vite
- **像素视觉与样式**：CSS Custom Properties + 全矢量自研 SVG 资产 + Pixelarticons + Press Start 2P 字体
- **后端与数据库**：Supabase（PostgreSQL + Row Level Security + Storage + Realtime + Deno Edge Functions）
- **移动端容器与原生桥**：Capacitor 8 + Kotlin 原生能力层（Android Notifications, AlarmManager, UsageStats）
- **测试与质量工具**：Vitest + PGlite 本地数据库测试 + Prettier

---

## 二、快速运行

### 1. 安装与启动

需要 Node.js 22.12 或更高版本：

```bash
npm install
npm run dev
```

启动后访问终端输出的本地地址（默认 `http://localhost:5173`）。

### 2. 开箱即用模式

- **本地演示 (Demo)**：无环境变量时自动以本地演示模式运行，数据保存在浏览器 IndexedDB 与 LocalStorage 中，可自由体验全部功能。
- **默认共享数据库**：应用内置了默认共享的 Supabase 公开凭据，无需自行搭建后端即可体验双人魔法链接登录与同步。

---

## 三、基础配置

如果需要接入你自己的 Supabase 项目：

1. 复制环境文件模板：
   ```bash
   cp .env.example .env.local
   ```
2. 在 `.env.local` 填入你的项目凭据（仅限公开前端密钥，绝不可放入 `service_role` 密钥）：
   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-public-anon-key
   ```
3. 在 Supabase 后台 **Authentication → URL Configuration** 配置以下项：
   - **Site URL**：`https://你的域名`
   - **Redirect URLs**：
     - `http://localhost:5173`（本地开发）
     - `https://你的域名`（Web 生产站）
     - `love.bibu.space://`（Android 原生深链接）

---

## 四、Web 部署 (Vercel)

1. 将仓库推送到你的 GitHub，并在 Vercel 导入该工程。
2. 构建预设选择 **Vite**：
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. 在 Vercel 环境变量中配置 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_PUBLISHABLE_KEY`。
4. 部署后将生成的正式 HTTPS 域名加入 Supabase 的 Redirect URLs。

---

## 五、Android 构建

本项目内置完整的 Capacitor Android 工程：

```bash
# 1. 编译前端产物并同步到 Android 资源目录
npm run android:sync

# 2. 编译生成 Debug APK
npm run android:build

# 3. 检查 Release 发布前准备度
npm run android:release:check

# 4. 构建签名 Release APK（需要配置签名密钥环境变量）
npm run android:release:build
```

编译产物位于 `android/app/build/outputs/apk/`。

---

## 六、当前重要限制与边界

1. **消息送达非绝对保证**：在网页完全关闭或手机强制休眠状态下，推送依赖系统通知通道与网络通道；请勿将应用用于紧急联络。
2. **私密空间与权限**：每个账号仅能归属于一个空间，每个空间上限严格为 2 人。所有数据均受 RLS 隔离保护。
3. **设备隐私机制**：屏幕使用时间与专注时长仅在 Android 本机明确授权后在设备内部读取，不向云端上传具体的应用使用详情。
4. **端到端加密说明**：当前架构属于基于数据库角色的访问权限隔离（RLS），并非端到端加密（E2EE）。

---

## 七、开发者文档与状态索引

- 详细本地架构、命令与分支开发指南：请查阅 [DEVELOPMENT.md](file:///DEVELOPMENT.md)
- 数据库表结构、RLS 权限与生命周期设计：请查阅 [DATABASE.md](file:///DATABASE.md)
- 视觉设计语言、色彩 Token 与组件规范：请查阅 [DESIGN_SYSTEM.md](file:///DESIGN_SYSTEM.md)
- 核心测试套件与发版验收清单：请查阅 [VERIFICATION.md](file:///VERIFICATION.md)
- 当前项目完成度、已知问题与发布阻塞项：请查阅 [CURRENT_STATUS.md](file:///CURRENT_STATUS.md)
