import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import type { Trip } from '../types'

export default function TripList() {
  const [trips, setTrips] = useState<Trip[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    loadTrips()
  }, [])

  const loadTrips = async () => {
    const { data } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: false })

    if (data) setTrips(data)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #2D1B4E 0%, #4A2D6B 100%)',
      padding: '1rem'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingTop: '1rem'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>My Trips</h1>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Back
          </button>
        </div>

        {trips.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: '1rem', opacity: 0.7 }}>No trips yet</p>
            <button
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #6B4D8E 0%, #8B6DB0 100%)',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Create First Trip
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {trips.map(trip => (
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
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {trip.name}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                  {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                </div>
                {trip.notes && (
                  <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
                    {trip.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
