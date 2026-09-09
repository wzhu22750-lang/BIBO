import { useId, useState, type ReactNode } from 'react'

export function SettingsNote({
  title = '查看说明',
  children,
  defaultOpen = false,
  className = '',
}: {
  title?: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <div className={`settings-note ${open ? 'is-open' : ''} ${className}`.trim()}>
      <button
        type="button"
        className="settings-note-toggle"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{title}</span>
        <span className="settings-note-caret" aria-hidden="true">
          {open ? '收起' : '展开'}
        </span>
      </button>
      {open ? (
        <div id={contentId} className="settings-note-body">
          {children}
        </div>
      ) : null}
    </div>
  )
}
