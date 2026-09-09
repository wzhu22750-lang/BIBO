# Pixel Pet / Wardrobe 视觉适配优化 Walkthrough

本次迭代**不新增任何功能**，只解决"装备与角色视觉适配"问题：建立角色视觉档案、
装备兼容性矩阵、角色级覆写、Visual QA 工具链，并逐组合修复穿模 / 悬空 / 比例错误。

> 说明：任务描述中提到"17 个角色"，当前代码库实际为 **16 款角色**
> （`CHARACTER_IDS`：dog…owl，与衣橱页文案"16 款小动物"一致，不存在第 17 个角色/龙）。
> 本次对全部 16 款角色逐一建立了视觉基准与适配参数。

---

## 1. 修改了哪些视觉问题

所有结论均来自像素级测量（`scripts/qa/measure.py` 解析角色/装备 SVG path 并栅格化）

- 全组合接触表渲染（`scripts/qa/sheets.test.tsx` → `scripts/qa/out/*.png`）的实际目视检查。

| #   | 问题                      | 表现                                                                             | 修复                                                                                                |
| --- | ------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | **帽子悬空**              | 小兔颅顶在 y=32（长耳之间），旧 head 锚点 y=24，所有帽子浮在耳间空中、与头脱节   | 小兔 head 锚点改为 y=38（颅顶+6），帽底（局部 y=-2）压住颅顶 4px                                    |
| 2   | **帽座不贴颅顶**          | 小猫/考拉颅顶 y=16，旧锚点 16/18，帽子与黑色额带之间留缝                         | 全角色统一规则 `head.y = skullTopY + 6`（猫/考拉 22、羊 12、其余 14）                               |
| 3   | **基础立绘破图**          | 熊猫白色肚皮 path 终点 x=76 超出身体轮廓，右下出现白色楔形穿模                   | 修正 `characters.ts` 熊猫 belly 子路径起点（`m-24 36h32v12H24z`）                                   |
| 4   | **游泳圈勒脖子/糊脸**     | `a_beach_swim_ring` 用 front 锚点，在仓鼠/龙猫/羊/水獭身上横穿嘴部               | 新增 `waist` 锚点类型，逐角色定义腰部中心；游泳圈改吸 waist                                         |
| 5   | **吐司咬不到嘴**          | `a_toast_mouth` 用 front-8 全局偏移，狗/猫/狐/考拉等嘴高不同，吐司糊在鼻子或下巴 | 新增 `mouth` 锚点类型（逐角色嘴/喙中心），吐司改吸 mouth                                            |
| 6   | **围巾双层穿模**          | 企鹅/仓鼠基础立绘自带围巾/围嘴，再叠红围巾出现双层堆叠                           | `a_red_scarf.characterOverrides.{penguin,hamster}.visible=false`                                    |
| 7   | **四只耳朵杂乱构图**      | 猫耳发箍/鹿角发箍戴在长耳（兔、龙猫）或耳羽（ owl）头上，耳朵叠耳朵              | `h_cat_ears` 对 bunny/chinchilla/owl 不兼容；`h_deer_antlers` 对 bunny/chinchilla 不兼容            |
| 8   | **宽躯干衣服显窄**        | 熊/熊猫/水獭/羊躯干 45–57px，衣服资产 37px，两侧露毛                             | 视觉档案 `clothesScale`：bear/panda 1.1、otter 1.08、sheep 1.06                                     |
| 9   | **随机/套装抽到不适配件** | 随机穿搭与一键套装无视兼容性                                                     | `getRandomOutfit(charId)` 只从兼容池抽取；`resolveSetForCharacter` 自动跳过不适配单品并在套装卡提示 |

## 2. 哪些角色增加了特殊适配

