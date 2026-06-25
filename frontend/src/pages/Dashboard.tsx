import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import type { Trip } from '../types'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function Dashboard() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [stats, setStats] = useState({ trips: 0, photos: 0, countries: 0 })
  const [showCreateTrip, setShowCreateTrip] = useState(false)
  const [newTrip, setNewTrip] = useState({ name: '', start_date: '', end_date: '', notes: '' })
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

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('trips').insert({
      user_id: user.id,
      name: newTrip.name,
      start_date: newTrip.start_date,
      end_date: newTrip.end_date,
      notes: newTrip.notes || null
    })

    if (!error) {
      setShowCreateTrip(false)
      setNewTrip({ name: '', start_date: '', end_date: '', notes: '' })
      loadData()
    }
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
      <TopBar title="Trace" rightContent={
        <button
          onClick={handleSignOut}
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'transparent',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          Sign Out
        </button>
      } />
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

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

        {/* Create Trip Button */}
        <button
          onClick={() => setShowCreateTrip(!showCreateTrip)}
          style={{
            width: '100%',
            padding: '1rem',
            marginBottom: '2rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #6B4D8E 0%, #8B6DB0 100%)',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          {showCreateTrip ? 'Cancel' : '+ New Trip'}
        </button>

        {/* Create Trip Form */}
        {showCreateTrip && (
          <form onSubmit={handleCreateTrip} style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <input
              type="text"
              placeholder="Trip name (e.g., Peru 2026)"
              value={newTrip.name}
              onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '1rem',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
            />
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="date"
                value={newTrip.start_date}
                onChange={(e) => setNewTrip({ ...newTrip, start_date: e.target.value })}
                required
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
              <input
                type="date"
                value={newTrip.end_date}
                onChange={(e) => setNewTrip({ ...newTrip, end_date: e.target.value })}
                required
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={newTrip.notes}
              onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })}
              rows={2}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '1rem',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '1rem',
                resize: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
                color: '#2D1B4E',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Create Trip
            </button>
          </form>
        )}

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
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {trip.cover_photo_url ? (
                    <img
                      src={trip.cover_photo_url}
                      alt={trip.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      flexShrink: 0
                    }}>
                      ✈️
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {trip.name}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                      {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}