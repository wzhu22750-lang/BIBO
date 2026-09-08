# BIBO 持续升级：审查与实施记录

目标来源：用户提供的 pasted-text-1.txt。保留现有像素 UI、React / TypeScript / Vite / Supabase / Vercel / Capacitor 路线，不重写项目。本文件是进度证据，不是全项目完成声明。

## 当前基线审查

- 当前工作树基线：d59bf7c。远端 origin 为 wzhu22750-lang/BIBO；只读查询的远端 HEAD 为 ef929fb12444b17312c3d07f683231f2db8528ea，与本工作树不同。未合并、推送或替换工作树。
- App.tsx 管理认证、hash 页面导航、声音授权、Toast。Workspace 按用户 ID 重建，Home 与底栏共用 useBibu 冷却。
- useSpace.ts 集中管理加载、Realtime、演示存储、业务写入。数据获取在 api.ts；远端写操作后全量重载，重载失败仅留下错误横幅。尚无幂等操作队列、持久化真实账号缓存或断线消息补发。
- 数据库：9 张业务表，RLS；成员关系及 Ping 通过 RPC。邀请码已哈希存储、24 小时过期、刷新失效和单次消费。不能把这些现有能力重复列为新交付。
- Realtime：业务表变更触发 180ms 合并重载；Ping INSERT 单独接收；重连、前台恢复、每分钟更新。没有离线 Ping 补齐、送达回执或后台推送。
- Chat：最近 200 条、文字/Emoji、中文输入法保护、发送后重载；缺少更早历史分页和持久草稿。不要扩展为社交聊天平台。
- Photos：私有 Storage + 签名 URL；已有 caption、上传日期；最多加载 200 张。尚无拍摄日期、事件/消息关联、删除 UI 或时间线。
- Events：纪念日/倒计时与年度重复；已有像素图形选择器。过去事件可显示，但没有关系时间线模型。
- Focus：共享 activity / ends_at / allow_reminders，不是 UsageStats，也不是在线状态或真实设备使用量。
- Android：仅 capacitor.config.json，没有 Capacitor npm 依赖、Android 工程、Gradle wrapper、Kotlin bridge。当前 .gitignore 忽略 android/；原生阶段需要有意调整版本控制范围。
- Vercel：静态 Vite 构建配置；没有已验证的线上部署。没有云凭据，不擅自部署迁移或声称真实双设备验证。
- 设计：保留奶白、蓝、粉、黄、粗描边、硬阴影、像素 SVG、安全区底栏；不换设计语言，不引入大型依赖。

## Phase 1 第一批已实施

1. 六种情侣 Ping：哔卟、想你、抱一下、快来、晚安、我回来啦。Home 选择语义，Home 与底栏发送同一选择、共享冷却。保留旧专注提醒值。
2. 类型贯穿 useBibu → useSpace → API；接收端按语义选像素图案、方波音序和震动节奏。声音仍须本人启用，震动缺失/异常不让已收到的 Ping 变成失败。无 AudioContext 时给出可读错误。
3. 新增兼容迁移 202609080001_semantic_pings.sql，扩展 CHECK 与 RPC，不改初始迁移、不重写旧记录。保留成员检查、服务端 3 秒冷却、专注免打扰、专注提醒授权、既有 RLS 和 RPC grants。
4. Home 每日问题以空间 ID 和本地自然日稳定轮换；刷新不随机跳变。日期及专注到期每 30 秒和回前台刷新。
5. Home 回忆按日轮换，最多三张，不改变原照片顺序；下一站只展示今天/未来或下一次周年，不把过去的一次性事件当作未来期待。
6. 展示伴侣共享专注记录与免打扰说明，不伪装在线状态。新增选择按钮至少 44px 高。

### 数据库升级部署顺序

已有数据库仅应用新增迁移；新数据库依次应用初始迁移和新增迁移。先部署数据库，再部署包含新 Ping 按钮的前端。旧数据库会明确拒绝新类型，不会伪装发送成功。迁移仅在本地 PGlite 测试库执行，尚未部署到 Supabase。

### 当前验证证据

- npm ci 成功；npm run typecheck 成功；npm test：4 个文件、94 项通过；npm run build 成功。
- 数据库测试执行初始迁移 + 新增迁移，覆盖全部六种 Ping、跨语义冷却、未知/null 拒绝、非专注时禁止专注提醒、未授权专注时拒绝情侣 Ping；原有隐私边界测试继续通过。
- 首页纯函数测试：日内稳定、跨日变化、无照片/单张照片、顺序稳定且不修改输入、过去/今天/年度事件。
- Playwright 本地演示浏览器：320 / 390 / 760 / 1024 / 1440 宽度均无横向溢出；六个语义按钮高度均 44px。
- 390px 下选择晚安、发送、出现晚安接收弹窗；底栏同步禁用，关闭弹窗成功；操作期间无 pageerror。截图 output/phase1-home-mobile.png 已人工查看。
- 尚未验证：声音实际听感、手机震感、所有六种 Ping 的双账号云端 Realtime、真机权限/后台。桌面浏览器不能证明这些边界。

## 后续顺序与完成门槛（仍未完成）

### Phase 1 剩余

- Ping 最近互动持久读取并汇聚 Home，处理遗漏/重复事件；更完整的移动端交互与失败路径测试。
- 逐项验证语义动效、声音授权异常、网络失败与冷却恢复。真实双端通知留到原生/推送阶段，不声称当前能后台送达。

### Phase 2 共同记忆

- Photos 记忆字段（文字、发生时间、事件关联、可选聊天来源），保留旧记录。
- Events 过去/现在/未来与纪念日/约会/旅行/生日类型；Home、照片、聊天轻关联；为回放/时间线留真实数据结构。
- 迁移与 RLS 关系完整性测试；浏览器完整创建/编辑/读取链路；typecheck/test/build。

### Phase 3 原生与可靠性

- BiboNative.notifications / reminders / vibration / screenTime / permissions / deepLinks：TypeScript 合同、Web fallback、Capacitor bridge、Kotlin 实现，页面不得直接调用 Android API。
- 通知/定时提醒/点击路由、Usage Access 权限与今日/指定 App 使用量；Focus 使用真实数据；后台检查和提醒，不做强制拦截。
- 本地缓存、按账号隔离的幂等操作队列、失败可见、断网恢复、Realtime 恢复；Android push 需要可信后端发送与设备 token 生命周期。
- 必须 Capacitor sync 和 Gradle build；无工具时先记录确切环境缺项，不能用 Web build 代替。
- 真机门槛：拒绝/撤销权限、锁屏、系统挂起/进程结束、重启、时区变化、定时提醒、通知点击、UsageStats、弱网恢复。允许明确记录无法验证，但不能声明目标全部完成。

### Phase 4 产品化

- 解绑/重新绑定、注销、数据库与 Storage 删除、照片管理、分页；避免越权与孤立文件，保留明确危险操作确认。
- 拆分 useSpace 获取/Realtime/业务操作，基于实际复杂度而非提前建通用框架。
- 性能与错误恢复验收；账户切换不得暴露旧空间数据；迁移兼容与 RLS 回归。

### Phase 5 长期能力

Widget、快捷入口、AI 仅在核心体验稳定后考虑，不提前堆砌实现。当前未开始。

## Phase 1 第二批：最近互动与接收边界

- Space 增加 pings，远端按空间、时间和 ID 查询最近 50 条；首页显示最新 5 条及来源/日期，不声称已读或送达。
- 新增 pings_couple_time 索引（包含在尚未部署的 202609080001 迁移中）。
- mergePings 校验 Realtime 形状、限定当前空间、按 ID 去重、固定排序和容量。全量加载晚于实时 INSERT 返回时合并，避免旧快照覆盖刚收到的记录。
- 只给两分钟内、未出现过、来自对方的实时 Ping 展示接收效果；历史加载/前台恢复不主动重放提醒。该时间窗口依赖客户端时钟，不代表推送送达保证。
- 演示数据保存真实的本地发送者；接收弹窗明确是演示预览。兼容没有 pings 字段的旧演示记录，保存配额失败仍抛出，不假装成功。
- dismissPing 引用固定；弹窗定时器只随新 Ping ID 重启，不被普通页面重渲染无限延期。
- 音频设备和震动运行时异常不反向破坏已接收的 Ping；未授权时不调用反馈能力。
- 新增单元测试覆盖重复/乱序、空间隔离、容量、旧消息/自己的消息不弹窗、旧演示兼容、存储失败、声音不可用/默认关闭/关闭后不触发和设备异常。
- 浏览器发送“抱一下”后刷新，记录不变、无历史接收弹窗；320/390/760/1440 无横向溢出、无 pageerror。测试后恢复浏览器原始演示存储。截图 output/phase1-ping-history.png 已查看，并根据截图补充记录区内边距。
- 当前最终逻辑检查：typecheck / 104 tests / build / diff whitespace check 通过。未验证云端双账号 Realtime 或真机声音/震感。
- 后续：Phase 2 的共同记忆字段、事件分类和跨页面关联；原生和账户生命周期等大目标仍未完成。

