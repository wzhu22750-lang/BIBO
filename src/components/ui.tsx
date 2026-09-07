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
}: {
  eyebrow: string
  title: string
  subtitle: string
  children?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="micro eyebrow">{eyebrow}</span>
        <h1>
          {title}
          <span className="heading-dot">.</span>
        </h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
