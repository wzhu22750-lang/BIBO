import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon } from './PixelArt'
import { errorText } from '../lib/supabase'
export const ToastContext = createContext<(message: string, error?: boolean) => void>(() => {})
export const useToast = () => useContext(ToastContext)
export function Button({
  tone = 'yellow',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'yellow' | 'green' | 'pink' | 'blue' | 'white' | 'ink'
}) {
  return (
    <button {...props} className={`button tone-${tone} ${className}`}>
      {children}
    </button>
  )
}
export function useTask() {
  const [busy, setBusy] = useState(false),
    toast = useToast(),
    running = useRef(false)
  async function run(task: () => Promise<void>) {
    if (running.current) return false
    running.current = true
    setBusy(true)
    try {
      await task()
      return true
    } catch (e) {
      toast(errorText(e), true)
      return false
    } finally {
      running.current = false
      setBusy(false)
    }
  }
  return { busy, run }
}
export function Panel({
  title,
  tag,
  children,
  className = '',
  action,
}: {
  title?: string
  tag?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-header">
          <h2>
            {title} {tag && <span className="micro muted">{tag}</span>}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
export function Modal({
  title,
  children,
  onClose,
  className = '',
}: {
  title: string
  children: ReactNode
  onClose: () => void
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = old
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect()
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose()
        }
      }}
    >
      <div className="modal-header">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="关闭弹窗" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      </div>
      {children}
    </dialog>
  )
}
export function Empty({
  icon = '♡',
  title,
  description,
}: {
  icon?: string
  title: string
  description: string
}) {
  return (
    <div className="empty">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
export function PageHeading({
  eyebrow,
  title,
  subtitle,
  children,
  leading,
  onEdit,
  editLabel = '编辑寄语',
}: {
  eyebrow: string
  title: string
  subtitle: string
  children?: ReactNode
  leading?: ReactNode
  onEdit?: () => void
  editLabel?: string
}) {
  return (
    <div className="page-heading">
      <div className="heading-main">
        <span className="micro eyebrow">{eyebrow}</span>
        <div className="heading-title-row">
          {leading}
          <h1>
            {title}
            <span className="heading-dot">.</span>
          </h1>
          {onEdit && (
            <button
              type="button"
              className="heading-edit-btn"
              onClick={onEdit}
              title={editLabel}
              aria-label={editLabel}
            >
              <Icon name="spark" size={13} />
              <span>编辑</span>
            </button>
          )}
        </div>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

export type PixelSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export function PixelSelect({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  'aria-label': ariaLabel,
  disabled = false,
  id,
}: {
  value: string
  onChange: (value: string) => void
  options: PixelSelectOption[]
  placeholder?: string
  className?: string
  'aria-label'?: string
  disabled?: boolean
  id?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const selectedOption = options.find((opt) => opt.value === value)
  const displayLabel = selectedOption?.label || placeholder || value || '请选择'

  return (
    <div
      ref={containerRef}
      className={`pixel-select-container ${open ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      id={id}
    >
      <button
        type="button"
        className="pixel-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="pixel-select-label">{displayLabel}</span>
        <span className={`pixel-select-arrow ${open ? 'is-up' : ''}`} aria-hidden="true">
          ▼
        </span>
      </button>

      {open && (
        <ul className="pixel-select-dropdown" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`pixel-select-option ${isSelected ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
                onClick={() => {
                  if (option.disabled) return
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <span className="pixel-select-check" aria-hidden="true">
                    ✔
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