## Phase 2 第一批：共同记忆、关系时间线与轻关联

### 数据与兼容性

- 新迁移 202609080002_shared_memories.sql：Photos 增加 occurred_on（可空自然日）、story（最多 2000 字）、event_id、message_id；Events 增加独立 category（日常/纪念日/约会/旅行/生日）。不替换原有 anniversary/countdown 字段，不猜测旧照片拍摄日期，不修改 uploaded/created 时间。
- 事件与消息关联使用 couple_id + id 复合外键，数据库拒绝跨空间引用。关联对象删除时仅置空相应关联字段，照片及所属空间保留。
- 仅上传者可编辑回忆字段，原有 RLS 的共享读取保留。更新必须返回数据库行；禁止修改 uploaded_by/path/couple_id。新字段使用有限列授权，没有开放整表任意更新。
- Web 使用可选旧字段兼容本地既有记录；新建/编辑统一验证日期和文字，演示模式也检查关联存在于当前空间。
- 迁移仍未部署；已有云数据库须依序应用 202609080001、202609080002，再发布对应前端。

### 用户路径

- Photos → 共同记忆：新增日期、长文字、事件、聊天关联；按发生日期排序，缺日期时明确标记上传日期；可以按事件筛选。
- 图片详情显示故事与关联对象，可编辑自己上传的回忆。Home 与时间线复用同一详情组件。
- Events 增加关系时间线的全部/过去/今天/未来筛选：周年保留最初日期；下方既有期待卡片继续显示下一次周年，两者不混淆。
- Chat 中有被照片关联的消息会出现“关联回忆”按钮；照片详情显示聊天内容并可回到 Chat。当前跳转到页面，而非精确定位旧历史消息。
- 当前只覆盖已加载照片/消息，明确提示不是完整历史分页。精确深链接、超出加载窗口的关联读取、分页与照片删除仍待后续。

### 验证

- typecheck / 110 项测试 / production build 通过。
- PostgreSQL/PGlite 执行三份迁移，验证日期/长度约束、跨空间 event/message FK 拒绝、第三人不可读取、伴侣更新返回零行、上传者可更新、身份列不可写、事件删除保留照片并仅清空 event_id。
- 纯函数测试覆盖闰日、无日期来源标记、旧照片排序、原始周年历史、自然日筛选。
- Playwright 实际 UI：选择图片 → 填日期/故事/事件/聊天 → 上传 → 刷新 → 查看 → 编辑 → 从关联消息重新打开 → 从过去时间线打开。步骤通过，无 pageerror，测试后恢复原始演示数据。
- Home/Photos/Events/Chat 在 320/390/760/1440 共 16 个组合无横向溢出。截图 output/phase2-memory-details.png 已查看；脚本 output/memory-smoke.js 保留复验路径。
- 真实 Supabase Storage/RLS HTTP/双端 Realtime 未验证；本地数据库引擎与演示浏览器不能替代这些证据。

下一步：补充迁移前真实旧行的兼容测试、精确关联导航与历史读取；再按原顺序推进 Android 能力层与可靠性。整体目标未完成。

## Phase 2 第二批：迁移前旧行与保存确认

- PGlite 初始化现在先执行初始迁移，插入真实旧照片/周年事件，再执行两份增量迁移。测试逐字段比较照片原始数据保持不变，新增字段为 null/空文本；旧周年类型、重复标记和原始目标时间保持不变。测试夹具随后清理，不影响原有 RLS 场景。
- 回忆编辑成功后先应用服务器真实返回行，保留同一路径的签名 URL，立即更新 stateRef 和 UI；使写入前启动的旧快照失效，然后进行重载。重载失败继续由同步错误横幅报告，不把已提交编辑自动重发。
- 返回行属于其他空间或该照片已被移除时，不把它插回当前状态；路径变化时不沿用旧签名链接。
- API 契约测试明确验证 null 返回拒绝、数据库错误对象及 code/details/hint 原样保留、实际返回行优先于提交对象、非法日期不发送 UPDATE。该测试使用客户端替身，不等同云端集成测试。
- 最终 typecheck、118 tests（9 files）、build、git diff --check 全部通过。本轮未声称浏览器模拟真实云端保存后断网；对应 UI/网络集成验收仍需补充。
- 下一项仍是精确关联导航/历史读取，其后原生能力和其余完整目标继续推进。

## Phase 2 第三批：精确关联导航与单条历史读取

- 新增 routes.ts 白名单解析：兼容原有 hash 页面；支持 chat?message=ID 与 events?event=ID。参数只用于内部记录查询，不接受外部跳转或任意路径。
- 回忆详情的“去悄悄话／去时间线”现在包含记录 ID；App 保持目标 ID，支持同页面 hash 变化与刷新恢复。
- controller.readReference → API.readLinkedRecord 按 couple_id 和 id 查询单条记录，仍受 RLS 限制。独立读取旧消息，不受最近 200 条加载窗口约束，也不伪装完整历史已加载。
- LinkedRecordPanel 区分加载中、查询失败可重试、删除/不可访问与成功状态；请求切换/卸载后忽略过期响应；目标或空间变化按 key 重建。精确消息模式暂不自动滚动到聊天末尾，防止掩盖目标内容。
- 7 项新测试验证旧路由兼容、参数边界、两个查询过滤条件、消息/事件表选择、空结果与错误区分、无效 ID 不发查询。
- 最终 typecheck / 125 tests（11 files）/ build 通过。直接链接浏览器验证消息内容、刷新、缺失记录、事件标题及清除定位；320/390/760/1440 无溢出、无 pageerror。截图 output/phase2-exact-event.png 已查看。
- 重新执行 output/memory-smoke.js，上传/编辑/跳转/关联回忆打开与四页面 16 个宽度组合仍通过；恢复原始演示存储。
- 边界：没有真实 Supabase 凭据下的旧消息 HTTP/双账号验收；这次查询合同测试使用 API 替身，不声称云端端到端验证。目标记录详情为读取时快照，不是单独的 Realtime 订阅。完整历史分页、账户生命周期、Android 能力层等总体目标仍未完成。

## Phase 3 第一批：可构建的 Android 基础与 Kotlin bridge

- 添加并锁定 @capacitor/core / android 8.5.1，CLI 8.4.3。原先尝试的 CLI 8.5.1 引入 xcode → uuid 开发依赖的 3 项 moderate 告警；改为 8.4.3 后 npm audit 为 0，重新 sync/Gradle 构建通过。未使用 audit fix --force。
- Android 工程现在纳入版本控制，忽略 build、local.properties、签名私钥和 google-services.json；关闭应用自动备份以避免默认备份本地私密数据。MainActivity 与 BiboDevicePlugin 均为 Kotlin，Kotlin 插件 2.2.20。
- src/native/index.ts 是 React 唯一原生能力入口；建立六个命名空间与 Web fallback。目前 notifications / permissions.notifications / vibration / deepLinks 有 Android 实现；reminders / screenTime 只是明确返回 unsupported 的待接入合同，不是完成的功能，不能据此声称 UsageStats 或定时提醒已经可用。
- Kotlin 支持通知权限申请/读取、通知渠道、系统通知、不可变 PendingIntent、通知点击内部路由、原生震动。双方数据仍由原有 Supabase/RLS 处理，通知点击不直接执行写操作。
- 设置页增加用户主动点击的系统通知测试；通知文字明确不是伴侣后台推送。Ping 震动经 BiboNative 调用；网页端缺能力不会报错或声称成功。App 挂载通知点击监听，允许白名单内部页面与关联 ID，不打开任意网络 URL。
- 当前只有本地测试通知；实时伴侣 Ping 尚未自动触发系统通知，后台远程 Push / 定时提醒 / UsageStats / Focus 原生数据和后台检查均待后续。

### 构建与验证

- 本机 Java 21、Android SDK 36 可用；npm run typecheck / 130 tests / build / Capacitor sync / Gradle assembleDebug 均通过。
- npm run android:sync（先构建 Web）与 npm run android:build 脚本可复验。
- APK：android/app/build/outputs/apk/debug/app-debug.apk（约 4.6 MB，调试签名，不是正式发布包）。
- adb devices 当前为空：没有真机/模拟器运行验证。权限拒绝/撤销、渠道关闭、冷/热启动通知点击、系统挂起和真实震感仍需设备验证；Gradle 通过只证明编译打包。
- Web 浏览器 390px 设置页点击系统通知测试，正确提示只能在 Android 中开启；无溢出、无 pageerror。
- Native 单元测试覆盖 Web 六能力边界、路由白名单、通知长度/ID、震动时长约束、未支持设备，不宣称真实系统行为。
- 下一步：定时提醒与 Usage Access / UsageStats → Focus → 后台/同步可靠性；全部大目标保持未完成。

