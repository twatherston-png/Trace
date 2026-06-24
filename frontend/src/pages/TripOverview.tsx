import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Trip, Day, Activity, Photo, JournalEntry } from '../types'

export default function TripOverview() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [days, setDays] = useState<Day[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [showJournalForm, setShowJournalForm] = useState(false)
  const [newJournal, setNewJournal] = useState({ date: '', location: '', content: '' })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (tripId) loadTripData()
  }, [tripId])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const loadTripData = async () => {
    if (!tripId) return

    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()

    if (tripData) setTrip(tripData)

    const { data: daysData } = await supabase
      .from('days')
      .select('*')
      .eq('trip_id', tripId)
      .order('date')

    if (daysData) setDays(daysData)

    const { data: activitiesData } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', tripId)

    if (activitiesData) setActivities(activitiesData)

    const { data: photosData } = await supabase
      .from('photos')
      .select('*')
      .eq('trip_id', tripId)

    if (photosData) setPhotos(photosData)

    const { data: journalData } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('trip_id', tripId)
      .order('date')

    if (journalData) setJournalEntries(journalData)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !tripId) return

    setUploading(true)
    setUploadProgress(0)

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
            trip_id: tripId,
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
      loadTripData()
    }
    if (errorCount > 0) {
      setNotification({ type: 'error', message: `Failed to upload ${errorCount} photo${errorCount > 1 ? 's' : ''}` })
    }
  }

  const handleAddJournal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tripId) return

    const { error } = await supabase.from('journal_entries').insert({
      trip_id: tripId,
      date: newJournal.date,
      location: newJournal.location || null,
      content: newJournal.content
    })

    if (error) {
      console.error('Error adding journal:', error)
      setNotification({ type: 'error', message: `Failed to add journal: ${error.message}` })
    } else {
      setNotification({ type: 'success', message: 'Journal entry added successfully!' })
      setShowJournalForm(false)
      setNewJournal({ date: '', location: '', content: '' })
      loadTripData()
    }
  }

  if (!trip) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #2D1B4E 0%, #4A2D6B 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>Loading trip...</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #2D1B4E 0%, #4A2D6B 100%)',
      padding: '1rem',
      paddingBottom: '80px'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Notification */}
        {notification && (
          <div style={{
            position: 'fixed',
            top: '1rem',
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingTop: '1rem'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{trip.name}</h1>
          <button
            onClick={() => navigate('/trips')}
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

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
          </div>
          {trip.notes && <div style={{ opacity: 0.8 }}>{trip.notes}</div>}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
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
              flex: 1,
              padding: '1rem',
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
            {uploading ? `Uploading... ${Math.round(uploadProgress)}%` : '+ Photos'}
          </button>
          <button
            onClick={() => setShowJournalForm(!showJournalForm)}
            style={{
              flex: 1,
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
            {showJournalForm ? 'Cancel' : '+ Journal'}
          </button>
        </div>

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

        {/* Journal Entry Form */}
        {showJournalForm && (
          <form onSubmit={handleAddJournal} style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <input
              type="date"
              value={newJournal.date}
              onChange={(e) => setNewJournal({ ...newJournal, date: e.target.value })}
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
            <input
              type="text"
              placeholder="Location (optional)"
              value={newJournal.location}
              onChange={(e) => setNewJournal({ ...newJournal, location: e.target.value })}
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
            <textarea
              placeholder="What happened?"
              value={newJournal.content}
              onChange={(e) => setNewJournal({ ...newJournal, content: e.target.value })}
              required
              rows={4}
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
              Add Journal Entry
            </button>
          </form>
        )}

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
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#D4AF37' }}>
              {days.length}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Days</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#D4AF37' }}>
              {photos.length}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Photos</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#D4AF37' }}>
              {journalEntries.length}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Journal</div>
          </div>
        </div>

        {/* Photos */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Photos</h2>
          {photos.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              opacity: 0.7
            }}>
              No photos yet
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '0.5rem'
            }}>
              {photos.map(photo => (
                <div
                  key={photo.id}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Photo'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activities */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Activities</h2>
          {activities.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              opacity: 0.7
            }}>
              No activities yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activities.map(activity => (
                <div
                  key={activity.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {activity.name}
                  </div>
                  {activity.time && (
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                      {activity.time}
                    </div>
                  )}
                  {activity.location && (
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                      📍 {activity.location}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Journal Entries */}
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Journal</h2>
          {journalEntries.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              opacity: 0.7
            }}>
              No journal entries yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {journalEntries.map(entry => (
                <div
                  key={entry.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '1.5rem'
                  }}
                >
                  <div style={{
                    fontSize: '0.9rem',
                    opacity: 0.7,
                    marginBottom: '0.5rem'
                  }}>
                    {new Date(entry.date).toLocaleDateString()}
                    {entry.location && ` • ${entry.location}`}
                  </div>
                  <div style={{ lineHeight: '1.6' }}>
                    {entry.content}
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
