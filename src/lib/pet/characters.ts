import type { ReactNode } from 'react'
import { createElement } from 'react'
import { CHARACTER_ANCHORS } from './anchors'
import type { CharacterDefinition, CharacterId } from './types'

export type CharacterMeta = CharacterDefinition & {
  renderBase: () => ReactNode
}

export const CHARACTER_LIST: CharacterMeta[] = [
  {
    id: 'dog',
    name: '小狗',
    tag: '忠诚活泼',
    description: '随时摇尾巴等待你的忠诚伙伴，精力充沛元气满满。',
    anchors: CHARACTER_ANCHORS.dog,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-dog' },
        createElement('path', {
          fill: '#171917',
          d: 'M12 4h16v4h24V4h16v16h-4v28h-4v8h4v8h8v16H16V64h8v-8h-4v-8h-8V20h4z',
        }),
        createElement('path', {
          fill: '#ea9937',
          d: 'M16 8h12v8h24V8h12v28h-8v8H24v-8h-8z',
        }),
        // 额头微光
        createElement('path', {
          fill: '#fed7aa',
          d: 'M32 12h16v4H32z',
        }),
        createElement('path', {
          fill: '#fff1d6',
          d: 'M24 16h4v4h-4zm28 0h4v4h-4zm-28 12h32v16H24zm4 20h24v8H28z',
        }),
        createElement('path', {
          fill: '#ff8595',
          d: 'M20 8h4v8h-4zm36 0h4v8h-4zm-40 28h8v4h-8zm40 0h8v4h-8z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M24 24h8v8h-8zm24 0h8v8h-8zm-12 8h8v4h-8zm-4 8h16v4H32z',
        }),
        // 眼睛灵动高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M24 24h4v4h-4zm24 0h4v4h-4z',
        }),
        // 工装背带裤
        createElement('path', {
          fill: '#0284c7',
          d: 'M24 56h32v8h8v12H16V64h8zm2-6h4v6h-4zm24 0h4v6h-4z',
        }),
        // 背带裤小金扣
        createElement('path', {
          fill: '#fbbf24',
          d: 'M38 60h4v3h-4z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M28 68h4v8h-4zm20 0h4v8h-4z',
        }),
      ),
  },
  {
    id: 'cat',
    name: '小猫',
    tag: '傲娇元气',
    description: '外表傲娇内心粘人的橘猫，最喜欢在你手边打滚撒娇。',
    anchors: CHARACTER_ANCHORS.cat,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-cat' },
        createElement('path', {
          fill: '#171917',
          d: 'M12 8h16v8h24V8h16v40h-8v8h-4v8h8v16H16V64h8v-8h-4v-8h-8z',
        }),
        createElement('path', {
          fill: '#ffbb53',
          d: 'M16 12h8v12h32V12h8v32h-8v8H24v-8h-8z',
        }),
        // 额头微光
        createElement('path', {
          fill: '#ffedd5',
          d: 'M32 16h16v4H32z',
        }),
        createElement('path', {
          fill: '#ffe8b9',
          d: 'M24 32h32v16H24z',
        }),
        createElement('path', {
          fill: '#ff817b',
          d: 'M16 16h4v8h-4zm44 0h4v8h-4zM20 36h8v4h-8zm32 0h8v4h-8z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M24 28h8v8h-8zm24 0h8v8h-8zM36 36h8v4h-8zm-4 8h16v4H32z',
        }),
        // 眼睛灵动高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M24 28h4v4h-4zm24 0h4v4h-4z',
        }),
        // 背带裙
        createElement('path', {
          fill: '#0beca0',
          d: 'M28 56h24v8h8v12H20V64h8zm-2-6h4v6h-4zm24 0h4v6h-4z',
        }),
        // 背带小扣
        createElement('path', {
          fill: '#facc15',
          d: 'M38 60h4v3h-4z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M28 68h4v8h-4zm20 0h4v8h-4z',
        }),
      ),
  },
  {
    id: 'bunny',
    name: '小兔',
    tag: '软萌温柔',
    description: '耳朵长长的大眼兔，无论何时都给你最温柔的倾听。',
    anchors: CHARACTER_ANCHORS.bunny,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-bunny' },
        createElement('path', {
          fill: '#171917',
          d: 'M16 0h16v24h16V0h16v32h4v20h-8v8h-4v4h8v16H16V64h8v-4h-4v-8h-8V32h4z',
        }),
        createElement('path', {
          fill: '#fff6ec',
          d: 'M20 4h8v28h24V4h8v32h4v12h-8v8H24v-8h-8V36h4z',
        }),
        createElement('path', {
          fill: '#ff94d9',
          d: 'M24 8h4v20h-4zm28 0h4v20h-4zM20 44h8v4h-8zm32 0h8v4h-8z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M28 36h4v8h-4zm20 0h4v8h-4zM36 44h8v4h-8z',
        }),
        createElement('path', {
          fill: '#ff88e1',
          d: 'M28 60h24v8h8v8H20v-8h8z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M28 72h4v4h-4zm20 0h4v4h-4z',
        }),
      ),
  },
  {
    id: 'bear',
    name: '小熊',
    tag: '憨厚温暖',
    description: '厚实可靠的棕熊先生，给你最安稳的大拥抱。',
    anchors: CHARACTER_ANCHORS.bear,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-bear' },
        createElement('path', {
          fill: '#171917',
          d: 'M8 4h20v4h24V4h20v20h-4v28h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24H8z',
        }),
        createElement('path', {
          fill: '#8d5b36',
          d: 'M12 8h12v8h32V8h12v28h-8v8H20v-8h-8z',
        }),
        // 额头微光
        createElement('path', {
          fill: '#b47b4d',
          d: 'M32 12h16v4H32z',
        }),
        createElement('path', {
          fill: '#ffe0a6',
          d: 'M16 8h4v8h-4zm44 0h4v8h-4zm-36 24h32v16H24z',
        }),
        createElement('path', {
          fill: '#ffa6e8',
          d: 'M16 36h8v4h-8zm40 0h8v4h-8zm-24 16h16v4H32zm-4 4h24v4H28z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M24 28h8v8h-8zm24 0h8v8h-8zm-12 4h8v4h-8zm0 8h8v4h-8z',
        }),
        // 眼睛晶亮高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M24 28h4v4h-4zm24 0h4v4h-4z',
        }),
        // 背带裤
        createElement('path', {
          fill: '#ffb703',
          d: 'M24 60h32v8h8v12H16V68h8zm2-8h4v8h-4zm24 0h4v8h-4z',
        }),
        // 蜜糖小纽扣
        createElement('path', {
          fill: '#fbbf24',
          d: 'M38 62h4v3h-4z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M24 72h4v8h-4zm28 0h4v8h-4z',
        }),
      ),
  },
  {
    id: 'panda',
    name: '熊猫',
    tag: '治愈呆萌',
    description: '慢悠悠啃竹子的大滚滚，治愈一整天的所有疲惫。',
    anchors: CHARACTER_ANCHORS.panda,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-panda' },
        createElement('path', {
          fill: '#171917',
          d: 'M8 4h20v4h24V4h20v20h-4v28h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24H8z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M12 8h12v12H12zm44 0h12v12H56zm-36 16h16v16H20zm24 0h16v16H44zm-28 32h48v16h-4v8h-4v-8H24v8h-4v-8h-4z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M24 12h32v12h8v24h-8v8H24v-8h-8V24h8zm4 16h4v4h-4zm20 0h4v4h-4zm-24 36h32v12H24z',
        }),
        createElement('path', {
          fill: '#ff94d9',
          d: 'M16 40h8v4h-8zm40 0h8v4h-8z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M36 36h8v4h-8zm-4 8h16v4H32z',
        }),
        // 眼睛水灵高光（黑眼圈内）
        createElement('path', {
          fill: '#ffffff',
          d: 'M26 26h4v4h-4zm20 0h4v4h-4z',
        }),
        // 背带裤
        createElement('path', {
          fill: '#2aeea4',
          d: 'M24 56h32v8H24zm2-6h4v6h-4zm24 0h4v6h-4z',
        }),
        // 小金徽章
        createElement('path', {
          fill: '#facc15',
          d: 'M38 58h4v3h-4z',
        }),
      ),
  },
  {
    id: 'fox',
    name: '狐狸',
    tag: '灵动机智',
    description: '古灵精怪的橘色小狐，总能想出逗你开心的小点子。',
    anchors: CHARACTER_ANCHORS.fox,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-fox' },
        createElement('path', {
          fill: '#171917',
          d: 'M8 0h16v8h32V0h16v28h-4v24h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V28H8z',
        }),
        createElement('path', {
          fill: '#f97316',
          d: 'M12 4h8v16h40V4h8v28h-8v8H20v-8h-8z',
        }),
        // 额头微光
        createElement('path', {
          fill: '#fbbf24',
          d: 'M36 12h8v4h-8z',
        }),
        createElement('path', {
          fill: '#fffef7',
          d: 'M16 4h4v12h-4zm44 0h4v12h-4zm-44 28h16v12h16V32h16v8h-8v8H24v-8h-8zm16 24h16v16H32z',
        }),
        createElement('path', {
          fill: '#ff94d9',
          d: 'M16 40h8v4h-8zm40 0h8v4h-8z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M24 24h8v6h-8zm24 0h8v6h-8zm-12 12h8v4h-8zm0 8h8v4h-8z',
        }),
        // 眼睛灵动高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M24 24h3v3h-3zm24 0h3v3h-3z',
        }),
        // 探险马甲
        createElement('path', {
          fill: '#0d9488',
          d: 'M20 56h40v8h4v12H16V64h4zm6-4h4v4h-4zm24 0h4v4h-4z',
        }),
        // 徽章纽扣
        createElement('path', {
          fill: '#facc15',
          d: 'M38 60h4v3h-4z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M28 68h4v8h-4zm20 0h4v8h-4z',
        }),
      ),
  },
  {
    id: 'penguin',
    name: '企鹅',
    tag: '摇摆可爱',
    description: '摇摇晃晃的南极小企鹅，戴着标志性围巾踏雪而来。',
    anchors: CHARACTER_ANCHORS.penguin,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-penguin' },
        createElement('path', {
          fill: '#171917',
          d: 'M20 4h40v4h8v16h4v28h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24h4V8h4z',
        }),
        createElement('path', {
          fill: '#1e293b',
          d: 'M24 8h32v8h8v36H16V16h8z',
        }),
        createElement('path', {
          fill: '#f8fafc',
          d: 'M24 16h32v36h-4v8H28v-8h-4z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M28 24h6v8h-6zm18 0h6v8h-6z',
        }),
        // 眼睛晶亮高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M28 24h3v3h-3zm18 0h3v3h-3z',
        }),
        createElement('path', {
          fill: '#f59e0b',
          d: 'M34 32h12v6H34zm-14 40h12v4H20zm28 0h12v4H48z',
        }),
        createElement('path', {
          fill: '#ffa6e8',
          d: 'M20 32h6v4h-6zm34 0h6v4h-6z',
        }),
        createElement('path', {
          fill: '#ef4444',
          d: 'M20 48h40v8H20zm24 8h8v12h-8z',
        }),
        // 围巾搭扣
        createElement('path', {
          fill: '#facc15',
          d: 'M42 50h4v4h-4z',
        }),
      ),
  },
  {
    id: 'duck',
    name: '鸭子',
    tag: '乐天快活',
    description: '嘎嘎叫的小黄鸭，头脑简单快乐加倍，自带喜感。',
    anchors: CHARACTER_ANCHORS.duck,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-duck' },
        createElement('path', {
          fill: '#171917',
          d: 'M20 4h40v4h8v16h4v28h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24h4V8h4z',
        }),
        createElement('path', {
          fill: '#facc15',
          d: 'M24 8h32v8h8v36H16V16h8z',
        }),
        // 额头绒羽微光
        createElement('path', {
          fill: '#fef08a',
          d: 'M34 8h12v4H34z',
        }),
        createElement('path', {
          fill: '#f97316',
          d: 'M28 32h24v8H28zm-8 40h12v4H20zm28 0h12v4H48z',
        }),
        createElement('path', {
          fill: '#fb7185',
          d: 'M20 36h6v4h-6zm34 0h6v4h-6z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M28 24h6v8h-6zm18 0h6v8h-6z',
        }),
        // 眼睛水灵高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M28 24h3v3h-3zm18 0h3v3h-3z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M28 48h24v4H28z',
        }),
        createElement('path', {
          fill: '#0284c7',
          d: 'M24 52h32v8h8v12H16V60h8z',
        }),
        // 水手领结扣
        createElement('path', {
          fill: '#facc15',
          d: 'M38 54h4v3h-4z',
        }),
      ),
  },
  {
    id: 'frog',
    name: '青蛙',
    tag: '幸运元气',
    description: '头顶大眼睛的幸运小青蛙，呱呱一声送来满分好运。',
    anchors: CHARACTER_ANCHORS.frog,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-frog' },
        createElement('path', {
          fill: '#171917',
          d: 'M12 0h20v8h16V0h20v24h-4v28h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24H8V0z',
        }),
        createElement('path', {
          fill: '#4ade80',
          d: 'M16 4h12v12h24V4h12v32h-8v8H24v-8h-8z',
        }),
        // 额头微光
        createElement('path', {
          fill: '#86efac',
          d: 'M32 14h16v4H32z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M20 4h8v12h-8zm32 0h8v12h-8z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M24 8h4v6h-4zm32 0h4v6h-4zm-32 24h32v4H24z',
        }),
        // 眼睛瞳孔高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M24 8h2v2h-2zm32 0h2v2h-2z',
        }),
        createElement('path', {
          fill: '#fef08a',
          d: 'M28 36h24v16H28z',
        }),
        createElement('path', {
          fill: '#f43f5e',
          d: 'M16 32h8v4h-8zm40 0h8v4h-8z',
        }),
        createElement('path', {
          fill: '#04bcf0',
          d: 'M24 56h32v8h8v12H16V64h8zm2-6h4v6h-4zm24 0h4v6h-4z',
        }),
        // 幸运小金扣
        createElement('path', {
          fill: '#facc15',
          d: 'M38 60h4v3h-4z',
        }),
      ),
  },
  {
    id: 'hamster',
    name: '仓鼠',
    tag: '腮帮吃货',
    description: '两腮鼓囊囊的小仓鼠，里面藏满了爱吃的小零食。',
    anchors: CHARACTER_ANCHORS.hamster,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-hamster' },
        createElement('path', {
          fill: '#171917',
          d: 'M12 4h16v4h24V4h16v16h8v24h-8v8h-4v8h8v16H8V64h8v-8h-4v-8H4V24h8V4z',
        }),
        createElement('path', {
          fill: '#e09f58',
          d: 'M16 8h12v8h24V8h12v20h8v16h-8v8H16v-8H8V28h8z',
        }),
        // 额头微光
        createElement('path', {
          fill: '#fed7aa',
          d: 'M32 12h16v4H32z',
        }),
        createElement('path', {
          fill: '#fff5ea',
          d: 'M16 32h48v16H16z',
        }),
        createElement('path', {
          fill: '#ff80bf',
          d: 'M20 8h4v6h-4zm36 0h4v6h-4zm-44 28h8v6h-8zm48 0h8v6h-8z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M24 24h8v8h-8zm24 0h8v8h-8zm-12 8h8v4h-8zm-2 8h12v4H34z',
        }),
        // 眼睛水灵高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M24 24h4v4h-4zm24 0h4v4h-4zm-6 16h4v2h-4z',
        }),
        createElement('path', {
          fill: '#f43f5e',
          d: 'M34 52h12v4H34zm-4 4h20v6H30zm4 6h12v4H34z',
        }),
        createElement('path', {
          fill: '#c084fc',
          d: 'M24 64h32v8H24zm2-8h4v8h-4zm24 0h4v8h-4z',
        }),
        // 金黄小贴袋扣
        createElement('path', {
          fill: '#fbbf24',
          d: 'M38 64h4v3h-4z',
        }),
      ),
  },
  {
    id: 'chick',
    name: '小鸡',
    tag: '萌趣好奇',
    description: '头上顶着小呆毛的绒毛雏鸡，对世界充满好奇心。',
    anchors: CHARACTER_ANCHORS.chick,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-chick' },
        createElement('path', {
          fill: '#171917',
          d: 'M32 0h16v4H32zm-12 4h40v4h8v16h4v28h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24h4V8h4z',
        }),
        createElement('path', {
          fill: '#ef4444',
          d: 'M36 0h8v4h-8z',
        }),
        createElement('path', {
          fill: '#fde047',
          d: 'M24 8h32v8h8v36H16V16h8z',
        }),
        // 额头微光
        createElement('path', {
          fill: '#fef9c3',
          d: 'M32 10h16v4H32z',
        }),
        createElement('path', {
          fill: '#f97316',
          d: 'M36 32h8v6h-8zm-12 40h8v4h-8zm24 0h8v4h-8z',
        }),
        createElement('path', {
          fill: '#fb7185',
          d: 'M20 32h8v4h-8zm32 0h8v4h-8z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M28 24h6v6h-6zm18 0h6v6h-6z',
        }),
        // 眼睛灵动高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M28 24h3v3h-3zm18 0h3v3h-3z',
        }),
        createElement('path', {
          fill: '#22c55e',
          d: 'M24 52h32v8h8v12H16V60h8zm2-4h4v4h-4zm24 0h4v4h-4z',
        }),
        // 雏菊小扣
        createElement('path', {
          fill: '#ffffff',
          d: 'M38 56h4v3h-4z',
        }),
      ),
  },
  {
    id: 'koala',
    name: '考拉',
    tag: '安心慢热',
    description: '慢吞吞的考拉宝宝，只想紧紧抱住你开启赖床模式。',
    anchors: CHARACTER_ANCHORS.koala,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-koala' },
        createElement('path', {
          fill: '#171917',
          d: 'M4 8h16v8h40V8h16v24h-8v16h-4v8h4v8h8v16H4V72h8v-8h4v-8h-4V40H4V8z',
        }),
        createElement('path', {
          fill: '#f1f5f9',
          d: 'M8 12h8v16H8zm56 0h8v16h-8z',
        }),
        createElement('path', {
          fill: '#94a3b8',
          d: 'M16 16h48v32h-8v8H24v-8h-8z',
        }),
        // 额头微光
        createElement('path', {
          fill: '#cbd5e1',
          d: 'M32 16h16v4H32z',
        }),
        createElement('path', {
          fill: '#1e293b',
          d: 'M34 28h12v16H34z',
        }),
        createElement('path', {
          fill: '#f472b6',
          d: 'M20 36h8v4h-8zm32 0h8v4h-8z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M24 24h6v6h-6zm26 0h6v6h-6z',
        }),
        // 眼睛安心高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M24 24h3v3h-3zm26 0h3v3h-3z',
        }),
        createElement('path', {
          fill: '#facc15',
          d: 'M24 56h32v8h8v12H16V64h8zm2-6h4v6h-4zm24 0h4v6h-4z',
        }),
        // 桉树叶小纽扣
        createElement('path', {
          fill: '#15803d',
          d: 'M38 60h4v3h-4z',
        }),
      ),
  },
  // ================= 5款全新扩充小动物 =================
  {
    id: 'chinchilla',
    name: '龙猫',
    tag: '软蓬呆萌',
    description: '圆滚滚毛茸茸的南美龙猫，大耳朵一抖就能融化人心。',
    anchors: CHARACTER_ANCHORS.chinchilla,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-chinchilla' },
        // 外轮廓
        createElement('path', {
          fill: '#171917',
          d: 'M8 4h20v4h24V4h20v24h-4v24h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V28H8z',
        }),
        // 银灰底色
        createElement('path', {
          fill: '#94a3b8',
          d: 'M12 8h12v16h32V8h12v32h-8v8H20v-8h-8z',
        }),
        // 额头微光
        createElement('path', {
          fill: '#e2e8f0',
          d: 'M32 12h16v4H32z',
        }),
        // 粉嫩内耳
        createElement('path', {
          fill: '#ffb5b5',
          d: 'M16 8h6v12h-6zm42 0h6v12h-6z',
        }),
        // 软白肚皮与脸部
        createElement('path', {
          fill: '#f8fafc',
          d: 'M24 32h32v24H24z',
        }),
        // 腮红
        createElement('path', {
          fill: '#ffa6e8',
          d: 'M16 36h8v4h-8zm40 0h8v4h-8z',
        }),
        // 眼睛、小鼻子
        createElement('path', {
          fill: '#171917',
          d: 'M26 26h6v6h-6zm22 0h6v6h-6zm-11 8h6v4h-6z',
        }),
        // 眼睛晶亮高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M26 26h3v3h-3zm22 0h3v3h-3z',
        }),
        // 身体下装底衬
        createElement('path', {
          fill: '#a78bfa',
          d: 'M20 56h40v8h4v12H16V64h4zm4-6h4v6h-4zm28 0h4v6h-4z',
        }),
        // 星星小扣
        createElement('path', {
          fill: '#fde047',
          d: 'M38 60h4v3h-4z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M26 68h4v8h-4zm24 0h4v8h-4z',
        }),
      ),
  },
  {
    id: 'otter',
    name: '水獭',
    tag: '灵动贪玩',
    description: '喜欢在水面浮游的水獭宝宝，握着小爪子陪你看风景。',
    anchors: CHARACTER_ANCHORS.otter,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-otter' },
        createElement('path', {
          fill: '#171917',
          d: 'M12 4h16v4h24V4h16v16h4v28h-4v8h4v8h8v16H8V64h8v-8h-4v-8H4V24h8V4z',
        }),
        // 巧克力暖棕毛色
        createElement('path', {
          fill: '#795548',
          d: 'M16 8h12v8h24V8h12v28h-8v8H20v-8h-4z',
        }),
        // 额头微光
        createElement('path', {
          fill: '#a1887f',
          d: 'M32 10h16v4H32z',
        }),
        // 浅褐吻部与脖颈
        createElement('path', {
          fill: '#d7ccc8',
          d: 'M24 24h32v20H24z',
        }),
        // 鼻吻黑珠
        createElement('path', {
          fill: '#171917',
          d: 'M36 32h8v4h-8zm-10-8h6v6h-6zm22 0h6v6h-6z',
        }),
        // 眼睛水灵高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M26 24h3v3h-3zm22 0h3v3h-3z',
        }),
        // 粉红耳芯与小腮红
        createElement('path', {
          fill: '#ffab91',
          d: 'M16 8h4v6h-4zm44 0h4v6h-4zm-42 24h6v4h-6zm36 0h6v4h-6z',
        }),
        // 蔚蓝水手底衬
        createElement('path', {
          fill: '#38bdf8',
          d: 'M22 54h36v10h6v12H16V64h6zm4-6h4v6h-4zm24 0h4v6h-4z',
        }),
        // 贝壳纽扣
        createElement('path', {
          fill: '#facc15',
          d: 'M38 58h4v3h-4z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M28 68h4v8h-4zm20 0h4v8h-4z',
        }),
      ),
  },
  {
    id: 'sheep',
    name: '小羊',
    tag: '蓬松云朵',
    description: '如云朵般轻盈柔软的小羊羔，带你进入最香甜的梦乡。',
    anchors: CHARACTER_ANCHORS.sheep,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-sheep' },
        createElement('path', {
          fill: '#171917',
          d: 'M12 4h20v4h16V4h20v20h4v24h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24h4V4z',
        }),
        // 暖黄角芽
        createElement('path', {
          fill: '#fcd34d',
          d: 'M12 8h8v12h-8zm48 0h8v12h-8z',
        }),
        // 云朵白蓬松毛绒
        createElement('path', {
          fill: '#f8fafc',
          d: 'M20 6h40v18h4v24h-4v8H20v-8h-4V24h4z',
        }),
        // 头顶微光
        createElement('path', {
          fill: '#ffffff',
          d: 'M28 6h24v4H28z',
        }),
        // 奶油脸庞
        createElement('path', {
          fill: '#fef3c7',
          d: 'M26 22h28v18H26z',
        }),
        // 眼睛嘴巴
        createElement('path', {
          fill: '#171917',
          d: 'M28 28h6v6h-6zm18 0h6v6h-6zm-10 8h8v3h-8z',
        }),
        // 眼睛温润高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M28 28h3v3h-3zm18 0h3v3h-3z',
        }),
        // 软糯腮红
        createElement('path', {
          fill: '#fda4af',
          d: 'M20 34h6v4h-6zm34 0h6v4h-6z',
        }),
        // 暖粉底圈
        createElement('path', {
          fill: '#f472b6',
          d: 'M24 56h32v8h8v12H16V64h8zm2-6h4v6h-4zm24 0h4v6h-4z',
        }),
        // 珍珠白扣
        createElement('path', {
          fill: '#ffffff',
          d: 'M38 60h4v3h-4z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M28 68h4v8h-4zm20 0h4v8h-4z',
        }),
      ),
  },
  {
    id: 'owl',
    name: '猫头鹰',
    tag: '睿智圆鼓',
    description: '黑夜守护神猫头鹰博士，大眼睛滴溜转，聪明又认真。',
    anchors: CHARACTER_ANCHORS.owl,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-owl' },
        createElement('path', {
          fill: '#171917',
          d: 'M16 2h16v6h16V2h16v20h4v28h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V22h4V2z',
        }),
        // 羽翼赭石棕
        createElement('path', {
          fill: '#92400e',
          d: 'M18 8h44v36h-4v8H22v-8h-4z',
        }),
        // 耳羽微光
        createElement('path', {
          fill: '#b45309',
          d: 'M18 4h10v4h-10zm34 0h10v4h-10z',
        }),
        // 大眼圈与胸部羽毛
        createElement('path', {
          fill: '#fef3c7',
          d: 'M22 16h16v16H22zm20 0h16v16H42zm-16 22h28v14H26z',
        }),
        // 金黄大圆瞳
        createElement('path', {
          fill: '#facc15',
          d: 'M26 20h8v8h-8zm20 0h8v8h-8z',
        }),
        // 黑瞳孔与喙
        createElement('path', {
          fill: '#171917',
          d: 'M28 22h4v4h-4zm20 0h4v4h-4zm-11 8h6v6h-6z',
        }),
        // 橘红尖喙
        createElement('path', {
          fill: '#f97316',
          d: 'M37 28h6v6h-6z',
        }),
        // 眼睛智慧纯白高光
        createElement('path', {
          fill: '#ffffff',
          d: 'M28 22h2v2h-2zm20 0h2v2h-2z',
        }),
        // 翡翠学袍底衬
        createElement('path', {
          fill: '#059669',
          d: 'M20 52h40v8h4v12H16V60h4zm4-4h4v4h-4zm28 0h4v4h-4z',
        }),
        // 学者徽章
        createElement('path', {
          fill: '#facc15',
          d: 'M38 56h4v3h-4z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M26 68h6v8h-6zm22 0h6v8h-6z',
        }),
      ),
  },
  {
    id: 'pig',
    name: '小猪',
    tag: '圆滚福气',
    description:
      '粉扑扑圆滚滚的元气小猪，标志性的大拱鼻配元气腮红，呼噜呼噜给你带来满格福气与陪伴。',
    anchors: CHARACTER_ANCHORS.pig,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-pig' },
        // 1. 外部黑色像素轮廓
        createElement('path', {
          fill: '#171917',
          d: 'M8 8h20v4h24V8h20v20h-4v24h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V28H8z',
        }),
        // 2. 柔嫩草莓奶粉主色（头部与身体基底）
        createElement('path', {
          fill: '#ffb3cc',
          d: 'M12 12h16v4h24v-4h16v18h-4v26H16V30h-4z',
        }),
        // 3. 额头头顶高光光泽
        createElement('path', {
          fill: '#ffe5ee',
          d: 'M32 16h16v4H32z',
        }),
        // 4. 耳蜗与粉嫩圆腮红
        createElement('path', {
          fill: '#ff7597',
          d: 'M16 12h8v8h-8zm40 0h8v8h-8zM16 38h8v6h-8zm40 0h8v6h-8z',
        }),
        // 5. 眼睛与猪鼻子黑轮廓
        createElement('path', {
          fill: '#171917',
          d: 'M24 24h8v8h-8zm24 0h8v8h-8zM26 32h28v16H26zM36 48h8v2h-8z',
        }),
        // 6. 猪鼻子（拱鼻）主肉粉色底
        createElement('path', {
          fill: '#ff85a6',
          d: 'M28 34h24v12H28z',
        }),
        // 7. 拱鼻上沿立体高光
        createElement('path', {
          fill: '#ffe5ee',
          d: 'M32 34h16v2H32z',
        }),
        // 8. 两个圆鼓鼓的猪鼻孔
        createElement('path', {
          fill: '#171917',
          d: 'M34 38h3v5h-3zm9 0h3v5h-3z',
        }),
        // 9. 大眼睛高光反光点
        createElement('path', {
          fill: '#ffffff',
          d: 'M24 24h4v4h-4zm24 0h4v4h-4zm-16 12h4v2h-4z',
        }),
        // 10. 阳光金黄元气背带裤
        createElement('path', {
          fill: '#fbbf24',
          d: 'M24 56h32v8h8v12H16V64h8zm4-4h4v8h-4zm20 0h4v8h-4z',
        }),
        // 11. 背带裤胸前小爱心纽扣
        createElement('path', {
          fill: '#ef4444',
          d: 'M38 60h4v3h-4z',
        }),
        // 12. 猪小蹄分趾黑线
        createElement('path', {
          fill: '#171917',
          d: 'M28 68h4v8h-4zm20 0h4v8h-4z',
        }),
      ),
  },
  {
    id: 'tiger',
    name: '小老虎',
    tag: '元气萌虎',
    description: '头顶威风小王字的小萌虎，虽然总装出凶巴巴的模样，但一被顺毛就会呼噜呼噜撒娇。',
    anchors: CHARACTER_ANCHORS.tiger,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-tiger' },
        createElement('path', {
          fill: '#171917',
          d: 'M16 4h12v4h24V4h12v16h-4v24h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V20h-4V4h4z',
        }),
        createElement('path', {
          fill: '#f59e0b',
          d: 'M16 8h12v4h24V8h12v12h-4v28H20V20h-4z',
        }),
        createElement('path', {
          fill: '#fde68a',
          d: 'M32 16h16v4H32z',
        }),
        createElement('path', {
          fill: '#fb7185',
          d: 'M18 8h6v6h-6zm38 0h6v6h-6zM16 34h8v4h-8zm40 0h8v4h-8z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M34 10h12v2H34zm2 2h8v2h-8zm-4 2h16v2H32zm6 2h4v4h-4zM16 22h6v2h-6zm42 0h6v2h-6zM14 28h6v2h-6zm46 0h6v2h-6z',
        }),
        createElement('path', {
          fill: '#fef3c7',
          d: 'M30 32h20v10H30z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M24 24h6v6h-6zm26 0h6v6h-6zm-12 10h4v3h-4zm-2 5h8v2h-8z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M24 24h3v3h-3zm26 0h3v3h-3z',
        }),
        createElement('path', {
          fill: '#3b82f6',
          d: 'M24 52h32v8h8v12H16V60h8zm4-4h4v8h-4zm20 0h4v8h-4z',
        }),
        createElement('path', {
          fill: '#fbbf24',
          d: 'M38 56h4v3h-4z',
        }),
      ),
  },
  {
    id: 'lion',
    name: '小狮子',
    tag: '温暖狮心',
    description: '顶着蓬松太阳鬃毛的阳光小狮子，永远元气满满，立志成为你最勇敢的护花使者。',
    anchors: CHARACTER_ANCHORS.lion,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-lion' },
        createElement('path', {
          fill: '#171917',
          d: 'M20 4h40v4h8v8h4v20h-4v8h-4v4h4v8h8v16H8V72h8v-8h4v-4h-4v-8H4V16h4V8h12z',
        }),
        createElement('path', {
          fill: '#d97706',
          d: 'M12 8h56v8h4v20h-4v8H12V36H8V16h4z',
        }),
        createElement('path', {
          fill: '#fcd34d',
          d: 'M20 16h40v26H20z',
        }),
        createElement('path', {
          fill: '#fef08a',
          d: 'M32 18h16v4H32z',
        }),
        createElement('path', {
          fill: '#fb7185',
          d: 'M18 10h6v6h-6zm38 0h6v6h-6zM18 34h6v4h-6zm38 0h6v4h-6z',
        }),
        createElement('path', {
          fill: '#fef9c3',
          d: 'M32 32h16v8H32z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M26 24h6v6h-6zm22 0h6v6h-6zm-10 10h4v3h-4zm-2 4h8v2h-8z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M26 24h3v3h-3zm22 0h3v3h-3z',
        }),
        createElement('path', {
          fill: '#10b981',
          d: 'M24 52h32v8h8v12H16V60h8zm4-4h4v8h-4zm20 0h4v8h-4z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M38 56h4v3h-4z',
        }),
      ),
  },
  {
    id: 'deer',
    name: '小鹿',
    tag: '林间灵鹿',
    description: '头顶稚嫩鹿茸角、眼眸清澈温柔的林间小鹿，带给你如森林清风般的宁静与治愈。',
    anchors: CHARACTER_ANCHORS.deer,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-deer' },
        createElement('path', {
          fill: '#171917',
          d: 'M16 4h8v8h4v-4h4v4h16V8h4v-4h8v8h-4v4h-4v4h4v20h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24h4v-4h-4v-4h-4z',
        }),
        createElement('path', {
          fill: '#92400e',
          d: 'M18 6h4v6h-4zm40 0h4v6h-4zm-14 4h4v4h-4zm-12 0h4v4h-4z',
        }),
        createElement('path', {
          fill: '#b45309',
          d: 'M20 16h40v30H20z',
        }),
        createElement('path', {
          fill: '#fed7aa',
          d: 'M32 18h16v4H32z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M28 20h3v3h-3zm21 0h3v3h-3zm-11 4h4v3h-4zM32 34h16v8H32z',
        }),
        createElement('path', {
          fill: '#f472b6',
          d: 'M16 16h4v6h-4zm44 0h4v6h-4zM18 34h6v4h-6zm38 0h6v4h-6z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M24 24h7v7h-7zm25 0h7v7h-7zm-11 11h4v3h-4zm-1 4h6v2h-6z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M24 24h3v3h-3zm25 0h3v3h-3z',
        }),
        createElement('path', {
          fill: '#059669',
          d: 'M24 52h32v8h8v12H16V60h8zm4-4h4v8h-4zm20 0h4v8h-4z',
        }),
        createElement('path', {
          fill: '#f59e0b',
          d: 'M38 56h4v3h-4z',
        }),
      ),
  },
  {
    id: 'seal',
    name: '海豹',
    tag: '圆滚小斑',
    description: '软乎乎像一颗糯米糍的雪白海豹，喜欢在地毯上骨碌碌打滚，用圆溜溜的大眼睛望向你。',
    anchors: CHARACTER_ANCHORS.seal,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-seal' },
        createElement('path', {
          fill: '#171917',
          d: 'M24 6h32v4h8v8h4v24h-4v8h8v8h4v16H4V74h4v-8h8v-8h-4V18h4v-8h8z',
        }),
        createElement('path', {
          fill: '#f8fafc',
          d: 'M24 10h32v8h8v24h-4v6H20v-6h-4V18h8z',
        }),
        createElement('path', {
          fill: '#e2e8f0',
          d: 'M32 14h16v4H32z',
        }),
        createElement('path', {
          fill: '#fb7185',
          d: 'M18 32h8v5h-8zm36 0h8v5h-8z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M24 22h8v8h-8zm24 0h8v8h-8zm-10 10h4v4h-4zm-4 4h4v2h-4zm8 0h4v2h-4zM20 30h2v2h-2zm38 0h2v2h-2z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M24 22h4v4h-4zm24 0h4v4h-4z',
        }),
        createElement('path', {
          fill: '#0284c7',
          d: 'M24 52h32v8h8v14H16V60h8zm4-4h4v8h-4zm20 0h4v8h-4z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M38 56h4v3h-4z',
        }),
      ),
  },
  {
    id: 'elephant',
    name: '小象',
    tag: '温柔象宝',
    description: '大耳朵扑扇扑扇的暖灰小象，长长的小鼻子总会俏皮地翘起，为你喷出一朵快乐小水花。',
    anchors: CHARACTER_ANCHORS.elephant,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-elephant' },
        createElement('path', {
          fill: '#171917',
          d: 'M6 8h20v4h28V8h20v24h-8v12h-4v8h4v8h8v16H4V76h8v-8h4v-8h-4V32H6z',
        }),
        createElement('path', {
          fill: '#f472b6',
          d: 'M10 14h12v14H10zm48 0h12v14H58z',
        }),
        createElement('path', {
          fill: '#94a3b8',
          d: 'M24 12h32v34H24zM10 28h14v8H10zm46 0h14v8H56z',
        }),
        createElement('path', {
          fill: '#cbd5e1',
          d: 'M32 14h16v4H32z',
        }),
        createElement('path', {
          fill: '#64748b',
          d: 'M36 28h8v14h-4v-4h-4z',
        }),
        createElement('path', {
          fill: '#f472b6',
          d: 'M36 34h4v4h-4z',
        }),
        createElement('path', {
          fill: '#fb7185',
          d: 'M24 34h6v4h-6zm26 0h6v4h-6z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M28 22h6v6h-6zm18 0h6v6h-6z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M28 22h3v3h-3zm18 0h3v3h-3z',
        }),
        createElement('path', {
          fill: '#eab308',
          d: 'M24 52h32v8h8v12H16V60h8zm4-4h4v8h-4zm20 0h4v8h-4z',
        }),
        createElement('path', {
          fill: '#ef4444',
          d: 'M38 56h4v3h-4z',
        }),
      ),
  },
  {
    id: 'hedgehog',
    name: '刺猬',
    tag: '软萌小刺',
    description: '外表带一圈软绵绵小刺的害羞小刺猬，其实内里有着全天下最软和的糯米肚皮与真诚。',
    anchors: CHARACTER_ANCHORS.hedgehog,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-hedgehog' },
        createElement('path', {
          fill: '#171917',
          d: 'M8 4h12v4h8V4h24v4h8V4h12v20h-4v4h4v16h-4v8h4v8h8v16H8V76h8v-8h4v-8h-4V44H8V28h4V8H8z',
        }),
        createElement('path', {
          fill: '#78350f',
          d: 'M12 8h56v16h-4v24H16V24h-4z',
        }),
        createElement('path', {
          fill: '#fed7aa',
          d: 'M20 20h40v26H20z',
        }),
        createElement('path', {
          fill: '#ffedd5',
          d: 'M32 20h16v4H32z',
        }),
        createElement('path', {
          fill: '#fb7185',
          d: 'M16 22h4v5h-4zm44 0h4v5h-4zM18 34h6v4h-6zm38 0h6v4h-6z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M37 32h6v4h-6zm-1 6h8v2h-8zM26 24h6v6h-6zm22 0h6v6h-6z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M26 24h3v3h-3zm22 0h3v3h-3zm-10 8h2v2h-2z',
        }),
        createElement('path', {
          fill: '#a855f7',
          d: 'M24 52h32v8h8v12H16V60h8zm4-4h4v8h-4zm20 0h4v8h-4z',
        }),
        createElement('path', {
          fill: '#fbbf24',
          d: 'M38 56h4v3h-4z',
        }),
      ),
  },
  {
    id: 'redpanda',
    name: '小熊猫',
    tag: '蓬松小浣',
    description: '拥有枫叶红毛色和雪白小眉毛的红熊猫，走起路来晃悠着大尾巴，萌力值爆表。',
    anchors: CHARACTER_ANCHORS.redpanda,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-redpanda' },
        createElement('path', {
          fill: '#171917',
          d: 'M12 4h16v4h24V4h16v18h-4v26h-4v8h4v8h8v16H8V76h8v-8h4v-8h-4V22h-4z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M14 6h12v12H14zm38 0h12v12H52z',
        }),
        createElement('path', {
          fill: '#ea580c',
          d: 'M16 12h48v34H16z',
        }),
        createElement('path', {
          fill: '#fdba74',
          d: 'M32 14h16v4H32z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M24 18h6v3h-6zm26 0h6v3h-6zM30 32h20v10H30zm-14 4h8v6h-8zm40 0h8v6h-8z',
        }),
        createElement('path', {
          fill: '#7c2d12',
          d: 'M24 30h4v6h-4zm28 0h4v6h-4z',
        }),
        createElement('path', {
          fill: '#fb7185',
          d: 'M18 36h4v4h-4zm40 0h4v4h-4z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M26 24h6v6h-6zm22 0h6v6h-6zm-10 10h4v3h-4zm-2 4h8v2h-8z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M26 24h3v3h-3zm22 0h3v3h-3z',
        }),
        createElement('path', {
          fill: '#1e293b',
          d: 'M24 52h32v8h8v12H16V60h8zm4-4h4v8h-4zm20 0h4v8h-4z',
        }),
        createElement('path', {
          fill: '#22c55e',
          d: 'M38 56h4v3h-4z',
        }),
      ),
  },
  {
    id: 'whale',
    name: '小鲸鱼',
    tag: '深海小游',
    description: '头顶冒出一颗欢快小水花的深海小鲸鱼，宽厚的性格正如大海一般包容而温暖。',
    anchors: CHARACTER_ANCHORS.whale,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-whale' },
        createElement('path', {
          fill: '#171917',
          d: 'M36 2h8v4h-4v4h16v4h8v8h4v24h-4v8h4v8h8v16H8V76h8v-8h4v-8h-4V22h4v-8h8v-4h12V6h-4z',
        }),
        createElement('path', {
          fill: '#38bdf8',
          d: 'M38 4h4v6h-4zm-4 4h4v2h-4zm8 0h4v2h-4z',
        }),
        createElement('path', {
          fill: '#0284c7',
          d: 'M20 14h40v32H20z',
        }),
        createElement('path', {
          fill: '#7dd3fc',
          d: 'M32 16h16v4H32z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M26 34h28v12H26z',
        }),
        createElement('path', {
          fill: '#fb7185',
          d: 'M18 30h6v4h-6zm38 0h6v4h-6z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M26 24h6v6h-6zm22 0h6v6h-6zm-12 12h8v4h-8z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M26 24h3v3h-3zm22 0h3v3h-3zm-6 13h4v1h-4z',
        }),
        createElement('path', {
          fill: '#1e3a8a',
          d: 'M24 52h32v8h8v12H16V60h8zm4-4h4v8h-4zm20 0h4v8h-4z',
        }),
        createElement('path', {
          fill: '#fbbf24',
          d: 'M38 56h4v3h-4z',
        }),
      ),
  },
  {
    id: 'monkey',
    name: '小猴',
    tag: '灵动桃桃',
    description: '有一双机灵圆大耳和桃心面庞的小皮猴，古灵精怪点子多，随时准备逗你开怀大笑。',
    anchors: CHARACTER_ANCHORS.monkey,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-monkey' },
        createElement('path', {
          fill: '#171917',
          d: 'M10 10h14V6h32v4h14v22h-8v14h-4v8h4v8h8v16H8V76h8v-8h4v-8h-4V32h-6z',
        }),
        createElement('path', {
          fill: '#92400e',
          d: 'M24 10h32v36H24zM12 14h12v14H12zm44 0h12v14H56z',
        }),
        createElement('path', {
          fill: '#f472b6',
          d: 'M14 18h8v8h-8zm44 0h8v8h-8z',
        }),
        createElement('path', {
          fill: '#fed7aa',
          d: 'M26 14h12v8H26zm16 0h12v8H42zM24 22h32v18H24z',
        }),
        createElement('path', {
          fill: '#ffedd5',
          d: 'M34 16h12v4H34z',
        }),
        createElement('path', {
          fill: '#fb7185',
          d: 'M22 30h6v4h-6zm30 0h6v4h-6z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M28 22h6v6h-6zm18 0h6v6h-6zm-10 10h8v4h-8zm2 2h4v1h-4z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M28 22h3v3h-3zm18 0h3v3h-3z',
        }),
        createElement('path', {
          fill: '#ef4444',
          d: 'M24 52h32v8h8v12H16V60h8zm4-4h4v8h-4zm20 0h4v8h-4z',
        }),
        createElement('path', {
          fill: '#facc15',
          d: 'M38 56h4v3h-4z',
        }),
      ),
  },
  {
    id: 'cow',
    name: '小奶牛',
    tag: '醇香小牛',
    description: '头顶一对嫩黄小犄角、憨态可掬的黑白花小奶牛，每天都要为你送上一份纯纯的甜蜜。',
    anchors: CHARACTER_ANCHORS.cow,
    renderBase: () =>
      createElement(
        'g',
        { className: 'char-base char-cow' },
        createElement('path', {
          fill: '#171917',
          d: 'M16 6h8v6h4V8h24v4h4V6h8v16h-4v24h-4v8h4v8h8v16H8V76h8v-8h4v-8h-4V22h-4z',
        }),
        createElement('path', {
          fill: '#f59e0b',
          d: 'M18 8h4v4h-4zm40 0h4v4h-4z',
        }),
        createElement('path', {
          fill: '#f8fafc',
          d: 'M20 12h40v34H20zM14 16h6v8h-6zm46 0h6v8h-6z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M32 14h16v4H32z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M14 16h6v6h-6zm6-4h10v8H20zm24 6h12v14H44z',
        }),
        createElement('path', {
          fill: '#f472b6',
          d: 'M26 32h28v12H26zM18 34h6v4h-6zm38 0h6v4h-6z',
        }),
        createElement('path', {
          fill: '#ffe4e6',
          d: 'M30 34h20v2H30z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M34 37h3v3h-3zm9 0h3v3h-3z',
        }),
        createElement('path', {
          fill: '#171917',
          d: 'M26 24h6v6h-6zm18 0h6v6h-6z',
        }),
        createElement('path', {
          fill: '#ffffff',
          d: 'M26 24h3v3h-3zm18 0h3v3h-3z',
        }),
        createElement('path', {
          fill: '#2563eb',
          d: 'M24 52h32v8h8v12H16V60h8zm4-4h4v8h-4zm20 0h4v8h-4z',
        }),
        createElement('path', {
          fill: '#10b981',
          d: 'M38 56h4v3h-4z',
        }),
      ),
  },
]

export const CHARACTER_MAP: Record<CharacterId, CharacterMeta> = CHARACTER_LIST.reduce(
  (acc, cur) => {
    acc[cur.id] = cur
    return acc
  },
  {} as Record<CharacterId, CharacterMeta>,
)
