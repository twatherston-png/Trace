import { useLocation, useNavigate } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  const isActive = (route: string) => {
    if (route === '/') return path === '/'
    return path.startsWith(route)
  }

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
    border: 'none',
    color: active ? '#D4AF37' : 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
    fontSize: '0.65rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    fontWeight: active ? 600 : 400,
    letterSpacing: active ? '0.02em' : 'normal'
  })

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '70px',
      background: 'rgba(26, 14, 46, 0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      zIndex: 100,
      padding: '0 0.5rem'
    }}>
      <button onClick={() => navigate('/')} style={buttonStyle(path === '/')}>
        <span style={{ fontSize: '1.4rem' }}>🏠</span>
        Home
      </button>
      <button onClick={() => navigate('/trips')} style={buttonStyle(isActive('/trips'))}>
        <span style={{ fontSize: '1.4rem' }}>✈️</span>
        Trips
      </button>
      <button onClick={() => navigate('/photos')} style={buttonStyle(path === '/photos')}>
        <span style={{ fontSize: '1.4rem' }}>📸</span>
        Photos
      </button>
      <button onClick={() => navigate('/profile')} style={buttonStyle(path === '/profile')}>
        <span style={{ fontSize: '1.4rem' }}>👤</span>
        Profile
      </button>
      <button onClick={() => navigate('/settings')} style={buttonStyle(path === '/settings')}>
        <span style={{ fontSize: '1.4rem' }}>⚙️</span>
        Settings
      </button>
    </div>
  )
}
