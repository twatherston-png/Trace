import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import type { Trip } from '../types'

export default function Dashboard() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [stats, setStats] = useState({ trips: 0, photos: 0, countries: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: tripsData } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: false })

    if (tripsData) {
      setTrips(tripsData)
      setStats(prev => ({ ...prev, trips: tripsData.length }))
    }

    const { count: photosCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })

    if (photosCount) {
      setStats(prev => ({ ...prev, photos: photosCount }))
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #2D1B4E 0%, #4A2D6B 100%)',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingTop: '1rem'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Trace</h1>
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#D4AF37' }}>
              {stats.trips}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Trips</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#D4AF37' }}>
              {stats.photos}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Photos</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#D4AF37' }}>
              {stats.countries}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Countries</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/trips')}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '1rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6B4D8E 0%, #8B6DB0 100%)',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              View Trips
            </button>
            <button
              onClick={() => navigate('/photos')}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '1rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6B4D8E 0%, #8B6DB0 100%)',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              View Photos
            </button>
          </div>
        </div>

        {/* Recent Trips */}
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Recent Trips</h2>
          {trips.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              opacity: 0.7
            }}>
              No trips yet. Create your first trip!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {trips.slice(0, 3).map(trip => (
                <div
                  key={trip.id}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {trip.name}
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
