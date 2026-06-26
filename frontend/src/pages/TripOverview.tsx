import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Trip, Photo, JournalEntry } from '../types'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import ActionMenu from '../components/ActionMenu'
import Itinerary from '../components/Itinerary'
import TripMap from '../components/TripMap'
import EXIF from 'exif-js'

export default function TripOverview() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [days, setDays] = useState<any[]>([])
  const [pinnedLocations, setPinnedLocations] = useState<any[]>([])
  const [showJournalForm, setShowJournalForm] = useState(false)
  const [newJournal, setNewJournal] = useState({ date: '', location: '', content: '' })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showMetadataModal, setShowMetadataModal] = useState(false)
  const [uploadedPhotoIds, setUploadedPhotoIds] = useState<string[]>([])
  const [extractedExif, setExtractedExif] = useState<{ date?: string; latitude?: number; longitude?: number }>({})
  const [bulkDate, setBulkDate] = useState('')
  const [bulkLocation, setBulkLocation] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null)
  const [editJournalData, setEditJournalData] = useState({ date: '', location: '', content: '' })

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

    const { data: activitiesData } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', tripId)

    if (activitiesData) setActivities(activitiesData)

    const { data: daysData } = await supabase
      .from('days')
      .select('*')
      .eq('trip_id', tripId)

    if (daysData) setDays(daysData)

    const { data: pinnedData } = await supabase
      .from('pinned_locations')
      .select('*')
      .eq('trip_id', tripId)

    if (pinnedData) setPinnedLocations(pinnedData)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !tripId) return

    setUploading(true)
    setUploadProgress(0)

    let successCount = 0
    let errorCount = 0
    const uploadedPhotoIds: string[] = []
    let extractedExif: { date?: string; latitude?: number; longitude?: number } = {}

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileName = `${Date.now()}-${file.name}`
      
      try {
        // Extract EXIF data from first photo
        if (i === 0) {
          extractedExif = await extractExifData(file)
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          errorCount++
          continue
        }

        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName)

          const { data: insertedData, error: insertError } = await supabase.from('photos').insert({
            trip_id: tripId,
            url: publicUrl,
            caption: file.name
          }).select('id')

          if (insertError) {
            console.error('Insert error:', insertError)
            errorCount++
          } else if (insertedData && insertedData.length > 0) {
            successCount++
            uploadedPhotoIds.push(insertedData[0].id)
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        errorCount++
      }

      setUploadProgress(((i + 1) / files.length) * 100)
    }

    setUploading(false)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (successCount > 0) {
      // Reload photos first to ensure they're in the database
      await loadTripData()
      
      // Show metadata modal
      setUploadedPhotoIds(uploadedPhotoIds)
      setExtractedExif(extractedExif)
      setShowMetadataModal(true)
      setNotification({ type: 'success', message: `Uploaded ${successCount} photo${successCount > 1 ? 's' : ''}!` })
    }
    if (errorCount > 0) {
      setNotification({ type: 'error', message: `Failed to upload ${errorCount} photo${errorCount > 1 ? 's' : ''}` })
    }
  }

  const extractExifData = async (file: File): Promise<{ date?: string; latitude?: number; longitude?: number }> => {
    return new Promise((resolve) => {
      EXIF.getData(file as any, function(this: any) {
        const result: { date?: string; latitude?: number; longitude?: number } = {}
        
        // Extract date
        const exifDate = EXIF.getTag(this, 'DateTimeOriginal')
        if (exifDate) {
          // Format: "2024:01:15 10:30:00"
          const match = exifDate.match(/(\d{4}):(\d{2}):(\d{2})/)
          if (match) {
            result.date = `${match[1]}-${match[2]}-${match[3]}`
          }
        }
        
        // Extract GPS coordinates
        const latitude = EXIF.getTag(this, 'GPSLatitude')
        const longitude = EXIF.getTag(this, 'GPSLongitude')
        const latRef = EXIF.getTag(this, 'GPSLatitudeRef')
        const lonRef = EXIF.getTag(this, 'GPSLongitudeRef')
        
        if (latitude && longitude) {
          result.latitude = convertDMSToDD(latitude, latRef)
          result.longitude = convertDMSToDD(longitude, lonRef)
        }
        
        resolve(result)
      })
    })
  }

  const convertDMSToDD = (dms: number[], ref: string) => {
    const [degrees, minutes, seconds] = dms
    let dd = degrees + minutes / 60 + seconds / 3600
    if (ref === 'S' || ref === 'W') dd = -dd
    return dd
  }

  const handleApplyMetadata = async (option: 'exif' | 'bulk' | 'blank', bulkDate?: string, bulkLocation?: string) => {
    if (!uploadedPhotoIds.length) return

    if (option === 'exif' && extractedExif.date) {
      await supabase
        .from('photos')
        .update({
          taken_at: extractedExif.date,
          latitude: extractedExif.latitude,
          longitude: extractedExif.longitude
        })
        .in('id', uploadedPhotoIds)
    } else if (option === 'bulk' && (bulkDate || bulkLocation)) {
      const updates: any = {}
      if (bulkDate) updates.taken_at = bulkDate
      if (bulkLocation) updates.location = bulkLocation
      
      await supabase
        .from('photos')
        .update(updates)
        .in('id', uploadedPhotoIds)
    }

    setShowMetadataModal(false)
    setUploadedPhotoIds([])
    setExtractedExif({})
    setBulkDate('')
    setBulkLocation('')
    setNotification({ type: 'success', message: 'Metadata applied successfully!' })
    loadTripData()
  }

  const handleAddJournal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tripId) return

    const { error } = await supabase.from('journal_entries').insert({
      trip_id: tripId,
      date: newJournal.date || null,
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

  const handleDeletePhoto = async (photoId: string, photoUrl: string) => {
    if (!confirm('Delete this photo?')) return

    // Extract file path from URL
    const urlParts = photoUrl.split('/photos/')
    if (urlParts.length < 2) {
      setNotification({ type: 'error', message: 'Could not determine file path' })
      return
    }
    const filePath = urlParts[1]

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([filePath])

    if (storageError) {
      console.error('Storage delete error:', storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      setNotification({ type: 'error', message: `Failed to delete photo: ${dbError.message}` })
    } else {
      setNotification({ type: 'success', message: 'Photo deleted successfully!' })
      loadTripData()
    }
  }

  const handleSetCoverPhoto = async (photoUrl: string) => {
    if (!tripId) return

    const { error } = await supabase
      .from('trips')
      .update({ cover_photo_url: photoUrl })
      .eq('id', tripId)

    if (error) {
      console.error('Error setting cover photo:', error)
      setNotification({ type: 'error', message: `Failed to set cover photo: ${error.message}` })
    } else {
      setNotification({ type: 'success', message: 'Cover photo set!' })
      loadTripData()
    }
  }

  const handleDeleteJournal = async (journalId: string) => {
    if (!confirm('Delete this journal entry?')) return

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', journalId)

    if (error) {
      console.error('Error deleting journal:', error)
      setNotification({ type: 'error', message: `Failed to delete journal: ${error.message}` })
    } else {
      setNotification({ type: 'success', message: 'Journal entry deleted successfully!' })
      loadTripData()
    }
  }

  const handleEditJournal = (entry: JournalEntry) => {
    setEditingJournal(entry)
    setEditJournalData({
      date: entry.date || '',
      location: entry.location || '',
      content: entry.content
    })
  }

  const handleSaveJournalEdit = async () => {
    if (!editingJournal) return

    const { error } = await supabase
      .from('journal_entries')
      .update({
        date: editJournalData.date || null,
        location: editJournalData.location || null,
        content: editJournalData.content
      })
      .eq('id', editingJournal.id)

    if (error) {
      console.error('Error updating journal:', error)
      setNotification({ type: 'error', message: `Failed to update journal: ${error.message}` })
    } else {
      setNotification({ type: 'success', message: 'Journal entry updated!' })
      setEditingJournal(null)
      setEditJournalData({ date: '', location: '', content: '' })
      loadTripData()
    }
  }

  const handleDeleteTrip = async () => {
    if (!confirm('Delete this entire trip? This will delete all photos, journal entries, and activities.')) return
    if (!tripId) return

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)

    if (error) {
      console.error('Error deleting trip:', error)
      setNotification({ type: 'error', message: `Failed to delete trip: ${error.message}` })
    } else {
      setNotification({ type: 'success', message: 'Trip deleted successfully!' })
      navigate('/trips')
    }
  }

  if (!trip) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem' }}>Loading trip...</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '1.25rem',
      paddingTop: '76px',
      paddingBottom: '86px'
    }}>
      <TopBar
        title={trip.name}
        subtitle={trip.start_date && trip.end_date 
          ? `${new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : ''}
        showBack
        onBack={() => navigate('/trips')}
        rightContent={
          <ActionMenu actions={[
            { label: '🗑️ Delete Trip', onClick: handleDeleteTrip, danger: true }
          ]} />
        }
      />
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

        {/* Trip Info */}
        <div className="fade-in glass-card" style={{
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          {trip.cover_photo_url && (
            <div className="photo-frame" style={{ marginBottom: '1rem' }}>
              <img
                src={trip.cover_photo_url}
                alt={trip.name}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
          )}
          {trip.notes && (
            <div style={{
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.6,
              fontSize: '0.95rem'
            }}>
              {trip.notes}
            </div>
          )}
          {!trip.notes && !trip.cover_photo_url && (
            <div style={{
              opacity: 0.4,
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '1rem 0'
            }}>
              No trip details yet
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          multiple
          accept="image/*"
          style={{ display: 'none' }}
        />

        {/* Upload Progress Bar */}
        {uploading && (
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '2px',
            marginBottom: '1rem',
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
          <form onSubmit={handleAddJournal} className="fade-in" style={{
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
              type="date"
              value={newJournal.date}
              onChange={(e) => setNewJournal({ ...newJournal, date: e.target.value })}
              style={{
                width: '100%',
                padding: '0.9rem 1rem',
                marginBottom: '1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'white',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease'
              }}
            />
            <input
              type="text"
              placeholder="Location (optional)"
              value={newJournal.location}
              onChange={(e) => setNewJournal({ ...newJournal, location: e.target.value })}
              style={{
                width: '100%',
                padding: '0.9rem 1rem',
                marginBottom: '1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'white',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease'
              }}
            />
            <textarea
              placeholder="What happened?"
              value={newJournal.content}
              onChange={(e) => setNewJournal({ ...newJournal, content: e.target.value })}
              required
              rows={4}
              className="journal-text"
              style={{
                width: '100%',
                padding: '0.9rem 1rem',
                marginBottom: '1.25rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'rgba(255, 255, 255, 0.9)',
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
              Add Journal Entry
            </button>
          </form>
        )}

        {/* Photos */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid rgba(212, 175, 55, 0.1)'
          }}>
            <h2 style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'rgba(212, 175, 55, 0.7)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              margin: 0
            }}>Photos</h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(229, 196, 88, 0.08) 100%)',
                color: '#D4AF37',
                fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
                letterSpacing: '0.02em',
                opacity: uploading ? 0.5 : 1
              }}
            >
              {uploading ? `Uploading... ${Math.round(uploadProgress)}%` : '+ Add Photos'}
            </button>
          </div>
          {photos.length === 0 ? (
            <div className="fade-in glass-card" style={{
              padding: '2.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.6 }}>📸</div>
              <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>No photos yet</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '0.75rem',
              paddingBottom: '0.5rem'
            }}>
              {Array.from({ length: Math.ceil(photos.length / 2) }, (_, i) => {
                const columnPhotos = photos.slice(i * 2, i * 2 + 2)
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexShrink: 0 }}>
                    {columnPhotos.map(photo => (
                      <div
                        key={photo.id}
                        className="photo-frame"
                        style={{
                          position: 'relative',
                          width: '120px',
                          height: '120px',
                          borderRadius: '12px',
                          overflow: 'hidden'
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
                            cursor: 'pointer',
                            transition: 'transform 0.3s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          onError={(e) => {
                            console.error('Image failed to load:', photo.url)
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <div style={{ position: 'absolute', top: '4px', right: '4px' }}>
                          <ActionMenu actions={[
                            { label: '🖼️ Set as Cover', onClick: () => handleSetCoverPhoto(photo.url) },
                            { label: '🗑️ Delete Photo', onClick: () => handleDeletePhoto(photo.id, photo.url), danger: true }
                          ]}
                        />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Itinerary */}
        <Itinerary 
          tripId={tripId!} 
          tripStartDate={trip.start_date} 
          tripEndDate={trip.end_date} 
        />

        {/* Journal Entries */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid rgba(212, 175, 55, 0.1)'
          }}>
            <h2 style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'rgba(212, 175, 55, 0.7)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              margin: 0
            }}>Journal</h2>
            <button
              onClick={() => setShowJournalForm(!showJournalForm)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(229, 196, 88, 0.08) 100%)',
                color: '#D4AF37',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.75rem',
                letterSpacing: '0.02em'
              }}
            >
              {showJournalForm ? 'Cancel' : '+ Add Entry'}
            </button>
          </div>
          {journalEntries.length === 0 ? (
            <div className="fade-in glass-card" style={{
              padding: '2.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.6 }}>📝</div>
              <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>No journal entries yet</p>
            </div>
          ) : (
            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {journalEntries.map(entry => (
                <div
                  key={entry.id}
                  className="fade-in glass-card"
                  style={{
                    position: 'relative',
                    padding: '1.5rem'
                  }}
                >
                  <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                    <ActionMenu actions={[
                      { label: '✏️ Edit Entry', onClick: () => handleEditJournal(entry) },
                      { label: '🗑️ Delete Entry', onClick: () => handleDeleteJournal(entry.id), danger: true }
                    ]}
                  />
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'rgba(212, 175, 55, 0.7)',
                    fontWeight: 500,
                    marginBottom: '0.5rem',
                    letterSpacing: '0.02em'
                  }}>
                    {entry.date ? new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                    {entry.location && ` • ${entry.location}`}
                  </div>
                  <div className="journal-text">
                    {entry.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        {(activities.length > 0 || pinnedLocations.length > 0) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <TripMap tripId={tripId!} activities={activities} days={days} />
          </div>
        )}
      </div>

      {/* Photo Lightbox with Swipe */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}
          >
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Photo'}
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)'
              }}
            />
            {selectedPhoto.caption && (
              <div style={{
                position: 'absolute',
                bottom: '-40px',
                left: 0,
                right: 0,
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem'
              }}>
                {selectedPhoto.caption}
              </div>
            )}
            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id)
                    const prevIndex = (currentIndex - 1 + photos.length) % photos.length
                    setSelectedPhoto(photos[prevIndex])
                  }}
                  style={{
                    position: 'fixed',
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '1.3rem',
                    transition: 'all 0.2s ease',
                    zIndex: 2001
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  ←
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id)
                    const nextIndex = (currentIndex + 1) % photos.length
                    setSelectedPhoto(photos[nextIndex])
                  }}
                  style={{
                    position: 'fixed',
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '1.3rem',
                    transition: 'all 0.2s ease',
                    zIndex: 2001
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Journal Edit Modal */}
      {editingJournal && (
        <div
          onClick={() => {
            setEditingJournal(null)
            setEditJournalData({ date: '', location: '', content: '' })
          }}
          className="fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '1rem',
            overflowY: 'auto',
            paddingTop: '60px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(45, 27, 78, 0.9)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              borderRadius: '24px',
              padding: '1.75rem',
              maxWidth: '500px',
              width: '100%',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 style={{
              color: 'white',
              marginBottom: '1.25rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Edit Journal Entry
            </h3>

            {/* Date */}
            <label style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Date
            </label>
            <input
              type="date"
              value={editJournalData.date}
              onChange={(e) => setEditJournalData({ ...editJournalData, date: e.target.value })}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'white',
                marginBottom: '1rem',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease'
              }}
            />

            {/* Location */}
            <label style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Location
            </label>
            <input
              type="text"
              value={editJournalData.location}
              onChange={(e) => setEditJournalData({ ...editJournalData, location: e.target.value })}
              placeholder="e.g. Lima, Peru"
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'white',
                marginBottom: '1rem',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease'
              }}
            />

            {/* Content */}
            <label style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Entry
            </label>
            <textarea
              value={editJournalData.content}
              onChange={(e) => setEditJournalData({ ...editJournalData, content: e.target.value })}
              rows={6}
              className="journal-text"
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '1.5rem',
                resize: 'vertical',
                transition: 'all 0.3s ease'
              }}
            />

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setEditingJournal(null)
                  setEditJournalData({ date: '', location: '', content: '' })
                }}
                style={{
                  flex: 1,
                  padding: '0.9rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveJournalEdit}
                className="gold-glow"
                style={{
                  flex: 1,
                  padding: '0.9rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
                  color: '#1A0E2E',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  letterSpacing: '0.02em'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Modal */}
      {showMetadataModal && (
        <div
          onClick={() => {
            setShowMetadataModal(false)
            setUploadedPhotoIds([])
            setExtractedExif({})
            setBulkDate('')
            setBulkLocation('')
          }}
          className="fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2001,
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(45, 27, 78, 0.9)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              borderRadius: '24px',
              padding: '1.75rem',
              maxWidth: '500px',
              width: '100%',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 style={{
              color: 'white',
              marginBottom: '1.25rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Apply Metadata to {uploadedPhotoIds.length} Photo{uploadedPhotoIds.length !== 1 ? 's' : ''}
            </h3>
            
            {extractedExif.date && (
              <button
                onClick={() => handleApplyMetadata('exif')}
                className="glass-card"
                style={{
                  width: '100%',
                  padding: '1.1rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  background: 'rgba(45, 27, 78, 0.6)',
                  color: 'white',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: '#D4AF37'
                }}>
                  📷 Use EXIF Data
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  Date: {extractedExif.date}
                  {extractedExif.latitude && extractedExif.longitude && ` • Location: ${extractedExif.latitude.toFixed(4)}, ${extractedExif.longitude.toFixed(4)}`}
                </div>
              </button>
            )}

            <button
              onClick={() => handleApplyMetadata('bulk', bulkDate, bulkLocation)}
              disabled={!bulkDate && !bulkLocation}
              className="glass-card"
              style={{
                width: '100%',
                padding: '1.1rem',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(45, 27, 78, 0.6)',
                color: 'white',
                cursor: (!bulkDate && !bulkLocation) ? 'not-allowed' : 'pointer',
                marginBottom: '1rem',
                textAlign: 'left',
                opacity: (!bulkDate && !bulkLocation) ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#D4AF37'
              }}>
                📝 Add Bulk Information
              </div>
              <input
                type="date"
                value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'white',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}
              />
              <input
                type="text"
                value={bulkLocation}
                onChange={(e) => setBulkLocation(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Location (e.g., Lima, Peru)"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'white',
                  fontSize: '0.9rem'
                }}
              />
            </button>

            <button
              onClick={() => handleApplyMetadata('blank')}
              className="glass-card"
              style={{
                width: '100%',
                padding: '1.1rem',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(45, 27, 78, 0.6)',
                color: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                fontWeight: 600,
                color: '#D4AF37'
              }}>
                ⊘ Add as Blank
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: '0.35rem'
              }}>
                No metadata, just upload the photos
              </div>
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
