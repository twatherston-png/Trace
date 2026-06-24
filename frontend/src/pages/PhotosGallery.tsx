import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import type { Photo } from '../types'

export default function PhotosGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'trip' | 'location'>('date')
  const navigate = useNavigate()

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (data) setPhotos(data)
  }

  const sortedPhotos = [...photos].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    }
    if (sortBy === 'location') {
      return (a.location || '').localeCompare(b.location || '')
    }
    return (a.trip_id || '').localeCompare(b.trip_id || '')
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #2D1B4E 0%, #4A2D6B 100%)',
      padding: '1rem'
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
              Upload Photos
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '0.5rem'
          }}>
            {sortedPhotos.map(photo => (
              <div
                key={photo.id}
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
        )}
      </div>
    </div>
  )
}
