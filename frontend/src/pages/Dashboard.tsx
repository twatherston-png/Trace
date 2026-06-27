import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import type { Trip } from '../types'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import WorldMap from '../components/WorldMap'

export default function Dashboard() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [stats, setStats] = useState({ trips: 0, photos: 0, countries: 0 })
  const [showCreateTrip, setShowCreateTrip] = useState(false)
  const [newTrip, setNewTrip] = useState({ name: '', start_date: '', end_date: '', notes: '' })
  const [showAddPin, setShowAddPin] = useState(false)
  const [newPin, setNewPin] = useState({ date: '', location: '', notes: '', photo_url: '' })
  const [geocoding, setGeocoding] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  // Set up global handlers for WorldMap navigation
  useEffect(() => {
    ;(window as any).__viewPhotos = (photoIds: string, locationLabel: string) => {
      navigate('/photos', { state: { photoIds, locationLabel } })
    }
    
    ;(window as any).__viewTrip = (tripId: string) => {
      navigate(`/trips/${tripId}`)
    }
    
    return () => {
      delete (window as any).__viewPhotos
      delete (window as any).__viewTrip
    }
  }, [navigate])

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

  const handleCountryCount = useCallback((count: number) => {
    setStats(prev => ({ ...prev, countries: count }))
  }, [])

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

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setGeocoding(true)
    let latitude: number | null = null
    let longitude: number | null = null

    // Geocode location if provided
    if (newPin.location) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(newPin.location)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}&limit=1`
        )
        const data = await response.json()
        if (data.features && data.features.length > 0) {
          [longitude, latitude] = data.features[0].center
        }
      } catch (error) {
        console.error('Geocoding error:', error)
      }
    }

    setGeocoding(false)

    const { error } = await supabase.from('pins').insert({
      user_id: user.id,
      date: newPin.date,
      location: newPin.location || null,
      latitude,
      longitude,
      notes: newPin.notes || null,
      photo_url: newPin.photo_url || null
    })

    if (!error) {
      setShowAddPin(false)
      setNewPin({ date: '', location: '', notes: '', photo_url: '' })
      // Refresh map to show new pin
      window.location.reload()
    }
  }

  const handlePinPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading photo:', uploadError)
      return
    }

    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath)

    setNewPin({ ...newPin, photo_url: data.publicUrl })
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '1.25rem',
      paddingTop: '76px',
      paddingBottom: '86px'
    }}>
      <TopBar title="Trace" subtitle="Your journey, preserved" />
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* World Map */}
        <div style={{ marginBottom: '2rem' }}>
          <WorldMap onCountryCount={handleCountryCount} />
        </div>

        {/* Stats */}
        <div className="stagger" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '2rem'
        }}>
          <div className="fade-in glass-card" style={{
            padding: '1.5rem 1rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.2rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.25rem'
            }}>
              {stats.trips}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Trips
            </div>
          </div>
          <div className="fade-in glass-card" style={{
            padding: '1.5rem 1rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.2rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.25rem'
            }}>
              {stats.photos}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Photos
            </div>
          </div>
          <div className="fade-in glass-card" style={{
            padding: '1.5rem 1rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.2rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.25rem'
            }}>
              {stats.countries}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Countries
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <button
            onClick={() => {
              setShowAddPin(!showAddPin)
              if (!showAddPin) setShowCreateTrip(false)
            }}
            className="gold-glow"
            style={{
              flex: 1,
              padding: '1.1rem',
              borderRadius: '16px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              background: showAddPin
                ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(229, 196, 88, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(74, 45, 107, 0.8) 0%, rgba(107, 77, 142, 0.8) 100%)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              letterSpacing: '0.02em'
            }}
          >
            {showAddPin ? 'Cancel' : '📍 Add Pin'}
          </button>
          <button
            onClick={() => {
              setShowCreateTrip(!showCreateTrip)
              if (!showCreateTrip) setShowAddPin(false)
            }}
            className="gold-glow"
            style={{
              flex: 1,
              padding: '1.1rem',
              borderRadius: '16px',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              background: showCreateTrip
                ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(229, 196, 88, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(74, 45, 107, 0.8) 0%, rgba(107, 77, 142, 0.8) 100%)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              letterSpacing: '0.02em'
            }}
          >
            {showCreateTrip ? 'Cancel' : '✈️ New Trip'}
          </button>
        </div>

        {/* Add Pin Form */}
        {showAddPin && (
          <form onSubmit={handleCreatePin} className="fade-in" style={{
            background: 'rgba(45, 27, 78, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '1.75rem',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#D4AF37' }}>
              📍 Add a Pin
            </div>
            <input
              type="date"
              value={newPin.date}
              onChange={(e) => setNewPin({ ...newPin, date: e.target.value })}
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
            <input
              type="text"
              placeholder="Location (e.g., Qatar, Doha Airport)"
              value={newPin.location}
              onChange={(e) => setNewPin({ ...newPin, location: e.target.value })}
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
            <textarea
              placeholder="Notes (e.g., Just passed through the airport)"
              value={newPin.notes}
              onChange={(e) => setNewPin({ ...newPin, notes: e.target.value })}
              rows={2}
              style={{
                width: '100%',
                padding: '0.9rem 1rem',
                marginBottom: '1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'white',
                fontSize: '1rem',
                resize: 'none',
                transition: 'all 0.3s ease'
              }}
            />
            {/* Photo upload or placeholder */}
            <div style={{ marginBottom: '1.25rem' }}>
              {newPin.photo_url ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={newPin.photo_url}
                    alt="Pin"
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setNewPin({ ...newPin, photo_url: '' })}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(231, 76, 60, 0.9)',
                      border: 'none',
                      color: 'white',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '0.6rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    📷 Add Photo
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                    Optional
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePinPhotoUpload}
                style={{ display: 'none' }}
              />
            </div>
            <button
              type="submit"
              disabled={geocoding}
              className="gold-glow"
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
                color: '#1A0E2E',
                fontWeight: 700,
                cursor: geocoding ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                letterSpacing: '0.02em',
                opacity: geocoding ? 0.7 : 1
              }}
            >
              {geocoding ? 'Locating...' : 'Drop Pin 📍'}
            </button>
          </form>
        )}

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
                required
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
                required
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

        {/* Recent Trips */}
        <div>
          <h2 style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
            color: 'rgba(212, 175, 55, 0.7)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Recent Trips
          </h2>
          {trips.length === 0 ? (
            <div className="fade-in glass-card" style={{
              padding: '3rem 2rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.6 }}>✈️</div>
              <p style={{ opacity: 0.7, fontSize: '1rem' }}>No trips yet. Create your first trip!</p>
            </div>
          ) : (
            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {trips.slice(0, 3).map(trip => (
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
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: 'linear-gradient(135deg, rgba(74, 45, 107, 0.6) 0%, rgba(107, 77, 142, 0.4) 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      flexShrink: 0,
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      ✈️
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      marginBottom: '0.4rem',
                      letterSpacing: '-0.01em'
                    }}>
                      {trip.name}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'rgba(212, 175, 55, 0.7)',
                      fontWeight: 500
                    }}>
                      {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
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
      </div>

      <BottomNav />
    </div>
  )
}
