import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  title: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  rightContent?: React.ReactNode
}

export default function TopBar({ title, subtitle, showBack, onBack, rightContent }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: 'rgba(26, 14, 46, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.25rem',
      zIndex: 100,
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {showBack && (
          <button
            onClick={onBack || (() => navigate(-1))}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.4rem 0.6rem',
              borderRadius: '10px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
            }}
          >
            ←
          </button>
        )}
        <div>
          <h1 style={{
            fontSize: '1.15rem',
            fontWeight: 600,
            color: 'white',
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
            {title}
          </h1>
          {subtitle && (
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(212, 175, 55, 0.7)',
              marginTop: '2px',
              letterSpacing: '0.03em',
              fontWeight: 500
            }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {rightContent && <div>{rightContent}</div>}
    </div>
  )
}
