import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ trips: 0, photos: 0, journal: 0 })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUser(user)

    const { data: tripsData } = await supabase.from('trips').select('id')
    const { count: photosCount } = await supabase.from('photos').select('*', { count: 'exact', head: true })
    const { count: journalCount } = await supabase.from('journal_entries').select('*', { count: 'exact', head: true })

    if (tripsData) setStats(prev => ({ ...prev, trips: tripsData.length }))
    if (photosCount) setStats(prev => ({ ...prev, photos: photosCount }))
    if (journalCount) setStats(prev => ({ ...prev, journal: journalCount }))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      padding: '1rem',
      paddingTop: '72px',
      paddingBottom: '80px'
    }}>
      <TopBar title="Profile" />
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* User Info */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6B4D8E 0%, #8B6DB0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '2rem'
          }}>
            👤
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {user?.email || 'User'}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#D4AF37' }}>
              {stats.trips}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Trips</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#D4AF37' }}>
              {stats.photos}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Photos</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#D4AF37' }}>
              {stats.journal}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Journal</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(244, 67, 54, 0.5)',
              background: 'rgba(244, 67, 54, 0.1)',
              color: '#f44336',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