## Phase 3 第二批：UsageStats 与 Focus 设备数据

- Kotlin 增加 Usage Access 的 AppOps 权限查询与系统设置入口；打开设置不当成授权成功，读取前后复核权限。
- screenTime.today 支持手机本地自然日的屏幕交互时间、指定包名 App 前台时间。独立 UsageWindow reducer 裁剪跨午夜区间、合并同 App 活动的重叠时段、在屏幕关闭/重启时结束区间；查询在 bridge 线程执行。
- 数据标记为设备事件估算，包含 from/to/timezone/metric；权限拒绝或无记录返回 null，不把未支持当作 0。总屏幕事件在 Android 9 以下明确不支持；两天回溯仍可能缺失初始状态或系统截断事件，不能承诺与系统数字健康完全一致。
- Focus 增加本人设备面板、指定包名查询、设置入口、回前台刷新及错误显示。没有上传使用记录、没有伴侣后台监控或强制拦截。移除旧的“不读取其他 App / 将来才做屏幕时间”过时说明。
- 132 项 TypeScript/Vitest 测试通过；Kotlin UsageWindow 5 项测试通过，XML tests=5 failures=0 errors=0；Web build、Capacitor sync、Gradle testDebugUnitTest + assembleDebug 通过。

### 模拟器运行证据（不等于真机）

- 复用本机 Pixel_8_Pro / Android 35 AVD，以 -read-only -no-snapshot-save -no-window 启动，不保存镜像变更；serial emulator-5554。APK 安装成功、MainActivity 启动。
- 通过调试 WebView CDP 调用实际 Capacitor nativePromise：无权限返回 supported=true/granted=false/milliseconds=null；在该临时模拟器中用 appops 授权后，实际返回屏幕 107053ms、BIBO 前台 54626ms；撤销后再查询回到 null/未授权。
- 模拟器自己的日期为 2026-09-06，与宿主当前日期不同；from/to 均取设备时钟。上述数值仅证明真实 bridge/UsageStats 查询路径，不代表宿主当日使用数据。
- appops 撤销后进程句柄消失；检查 crash buffer 没有 BIBO crash（仅 Google Play Services 字体异常），重新启动后查询恢复。没有把失效的 CDP socket 当成同一活跃连接继续使用。
- 实际 WebView Focus 文本显示“屏幕交互时间 / 2 分 38 秒 / Asia/Shanghai”；修订隐私文案后再次构建、安装。未把模拟器程序化授权当成用户权限对话框验收。
- 定时提醒仍未实现；后续继续 AlarmManager/重启恢复/通知点击，以及后台/弱网/同步和账户生命周期。大目标保持未完成。

## Phase 3 第三批：原生定时提醒、取消与重启恢复

- reminders.schedule/cancel/list 接入 Kotlin BiboReminders；使用 AlarmManager.setAndAllowWhileIdle 非精确闹钟，不申请精确闹钟权限，明确系统可能延迟。
- SharedPreferences 先持久保存，再请求系统调度；最多 64 条，时间限制为未来一年；取消先删记录再取消系统闹钟，竞态广播读不到记录就不发通知。
- 独立通知渠道、不可变 PendingIntent、私密锁屏可见性、点击回 Focus；状态区分 scheduled/posted/blocked/expired/failed，posted 仅表示交给通知服务，不代表用户看到。
- BOOT_COMPLETED / MY_PACKAGE_REPLACED / TIME_SET receiver 恢复待提醒任务；超过一天的迟到提醒标记 expired，不突然补发旧通知。系统接收器非 exported。
- Focus 增加本机提醒时间选择、列表刷新、取消与移除状态记录。此入口只使用通用通知文案，明确是设备级而非云端账号提醒，没有把私人聊天留在账号切换后的通知中。
- Web 明确不支持后台提醒，不用网页 setTimeout 替代 Android 调度。
- 134 项 Vitest、Kotlin UsageWindow 5 项及 ReminderPolicy 2 项测试通过；typecheck、Web build、Capacitor sync、Gradle testDebugUnitTest / assembleDebug 通过。

### Android 35 模拟器实测

- 当前 serial emulator-5554 活跃；APK 安装、通知权限在测试环境程序化授予。
- 通过实际 Capacitor bridge 设置 15 秒后的提醒，退到桌面；dumpsys alarm 有对应 RTC_WAKEUP，随后 SharedPreferences 状态为 posted、dumpsys notification 有 id=4242/tag=reminder/channel=bibo_reminders_v1 的通知。不是 JS 计时器测试。
- 设置并取消 id=4244，列表不再包含该记录；已展示的 4242 也可取消/清除。
- 第一次 reboot 把设备日期从 2026-09-06 校正到 2026-09-08，原提醒超过一天，接收器将其改为 expired；广播历史确认 BOOT_COMPLETED 已送达。
- 校时后再设置一小时后的 id=4245 并 reboot；不打开 App，系统闹钟服务已有重建的 RTC_WAKEUP，记录仍 scheduled。恢复成功但不是精确时间保证：系统窗口约 44 分钟，已在 UI 如实提示可能延后。
- 测试结束通过插件取消全部 4242–4245 测试记录，list 返回 items=[]。dumpsys alarm 历史统计仍可能保留标签，不代表有待执行提醒。
- 尚未验证：真机 Doze/厂商省电策略、强制停止后行为、人工权限弹窗、真实通知点击；明确强制停止可能阻止执行。还未接入 Events 自动提醒或 Focus 到期自动安排。
- 后续继续后台 Focus 检查、弱网与持久同步队列、账户生命周期等完整目标，不把这批作为全项目完成。

## Phase 3 第四批：持久聊天消息队列与幂等确认

- IndexedDB message outbox 按 userId/coupleId 隔离，事务提交后才允许输入框清空。上限每空间 100 条；待发送保留原文、固定 UUID、排队时间、pending/blocked 与错误详情。
- 新迁移 202609080003_message_outbox.sql 增加 send_message_once RPC：服务端获取 auth.uid、验证当前空间、生成服务端时间；相同 UUID/空间/发送者/内容重试返回同一行，换内容或冒用 ID 被拒绝。数据库约束继续生效，匿名无执行权限。
- useMessageOutbox 从 useSpace 拆出持久队列与恢复逻辑；在线/回前台/15 秒检查同步。网络不确定时保留原 UUID；只有匹配服务端返回行才移除本机记录；约束/权限错误 blocked，不自动循环提交。卸载 hook/切换空间后停止后续发送，已发请求不能撤回。
- Chat 明确显示本机等待同步、失败可重试、移除需确认；不把“已保存到本机”称作对方收到。移除本机记录不能撤回已经到达服务器的消息。
- 保存后本机状态刷新失败不把持久入队当作失败，避免用户重按发送产生新的 UUID。服务端确认后立即合并消息，再触发空间同步。
- 此轮只接入聊天操作；照片/事件操作队列、首次断网启动的空间缓存、后台强制终止后自动联网发送仍未实现。不把本批缩小为整体离线能力完成。

### 验证与部署边界

- PostgreSQL 测试执行第四份迁移；相同 UUID 重发只产生一行，原创建时间不变；换内容、其他发送者、跨空间和匿名调用拒绝。
- 浏览器 output/outbox-smoke.js 使用真实 IndexedDB + 实际 React hook，发送端注入替身：离线持久化、重新挂载保留、服务端提交后响应丢失、同 UUID 重试不重复、权限错误保留内容/code/details、其他账号读取为空、blocked 不自动重发均通过。测试数据以独立随机账号命名并清理。
- 首次测试命中旧的浏览器动态模块缓存；加入仅测试用 cachebuster 后加载当前 hook，再完整重跑通过。不能将替身结果说成真实 Supabase 网络验收。
- 最终 typecheck、138 Vitest tests（13 files）、Web build、Capacitor sync、Gradle testDebugUnitTest / assembleDebug、git diff --check 均通过。
- 发布前必须应用 202609080003；旧云数据库缺 RPC 时消息会留在 blocked 队列，提示错误，迁移后可手动重试。尚未部署到实际 Supabase 项目。
- 待补：真实双账号弱网/多窗口并发、IndexedDB 配额/损坏 UI、跨账户清理策略；继续原有完整目标。

## Phase 3 第五批：主动开启的离线空间快照

