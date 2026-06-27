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
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          border: 'none',
          color: 'white',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '0.25rem 0.5rem',
          lineHeight: 1,
          borderRadius: '4px'
        }}
      >
        ⋮
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          background: 'rgba(26, 14, 46, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '12px',
          overflow: 'hidden',
          minWidth: '180px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          zIndex: 9999
        }}>
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation()
                action.onClick()
                setOpen(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '1rem 1.25rem',
                background: 'transparent',
                border: 'none',
                borderBottom: i < actions.length - 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                color: action.danger ? '#f44336' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '1rem'
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
