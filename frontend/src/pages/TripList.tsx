import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import type { Trip } from '../types'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function TripList() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [showCreateTrip, setShowCreateTrip] = useState(false)
  const [newTrip, setNewTrip] = useState({ name: '', start_date: '', end_date: '', notes: '' })
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadTrips()
  }, [])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const loadTrips = async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error loading trips:', error)
      setNotification({ type: 'error', message: 'Failed to load trips' })
    } else if (data) {
      setTrips(data)
    }
  }

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setNotification({ type: 'error', message: 'Not logged in' })
      return
    }

    const { error } = await supabase.from('trips').insert({
      user_id: user.id,
      name: newTrip.name,
      start_date: newTrip.start_date || null,
      end_date: newTrip.end_date || null,
      notes: newTrip.notes || null
    })

    if (error) {
      console.error('Error creating trip:', error)
      setNotification({ type: 'error', message: `Failed to create trip: ${error.message}` })
    } else {
      setNotification({ type: 'success', message: 'Trip created successfully!' })
      setShowCreateTrip(false)
      setNewTrip({ name: '', start_date: '', end_date: '', notes: '' })
      loadTrips()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '1.25rem',
      paddingTop: '76px',
      paddingBottom: '86px'
    }}>
      <TopBar title="My Trips" subtitle="Your adventures await" />
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Notification */}
        {notification && (
          <div className="fade-in" style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: notification.type === 'success'
              ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.95) 0%, rgba(56, 142, 60, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(244, 67, 54, 0.95) 0%, rgba(211, 47, 47, 0.95) 100%)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '16px',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontWeight: 500
          }}>
            {notification.message}
          </div>
        )}

        {/* Create Trip Button */}
        <button
          onClick={() => setShowCreateTrip(!showCreateTrip)}
          className="gold-glow"
          style={{
            width: '100%',
            padding: '1.1rem',
            marginBottom: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            background: 'linear-gradient(135deg, rgba(74, 45, 107, 0.8) 0%, rgba(107, 77, 142, 0.8) 100%)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.3s ease',
            letterSpacing: '0.02em'
          }}
        >
          {showCreateTrip ? 'Cancel' : '+ New Trip'}
        </button>

        {/* Create Trip Form */}
        {showCreateTrip && (
          <form onSubmit={handleCreateTrip} className="fade-in" style={{
            background: 'rgba(45, 27, 78, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '1.75rem',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <input
              type="text"
              placeholder="Trip name (e.g., Peru 2026)"
              value={newTrip.name}
              onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.9rem 1rem',
                marginBottom: '1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'white',
                fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <input
                type="date"
                value={newTrip.start_date}
                onChange={(e) => setNewTrip({ ...newTrip, start_date: e.target.value })}
                style={{
                  flex: 1,
                  padding: '0.9rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'white',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease'
                }}
              />
              <input
                type="date"
                value={newTrip.end_date}
                onChange={(e) => setNewTrip({ ...newTrip, end_date: e.target.value })}
                style={{
                  flex: 1,
                  padding: '0.9rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'white',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease'
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
                padding: '0.9rem 1rem',
                marginBottom: '1.25rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'white',
                fontSize: '1rem',
                resize: 'none',
                transition: 'all 0.3s ease'
              }}
            />
            <button
              type="submit"
              className="gold-glow"
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
                color: '#1A0E2E',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                letterSpacing: '0.02em'
              }}
            >
              Create Trip
            </button>
          </form>
        )}

        {/* Trips List */}
        {trips.length === 0 ? (
          <div className="fade-in glass-card" style={{
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.6 }}>✈️</div>
            <p style={{ marginBottom: '1.5rem', opacity: 0.7, fontSize: '1.1rem' }}>No trips yet</p>
            <button
              onClick={() => setShowCreateTrip(true)}
              className="gold-glow"
              style={{
                padding: '0.9rem 2rem',
                borderRadius: '12px',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                background: 'linear-gradient(135deg, rgba(74, 45, 107, 0.8) 0%, rgba(107, 77, 142, 0.8) 100%)',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease'
              }}
            >
              Create First Trip
            </button>
          </div>
        ) : (
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {trips.map(trip => (
              <div
                key={trip.id}
                onClick={() => navigate(`/trips/${trip.id}`)}
                className="fade-in glass-card"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '1.25rem',
                  alignItems: 'center'
                }}
              >
                {trip.cover_photo_url ? (
                  <div className="photo-frame" style={{ flexShrink: 0 }}>
                    <img
                      src={trip.cover_photo_url}
                      alt={trip.name}
                      style={{
                        width: '85px',
                        height: '85px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '85px',
                    height: '85px',
                    background: 'linear-gradient(135deg, rgba(74, 45, 107, 0.6) 0%, rgba(107, 77, 142, 0.4) 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.2rem',
                    flexShrink: 0,
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    ✈️
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    letterSpacing: '-0.01em'
                  }}>
                    {trip.name}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'rgba(212, 175, 55, 0.7)',
                    fontWeight: 500
                  }}>
                    {trip.start_date ? new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No dates'}
                    {trip.start_date && trip.end_date && ' — '}
                    {trip.end_date ? new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                  </div>
                  {trip.notes && (
                    <div style={{
                      fontSize: '0.9rem',
                      marginTop: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {trip.notes}
                    </div>
                  )}
                </div>
                <div style={{
                  color: 'rgba(212, 175, 55, 0.5)',
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}>
                  →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}