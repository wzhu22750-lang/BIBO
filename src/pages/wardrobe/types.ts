import type { AvatarType, Page } from '../../lib/types'
import type { WardrobeViewMode } from '../../lib/routes'
import type { CharacterId, CharacterOutfits, Outfit, WardrobeItem } from '../../lib/pet'
import type { PixelCharacterAnimation } from '../../components/pet/PixelCharacter'

export type { WardrobeViewMode }

export type SharedWardrobeProps = {
  activeChar: CharacterId
  outfits: CharacterOutfits
  currentOutfit: Outfit
  deployedAvatar: AvatarType
  isDeployed: boolean
  isDirty?: boolean
  anim: PixelCharacterAnimation
  busy: boolean
  triggerBounce: () => void
  onSelectCharacter: (charId: CharacterId) => void
  onOutfitChange: (newOutfit: Outfit) => void
  onItemEquipped: (item: WardrobeItem) => void
  onSetDeployed: () => void
  onSave: () => void
  navigate: (page: Page) => void
}