- spaceCache 模块按登录账号隔离，默认不开启。设置页明示存储内容、共享设备风险、离线无法即时感知权限撤销，并提供关闭/清除。退出登录前关闭并清除本机空间快照，不碰待发消息或云数据。
- 仅缓存最近成功读取的业务字段（聊天最多 200、事件 500、照片文字 200、Ping 50、Focus 2），2 MB 上限、24 小时 TTL；不保存签名 URL、图片文件、令牌、邀请码。序列化白名单及读取结构校验避免旧/坏数据导致页面崩溃。
- useSpace 仅对明确的网络/超时错误恢复缓存；数据库权限/结构错误不会用缓存掩盖。离线快照展示保存时间，联网重新成功后替换；权限拒绝清除离线状态与快照，服务端无成员关系时移除旧快照。
- 写本机快照失败与云端加载成功分开报告，不将本地配额错误伪装成云端写入失败。首次加载过页面且账号会话仍在时可恢复内容；未配置 PWA app-shell 缓存，因此不宣称 Web 从未打开过或 HTTP 页面不可达时也能启动。Android Web 资源已随 APK 打包，但离线认证会话仍有独立边界。
- 缓存是本人主动开启的明文设备存储，不是 E2EE；离线期间无法实时撤销已有设备副本。开启 UI 已明确告知。
- 7 项新增单元测试覆盖默认关闭、跨账号、签名链接剥离、结构/时间异常、混合空间拒绝、清除不碰其他存储、配额失败、权限错误不视为网络故障。
- output/cache-smoke.js：真实浏览器 localStorage + 实际 useSpace，注入 loadSpace 故障替身；网络失败恢复、签名 URL 缺失、权限拒绝清空状态/缓存、在线解绑状态替换均通过。未将此替身称作真实 Supabase 断网集成测试。
- 最终 typecheck、145 tests（14 files）、Web build、Capacitor sync、Gradle testDebugUnitTest / assembleDebug、diff 检查通过。
- 后续完整目标仍包括：事件/照片操作恢复、分页、后台 Focus 检查、远程 Push、解绑/重新绑定/注销/数据清理、真实双账号和真机验收；目标未完成。

## 历史读取增量：聊天游标分页

- 新增 202609080004_message_history.sql：security invoker RPC + (couple_id,created_at,id) 索引；双列游标稳定倒序，每页 50，服务端最多 100，匿名不可调用，当前空间过滤及 RLS 同时生效。
- 初始最近消息排序补 id，避免同时间戳分页边界不稳定。useMessageHistory 独立保存当前页面已加载历史，与近期消息去重合并；错误保留现有历史和游标，重试不跳页。
- Chat 增加“加载更早的悄悄话”、加载失败说明、已到最早提示。加载前保存滚动高度/位置，完成渲染后补偿；读取旧记录时新消息不强制拉底，提供回到最新按钮。
- SQL 测试插入 105 条完全相同时间戳记录，分页 50/50/5、105 个唯一 ID，检查 100 条上限、其他空间空结果、匿名拒绝。
- output/history-smoke.js 用真实 hook + 注入分页端验证游标顺序 100→050→050（失败重试）、保留已加载历史、到末尾、新消息合并；不是云端 HTTP 或滚动像素验收。
- typecheck、148 tests（15 files）、Web build、Capacitor sync、Gradle 测试/assembleDebug 通过。完整滚动位置和连续大量 Realtime 插入还需专项 UI 验收。
- 图片历史分页仍未做；当前关系时间线不会自动加载所有历史。新增 SQL 未部署，部署前历史按钮可能收到 RPC 缺失错误，保留近期内容并明确提示。
- 所有未完成的原生后台、数据恢复、远程 Push、账户/照片生命周期和真机验收仍保留，整体目标未完成。

## 产品化增量：上传者照片删除与部分失败

- 新增 202609080005_photo_deletion.sql：仅上传者且仍属当前空间可删除照片元数据。photo_deletion_target 为 security invoker 的预检 RPC，前端先调用它再碰 Storage；数据库尚未迁移时在删文件之前失败，避免发布错序损坏照片。
- deleteOwnedPhoto 独立编排：读取服务端归属及路径 → 删除私有对象 → 查询文件已不存在 → 删除并确认匹配的数据库行。Storage 与数据库无法原子事务，不掩盖部分成功；元数据失败明确指出“文件已清理，记录删除未确认”，可以在文件已不存在时重试。
- 删除失败不把零行/错误当成功；路径/空间/上传者不匹配不动文件。预检后权限撤销等竞态仍可能导致部分状态，明确展示而非声称彻底原子化。
- PhotoViewer 提供输入“删除”确认，取消保留，仅本人上传显示入口；不会删除关联事件/聊天。成功后本机状态及主动开启的离线快照更新，再同步；其他设备已下载副本无法远程撤销。
- SQL 测试验证预检和 DELETE 的上传者限制、伴侣及第三人零行、关联事件保留；5 个编排测试覆盖顺序、错误/不匹配、Storage 未确认、部分失败及重试。
- output/photo-delete-smoke.js 在真实浏览器本地演示跑通输入确认、取消、删除刷新不恢复、伴侣无删除入口；原始演示存储已恢复。并未对用户真实云端照片执行删除。
- typecheck、154 tests（16 files）、Web build、Capacitor sync、Gradle testDebugUnitTest/assembleDebug、diff 检查通过。
- 当前有意保留边界：Storage HTTP 实际删除/过期签名/CDN缓存尚未云端验收；空列表证明依赖同一有效成员权限，权限切换竞态仍有部分失败风险。完整后台清理/账户生命周期另行实现，不能由本批替代。

## 产品化增量：邀请状态与主动撤销

- 完整复核确认原 refresh_invite 已具备 couples 行锁与满员检查；本轮开始时口头误判已更正，没有重复替换原实现。
- 新增 202609080006_invitation_management.sql：invitation_status 只返回本人空间 active/expires_at，不返回原文或哈希；revoke_invitation 与 join/refresh 共用空间行锁，删除待使用码，重复撤销可成功，不解除已经完成的绑定。
- InvitationManager 独立处理状态读取、过期时间、刷新/回前台检查、生成与撤销。页面重载后能得知是否仍有活跃邀请，但不能从服务器恢复原文；生成新码后可复制，消费/撤销/过期后隐藏旧码。
- SQL 测试验证状态字段最小化、跨空间不可见、重复撤销、旧码不能加入、未绑定账号无权撤销、新码可绑定、撤销不会清除成员、匿名禁止。
- output/invite-smoke.js 用真实组件和测试 controller 验证活动邀请状态、生成码显示、撤销后隐藏；没有调用实际云数据库。
- typecheck、155 tests（16 files）、Web build、Capacitor sync、Gradle testDebugUnitTest / assembleDebug 通过。锁竞争未做独立数据库连接并发压测，不把顺序 SQL 测试当并发证明。
- 解绑/重新绑定与注销仍未实现，设置页未伪装已有这些能力。总体目标继续进行中。

## 产品化增量：照片服务端分页与事件筛选

- 202609080007_photo_history.sql 新增 security invoker RPC 和上传时间/ID 索引，按当前空间和可选事件过滤，返回 31 条（展示 30 + 1 条判断下一页）；匿名禁止，RLS 继续生效。
- Photos 在线模式使用 usePhotoPages 按页读取，上一页/下一页游标栈、事件过滤重置到首页、加载/失败/刷新状态；只给本页 30 张生成签名链接，每分钟/回前台刷新当前页。首页仍是轻量快照，不把全部照片装入 useSpace。
- 在线分页明示“按上传时间倒序”，回忆详情仍展示实际发生日期；离线快照和演示只筛选当前已加载数据，不假装云端历史已全部加载。
- 去除真实模式编辑/删除“必须在首页最近照片中找到”的限制：删除仍使用服务端预检和上传者检查，更新仍受 RLS/列权限保护；演示仍检查本地上传者。详情使用真实保存返回行立即呈现编辑结果，关闭详情刷新当前页。
- SQL 测试 65 张同一上传时间的事件照片，30/30/5 页、65 个唯一 ID，跨空间及匿名拒绝。测试夹具写显式 id/time 需要管理员模式，随后恢复 authenticated 角色验证实际查询；没有因此放宽生产列授权。
- output/photo-page-smoke.js：真实 hook + 查询替身验证下一页游标、返回上一页、失败刷新保留当前页、服务端事件参数及重置游标。不是实际 Storage HTTP 验收。
- 重新执行 output/memory-smoke.js：演示上传/编辑/跨页关联打开与四页面 16 个宽度组合通过，无 pageerror；测试后恢复原数据。
- typecheck、157 tests（17 files）、Web build、Capacitor sync、Gradle testDebugUnitTest/assembleDebug 通过。
- 边界：云端迁移未部署；真实旧页编辑/删除及签名过期路径还需双账号验收。分页页面不做独立 Realtime 订阅，靠手动/回前台/周期刷新；关系时间线仍只展示已加载的快照。剩余全部目标继续保留。

