# BIBU！当前项目状态

> 更新日期：2026 年 9 月 9 日 · 分支：`main`

## 一、当前完成度概览

BIBU！已完成前端全功能、数据持久化与离线缓存、Supabase 后端架构（含增量加固与注销能力）、Capacitor Android 原生能力桥接及本地构建流水线。

| 模块                         | 完成度 | 状态说明                                                                                       |
| ---------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| **Web 前端功能**             | 100%   | 六大功能页（小窝、悄悄话、值得期待、照片墙、专注陪伴、萌宠衣橱）与设置、登录、绑定均可正常运行 |
| **离线与缓存能力**           | 95%    | IndexedDB 照片持久缓存 (LRU/64MB)、消息/事件/照片待发队列、离线快照恢复均已就绪                |
| **Supabase 数据库与 RLS**    | 95%    | 初始迁移 + `202609080001` 至 `0020` 增量迁移全部就绪；线上已应用加固与行锁保护                 |
| **Edge Functions 服务端**    | 90%    | `send-message-push`、`send-ping-push`、`delete-account` 已部署线上并通过鉴权断言               |
| **Android 原生能力层**       | 85%    | 通知、非精确定时提醒 (AlarmManager)、UsageStats 使用量、Deep Link 回调、本地构建通过           |
| **生产发布就绪度 (Release)** | 待验收 | 缺少正式 release keystore 签名环境变量与 `google-services.json`，暂未进行物理双机 Push 验收    |

---

## 二、已完成能力

### 1. 核心业务体验

- **双人专属空间**：基于 Supabase Auth 邮箱魔法链接（PKCE 流程），通过 24 小时单次邀请码实现双人原子绑定与第三人绝对隔离。
- **双向情感 Ping**：六种恋爱情绪（哔卟哔卟、想你、抱一下、快来、晚安、我回来啦），服务端 3 秒行锁冷却，支持音效、震动与全屏像素动画。
- **私密悄悄话**：文字/Emoji 聊天，中文输入法保护，支持游标历史分页，未发送内容支持本地草稿恢复与待发送队列重试。
- **恋爱里程碑与期待**：天数自然日计算（开始日为第 0 天，非闰年 2 月 29 日兼容），64 款复古全彩像素 SVG 图标与分类搜索。
- **照片回忆墙**：私有 Storage 存储桶，1 小时签名 URL 自动轮换；本地 IndexedDB Blob 持久缓存与 LRU 淘汰；支持发生日期、长故事、关联事件与关联聊天。
- **专注陪伴与小约定**：双方专注状态与授权免打扰机制；Android 原生 UsageStats 查询今日屏幕交互或指定 App 使用时长；AlarmManager 非精确定时提醒。
- **萌宠衣橱**：16 款复古像素小动物，逐角色像素级测量与锚点档案，支持 60+ 装备/套装自由试穿与角色兼容性矩阵校验。

### 2. 原生与系统适配

- **Android 原生能力层**：基于 Capacitor 8 + Kotlin 原生插件（`BiboDevicePlugin`），实现独立私密通知渠道、锁屏可见性为 PRIVATE、专用状态栏小图标。
- **应用内日期选择器**：全面采用自研像素化 `PixelDatePicker` / `PixelTimePicker` / `PixelDateTimePicker`，摆脱 OEM 原生 Picker 样式碎片化。
- **Android 物理返回键处理**：层级化关闭弹窗 / 菜单 → 路由回退 → 退出应用。
- **沉浸式与安全区**：EdgeToEdge 透明系统状态栏，全面适配 `env(safe-area-inset-*)`。

### 3. 数据生命周期与隐私

- **关系封存**：支持解除关系并封存空间，撤销双人成员关系并封闭空间，历史数据保留但双方均不可再访问。
- **账户注销恢复**：提供注销前本地 marker 机制与服务端 `delete-account` Edge Function（自动清理本人照片文件、匿名化共同记录、删除 Auth 用户），防止网络中断假成功。

---

## 三、当前已知问题（已知且接受）

1. **Vite 生产构建 Chunk 提示**：由于全量打包包含 pixelarticons 与预置字体资源，`index.js` 单包大于 500kB。功能与加载正常，后续可按路由代码分割（code-splitting）。
2. **Android 编译警告**：Kotlin 编译时存在 `VIBRATOR_SERVICE` 和 `unsafeCheckOpNoThrow` 等已过时系统 API 警告，因需向前兼容老旧 Android 版本刻意保留。
3. **部分小动物同色系装扮对比度偏低**：小鸭穿嫩黄渔夫帽、白羊戴白厨师帽等像素艺术配色对比度偏低，有黑色硬轮廓描边兜底。

---

## 四、尚未完成事项（非阻塞）

1. **桌面 Web 端 Service Worker 缓存策略**：当前仅注册基础 sw，未配置复杂预缓存策略。
2. **多语言 / 国际化扩展**：目前原生文本与 UI 仅面向中文。
3. **头像相册自由上传**：目前统一采用 16 款复古像素小动物形象与衣橱定制，尚未提供自定义用户相片作为头像。

---

## 五、发布前阻塞项 (Release Blockers)

在正式打出面向终端用户的生产 Release APK 之前，必须完成以下前置配置：

1. **正式签名凭据**：创建并配置 `.env.release`（或环境变量）中的 `BIBU_RELEASE_KEYSTORE`、`BIBU_RELEASE_STORE_PASSWORD`、`BIBU_RELEASE_KEY_ALIAS`、`BIBU_RELEASE_KEY_PASSWORD`。
2. **个推凭据配置**：在 `.env.release` 与 Supabase Edge Function Secrets 中配置 `GETUI_APP_ID`、`GETUI_APP_KEY`、`GETUI_MASTER_SECRET`。
3. **真实物理设备个推送达验收**：在两台真实物理 Android 设备上完成前台、后台、锁屏、进程被杀后的 Push 唤醒与点击跳转验收。
4. **线上 Supabase 触发器端到端核验**：确保远程 Database Webhook 对 `public.pings` 与 `public.messages` 的 AFTER INSERT 触发器稳定调用 Edge Function。
