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
    background: 'transparent',
    border: 'none',
    color: active ? '#D4AF37' : 'white',
    cursor: 'pointer',
    fontSize: '0.7rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem'
  })

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: '#2D1B4E',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: 100
    }}>
      <button onClick={() => navigate('/')} style={buttonStyle(path === '/')}>
        <span style={{ fontSize: '1.3rem' }}>🏠</span>
        Home
      </button>
      <button onClick={() => navigate('/trips')} style={buttonStyle(isActive('/trips'))}>
        <span style={{ fontSize: '1.3rem' }}>✈️</span>
        Trips
      </button>
      <button onClick={() => navigate('/photos')} style={buttonStyle(path === '/photos')}>
        <span style={{ fontSize: '1.3rem' }}>📸</span>
        Photos
      </button>
      <button onClick={() => navigate('/profile')} style={buttonStyle(path === '/profile')}>
        <span style={{ fontSize: '1.3rem' }}>👤</span>
        Profile
      </button>
      <button onClick={() => navigate('/settings')} style={buttonStyle(path === '/settings')}>
        <span style={{ fontSize: '1.3rem' }}>⚙️</span>
        Settings
      </button>
    </div>
  )
}
