import type { ReactNode } from 'react'
import { createElement } from 'react'

/**
 * 矢量像素装扮图层资产映射表 (Wardrobe Assets)
 * 每一件装扮均以锚点原点 (0, 0) 为几何中心进行矢量像素绘制，
 * shapeRendering="crispEdges" 保证边缘绝对锋利。
 */
export const WARDROBE_ASSET_RENDERERS: Record<string, () => ReactNode> = {
  // ================= 衣服 (Clothes) =================
  // 1. 经典蓝卫衣
  asset_c_blue_hoodie: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-blue-hoodie' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v18h-4v4h-6v-4h-16v4h-6v-4h-4z',
      }),
      createElement('path', {
        fill: '#0284c7',
        d: 'M-16 0h32v16h-4v2h-4v-2h-16v2h-4v-2h-4z',
      }),
      createElement('path', {
        fill: '#38bdf8',
        d: 'M-8 4h16v8h-16z',
      }),
      createElement('path', {
        fill: '#ffffff',
        d: 'M-4 1h2v6h-2zm6 0h2v6h-2z',
      }),
    ),

  // 2. 甜蜜粉卫衣
  asset_c_pink_hoodie: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-pink-hoodie' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v18h-4v4h-6v-4h-16v4h-6v-4h-4z',
      }),
      createElement('path', {
        fill: '#ec4899',
        d: 'M-16 0h32v16h-4v2h-4v-2h-16v2h-4v-2h-4z',
      }),
      createElement('path', {
        fill: '#f472b6',
        d: 'M-8 4h16v8h-16z',
      }),
      createElement('path', {
        fill: '#ffffff',
        d: 'M-3 5h2v2h-2zm4 0h2v2h-2zm-3 2h4v2h-4zm1 2h2v2h-2z',
      }),
    ),

  // 3. 条纹海魂衫
  asset_c_striped_tee: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-striped-tee' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v16h-6v4h-24v-4h-6z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M-16 0h32v14h-4v2h-24v-2h-4z',
      }),
      createElement('path', {
        fill: '#0284c7',
        d: 'M-16 2h32v2h-32zm0 6h32v2h-32zm0 6h32v2h-32z',
      }),
    ),

  // 4. 水手服
  asset_c_sailor_suit: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-sailor-suit' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v18h-6v2h-24v-2h-6z',
      }),
      createElement('path', {
        fill: '#0f172a',
        d: 'M-16 0h32v16h-6v2h-20v-2h-6z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M-10 0h20v8h-20z',
      }),
      createElement('path', {
        fill: '#ef4444',
        d: 'M-4 2h8v4h-8zm2 4h4v6h-4z',
      }),
    ),

  // 5. 英伦西服小制服
  asset_c_british_blazer: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-british-blazer' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v18h-6v2h-24v-2h-6z',
      }),
      createElement('path', {
        fill: '#1e3a8a',
        d: 'M-16 0h32v16h-32z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M-6 0h12v10h-12z',
      }),
      createElement('path', {
        fill: '#dc2626',
        d: 'M-2 2h4v8h-4zm1 8h2v3h-2z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-10 8h2v2h-2zm18 0h2v2h-2z',
      }),
    ),

  // 6. 工装牛仔背带裤
  asset_c_overalls: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-overalls' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v20h-6v2h-24v-2h-6z',
      }),
      createElement('path', {
        fill: '#fef08a',
        d: 'M-16 0h32v6h-32z',
      }),
      createElement('path', {
        fill: '#1d4ed8',
        d: 'M-14 4h4v14h-4zm24 0h4v14h-4zm-20 6h24v8h-24z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-13 8h2v2h-2zm24 0h2v2h-2z',
      }),
    ),

  // 7. 干净白衬衫
  asset_c_white_shirt: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-white-shirt' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v16h-6v2h-24v-2h-6z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M-16 0h32v14h-32z',
      }),
      createElement('path', {
        fill: '#cbd5e1',
        d: 'M-4 0h8v4h-8zm3 4h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z',
      }),
    ),

  // 8. 圣诞驯鹿红毛衣
  asset_c_christmas_sweater: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-christmas-sweater' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v18h-6v2h-24v-2h-6z',
      }),
      createElement('path', {
        fill: '#dc2626',
        d: 'M-16 0h32v16h-32z',
      }),
      createElement('path', {
        fill: '#16a34a',
        d: 'M-16 4h32v2h-32zm0 6h32v2h-32z',
      }),
      createElement('path', {
        fill: '#fef08a',
        d: 'M-6 5h4v4h-4zm8 0h4v4h-4z',
      }),
    ),

  // 9. 暖冬雪花羽绒服
  asset_c_winter_down_jacket: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-winter-jacket' },
      createElement('path', {
        fill: '#171917',
        d: 'M-20 -2h40v20h-6v2h-28v-2h-6z',
      }),
      createElement('path', {
        fill: '#3b82f6',
        d: 'M-18 0h36v18h-36z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M-16 0h32v4h-32zm14 4h4v14h-4z',
      }),
      createElement('path', {
        fill: '#93c5fd',
        d: 'M-10 6h4v4h-4zm16 4h4v4h-4z',
      }),
    ),

  // 10. 夏威夷碎花衬衫
  asset_c_hawaiian_shirt: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-hawaiian-shirt' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v16h-6v2h-24v-2h-6z',
      }),
      createElement('path', {
        fill: '#f97316',
        d: 'M-16 0h32v14h-32z',
      }),
      createElement('path', {
        fill: '#fef08a',
        d: 'M-12 4h4v4h-4zm18 4h4v4h-4zm-8 4h4v4h-4z',
      }),
      createElement('path', {
        fill: '#22c55e',
        d: 'M-8 2h2v4h-2zm12 2h2v4h-2z',
      }),
    ),

  // 11. 活力运动校服
  asset_c_sports_jersey: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-sports-jersey' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v16h-6v2h-24v-2h-6z',
      }),
      createElement('path', {
        fill: '#059669',
        d: 'M-16 0h32v14h-32z',
      }),
      createElement('path', {
        fill: '#ffffff',
        d: 'M-16 2h4v12h-4zm28 0h4v12h-4zm-14 2h4v8h-4z',
      }),
    ),

  // 12. 侦探小风衣
  asset_c_detective_cape: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-detective-cape' },
      createElement('path', {
        fill: '#171917',
        d: 'M-20 -2h40v18h-6v4h-28v-4h-6z',
      }),
      createElement('path', {
        fill: '#b45309',
        d: 'M-18 0h36v16h-36z',
      }),
      createElement('path', {
        fill: '#78350f',
        d: 'M-14 0h28v6h-28zm10 6h8v12h-8z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-8 8h2v2h-2zm14 0h2v2h-2z',
      }),
    ),

  // 13. 烘焙小围裙
  asset_c_chef_apron: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-chef-apron' },
      createElement('path', {
        fill: '#171917',
        d: 'M-16 -2h32v18h-4v2h-24v-2h-4z',
      }),
      createElement('path', {
        fill: '#fed7aa',
        d: 'M-14 0h28v16h-28z',
      }),
      createElement('path', {
        fill: '#f97316',
        d: 'M-8 2h16v6h-16zm-4 8h24v2h-24z',
      }),
      createElement('path', {
        fill: '#ea580c',
        d: 'M-4 10h8v4h-8z',
      }),
    ),

  // 14. 魔法学徒长袍
  asset_c_magic_robe: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-magic-robe' },
      createElement('path', {
        fill: '#171917',
        d: 'M-20 -2h40v20h-6v2h-28v-2h-6z',
      }),
      createElement('path', {
        fill: '#4c1d95',
        d: 'M-18 0h36v18h-36z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-4 0h8v18h-8zm-14 16h36v2h-36z',
      }),
      createElement('path', {
        fill: '#c084fc',
        d: 'M-12 4h6v6h-6zm18 4h6v6h-6z',
      }),
    ),

  // 15. 暖萌草莓睡袍
  asset_c_cozy_pajamas: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-cozy-pajamas' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v18h-6v2h-24v-2h-6z',
      }),
      createElement('path', {
        fill: '#fce7f3',
        d: 'M-16 0h32v16h-32z',
      }),
      createElement('path', {
        fill: '#f43f5e',
        d: 'M-10 3h3v3h-3zm14 2h3v3h-3zm-8 7h3v3h-3zm12 2h3v3h-3z',
      }),
      createElement('path', {
        fill: '#ec4899',
        d: 'M-2 0h4v16h-4z',
      }),
    ),

  // 16. 星际宇航服
  asset_c_space_suit: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-space-suit' },
      createElement('path', {
        fill: '#171917',
        d: 'M-20 -2h40v20h-6v2h-28v-2h-6z',
      }),
      createElement('path', {
        fill: '#e2e8f0',
        d: 'M-18 0h36v18h-36z',
      }),
      createElement('path', {
        fill: '#0284c7',
        d: 'M-6 4h12v8h-12z',
      }),
      createElement('path', {
        fill: '#ef4444',
        d: 'M-4 6h2v2h-2z',
      }),
      createElement('path', {
        fill: '#22c55e',
        d: 'M0 6h2v2h-2z',
      }),
    ),

  // 17. 薄荷撞色情侣T恤
  asset_c_couple_mint_tee: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-mint-tee' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v16h-6v2h-24v-2h-6z',
      }),
      createElement('path', {
        fill: '#34d399',
        d: 'M-16 0h32v14h-32z',
      }),
      createElement('path', {
        fill: '#ecfdf5',
        d: 'M-8 2h16v6h-16z',
      }),
      createElement('path', {
        fill: '#059669',
        d: 'M-4 4h8v2h-8z',
      }),
    ),

  // 18. 香芋紫情侣T恤
  asset_c_couple_lilac_tee: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-lilac-tee' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v16h-6v2h-24v-2h-6z',
      }),
      createElement('path', {
        fill: '#c084fc',
        d: 'M-16 0h32v14h-32z',
      }),
      createElement('path', {
        fill: '#faf5ff',
        d: 'M-8 2h16v6h-16z',
      }),
      createElement('path', {
        fill: '#9333ea',
        d: 'M-4 4h8v2h-8z',
      }),
    ),

  // 19. 学院风麻花针织背心
  asset_c_knitted_vest: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-knitted-vest' },
      createElement('path', {
        fill: '#171917',
        d: 'M-16 -2h32v16h-4v2h-24v-2h-4z',
      }),
      createElement('path', {
        fill: '#fef3c7',
        d: 'M-14 0h28v14h-28z',
      }),
      createElement('path', {
        fill: '#b45309',
        d: 'M-6 0h12v4h-12zm-4 4h4v10h-4zm16 0h4v10h-4z',
      }),
    ),

  // 20. 和风花见浴衣
  asset_c_kimono_robe: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-kimono-robe' },
      createElement('path', {
        fill: '#171917',
        d: 'M-20 -2h40v18h-6v4h-28v-4h-6z',
      }),
      createElement('path', {
        fill: '#0f766e',
        d: 'M-18 0h36v16h-36z',
      }),
      createElement('path', {
        fill: '#f43f5e',
        d: 'M-14 8h28v4h-28z',
      }),
      createElement('path', {
        fill: '#fef08a',
        d: 'M-2 8h4v4h-4zm-8-6h2v2h-2zm16 0h2v2h-2z',
      }),
    ),

  // 21. 庆典小礼服
  asset_c_party_tuxedo: () =>
    createElement(
      'g',
      { className: 'outfit-clothes-party-tuxedo' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -2h36v18h-6v2h-24v-2h-6z',
      }),
      createElement('path', {
        fill: '#09090b',
        d: 'M-16 0h32v16h-32z',
      }),
      createElement('path', {
        fill: '#ffffff',
        d: 'M-6 0h12v8h-12z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-4 2h8v2h-8zm2 2h4v2h-4z',
      }),
    ),

  // ================= 帽子 (Hats) =================
  // 1. 复古红贝雷帽
  asset_h_red_beret: () =>
    createElement(
      'g',
      { className: 'outfit-hat-red-beret' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -14h34v4h4v8h-42v-8h4z',
      }),
      createElement('path', {
        fill: '#dc2626',
        d: 'M-16 -12h30v4h4v4h-38v-4h4z',
      }),
      createElement('path', {
        fill: '#ef4444',
        d: 'M-8 -14h4v4h-4zm-6 4h20v2h-20z',
      }),
    ),

  // 2. 优雅黑贝雷帽
  asset_h_black_beret: () =>
    createElement(
      'g',
      { className: 'outfit-hat-black-beret' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -14h34v4h4v8h-42v-8h4z',
      }),
      createElement('path', {
        fill: '#1e293b',
        d: 'M-16 -12h30v4h4v4h-38v-4h4z',
      }),
      createElement('path', {
        fill: '#475569',
        d: 'M-8 -14h4v4h-4zm-6 4h20v2h-20z',
      }),
    ),

  // 3. 动感棒球帽
  asset_h_baseball_cap: () =>
    createElement(
      'g',
      { className: 'outfit-hat-baseball-cap' },
      createElement('path', {
        fill: '#171917',
        d: 'M-16 -14h32v8h12v4h-48v-4h4z',
      }),
      createElement('path', {
        fill: '#2563eb',
        d: 'M-14 -12h28v6h-28zm28 4h10v2h-10z',
      }),
      createElement('path', {
        fill: '#ffffff',
        d: 'M-2 -10h4v4h-4z',
      }),
    ),

  // 4. 嫩黄渔夫帽
  asset_h_bucket_hat: () =>
    createElement(
      'g',
      { className: 'outfit-hat-bucket-hat' },
      createElement('path', {
        fill: '#171917',
        d: 'M-14 -16h28v8h8v6h-44v-6h8z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-12 -14h24v6h6v4h-36v-4h6z',
      }),
      createElement('path', {
        fill: '#fde047',
        d: 'M-8 -12h16v4h-16z',
      }),
    ),

  // 5. 经典圣诞红帽
  asset_h_santa_hat: () =>
    createElement(
      'g',
      { className: 'outfit-hat-santa-hat' },
      createElement('path', {
        fill: '#171917',
        d: 'M-16 -4h32v6h-32zm22 -14h10v10h-10zM-10 -16h16v6h-16z',
      }),
      createElement('path', {
        fill: '#dc2626',
        d: 'M-8 -14h12v6h-12zm10 2h6v8h-6z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M-14 -2h28v4h-28zm30 -10h6v6h-6z',
      }),
    ),

  // 6. 萌萌小鹿角发箍
  asset_h_deer_antlers: () =>
    createElement(
      'g',
      { className: 'outfit-hat-deer-antlers' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -20h6v6h4v-8h6v14h-16zm20 -8h6v8h4v-6h6v14h-16z',
      }),
      createElement('path', {
        fill: '#b45309',
        d: 'M-16 -18h4v4h4v-4h2v8h-10zm22 -6h2v4h4v-4h4v8h-10z',
      }),
      createElement('path', {
        fill: '#f43f5e',
        d: 'M-12 -2h24v3h-24z',
      }),
    ),

  // 7. 春日雏菊花环
  asset_h_flower_crown: () =>
    createElement(
      'g',
      { className: 'outfit-hat-flower-crown' },
      createElement('path', {
        fill: '#15803d',
        d: 'M-18 -4h36v4h-36z',
      }),
      createElement('path', {
        fill: '#ffffff',
        d: 'M-16 -8h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-14 -6h2v2h-2zm12 0h2v2h-2zm12 0h2v2h-2z',
      }),
    ),

  // 8. 甜心蝴蝶结
  asset_h_pink_bow: () =>
    createElement(
      'g',
      { className: 'outfit-hat-pink-bow' },
      createElement('path', {
        fill: '#171917',
        d: 'M-14 -12h10v10h-10zm18 0h10v10h-10zm-10 2h6v6h-6z',
      }),
      createElement('path', {
        fill: '#f43f5e',
        d: 'M-12 -10h6v6h-6zm18 0h6v6h-6zm-10 2h4v2h-4z',
      }),
      createElement('path', {
        fill: '#fda4af',
        d: 'M-10 -8h2v2h-2zm18 0h2v2h-2z',
      }),
    ),

  // 9. 薄荷绿蝴蝶结
  asset_h_mint_bow: () =>
    createElement(
      'g',
      { className: 'outfit-hat-mint-bow' },
      createElement('path', {
        fill: '#171917',
        d: 'M-14 -12h10v10h-10zm18 0h10v10h-10zm-10 2h6v6h-6z',
      }),
      createElement('path', {
        fill: '#10b981',
        d: 'M-12 -10h6v6h-6zm18 0h6v6h-6zm-10 2h4v2h-4z',
      }),
      createElement('path', {
        fill: '#a7f3d0',
        d: 'M-10 -8h2v2h-2zm18 0h2v2h-2z',
      }),
    ),

  // 10. 耀眼小金冠
  asset_h_gold_crown: () =>
    createElement(
      'g',
      { className: 'outfit-hat-gold-crown' },
      createElement('path', {
        fill: '#171917',
        d: 'M-12 -14h6v4h4v-6h4v6h4v-4h6v12h-24z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-10 -12h4v4h4v-4h4v4h4v-2h2v6h-18z',
      }),
      createElement('path', {
        fill: '#ef4444',
        d: 'M-2 -6h4v4h-4z',
      }),
      createElement('path', {
        fill: '#38bdf8',
        d: 'M-8 -6h2v2h-2zm14 0h2v2h-2z',
      }),
    ),

  // 11. 绒毛猫耳发箍
  asset_h_cat_ears: () =>
    createElement(
      'g',
      { className: 'outfit-hat-cat-ears' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -14h8v12h-8zm28 0h8v12h-8zM-12 -2h24v3h-24z',
      }),
      createElement('path', {
        fill: '#1e293b',
        d: 'M-16 -12h6v8h-6zm28 0h6v8h-6z',
      }),
      createElement('path', {
        fill: '#f43f5e',
        d: 'M-14 -8h3v4h-3zm28 0h3v4h-3z',
      }),
    ),

  // 12. 呆萌小黄鸭毛线帽
  asset_h_duck_beanie: () =>
    createElement(
      'g',
      { className: 'outfit-hat-duck-beanie' },
      createElement('path', {
        fill: '#171917',
        d: 'M-16 -14h32v12h-32zM-4 -20h8v6h-8z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-14 -12h28v8h-28zm12 -6h4v4h-4z',
      }),
      createElement('path', {
        fill: '#f97316',
        d: 'M-4 -6h8v3h-8z',
      }),
      createElement('path', {
        fill: '#171917',
        d: 'M-8 -8h2v2h-2zm14 0h2v2h-2z',
      }),
    ),

  // 13. 暖冬雪花毛线帽
  asset_h_winter_beanie: () =>
    createElement(
      'g',
      { className: 'outfit-hat-winter-beanie' },
      createElement('path', {
        fill: '#171917',
        d: 'M-16 -14h32v12h-32zM-4 -20h8v6h-8z',
      }),
      createElement('path', {
        fill: '#0284c7',
        d: 'M-14 -12h28v8h-28z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M-14 -4h28v2h-28zm12 -14h4v4h-4zM-6 -8h4v2h-4zm8 0h4v2h-4z',
      }),
    ),

  // 14. 烘焙厨师高帽
  asset_h_chef_toque: () =>
    createElement(
      'g',
      { className: 'outfit-hat-chef-toque' },
      createElement('path', {
        fill: '#171917',
        d: 'M-16 -20h32v8h4v8h-40v-8h4z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M-14 -18h28v6h4v6h-36v-6h4z',
      }),
      createElement('path', {
        fill: '#e2e8f0',
        d: 'M-14 -6h28v2h-28zm-2 -8h6v2h-6zm14 0h6v2h-6zm10 0h6v2h-6z',
      }),
    ),

  // 15. 魔法尖顶帽
  asset_h_magic_wizard_hat: () =>
    createElement(
      'g',
      { className: 'outfit-hat-magic-wizard' },
      createElement('path', {
        fill: '#171917',
        d: 'M-4 -24h8v6h-4v4h-4v6h-4v4h24v4h-36v-4h8v-4h4v-6h4z',
      }),
      createElement('path', {
        fill: '#4c1d95',
        d: 'M-2 -22h4v4h-2v4h-4v6h-4v4h16v-4h-4v-4h-2v-4h-2z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-14 -4h28v2h-28zm12 -14h2v2h-2zm-6 8h2v2h-2z',
      }),
    ),

  // 16. 猎鹿侦探帽
  asset_h_detective_hat: () =>
    createElement(
      'g',
      { className: 'outfit-hat-detective-hat' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -12h36v6h6v4h-48v-4h6z',
      }),
      createElement('path', {
        fill: '#b45309',
        d: 'M-16 -10h32v4h4v2h-40v-2h4z',
      }),
      createElement('path', {
        fill: '#78350f',
        d: 'M-8 -12h4v8h-4zm12 0h4v8h-4z',
      }),
    ),

  // 17. 夏日草织遮阳帽
  asset_h_straw_sunhat: () =>
    createElement(
      'g',
      { className: 'outfit-hat-straw-sunhat' },
      createElement('path', {
        fill: '#171917',
        d: 'M-14 -12h28v6h12v4h-52v-4h12z',
      }),
      createElement('path', {
        fill: '#fef08a',
        d: 'M-12 -10h24v4h10v2h-44v-2h10z',
      }),
      createElement('path', {
        fill: '#0284c7',
        d: 'M-12 -6h24v2h-24z',
      }),
    ),

  // 18. 软绵睡眠睡帽
  asset_h_pajama_nightcap: () =>
    createElement(
      'g',
      { className: 'outfit-hat-pajama-nightcap' },
      createElement('path', {
        fill: '#171917',
        d: 'M-16 -6h32v6h-32zm16 -12h14v10h-14zM-4 -14h8v6h-8z',
      }),
      createElement('path', {
        fill: '#fbcfe8',
        d: 'M-14 -4h28v2h-28zm14 -6h12v8h-12zm-4 -2h6v4h-6z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M22 -6h6v6h-6z',
      }),
    ),

  // 19. 太空宇航头盔面罩
  asset_h_space_helmet: () =>
    createElement(
      'g',
      { className: 'outfit-hat-space-helmet' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -16h36v20h-36z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M-16 -14h32v16h-32z',
      }),
      createElement('path', {
        fill: '#38bdf8',
        d: 'M-12 -10h24v10h-24z',
      }),
      createElement('path', {
        fill: '#ffffff',
        d: 'M-10 -8h4v2h-4zm2 2h2v4h-2z',
      }),
    ),

  // 20. 心动爱心天线发箍
  asset_h_heart_antenna: () =>
    createElement(
      'g',
      { className: 'outfit-hat-heart-antenna' },
      createElement('path', {
        fill: '#171917',
        d: 'M-12 -2h24v3h-24zM-6 -18h12v6h-4v8h-4v-8h-4z',
      }),
      createElement('path', {
        fill: '#f43f5e',
        d: 'M-4 -16h8v4h-8z',
      }),
      createElement('path', {
        fill: '#fb7185',
        d: 'M-2 -18h4v2h-4z',
      }),
    ),

  // 21. 呆萌小豆苗发夹
  asset_h_sprout_hairclip: () =>
    createElement(
      'g',
      { className: 'outfit-hat-sprout-hairclip' },
      createElement('path', {
        fill: '#171917',
        d: 'M-2 -14h4v14h-4zM-8 -18h6v6h-6zm4 0h6v6h-6z',
      }),
      createElement('path', {
        fill: '#22c55e',
        d: 'M-6 -16h4v4h-4zm4 0h4v4h-4z',
      }),
      createElement('path', {
        fill: '#4ade80',
        d: 'M0 -12h2v10h-2z',
      }),
    ),

  // ================= 配饰 (Accessories) =================
  // 1. 浪漫心形红气球
  asset_a_heart_balloon: () =>
    createElement(
      'g',
      { className: 'outfit-acc-heart-balloon' },
      // 细线
      createElement('path', {
        fill: '#171917',
        d: 'M0 0h2v18h-2z',
      }),
      // 心形
      createElement('path', {
        fill: '#171917',
        d: 'M-8 -14h16v10h-2v2h-4v2h-4v-2h-4v-2h-2z',
      }),
      createElement('path', {
        fill: '#ef4444',
        d: 'M-6 -12h12v8h-2v2h-4v-2h-2v-4h-4z',
      }),
      createElement('path', {
        fill: '#ffffff',
        d: 'M-4 -10h2v2h-2z',
      }),
    ),

  // 2. 拍立得复古相机
  asset_a_polaroid_camera: () =>
    createElement(
      'g',
      { className: 'outfit-acc-polaroid-camera' },
      createElement('path', {
        fill: '#171917',
        d: 'M-8 -6h16v12h-16zM-6 -8h6v2h-6z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M-6 -4h12v8h-12z',
      }),
      createElement('path', {
        fill: '#0284c7',
        d: 'M-2 -2h4v4h-4z',
      }),
      createElement('path', {
        fill: '#f97316',
        d: 'M2 -2h2v2h-2z',
      }),
    ),

  // 3. 灿烂向日葵花束
  asset_a_sunflower: () =>
    createElement(
      'g',
      { className: 'outfit-acc-sunflower' },
      createElement('path', {
        fill: '#171917',
        d: 'M-6 -8h12v12h-12zM-2 4h4v12h-4z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-4 -6h8v8h-8z',
      }),
      createElement('path', {
        fill: '#78350f',
        d: 'M-2 -4h4v4h-4z',
      }),
      createElement('path', {
        fill: '#16a34a',
        d: 'M0 6h2v10h-2zm-4 4h4v2h-4z',
      }),
    ),

  // 4. 珍珠奶茶杯
  asset_a_boba_milk_tea: () =>
    createElement(
      'g',
      { className: 'outfit-acc-boba-tea' },
      createElement('path', {
        fill: '#171917',
        d: 'M-6 -6h12v14h-12zM-1 -10h2v4h-2z',
      }),
      createElement('path', {
        fill: '#fde68a',
        d: 'M-4 -4h8v10h-8z',
      }),
      createElement('path', {
        fill: '#f43f5e',
        d: 'M-1 -8h2v2h-2z',
      }),
      createElement('path', {
        fill: '#171917',
        d: 'M-2 2h2v2h-2zm4 0h2v2h-2zm-3 2h2v2h-2z',
      }),
    ),

  // 5. 黄色小挎包
  asset_a_crossbody_bag: () =>
    createElement(
      'g',
      { className: 'outfit-acc-crossbody-bag' },
      createElement('path', {
        fill: '#171917',
        d: 'M-6 -4h12v10h-12zM-10 -12h4v10h-4z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-4 -2h8v6h-8z',
      }),
      createElement('path', {
        fill: '#ca8a04',
        d: 'M-2 0h4v2h-4z',
      }),
    ),

  // 6. 学霸双肩包
  asset_a_school_backpack: () =>
    createElement(
      'g',
      { className: 'outfit-acc-school-backpack' },
      createElement('path', {
        fill: '#171917',
        d: 'M-10 -8h12v16h-12z',
      }),
      createElement('path', {
        fill: '#0284c7',
        d: 'M-8 -6h8v12h-8z',
      }),
      createElement('path', {
        fill: '#38bdf8',
        d: 'M-6 -2h4v4h-4z',
      }),
    ),

  // 7. 温暖红色毛线围巾
  asset_a_red_scarf: () =>
    createElement(
      'g',
      { className: 'outfit-acc-red-scarf' },
      createElement('path', {
        fill: '#171917',
        d: 'M-14 -2h28v6h-28zm10 4h8v10h-8z',
      }),
      createElement('path', {
        fill: '#dc2626',
        d: 'M-12 0h24v3h-24zm10 2h6v8h-6z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M-2 8h6v2h-6z',
      }),
    ),

  // 8. 星之魔法杖
  asset_a_magic_wand: () =>
    createElement(
      'g',
      { className: 'outfit-acc-magic-wand' },
      createElement('path', {
        fill: '#171917',
        d: 'M0 2h3v16h-3zM-4 -6h10v8h-10z',
      }),
      createElement('path', {
        fill: '#b45309',
        d: 'M1 4h1v12h-1z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-2 -4h6v4h-6zm2 -4h2v2h-2zm-4 4h2v2h-2zm8 0h2v2h-2zm-4 4h2v2h-2z',
      }),
      createElement('path', {
        fill: '#fde047',
        d: 'M0 -2h2v2h-2z',
      }),
    ),

  // 9. 告白心心信封
  asset_a_love_letter: () =>
    createElement(
      'g',
      { className: 'outfit-acc-love-letter' },
      createElement('path', {
        fill: '#171917',
        d: 'M-6 -4h12v8h-12z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M-4 -2h8v4h-8z',
      }),
      createElement('path', {
        fill: '#f43f5e',
        d: 'M-1 -1h2v2h-2z',
      }),
    ),

  // 10. 侦探放大镜
  asset_a_detective_magnifier: () =>
    createElement(
      'g',
      { className: 'outfit-acc-magnifier' },
      createElement('path', {
        fill: '#171917',
        d: 'M-6 -8h10v10h-10zm6 8h4v8h-4z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-4 -6h6v6h-6zm5 7h2v6h-2z',
      }),
      createElement('path', {
        fill: '#e0f2fe',
        d: 'M-2 -4h3v3h-3z',
      }),
    ),

  // 11. 烘焙打蛋木勺
  asset_a_whisk_spoon: () =>
    createElement(
      'g',
      { className: 'outfit-acc-whisk-spoon' },
      createElement('path', {
        fill: '#171917',
        d: 'M-2 -8h6v8h-6zm1 8h2v14h-2z',
      }),
      createElement('path', {
        fill: '#d97706',
        d: 'M0 -6h2v4h-2zm0 8h2v12h-2z',
      }),
    ),

  // 12. 小鸭游泳圈
  asset_a_beach_swim_ring: () =>
    createElement(
      'g',
      { className: 'outfit-acc-swim-ring' },
      createElement('path', {
        fill: '#171917',
        d: 'M-18 -4h36v10h-36zM-12 -12h8v8h-8z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-16 -2h32v6h-32zm6 -8h4v6h-4z',
      }),
      createElement('path', {
        fill: '#f97316',
        d: 'M-12 -6h4v3h-4z',
      }),
    ),

  // 13. 荣耀小星徽章
  asset_a_star_badge: () =>
    createElement(
      'g',
      { className: 'outfit-acc-star-badge' },
      createElement('path', {
        fill: '#171917',
        d: 'M-4 -4h8v8h-8z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-3 -3h6v6h-6z',
      }),
      createElement('path', {
        fill: '#fde047',
        d: 'M-1 -1h2v2h-2z',
      }),
    ),

  // 14. 第一名小金牌
  asset_a_gold_medal: () =>
    createElement(
      'g',
      { className: 'outfit-acc-gold-medal' },
      createElement('path', {
        fill: '#dc2626',
        d: 'M-4 -8h8v6h-8z',
      }),
      createElement('path', {
        fill: '#171917',
        d: 'M-5 -2h10v10h-10z',
      }),
      createElement('path', {
        fill: '#facc15',
        d: 'M-4 -1h8v8h-8z',
      }),
      createElement('path', {
        fill: '#ca8a04',
        d: 'M-1 2h2v4h-2z',
      }),
    ),

  // 15. 暖心外带热咖啡
  asset_a_coffee_cup: () =>
    createElement(
      'g',
      { className: 'outfit-acc-coffee-cup' },
      createElement('path', {
        fill: '#171917',
        d: 'M-5 -4h10v10h-10zM-4 -7h8v3h-8z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M-3 -5h6v1h-6zm0 2h6v6h-6z',
      }),
      createElement('path', {
        fill: '#78350f',
        d: 'M-3 -1h6v3h-6z',
      }),
    ),

  // 16. 晨间小土司
  asset_a_toast_mouth: () =>
    createElement(
      'g',
      { className: 'outfit-acc-toast' },
      createElement('path', {
        fill: '#171917',
        d: 'M-6 -3h12v6h-12z',
      }),
      createElement('path', {
        fill: '#fde68a',
        d: 'M-5 -2h10v4h-10z',
      }),
      createElement('path', {
        fill: '#d97706',
        d: 'M-4 -1h8v1h-8z',
      }),
    ),

  // 17. 复古掌上游戏机
  asset_a_gameboy: () =>
    createElement(
      'g',
      { className: 'outfit-acc-gameboy' },
      createElement('path', {
        fill: '#171917',
        d: 'M-6 -6h12v14h-12z',
      }),
      createElement('path', {
        fill: '#94a3b8',
        d: 'M-4 -4h8v10h-8z',
      }),
      createElement('path', {
        fill: '#15803d',
        d: 'M-3 -2h6v4h-6z',
      }),
      createElement('path', {
        fill: '#dc2626',
        d: 'M1 4h2v2h-2z',
      }),
    ),

  // 18. 双生小樱桃胸针
  asset_a_cherry_pin: () =>
    createElement(
      'g',
      { className: 'outfit-acc-cherry-pin' },
      createElement('path', {
        fill: '#15803d',
        d: 'M-1 -6h4v4h-4z',
      }),
      createElement('path', {
        fill: '#171917',
        d: 'M-4 -2h4v4h-4zm5 0h4v4h-4z',
      }),
      createElement('path', {
        fill: '#dc2626',
        d: 'M-3 -1h3v3h-3zm5 0h3v3h-3z',
      }),
    ),

  // 19. 心动闪光环绕粒子
  asset_a_sparkle_aura: () =>
    createElement(
      'g',
      { className: 'outfit-acc-sparkle-aura' },
      createElement('path', {
        fill: '#facc15',
        d: 'M-26 -16h3v3h-3zm50 4h3v3h-3zm-48 30h3v3h-3zm44 4h3v3h-3z',
      }),
      createElement('path', {
        fill: '#f43f5e',
        d: 'M-20 6h4v4h-4zm36 -24h4v4h-4z',
      }),
    ),

  // 20. 像素小幽灵跟宠
  asset_a_ghost_companion: () =>
    createElement(
      'g',
      { className: 'outfit-acc-ghost' },
      createElement('path', {
        fill: '#171917',
        d: 'M14 -12h8v12h-2v2h-4v-2h-2z',
      }),
      createElement('path', {
        fill: '#f8fafc',
        d: 'M16 -10h5v8h-1v1h-3v-1h-1z',
      }),
      createElement('path', {
        fill: '#171917',
        d: 'M17 -8h1v2h-1zm3 0h1v2h-1z',
      }),
    ),

  // 21. 欢快音符环绕
  asset_a_musical_notes: () =>
    createElement(
      'g',
      { className: 'outfit-acc-musical-notes' },
      createElement('path', {
        fill: '#171917',
        d: 'M-22 -10h4v6h-4zm2 0h6v2h-6zm4 0h2v6h-2z',
      }),
      createElement('path', {
        fill: '#0284c7',
        d: 'M-20 -8h2v3h-2zm4 0h2v3h-2z',
      }),
      createElement('path', {
        fill: '#f43f5e',
        d: 'M20 -16h4v4h-4zm2 -2h6v2h-6zm4 0h2v4h-2z',
      }),
    ),
}