## 原生业务联动：Focus 到期提醒

- 开始专注表单新增独立的“到时提醒我”选择，不与伴侣打扰授权混淆。服务端专注记录确认后，使用返回的 ends_at 安排通用文案的本机通知。
- 开始新专注先清理旧的专注闹钟；未选择提醒时不申请通知权限。固定保留 ID 2147483647 与随机手工提醒区间分开，避免同一设备连续开启专注堆积多个到期提醒。
- 提前结束专注后取消本机到期提醒；云端专注与本机闹钟不能跨系统原子事务，权限拒绝/调度失败/取消失败分别反馈，不将已开始或已结束的专注误报为整体失败。
- startFocus/endFocus 应用真实确认结果到当前状态，重载失败不隐藏已提交的专注状态。开始参数验证 1–180 分钟和非空内容。
- 提醒只含通用文案，不记录活动名称或账号身份；跨设备结束不会立即取消本机闹钟，UI 明确提示到本机提醒列表手工取消，未宣称跨设备强一致。
- 4 项新增测试覆盖结束时间来源、无隐私文本、未选择不申请权限、部分成功/取消失败。浏览器演示验证选择提醒但 Web 不支持时专注仍开始、随后正常结束，原始演示数据恢复。
- 最终 typecheck、161 tests（18 files）、Web build、Capacitor sync、Gradle testDebugUnitTest/assembleDebug 通过。本轮尚未对最终 APK 的 Focus 表单做模拟器/真机点按验收；底层 AlarmManager 先前模拟器证据不替代本轮完整业务链。
- 目标仍未完成：解绑/重绑/注销、后台监督检查、远程 Push、事件/照片持久操作恢复、真实云端与真机验收等均继续保留。

## 聊天输入可靠性：发送等待期间保留新输入

- 发现 Chat 原发送成功回调无条件清空输入，会丢弃请求等待期间新输入的文字。改为记录提交时的 draft revision，只在期间完全未编辑时清空。
- 输入和 Emoji 追加共用版本更新；即使用户删掉再输入同样文字，也视为新的编辑，不被旧请求成功回调清除。失败保留原文，不额外发送用户后续输入。
- 3 项单元测试覆盖未改动清空、新文字保留、相同文字重输保留。
- output/chat-draft-smoke.js 使用实际 Chat 组件、浏览器文本框输入与延迟 Promise 发送端，验证新输入/同文重输/发送失败均保留、未修改成功清空；替身控制请求完成时序，不宣称真实网络验收。
- typecheck、164 tests（19 files）、Web build、Capacitor sync、Gradle testDebugUnitTest/assembleDebug、diff 检查通过。
- 尚未实现跨页面持久草稿；本批只修复发送回调覆盖输入，不把它当成完整离线或数据生命周期交付。原始所有剩余目标继续保留。

## 弱网恢复增量：持久退避与重试边界

- 待发消息新增可选 attempts/nextAttemptAt，兼容旧 IndexedDB 行；失败后原 UUID/内容不变，退避从约 15 秒指数增加到最多 5 分钟，按消息 ID 稳定抖动减少同步重试集中。
- 在线/回前台检查尊重已保存的截止时间，不因重新挂载或反复 online 事件立即重发；待发送消息维持顺序。权限/约束 blocked 不自动重试，手动重试清除该消息退避和计数。
- Chat 显示最早重试时间；时钟大幅回退时不会等待数天。当前网络请求本身尚未增加硬超时，后续仍需补充悬挂请求恢复。
- 4 项新增测试覆盖上限、持久化、身份/内容不变、旧记录、blocked 和时钟异常。output/outbox-smoke.js 新增“重连不得绕过退避、截止时间实际写入 IndexedDB”检查，与响应丢失同 UUID 重试等已有流程一起通过。
- typecheck、168 tests（20 files）、Web build、Capacitor sync、Gradle testDebugUnitTest/assembleDebug、diff 检查通过。浏览器发送端仍为注入替身，真实 Supabase 弱网验收尚未完成。
- 本轮是恢复策略增量，不替代解绑/重绑/注销、后台监督、Push、事件/照片操作持久恢复等未完成目标。

## 弱网恢复增量：悬挂消息请求超时

- 每次消息 outbox 同步增加 20 秒 deadline，并将 AbortSignal 传入 Supabase RPC。即使底层 Promise 不响应 abort，也释放本地等待锁，不让一个挂起请求永久阻塞队列。
- 超时明确是结果未知，保留原 UUID/内容并进入现有退避重试；晚到成功不会被当作第二次完成，服务端幂等约束处理可能已经提交的请求。中止请求不代表撤销服务端事务。
- 四项测试验证成功清理计时器、悬挂超时及 abort、晚到响应不重复完成、原错误保留。
- output/outbox-timeout-smoke.js 使用实际 hook/IndexedDB 和永不返回的发送替身，实测约 20108ms 后保留超时记录、signal 已 abort、锁释放；随后手动重试相同 UUID 成功并清队列。测试数据清理；不是实际云端超时测试。
- typecheck、172 tests（21 files）、Web build、Capacitor sync、Gradle testDebugUnitTest/assembleDebug 通过。
- 其余读取请求、Android 系统冻结 JS 定时器、真实云端回包时序等还需对应验收；不将单条消息 timeout 视为全应用网络可靠性完成。完整原目标保持进行中。

## Realtime 架构增量：独立订阅与固定窗口合并

- 将 useSpace 中的 Supabase channel、前后台/网络事件、周期刷新与演示 Storage 同步拆至 useSpaceRealtime；业务状态合并与 Ping 展示仍由 controller 负责。
- 原 debounce 每个事件重置 180ms，持续高频变更可令读取不断延后。createReloadScheduler 改为首次事件后固定窗口读取，窗口内合并，读取中只标记一次后续补读，避免该订阅触发的读取重叠。
- channel 清理后 disposed 守卫拒绝旧 Ping/status/change 回调；取消计时器和监听。网络断开/恢复有明确文案，CLOSED 状态不再伪装普通连接中。演示 localStorage.clear 事件也触发重读。
- 没有收紧 DELETE 过滤以免影响删除/成员发现；服务端 RLS 仍是授权边界。此拆分不保证 Supabase 实际自动重连或跨账号事件送达，需要云端证据。
- 四项测试覆盖高频事件不饥饿、读取中事件只补读一次、不重叠、dispose 后不继续、读取错误后仍接受请求。
- 176 tests（22 files）、typecheck、Web build、Capacitor sync、Gradle testDebugUnitTest/assembleDebug 通过。拆分后重新执行 cache-smoke.js，实际 controller 离线恢复/权限拒绝清除路径仍通过。
- 原始整体目标未完成，尤其生命周期、后台监督/Push、照片事件持久操作队列及云端/真机验证等剩余项没有被此重构替代。

## 启动可靠性：空间读取截止时间

- useSpace 全次 loadSpace 读取增加 20 秒截止时间；超时显示空间读取错误并允许主动开启的离线快照恢复，不再永久停在加载屏。
- API 数据库查询共享 AbortSignal，截止后中止可取消的读取。Storage 签名 URL 请求当前没有单独可传信号的适配，外层截止仍释放等待并忽略迟到结果，不声称所有底层网络请求都已取消。
- RequestDeadlineError 支持场景文案，读取超时不再错误地提示“消息已排队”。消息发送仍保持原有结果未知和同 ID 重试说明。
- 新测试验证读取场景超时文案；output/cache-timeout-smoke.js 以永不返回的 loadSpace 替身运行实际 hook，等待真实截止后恢复缓存，再验证权限拒绝清除与在线状态替换。不是 Supabase HTTP 超时验收。
- typecheck、177 tests（22 files）、Web build、Capacitor sync、Gradle testDebugUnitTest/assembleDebug、diff 检查通过。其他分页/关联单条请求暂未统一截止，原始整体目标仍未完成。

## 账户生命周期第一步：解除关系与新空间重绑

- 新增 202609080008_relationship_lifecycle.sql：close_relationship 要求当前账号和明确 expected_space，锁定账号 profile 及空间；事务内设置 closed_at、撤销邀请、清理共享专注并移除双方成员关系。
- 旧聊天/照片/事件云端行保留但双方不再具有当前空间访问权；新建/加入只能进入新空间。membership_closed_guard 拒绝向封存空间重新插入或迁移成员，避免新伴侣继承旧关系资料。
- 设置页加入输入“解除绑定”确认，明确双方影响、封存不是删除、没有封存恢复入口、需自行保存副本、其他设备缓存无法即时撤销、旧待发队列不会迁入新关系和本机提醒需管理。
- 服务端确认后立即清除当前可见空间/Ping/邀请码并停用本机快照，再刷新到创建/加入入口。网络响应丢失仍提示未确认并要求刷新，不能将旧 expected_space 用于关闭后来新建的空间。
- SQL 测试验证错误空间拒绝、双方丧失读取、旧数据保持、新空间重新绑定后看不到旧消息、陈旧解除请求拒绝、封存空间成员写入阻止、匿名拒绝。未做跨连接并发压测。
- output/relationship-smoke.js 用实际 Settings 与测试 controller 验证输入门槛、取消不调用、只提交当前 expected_space。没有对真实账号执行解除。
- typecheck、178 tests（22 files）、Web build、Capacitor sync、Gradle testDebugUnitTest/assembleDebug、diff 检查通过。
- 仍未完成：封存资料的本人管理/彻底删除与账号注销、本机旧队列清理入口、远程缓存清理限制、跨端 Realtime 解除恢复及真机/云端验收。封存不等于数据删除，未声称完整生命周期完成。

