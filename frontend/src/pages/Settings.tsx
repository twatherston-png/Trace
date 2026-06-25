import { useState } from 'react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function Settings() {
  const [theme, setTheme] = useState('dark')
  const [notifications, setNotifications] = useState(true)
  const [autoUpload, setAutoUpload] = useState(false)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      padding: '1rem',
      paddingTop: '72px',
      paddingBottom: '80px'
    }}>
      <TopBar title="Settings" />
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Appearance Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', opacity: 0.8 }}>
            Appearance
          </h2>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Theme</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>Choose your preferred look</div>
              </div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', opacity: 0.8 }}>
            Notifications
          </h2>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Push Notifications</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>Get notified about your trips</div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                style={{
                  width: '50px',
                  height: '30px',
                  borderRadius: '15px',
                  border: 'none',
                  background: notifications ? '#6B4D8E' : 'rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: notifications ? '23px' : '3px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Data & Storage Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', opacity: 0.8 }}>
            Data & Storage
          </h2>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Auto-Upload Photos</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>Automatically upload photos from your camera roll</div>
              </div>
              <button
                onClick={() => setAutoUpload(!autoUpload)}
                style={{
                  width: '50px',
                  height: '30px',
                  borderRadius: '15px',
                  border: 'none',
                  background: autoUpload ? '#6B4D8E' : 'rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: autoUpload ? '23px' : '3px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', opacity: 0.8 }}>
            About
          </h2>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Version</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>1.0.0</div>
            </div>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Developed by</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>Phoenix in Sereinity</div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