| 角色               | 特殊适配                                                              |
| ------------------ | --------------------------------------------------------------------- |
| bunny              | 帽座 y=38（颅顶 32，长耳之间）；waist 64；mouth 46；禁用猫耳/鹿角发箍 |
| cat / koala        | 帽座 y=22（颅顶 16，避开黑色额带/大圆耳）                             |
| sheep              | 帽座 y=12（云绒顶 6）；clothesScale 1.06；earStyle=horns              |
| penguin            | mouth=35（喙）；waist=64（避开基础围巾）；禁用红围巾                  |
| hamster            | 禁用红围巾（自带围嘴）；waist=60                                      |
| duck / chick / owl | mouth 取喙中心（36/35/31）                                            |
| bear / panda       | clothesScale 1.1                                                      |
| otter              | clothesScale 1.08                                                     |
| owl                | 禁用猫耳发箍（耳羽冲突）                                              |
| chinchilla         | 禁用猫耳/鹿角发箍（大耳冲突）                                         |

其余角色共享统一规则但拥有**逐角色测量**的 mouth/waist/躯干参数——
"统一艺术风格，不统一动物几何结构"。

## 3. 哪些装备被限制兼容角色

| 装备                        | 不兼容角色             | 原因                                  |
| --------------------------- | ---------------------- | ------------------------------------- |
| `a_red_scarf` 暖红毛线围巾  | penguin、hamster       | 基础立绘自带围巾/围嘴，双层穿模       |
| `h_cat_ears` 萌系猫耳发箍   | bunny、chinchilla、owl | 长耳/大耳/耳羽 + 发箍耳 = 四耳杂乱    |
| `h_deer_antlers` 萌鹿角发箍 | bunny、chinchilla      | 鹿角需要干净头顶空间，与长耳/大耳穿模 |

其余 60+ 装备默认全角色兼容；`compatibleCharacters` 白名单字段已就绪供未来使用。

## 4. anchor / scale / offset 系统如何工作

解析管线（`src/lib/pet/compatibility.ts#resolveItemPlacement`），后者覆盖前者：

1. **角色锚点表** `CHARACTER_ANCHORS[char][item.anchor]`
   — 8 类锚点：`head`(帽座) `body`(衣服) `front`(胸前) `hand`(手持) `back`(背负)
   `accessory`(特效) `mouth`(口部) `waist`(环身)，全部逐角色像素测量；
2. **视觉档案图层比例** `CharacterVisualProfile.{hat,clothes,accessory,special}Scale`
   （宽躯干补偿）；
3. **装备全局** `item.offset` / `item.scale`；
4. **角色级覆写** `item.characterOverrides[char] = { offset?, scale?, visible? }`
   （`visible:false` 即兼容性矩阵的 incompatible 入口；旧 `characterOffsets` 仍被合并，保持向后兼容）。

最终 `translate(x, y) scale(s)` 在单一 SVG viewBox(0 0 80 88) 内原子合成，
图层顺序固定 `base → clothes → hat → accessory → special`（`LAYER_ORDER`）。

**CharacterVisualProfile**（`visualProfiles.ts`）为每个角色记录：
bodyBounds / headBounds / torsoBounds / faceCenter / leftEar / rightEar / earStyle /
skullTopY / neckY / mouth / waist / 各图层 anchor+scale —— 即任务要求的角色适配系统，
且锚点真源仍保留在 `CHARACTER_ANCHORS`（档案引用它，避免双真源）。

**兼容性矩阵 API**：`getCompatibilityStatus()` → `compatible | incompatible | custom`、
`isItemCompatible()`、`filterCompatibleItems()`、`resolveSetForCharacter()`。
衣橱网格对 incompatible 单品置灰 + "不适配"徽章并禁止穿戴；套装卡显示
"部分单品不适配当前角色，将自动跳过"。

**数据兼容**：`normalizeOutfit/normalizeOutfits` 未改动——旧存档里即使存了被限制装备
也仍能解析（渲染层跳过、UI 置灰），Supabase 持久化结构零变更。

## 5. 做了哪些视觉 QA

1. **像素测量**：`scripts/qa/measure.py` 解析全部 16 角色 × 63 件装备的 path 数据，
   栅格化输出包围盒、逐行跨度、颈线、五官位置（`scripts/qa/measurements.json`），
   锚点数值全部由此推导而非拍脑袋。
