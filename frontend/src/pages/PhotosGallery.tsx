import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import type { Photo } from '../types'

export default function PhotosGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'trip' | 'location'>('date')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    const { data } = await supabase
      .from('photos')
      .select('*, trips(name)')
      .order('uploaded_at', { ascending: false })

    if (data) setPhotos(data)
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
      background: 'linear-gradient(180deg, #2D1B4E 0%, #4A2D6B 100%)',
      padding: '1rem',
      paddingBottom: '80px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingTop: '1rem'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Photos</h1>
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
                      onClick={() => setSelectedPhoto(photo)}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer'
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

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(45, 27, 78, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '1rem',
        paddingBottom: '1.5rem'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
          <span style={{ fontSize: '1.5rem' }}>🏠</span>
          Home
        </button>
        <button
          onClick={() => navigate('/trips')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
          <span style={{ fontSize: '1.5rem' }}>✈️</span>
          Trips
        </button>
        <button
          onClick={() => navigate('/photos')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#D4AF37',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
          <span style={{ fontSize: '1.5rem' }}>📸</span>
          Photos
        </button>
      </div>
    </div>
  )
}
