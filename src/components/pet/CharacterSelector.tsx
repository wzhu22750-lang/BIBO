import type { CharacterId, CharacterOutfits } from '../../lib/pet'
import { CHARACTER_LIST } from '../../lib/pet'
import { PixelCharacter } from './PixelCharacter'

export type CharacterSelectorProps = {
  selectedId: CharacterId
  outfits?: CharacterOutfits
  onSelect: (id: CharacterId) => void
  className?: string
}

export function CharacterSelector({
  selectedId,
  outfits,
  onSelect,
  className = '',
}: CharacterSelectorProps) {
  return (
    <div
      className={`character-selector-grid ${className}`}
      role="radiogroup"
      aria-label="选择像素宠物伙伴"
    >
      {CHARACTER_LIST.map((item) => {
        const active = item.id === selectedId
        const outfit = outfits?.[item.id]

        return (
          <button
            key={item.id}
            type="button"
            className={`character-card-option ${active ? 'active' : ''}`}
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(item.id)}
            title={item.name}
          >
            <div className="char-card-preview">
              <PixelCharacter
                character={item.id}
                outfit={outfit}
                size={38}
                animation={active ? 'bounce' : 'none'}
              />
            </div>
            <span className="char-card-name">{item.name}</span>
            {active && <span className="char-card-badge">当前选择</span>}
          </button>
        )
      })}
    </div>
  )
}
