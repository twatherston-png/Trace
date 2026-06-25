import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  rightContent?: React.ReactNode
}

export default function TopBar({ title, showBack, onBack, rightContent }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '56px',
      background: '#2D1B4E',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1rem',
      zIndex: 100,
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {showBack && (
          <button
            onClick={onBack || (() => navigate(-1))}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0.25rem'
            }}
          >
            ←
          </button>
        )}
        <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
          {title}
        </h1>
      </div>
      {rightContent && <div>{rightContent}</div>}
    </div>
  )
}
