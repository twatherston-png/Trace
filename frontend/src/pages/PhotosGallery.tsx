import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Photo } from '../types'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import ActionMenu from '../components/ActionMenu'

export default function PhotosGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'trip' | 'location'>('date')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    loadPhotos()
  }, [])

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

      <BottomNav />
    </div>
  )
}
