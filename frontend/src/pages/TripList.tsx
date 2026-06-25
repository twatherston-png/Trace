import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import type { Trip } from '../types'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function TripList() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [showCreateTrip, setShowCreateTrip] = useState(false)
  const [newTrip, setNewTrip] = useState({ name: '', start_date: '', end_date: '', notes: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setNotification({ type: 'error', message: 'Not logged in' })
      setUploading(false)
      return
    }

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileName = `${Date.now()}-${file.name}`
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          errorCount++
          continue
        }

        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName)

          const { error: insertError } = await supabase.from('photos').insert({
            trip_id: trips[0]?.id || null,
            url: publicUrl,
            caption: file.name
          })

          if (insertError) {
            console.error('Insert error:', insertError)
            errorCount++
          } else {
            successCount++
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        errorCount++
      }

      setUploadProgress(((i + 1) / files.length) * 100)
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (successCount > 0) {
      setNotification({ type: 'success', message: `Uploaded ${successCount} photo${successCount > 1 ? 's' : ''} successfully!` })
    }
    if (errorCount > 0) {
      setNotification({ type: 'error', message: `Failed to upload ${errorCount} photo${errorCount > 1 ? 's' : ''}` })
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      padding: '1rem',
      paddingTop: '72px',
      paddingBottom: '80px'
    }}>
      <TopBar title="My Trips" />
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Notification */}
        {notification && (
          <div style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: notification.type === 'success' ? '#4CAF50' : '#f44336',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '8px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            {notification.message}
          </div>
        )}

        {/* Upload Photos Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          multiple
          accept="image/*"
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%',
            padding: '1rem',
            marginBottom: uploading ? '0.5rem' : '1.5rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #6B4D8E 0%, #8B6DB0 100%)',
            color: 'white',
            fontWeight: 'bold',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            opacity: uploading ? 0.7 : 1
          }}
        >
          {uploading ? `Uploading... ${Math.round(uploadProgress)}%` : '+ Upload Photos'}
        </button>

        {/* Upload Progress Bar */}
        {uploading && (
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #D4AF37 0%, #E5C458 100%)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}

        {/* Create Trip Button */}
        <button
          onClick={() => setShowCreateTrip(!showCreateTrip)}
          style={{
            width: '100%',
            padding: '1rem',
            marginBottom: '1.5rem',
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

        {/* Trips List */}
        {trips.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: '1rem', opacity: 0.7 }}>No trips yet</p>
            <button
              onClick={() => setShowCreateTrip(true)}
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
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {trip.name}
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : 'No dates'} - {trip.end_date ? new Date(trip.end_date).toLocaleDateString() : ''}
                  </div>
                  {trip.notes && (
                    <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
                      {trip.notes}
                    </div>
                  )}
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