## 解绑后的本机管理：旧空间待发消息

- InactiveOutbox 在未绑定入口与设置页可达，仅展示当前账号、非当前空间的 IndexedDB 队列。旧关系消息无重发到新空间入口。
- 可逐条复制原文，或二次确认移除；明确本机移除不是服务端消息撤回。不会删除当前关系队列、其他账号队列或云端内容。
- 当前账号/空间变化时立即隔离旧 state，过期读取不覆盖新状态；读取错误有提示及刷新入口。
- 新单元测试验证账号与关系过滤；output/inactive-outbox-smoke.js 实际 IndexedDB + 实际组件点按验证取消保留、确认仅删旧关系一条，结果 old=0/current=1/other=1。测试 fixture 最初被现有侧栏遮挡，调整测试挂载层级后完整复验通过，未为此修改产品层级。
- typecheck、179 tests（22 files）、Web build、Capacitor sync、Gradle testDebugUnitTest/assembleDebug 通过。测试数据清理完毕，没有动真实用户记录。
- 旧封存云资料管理/彻底删除与注销仍待实现；本机清理入口不替代完整数据生命周期，整体目标未完成。

## Phase 4 增量：账号注销与本机清理

- 新增 202609080009_account_deletion.sql：共享作者外键改为可空，新增一次性 account_deletion_jobs 捕获该账号上传的 Storage 路径；prepare_account_deletion 在调用者权限下锁定账号/空间、解除成员、清理本人专注、匿名化共享消息/事件/照片/哔卟，并对重试返回同一 job。
- 新增服务器专用 Supabase Edge Function `supabase/functions/delete-account`：验证 JWT → 调用调用者范围的准备 RPC → 通过 service role 读取一次性路径并扫描本人空间照片目录 → 分批清理 Storage → 确认后 admin.deleteUser。service role 只出现在服务端环境，不进入 Vite/Android。
- Storage 或 Auth 删除失败会返回 prepared/错误而不伪装成功；准备后的 job 使重试可继续，Auth 删除成功后 job/profile 由外键级联清理。客户端只在收到 deleted=true 后清理离线快照、IndexedDB 待发送队列、保存邮箱和本机提醒，并清空当前状态/本地会话。
- 共享资料保留给伴侣，作者显示为“已注销玩家”；缓存校验、Ping 历史和关联消息展示已支持 null 作者，不把匿名 Ping 再次当作新的实时提醒。
- Settings 和无空间 Onboarding 均提供明确输入“注销账号”确认；组件不会因取消或未完成确认调用删除操作，并提示不可逆、共享资料、已下载副本和部分失败语义。
- 数据库测试执行 009 迁移，验证准备 RPC 幂等、成员移除、共享作者匿名化、旧空间数据保留、job 级联；本地 Edge Function 未连接真实 Supabase。
- 新增 accountCleanup 单元测试覆盖快照/队列/保存邮箱/本机提醒逐项清理及失败汇总；浏览器 account-deletion-smoke.js 覆盖确认门槛、取消安全和 expected_space；187 tests（24 files）通过。
- README、DATABASE.md、VERIFICATION.md 已记录部署顺序、service key 边界、Edge Function 配置和真实验收清单。npm format:check、typecheck、test、Web build、Capacitor sync、Gradle assembleDebug 全部通过。
- 当前仍未声称完成：Edge Function 云端部署、真实 Storage 扫描/删除、Auth admin 删除回读、双账号注销后 Realtime、导出、远程缓存撤销、真机厂商后台等。

## Android/Realtime 增量：在线 Ping 系统通知

- 新增 `pingNotification.ts`，为 Ping ID 生成稳定的正整数 Android 通知 ID，通知只使用通用标题、语义文本和白名单内部路由 `#home`，不把聊天/账号隐私放进通知正文。
- 当前 Realtime 收到“新鲜、来自伴侣、未重复”的 Ping 后，先更新已有历史与全屏反馈，再尝试 `BiboNative.notifications.show`；通知权限未开、Web 平台或系统通知失败只被吞掉，不影响 Ping 记录和 UI。
- 已匿名化的 null sender Ping 可读但不会再次触发实时通知；共享历史显示为“已注销玩家”。
- 2 项通知构造测试覆盖稳定 ID、正数边界、未知 wire kind fallback 和内部路由。最终 typecheck、189 tests（25 files）、Web build、Capacitor sync、Gradle assembleDebug 通过。
- 仍非远程 Push：Realtime/应用进程必须能够接收事件；进程被杀、系统挂起、Realtime 断开时不保证通知。FCM/设备 token/服务端发送通道、真机通知权限及厂商后台策略仍待实现与验证。

## Phase 4 增量：账号注销与共享记录匿名化

- `202609080009_account_deletion.sql` 新增一次性 `account_deletion_jobs`（保存本人照片路径并保证重试幂等），将共享记录作者外键改为 `ON DELETE SET NULL`；`prepare_account_deletion` 在调用者权限下锁定账号/空间、移除成员、清理专注、撤销最后成员空间邀请并匿名化消息/事件/照片/Ping。
- `supabase/functions/delete-account/index.ts` 是唯一 service-role 边界：校验 JWT 和 expected_space，读取准备 job，校验/扫描本人空间 Storage 目录并分批删除文件，成功后调用 `auth.admin.deleteUser`。照片清理或 Auth 删除失败明确返回 prepared 状态，不能伪装成功；重复请求使用同一准备 job。
- Web/Android 只调用 Edge Function，不含管理员密钥。客户端仅收到 `deleted: true` 后清理本机空间快照、IndexedDB 待发消息、保存邮箱、本机提醒和本地会话；清理失败汇总为 warning，不篡改服务器成功结论。
- 注销后的共享记录继续展示给伴侣，但作者显示“已注销玩家”；缓存/封存/聊天/关联读取接受 null 作者，匿名 Ping 历史不会再次触发实时接收动画。
- 设置页和无空间入口均加入输入“注销账号”确认；取消不调用，expected_space 绑定当前空间。共享资料、已下载副本、不可逆、服务端部分失败均有文案。
- 数据库测试覆盖 009 迁移、准备幂等、照片路径 job、成员移除、共享作者匿名化、Auth profile/job 级联；accountCleanup 测试覆盖本机各清理步骤独立失败；AccountDeletion 浏览器 smoke 覆盖确认/取消/expected_space；当前 189 tests（25 files）通过。
- README / DATABASE / VERIFICATION 已更新迁移顺序、Edge Function service key 边界和独立云端验收清单。未经 Supabase Edge Function 部署、真实 Storage、Auth admin delete 回读，不声称线上注销完成。

## Realtime 增量：在线 Ping 系统通知

- Realtime 收到新鲜且来自伴侣的 Ping 后尝试 `BiboNative.notifications.show`；Web/未授权/系统失败不影响业务记录和页面动画。通知使用稳定 ID、通用文案和内部 `#home` 路由。
- Android 进程被系统挂起/杀死或 Realtime 断开时不保证后台通知；FCM/设备 token/服务端推送仍未交付。

## 注销链路加固与文档同步（2026-09-08）

- 注销准备 job 现在在重试时校验 expected_space，避免旧准备记录被不同空间标识误用；Edge Function 在读取 job 后确认 prepared 是合法 job ID，并读取 expected_space。
- Edge Function 清理照片时不仅使用数据库捕获的路径，还按 `space/user` 前缀扫描 Storage，覆盖元数据丢失但对象仍存在的本人文件；仅接受三段、UUID 空间、本用户目录路径，分批删除，清理失败不删除 Auth。
- 注销后的共享作者字段可为 null；聊天、首页 Ping、关联消息、离线快照都显示“已注销玩家”或保留中性记录，不把 null Ping 当成新的实时提醒。
- AccountDeletion 客户端在 `deleted: true` 后清理快照、IndexedDB 队列、保存邮箱、本机提醒和本机会话；各清理步骤独立失败并汇总 warning。服务器未确认删除时不执行这些本地清理。
- README、DATABASE、VERIFICATION 补充迁移顺序、Edge Function/service key 边界、注销语义和真实云端验收清单；文档不再把 Android 工程描述为“尚未生成”。
- AccountDeletion 浏览器 smoke、匿名作者缓存/显示测试、accountCleanup 测试和 PGlite account-deletion job 测试通过。当前最终状态：189 tests（25 files）、typecheck、format:check、Web build、Capacitor sync、Gradle assembleDebug 通过。
- `supabase/functions/delete-account` 未在本地 Deno/Supabase 项目执行，真实 Storage 扫描、service-role 删除、Auth 删除回读仍是发布前必验；绝不把本地 PGlite/浏览器替身当成线上注销证明。

