import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Photo } from '../types'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import ActionMenu from '../components/ActionMenu'

export default function PhotosGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [trips, setTrips] = useState<any[]>([])
  const [days, setDays] = useState<any[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'trip' | 'location'>('date')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  // Edit form state
  const [editDate, setEditDate] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editJournal, setEditJournal] = useState('')
  const [editTripId, setEditTripId] = useState('')
  const [editDayId, setEditDayId] = useState('')

  useEffect(() => {
    loadPhotos()
    loadTrips()
    loadDays()
  }, [])

  const loadTrips = async () => {
    const { data } = await supabase.from('trips').select('*').order('start_date', { ascending: false })
    if (data) setTrips(data)
  }

  const loadDays = async () => {
    const { data } = await supabase.from('days').select('*').order('date', { ascending: false })
    if (data) setDays(data)
  }

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const loadPhotos = async () => {
    const { data } = await supabase
      .from('photos')
      .select('*, trips(name)')
      .order('uploaded_at', { ascending: false })

    if (data) setPhotos(data)
  }

  const handleDeletePhoto = async (photoId: string, photoUrl: string) => {
    if (!confirm('Delete this photo?')) return

    const urlParts = photoUrl.split('/photos/')
    if (urlParts.length < 2) {
      setNotification({ type: 'error', message: 'Could not determine file path' })
      return
    }
    const filePath = urlParts[1]

    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([filePath])

    if (storageError) {
      console.error('Storage delete error:', storageError)
    }

    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      setNotification({ type: 'error', message: `Failed to delete photo: ${dbError.message}` })
    } else {
      setNotification({ type: 'success', message: 'Photo deleted successfully!' })
      loadPhotos()
    }
  }

  const handleOpenEdit = (photo: Photo) => {
    setEditingPhoto(photo)
    setEditDate(photo.taken_at ? photo.taken_at.split('T')[0] : '')
    setEditLocation(photo.location || '')
    setEditNotes(photo.notes || '')
    setEditJournal(photo.journal_entry || '')
    setEditTripId(photo.trip_id || '')
    setEditDayId(photo.day_id || '')
  }

  const handleSaveEdit = async () => {
    if (!editingPhoto) return

    // Auto-assign day if date and trip are set
    let autoDayId = editDayId
    if (editDate && editTripId && !autoDayId) {
      const matchingDay = days.find(d => 
        d.trip_id === editTripId && 
        d.date === editDate
      )
      if (matchingDay) {
        autoDayId = matchingDay.id
      }
    }

    const { error } = await supabase
      .from('photos')
      .update({
        taken_at: editDate || null,
        location: editLocation || null,
        notes: editNotes || null,
        journal_entry: editJournal || null,
        trip_id: editTripId || null,
        day_id: autoDayId || null
      })
      .eq('id', editingPhoto.id)

    if (error) {
      setNotification({ type: 'error', message: `Failed to save: ${error.message}` })
    } else {
      setNotification({ type: 'success', message: 'Photo updated!' })
      setEditingPhoto(null)
      loadPhotos()
    }
  }

  const sortedPhotos = [...photos].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    }
    if (sortBy === 'location') {
      return (a.location || 'No location').localeCompare(b.location || 'No location')
    }
    if (sortBy === 'trip') {
      const tripA = (a as any).trips?.name || 'No trip'
      const tripB = (b as any).trips?.name || 'No trip'
      return tripA.localeCompare(tripB)
    }
    return 0
  })

  const groupedPhotos = sortedPhotos.reduce((acc, photo) => {
    let key = 'No trip'
    if (sortBy === 'date') {
      key = new Date(photo.uploaded_at).toLocaleDateString()
    } else if (sortBy === 'trip') {
      key = (photo as any).trips?.name || 'No trip'
    } else if (sortBy === 'location') {
      key = photo.location || 'No location'
    }
    if (!acc[key]) acc[key] = []
    acc[key].push(photo)
    return acc
  }, {} as Record<string, Photo[]>)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      padding: '1rem',
      paddingTop: '72px',
      paddingBottom: '80px'
    }}>
      <TopBar title="Photos" />
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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

        {/* Sort Controls */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          {(['date', 'trip', 'location'] as const).map(sort => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: sortBy === sort
                  ? 'linear-gradient(135deg, #6B4D8E 0%, #8B6DB0 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {sort}
            </button>
          ))}
        </div>

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: '1rem', opacity: 0.7 }}>No photos yet</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.5 }}>Upload photos from a trip page</p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedPhotos).map(([group, groupPhotos]) => (
              <div key={group} style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  opacity: 0.8,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  paddingBottom: '0.5rem'
                }}>
                  {group}
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {groupPhotos.map(photo => (
                    <div
                      key={photo.id}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Photo'}
                        onClick={() => setSelectedPhoto(photo)}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ position: 'absolute', top: '4px', right: '4px' }}>
                        <ActionMenu actions={[
                          { label: '✏️ Edit Details', onClick: () => handleOpenEdit(photo) },
                          { label: '🗑️ Delete Photo', onClick: () => handleDeletePhoto(photo.id, photo.url), danger: true }
                        ]}
                      />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem'
          }}
        >
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.caption || 'Photo'}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: '8px'
            }}
          />
        </div>
      )}

      {/* Edit Photo Modal */}
      {editingPhoto && (
        <div
          onClick={() => setEditingPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '1rem',
            overflowY: 'auto',
            paddingTop: '80px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a1a',
              borderRadius: '16px',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '100%',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* Preview */}
            <img
              src={editingPhoto.url}
              alt=""
              style={{
                width: '100%',
                maxHeight: '200px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}
            />

            <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.2rem' }}>Edit Photo Details</h3>

            {/* Date */}
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
              Date Taken
            </label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                marginBottom: '1rem',
                fontSize: '1rem'
              }}
            />

            {/* Location */}
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
              Location
            </label>
            <input
              type="text"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              placeholder="e.g. Lima, Peru"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                marginBottom: '1rem',
                fontSize: '1rem'
              }}
            />

            {/* Trip */}
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
              Trip
            </label>
            <select
              value={editTripId}
              onChange={(e) => setEditTripId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                marginBottom: '1rem',
                fontSize: '1rem'
              }}
            >
              <option value="" style={{ background: '#1a1a1a' }}>No trip</option>
              {trips.map(t => (
                <option key={t.id} value={t.id} style={{ background: '#1a1a1a' }}>{t.name}</option>
              ))}
            </select>

            {/* Day (auto-assigned if date matches) */}
            {editTripId && (
              <>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
                  Day (auto-assigned by date)
                </label>
                <select
                  value={editDayId}
                  onChange={(e) => setEditDayId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    marginBottom: '1rem',
                    fontSize: '1rem'
                  }}
                >
                  <option value="" style={{ background: '#1a1a1a' }}>Auto (match by date)</option>
                  {days.filter(d => d.trip_id === editTripId).map(d => (
                    <option key={d.id} value={d.id} style={{ background: '#1a1a1a' }}>
                      {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {d.location || 'No location'}
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Notes */}
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
              Notes
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Quick notes about this photo..."
              rows={2}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                marginBottom: '1rem',
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />

            {/* Journal Entry */}
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
              Journal Entry
            </label>
            <textarea
              value={editJournal}
              onChange={(e) => setEditJournal(e.target.value)}
              placeholder="Write about this moment..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                marginBottom: '1.5rem',
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setEditingPhoto(null)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  flex: 1,
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
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