2. **全组合接触表**：`QA_SHEETS=1 npx vitest run scripts/qa/sheets.test.tsx`
   生成 16 角色 × (21 帽 + 21 衣 + 21 配饰 + 10 套装) 的 SVG 接触表，
   `rsvg-convert` 转 PNG 后逐行目视检查（修复前/后各一轮），
   并对问题单元格 4× 放大复核（兔贝雷帽悬空、熊猫楔形、仓鼠游泳圈糊脸、狗吐司等）。
3. **真机页面截图**：`node scripts/qa/shoot.mjs`（CDP 无头 Chrome，demo 模式）
   截取 Home / Wardrobe / Wardrobe QA / Focus / Chat / Settings 六页，
   确认同一角色（猫：蓝卫衣+红贝雷；兔：粉卫衣）在各页渲染完全一致（`scripts/qa/out/pages/`）。
4. **Visual QA 面板（仅开发环境）**：`#wardrobe?mode=qa`
   （`import.meta.env.DEV` 门控，生产构建不渲染）。支持：
   角色 → 分类 → 单品选择、最终 SVG 大图、Base/Clothes/Hat/Accessory/Special 图层开关、
   实时显示 anchor / itemOffset / characterOffset / layerScale / overrideScale /
   finalPosition / status / profile 参数，以及"角色 × 分类"缩略矩阵与套装跳过清单。
5. **自动化测试**：新增 `src/lib/pet/compatibility.test.ts`（13 个用例）：
   档案完整性、mouth/waist 锚点全覆盖、帽座=颅顶+6、全装备×全角色可解析、
   兼容/不兼容判定、incompatible 渲染跳过（SSR 断言无图层节点）、
   吐司/游泳圈吸附、宽躯干比例补偿、套装跳过与"至少保留一件"、随机池纯净性、
   存量数据 normalize 兼容。

## 6. 测试结果

```
npm test            → 41 passed | 1 skipped (42 files), 283 passed | 1 skipped (284)
npm run typecheck   → tsc -b 通过
npm run format:check→ All matched files use Prettier code style!
npm run build       → ✓ built（仅既有 chunk >500kB 提示，与本次无关）
```

未触碰：登录/情侣关系/FCM/提醒/照片/聊天/Supabase 持久化；
未新增商城/解锁/收藏/成就/货币系统。

## 7. 仍然存在的视觉问题（已知且接受）

1. **同色系碰撞**：嫩黄渔夫帽×黄鸭、白厨师帽/睡帽×白羊、红贝雷×小鸡红呆毛——
   有黑色描边兜底、剪影可读，但对比度偏低，属资产配色问题而非适配问题。
2. **宽檐帽压侧耳**：草编遮阳帽/侦探帽（檐宽 49–53px）在考拉/羊/龙猫身上
   会从大耳前方横切——像素艺术"帽戴在耳上"的常规约定，刻意保留。
3. **非整数 clothesScale**（1.06/1.08/1.1）在极小尺寸（28px ribbon）下
   像素栅格略有不均；crispEdges 保证边缘锋利，肉眼在常规尺寸不可辨。
4. **宇航面罩×小兔**：面罩下沿与眼睛上缘有 ~2px 重叠，作为"面罩压脸"语义保留。
5. 青蛙 faceCenter 位于眼泡（其眼睛即眼泡），若未来新增"贴脸"类道具需单独测量。

---

**结论**：装备仍是通用资产，但每件装备在每个角色身上的位置/比例/可见性
都由"角色锚点 → 视觉档案 → 装备默认 → 角色覆写"四级管线解析；
不适合的组合被显式标记 incompatible 而非强行渲染。
16 款角色结构各异（长耳兔、圆耳考拉、有角羊、无耳企鹅……），
但共享同一画布、描边与阴影语言——它们看起来属于同一个完整的 Pixel Art 世界。
