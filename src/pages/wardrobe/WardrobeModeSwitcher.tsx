import type { WardrobeViewMode } from './types'
import { Icon, type IconName } from '../../components/PixelArt'

const MODES: {
  id: WardrobeViewMode
  name: string
  icon: IconName
  tagline: string
  desc: string
}[] = [
  {
    id: 'split',
    name: '上下分屏',
    icon: 'grid',
    tagline: '黄金分屏',
    desc: '角色固定在上半屏，实时看着你换装，零滑动疲劳',
  },
  {
    id: 'drawer',
    name: '抽屉试衣间',
    icon: 'shirt',
    tagline: '底部抽屉',
    desc: '全屏沉浸大展台，时装从底部优雅拉出，可随时收起',
  },
]

export function WardrobeModeSwitcher({
  currentMode,
  onChangeMode,
}: {
  currentMode: WardrobeViewMode
  onChangeMode: (mode: WardrobeViewMode) => void
}) {
  return (
    <aside className="wardrobe-mode-switcher-container" aria-label="原型方案选择">
      <div className="switcher-header">
        <span className="micro eyebrow">A / B 原型体验对比</span>
        <span className="micro muted">（随时在 2 种交互模式间即时切换）</span>
      </div>
      <div className="switcher-modes-row">
        {MODES.map((item) => {
          const active = currentMode === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`switcher-mode-card ${active ? 'active' : ''}`}
              onClick={() => onChangeMode(item.id)}
            >
              <div className="mode-card-title">
                <Icon name={item.icon} size={15} className="mode-icon" />
                <strong>{item.name}</strong>
                <span className="mode-badge micro">{item.tagline}</span>
              </div>
              <p className="mode-desc micro">{item.desc}</p>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
