import { useRef } from 'react'
import type { Photo } from '../types'

interface PhotoLightboxProps {
  photo: Photo
  photos: Photo[]
  onClose: () => void
  onNavigate: (photo: Photo) => void
  onEdit?: () => void
  onDelete: (photoId: string, photoUrl: string) => void
  onSetCover: (photoUrl: string) => void
}

export default function PhotoLightbox({
  photo,
  photos,
  onClose,
  onNavigate,
  onEdit,
  onDelete,
  onSetCover
}: PhotoLightboxProps) {
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return

    const diff = touchStartX.current - touchEndX.current
    const threshold = 50 // minimum swipe distance

    if (Math.abs(diff) > threshold) {
      const currentIndex = photos.findIndex(p => p.id === photo.id)
      
      if (diff > 0) {
        // Swipe left - next photo
        const nextIndex = (currentIndex + 1) % photos.length
        onNavigate(photos[nextIndex])
      } else {
        // Swipe right - previous photo
        const prevIndex = (currentIndex - 1 + photos.length) % photos.length
        onNavigate(photos[prevIndex])
      }
    }

    touchStartX.current = null
    touchEndX.current = null
  }

  const currentIndex = photos.findIndex(p => p.id === photo.id)

  return (
    <div
      onClick={onClose}
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
        <img
          src={photo.url}
          alt={photo.caption || 'Photo'}
          style={{
            maxWidth: '100%',
            maxHeight: '85vh',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
            userSelect: 'none'
          }}
        />
        
        {photo.caption && (
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.9rem'
          }}>
            {photo.caption}
          </div>
        )}

        {/* Menu button - more prominent for mobile */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 2001
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const rect = e.currentTarget.getBoundingClientRect()
              const menu = e.currentTarget.nextElementSibling as HTMLElement
              if (menu) {
                menu.style.display = menu.style.display === 'none' ? 'block' : 'none'
                menu.style.top = `${rect.bottom + 8}px`
                menu.style.right = `${window.innerWidth - rect.right}px`
              }
            }}
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '1.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            ⋮
          </button>
          <div style={{
            display: 'none',
            position: 'fixed',
            background: 'rgba(26, 14, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '12px',
            overflow: 'hidden',
            minWidth: '180px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            zIndex: 9999
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(); (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
              style={{
                display: 'block',
                width: '100%',
                padding: '1rem 1.25rem',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '1rem'
              }}
            >
              ✏️ Edit Details
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSetCover(photo.url); (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
              style={{
                display: 'block',
                width: '100%',
                padding: '1rem 1.25rem',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '1rem'
              }}
            >
              🖼️ Set as Cover
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(photo.id, photo.url); (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
              style={{
                display: 'block',
                width: '100%',
                padding: '1rem 1.25rem',
                background: 'transparent',
                border: 'none',
                color: '#f44336',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '1rem'
              }}
            >
              🗑️ Delete Photo
            </button>
          </div>
        </div>

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                const prevIndex = (currentIndex - 1 + photos.length) % photos.length
                onNavigate(photos[prevIndex])
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
                const nextIndex = (currentIndex + 1) % photos.length
                onNavigate(photos[nextIndex])
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

        {/* Photo counter */}
        {photos.length > 1 && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.85rem',
            zIndex: 2001
          }}>
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>
    </div>
  )
}