## Phase 3 增量：FCM/Push 设备 token 注册层

- 安装官方 `@capacitor/push-notifications@8.1.2`（与 Capacitor core/android 8.x 兼容），Android 工程 sync 后实际编译插件服务。
- `BiboNative.push.register/unregister/listenAction`：Android 申请 Push 权限、注册 FCM token、监听点击路由；Web fallback 明确 unsupported，不使用浏览器假 token。无 `google-services.json`、权限拒绝或 token 超时都会返回失败说明。
- 新迁移 `202609080010_device_push_tokens.sql` 创建 RLS 保护的 device_installations；token 只允许当前账号读写，账号删除由 profiles 外键级联清理。客户端只登记 token/版本，不包含 service key，也不发送伴侣消息。
- Settings 增加“登记这台设备接收 Push”和撤销入口；注销本机清理额外撤销 Push token。Push 点击复用内部安全路由，不接受任意外部 URL。
- Web 浏览器 390px 验证 Push fallback、撤销按钮状态和无横向溢出；Push registration 单元测试覆盖 unsupported、成功登记、原生撤销失败不删服务器 token、成功撤销仅清理当前设备 token，不能清理账号其他设备。
- npm audit 仍为 0；typecheck、193 tests（26 files）、Web build、Capacitor sync、Gradle assembleDebug 通过。首次安装尝试 8.5.1 发现该插件版本不存在，改用 npm 实际存在的 8.1.2；未凭经验写死不存在版本。
- 真实 Firebase 项目、google-services.json、FCM 服务端发送 Edge Function、双设备后台送达和 Android 真机尚未验收；token 登记绝不等于消息送达。远程 Push 全链路仍未完成。

## Phase 3 增量：FCM 服务端发送模板与注册安全

- 添加官方 `@capacitor/push-notifications@8.1.2`。React/Android 只负责权限、FCM token 注册/刷新监听、逐设备撤销和内部点击路由；设备 token 通过 `device_installations` RLS 表登记到当前账号，单设备撤销只删除该 token，不能清掉账号其他设备。
- Settings 增加 Push 登记/撤销入口；无 Firebase 配置时 Kotlin bridge 先做 `FirebaseApp.getApps` 预检，直接返回未配置，不调用会抛 Firebase 未初始化异常的官方 register。Android 增加 Push 专用白色小图标和 `bibo_love_v1` 默认 channel。模拟器曾直接调用官方插件观察到 `Default FirebaseApp is not initialized`；加入预检后，应用路径不会主动触发这条已知配置错误。
- 新增 `supabase/functions/send-ping-push`：只接受带 `BIBO_WEBHOOK_SECRET` 的数据库 Webhook，服务端读取当前空间另一位成员的 Android token，使用 FCM HTTP v1 service account OAuth 发送最小化通知；失效 token 删除，其他 FCM 失败返回非 2xx 以便 Webhook 重试。service account、Supabase service key、Webhook secret 只在 Supabase secrets。
- Ping push 载荷只含通用标题、语义、Ping ID 和内部 `#home` 路由，不含 couple ID、聊天正文或用户 ID；客户端在线 Realtime Ping 与后台 FCM 是两条独立路径，都不声称已读/送达。
- 新增 `_shared/pingPush.ts` 合同测试、设备 token RLS/删除级联测试；当前 200 tests（28 files）、typecheck、format:check、npm audit（含生产依赖）为 0、Web build、Capacitor sync、Gradle assembleDebug 通过。
- 直接调用官方插件的模拟器验证确认无 Firebase 时会报原生“Firebase 未初始化”；这次运行是在加入预检前用于取证，不代表产品路径成功。预检 Kotlin 代码随后重新构建通过；最终完整 UI bridge 调用尚未在配置 Firebase 的模拟器上验证。
- FCM `google-services.json`、Firebase service account、Database Webhook、send-ping-push 部署、双设备送达、FCM 点击、5xx 重试和厂商后台策略仍未完成/验证。token 登记不等于远程 Push 交付。

## 注销 Storage 删除加固

- `delete-account` 清理注册路径与本人目录扫描均校验三段路径、UUID 空间和本人目录；删除后再次列举本人目录，发现残留就阻止 Auth 删除，避免 Storage API“返回成功”被当作对象消失。
- 不符合数据库路径约束的注销 job fail closed；必要时保留账号等待管理员修复和重试。此函数尚未在 Deno/Supabase 执行，仍需真实服务端验收。

## Phase 4 增量：可导出当前已加载数据

- Settings 提供“导出当前已加载的数据”，生成本地 JSON；不含图片文件、签名 URL、Auth token、记录 ID 或管理员字段，作者以本人/伴侣/已注销玩家表示。明确不包含完整分页历史。
- `spaceExport` 单元测试覆盖匿名作者、秘密/URL剥离、关联事件缺失和日期文件名；下载函数使用 Blob，未引入新依赖。浏览器 UI 受 demo/真实环境隔离，导出单元执行通过；真实用户数据未导出。

## 弱网恢复增量：事件创建/删除操作队列

- 新增 `202609080011_event_outbox.sql`：`create_event_once` 使用客户端生成 event UUID、服务端 auth.uid/current space 和 exact-row confirmation；同 UUID 重试不会重复创建。`delete_event_once` 校验当前空间，重复删除安全返回成功。
- `eventOutbox.ts` / `useEventOutbox.ts` 使用独立 IndexedDB store，最多 100 条，操作按排队顺序、固定 UUID、退避/超时/blocked 状态恢复；网络失败保留，权限/约束错误不自动循环，手动重试清退避。创建和删除的先后顺序不被早期操作退避绕过。
- `useSpace` 远端 add/delete event 改为入队，不再在离线时直接丢失意图；服务端确认后合并/移除事件并清理照片关联。演示模式保持原有 localStorage 行为。Account deletion 一次清理消息和事件队列。
- Events 页面新增同步队列，显示等待/最早重试/失败原意图，可重试或移除本机意图；照片文件上传仍要求在线，不伪装可离线。
- typecheck、205 tests（29 files）、Web build、Capacitor sync、Gradle assembleDebug 通过；PGlite 测试覆盖事件 RPC 幂等、篡改/空间/匿名边界；output/event-outbox-smoke.js 使用实际 IndexedDB + hook 验证断网入队、同 ID 重试不重复、删除确认、blocked 原文保留和退避。
- 当前边界：事件队列测试发送端为注入替身，真实 Supabase Webhook/HTTP 仍需验收；已绑定空间被服务器撤销时队列会 blocked，不会迁移到新空间。照片文件离线上传、完整操作队列导入/导出、厂商后台仍未完成。

## 事件队列后续：解绑后的本机事件意图

- 新增 InactiveEventOutbox；解除关系/重新绑定后只显示当前账号留在旧空间的创建/删除意图，当前新空间操作不泄露。旧意图可复制摘要或确认移除，不提供自动迁移/重发。
- output/inactive-event-smoke.js 用真实 IndexedDB + 实际组件验证旧事件可见、当前空间事件隐藏、取消不删除、确认只清旧记录；测试数据已清理。
- README Focus 说明已同步为：UsageStats 需本人明确授权且只在设备本地估算，不上传给伴侣。

## Android Deep Link 运行验收

- `DeepLinkPolicy` 将 Android Intent extra 和 `love.bibu.space://` data URI 转换为白名单 hash；仅允许已知页面和 message/event ID，恶意 scheme/path/query 回退为安全页面或忽略。Manifest 注册 VIEW/DEFAULT/BROWSABLE 自定义 scheme。
- Kotlin 本地测试不再依赖未 mock 的 Intent/Uri，而测试纯规则输入；11 项 Android unit tests（含 UsageWindow/ReminderPolicy/DeepLinkPolicy）通过。
- Android 35 Pixel_8_Pro AVD 实测：`am start -a VIEW -d 'love.bibu.space://chat?message=abc_123' -n love.bibu.space/.MainActivity` 返回 ok，调试 WebView 实际 `location.hash` 为 `#chat?message=abc_123`，页面标题为 BIBO。此为模拟器路由证据，不等于真实浏览器点击或真机 Android App Links 验证。
- 最新 APK 构建、Capacitor sync、Gradle unit test + assembleDebug 均通过。FCM 配置、系统通知点击和厂商策略另行验收。

