import { useState, useRef, useEffect } from 'react'

interface Action {
  label: string
  onClick: () => void
  danger?: boolean
}

interface ActionMenuProps {
  actions: Action[]
}

export default function ActionMenu({ actions }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPos({
        top: rect.bottom,
        right: window.innerWidth - rect.right
      })
    }
    setOpen(!open)
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '1.4rem',
          cursor: 'pointer',
          padding: '0.25rem 0.5rem',
          lineHeight: 1
        }}
      >
        ⋮
      </button>
      {open && menuPos && (
        <div style={{
          position: 'fixed',
          top: menuPos.top,
          right: menuPos.right,
          background: '#1a1a1a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          overflow: 'hidden',
          minWidth: '160px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
          zIndex: 9999
        }}>
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => { action.onClick(); setOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: i < actions.length - 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                color: action.danger ? '#f44336' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.9rem'
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