## 继续验收记录：Deep Link 与 Firebase 预检

- 当前 Android 35 AVD `emulator-5554` 保持可用；安装最新 APK 后用真实 `am start -a android.intent.action.VIEW -d 'love.bibu.space://chat?message=abc_123' -n love.bibu.space/.MainActivity`，系统返回 `Status: ok`，WebView CDP 实际 hash 为 `#chat?message=abc_123`，证明 Manifest → MainActivity → Kotlin bridge → React hash 路由链路。
- 该运行环境没有 Firebase 配置；`BiboDevice.firebaseConfiguration` 实测返回 `supported=true, configured=false`。直接绕过产品预检调用官方插件曾取证到 Firebase 未初始化日志；产品入口现在先拦截，不主动触发官方异常路径。没有把无 Firebase 当成 Push 注册成功。
- 新增 FCM 默认 channel/id 图标；Push 插件和自有 Kotlin bridge build 通过。FCM 配置后仍需真实权限弹窗、token、Webhook 和双设备验证。

## Web 离线壳：Service Worker 资源缓存

- 新增 `public/sw.js`，仅缓存同源 `/`、`index.html`、`assets/`、本地 `/demo/` 和 favicon；Service Worker 自身不缓存，POST、Supabase REST、Storage、Functions 路径一律不缓存，避免私密响应/签名 URL进入离线 Cache Storage。
- 导航请求 network-first，网络失败回退已缓存 index；静态资源 cache-first；版本切换清理旧的 BIBO shell cache。`main.tsx` 仅生产环境注册，注册失败只警告，不影响页面。
- 与主动开启的 spaceCache 分工：Service Worker 提供页面壳，spaceCache 提供按账号校验的业务快照；首次从未联网打开不能凭空离线启动，业务缓存仍默认关闭。
- 3 项 policy 测试覆盖同源静态资源、API/Storage/Functions 排除、非 GET 与导航识别。preview 浏览器实测 cache key 为 bibo-shell-20260908-v1，缓存了构建资源/演示图片且 `apiCached=false`；切换离线后页面标题和 Home 标题正常加载、受 SW 控制、无 pageerror，随后恢复在线。
- 当前未在 Android WebView 冷启动验证 Service Worker，亦未缓存 Supabase 数据；这不是远程 Push/后台同步替代品。整体目标继续进行中。

## 2026-09-08 当前回归基线

- 迁移链当前为初始 SQL + 202609080001–202609080012，必须按文件名顺序执行；README/DATABASE 已同步到 012。
- TypeScript/Vitest 当前 208 tests（30 files）通过；`npm run format:check`、`npm run typecheck`、`npm run test`、`npm run build`、`npm audit --omit=dev`（0）通过。
- `npm run android:build` 当前可完成 Web build、Capacitor sync、Android debug APK；最新构建含 Push Notifications、Firebase 配置预检、Deep Link、事件队列和 Service Worker 资源。
- Android 35 AVD 曾实际验证自定义 Deep Link；没有 Firebase 配置时实际 `BiboDevice.firebaseConfiguration` 为 false。不存在真机、真实 Supabase、FCM 或 Edge Function 的当前运行证据，相关目标继续标记为未验收。

## Android WebView 离线壳验收

- 最新 APK 安装到 Android 35 Pixel_8_Pro 后，Capacitor origin `https://localhost` 支持 Service Worker；首次 3 秒查询仍处于注册前窗口，手动触发 registration 作为诊断确认脚本可激活。随后等待 500ms，实际 `navigator.serviceWorker.controller=true`、scope 为 `https://localhost/`、Cache Storage 包含 `bibo-shell-20260908-v1`。
- Logcat 确认 `https://localhost/sw.js` 由 Capacitor 本地服务提供，BiboDevice 和 PushNotifications 均正常注册；没有把首次尚未 controller 当作失败。
- 这证明 Android WebView 可以使用静态离线壳；尚未做断网冷启动/强制停止后的业务快照恢复，因此仍不能声称 Android 全离线可靠。

## 数据导出运行验收

- 2026-09-08 在本地演示浏览器实际调用 `downloadSpace`：生成 `application/json` Blob，大小 2130 bytes，文件名 `bibo-space-2026-09-08.json`，schema=1、scope=`currently_loaded`。
- 对生成内容检查无 `token=`、`access_token`、`service_role`、演示账号 ID；导出仅使用演示数据，不访问真实账号。

## 移动端聊天体验增量：会话级草稿恢复

- Chat 草稿按当前账号和空间写入 sessionStorage，延迟 180ms 保存，最多 24 小时；切换组件或刷新后恢复，空草稿立即清除。不会进入 Supabase、spaceCache 或导出文件，避免把未发送私密内容长期落盘。
- 与发送 revision 保护结合：成功只清除未被编辑的提交草稿；发送失败、新输入和同文重新输入都保留。账户注销时已有本机会话清理会随账号会话结束，页面关闭也由浏览器清理 sessionStorage。
- 新增 3 项存储测试；重新执行实际 Chat 组件浏览器 smoke，验证刷新/重挂载恢复“刷新后仍在的草稿”，并再次验证发送中输入保护。
- 本轮浏览器测试数据恢复原始 `bibo-chat-draft-v1:demo-me:demo`；无真实账号数据。

## 离线壳更新安全修复

- Service Worker 不再缓存 `/sw.js` 自身，避免旧脚本阻止版本更新；版本淘汰只处理 `bibo-shell-*` 旧缓存。
- 更新后的 preview 实测 controller=true、`hasServiceWorkerScript=false`、`apiCached=false`，静态资源仍可由 `bibo-shell-20260908-v1` 提供。
- 212 tests、typecheck、format:check、Web build 继续通过；Android WebView 之前的 Service Worker 注册证据仍有效，尚未重新做 Android 冷启动。

## Events 长期维护：编辑事件

- 新增 `202609080012_event_edit.sql` 的 `update_event_once` RPC：只允许当前空间成员编辑，服务端应用标题/时间/类型/年度/图标/分类校验并返回真实行；已注销创建者不阻止剩余成员维护事件。不存在事件、跨空间和匿名请求拒绝。
- Event outbox 扩展 update 操作，固定 event ID，编辑结果不创建副本；创建/编辑共享 exact-row confirmation，网络不确定时按当前队列顺序退避重试。
- EventForm 支持创建/编辑复用，保留本机时区 datetime-local；Events 卡片提供编辑入口，演示/真实路径文案区分“修改已保存”和“修改意图已保存在本机”。
- 新增时间输入与 update confirmation 测试；output/event-edit-smoke.js 实际演示浏览器验证已有事件加载、修改标题/类型/年度、刷新持久化、390px 无溢出、无 pageerror，测试后恢复原始演示数据。
- 本轮最终 TypeScript 检查、测试和构建已通过；数据库新迁移未部署，真实云端编辑权限与多人并发尚未验收。

## Events 分类筛选与移动端修复（2026-09-08）

- Events 列表新增日常小事/纪念日/约会/旅行/生日分类筛选；新演示数据补充 travel/birthday/date 分类，真实旧行缺分类仍显示为日常小事，不改写云端旧记录。
- 初次 320px 验收发现分类控件作为 nowrap flex item 溢出到 393px；通过移动端换行和 100% flex-basis 修复，没有隐藏筛选功能。修复后 Travel/Birthday 筛选均正确，320px 无横向溢出。
- 回归：215 TypeScript/Vitest tests、typecheck、format:check、Web build、Capacitor sync、Gradle assembleDebug 通过。

## 账号退出/注销隐私修复：会话聊天草稿清理

- Chat 草稿虽然只在 sessionStorage，但退出登录或账号注销后仍可能留在当前浏览器会话。新增按 userId 批量清理，删除前先拍快照避免遍历时跳过 key；不碰其他账号的草稿。
- AccountDeletion 成功后的本机清理加入聊天草稿；普通退出登录和无空间入口退出也清理当前账号草稿。云端注销未确认时不提前删除，避免服务器失败导致不可恢复的本机数据丢失。
- 新增测试覆盖多空间同账号清理、其他账号保留和清理异常；现有 Chat 草稿恢复/发送保护继续通过。
- 本轮测试最初暴露测试 sessionStorage 替身缺少 key/length，补齐后 216 tests（31 files）通过。

## 事件队列语义修复

- 旧空间事件意图面板现在区分创建、编辑、删除三种操作；编辑意图不再误显示为删除，避免用户在解绑后错误理解本机数据。
- typecheck、216 tests、format/build 回归中的 TypeScript/Vitest 部分通过；剩余 Android build 由事件编辑回归基线覆盖。
