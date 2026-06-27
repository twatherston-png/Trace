import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Photo } from '../types'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import ActionMenu from '../components/ActionMenu'
import PhotoLightbox from '../components/PhotoLightbox'
import EXIF from 'exif-js'

export default function PhotosGallery() {
  const location = useLocation()
  const navigate = useNavigate()
  const locationState = location.state as { photoIds?: string; locationLabel?: string } | null
  const [photos, setPhotos] = useState<Photo[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[] | null>(null)
  const [trips, setTrips] = useState<any[]>([])
  const [days, setDays] = useState<any[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'trip' | 'location'>('date')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [bulkEditing, setBulkEditing] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedPhotoIds, setUploadedPhotoIds] = useState<string[]>([])
  const [showMetadataModal, setShowMetadataModal] = useState(false)
  const [extractedExif, setExtractedExif] = useState<{ date?: string; latitude?: number; longitude?: number }>({})
  const [bulkDate, setBulkDate] = useState('')
  const [bulkLocation, setBulkLocation] = useState('')
  const [bulkTripId, setBulkTripId] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  
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

  useEffect(() => {
    if (locationState?.photoIds) {
      const ids = locationState.photoIds.split(',').filter(id => id.trim())
      const filtered = photos.filter(p => ids.includes(p.id))
      setFilteredPhotos(filtered)
    } else {
      setFilteredPhotos(null)
    }
  }, [locationState, photos])

  // Compute available filter options based on current sort mode
  const getFilterOptions = () => {
    const options = new Set<string>()
    
    if (sortBy === 'date') {
      // Extract unique months from photos
      photos.forEach(photo => {
        const date = new Date(photo.uploaded_at)
        const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        options.add(monthYear)
      })
    } else if (sortBy === 'trip') {
      // Extract unique trip names
      photos.forEach(photo => {
        const tripName = (photo as any).trips?.name
        if (tripName) options.add(tripName)
      })
    } else if (sortBy === 'location') {
      // Extract unique locations
      photos.forEach(photo => {
        if (photo.location) options.add(photo.location)
      })
    }
    
    return Array.from(options).sort()
  }

  const filterOptions = getFilterOptions()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowFilterDropdown(false)
    if (showFilterDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showFilterDropdown])

  // Apply filter to photos
  const getFilteredPhotos = () => {
    let basePhotos = filteredPhotos || photos
    
    if (!filterValue) return basePhotos
    
    return basePhotos.filter(photo => {
      if (sortBy === 'date') {
        const date = new Date(photo.uploaded_at)
        const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        return monthYear === filterValue
      } else if (sortBy === 'trip') {
        const tripName = (photo as any).trips?.name
        return tripName === filterValue
      } else if (sortBy === 'location') {
        return photo.location === filterValue
      }
      return true
    })
  }

  const displayPhotos = getFilteredPhotos()

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

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
          const exifData = await extractExifData(file)
          extractedExif = exifData
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
      await loadPhotos()
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
      // Timeout after 3 seconds in case EXIF hangs
      const timeout = setTimeout(() => {
        console.warn('EXIF extraction timed out for', file.name)
        resolve({})
      }, 3000)
      
      try {
        EXIF.getData(file as any, function(this: any) {
          clearTimeout(timeout)
          const result: { date?: string; latitude?: number; longitude?: number } = {}
          
          try {
            // Extract date
            const exifDate = EXIF.getTag(this, 'DateTimeOriginal')
            if (exifDate) {
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
          } catch (err) {
            console.warn('EXIF parse error:', err)
          }
          
          resolve(result)
        })
      } catch (err) {
        clearTimeout(timeout)
        console.warn('EXIF extraction failed:', err)
        resolve({})
      }
    })
  }

  const convertDMSToDD = (dms: number[], ref: string) => {
    const [degrees, minutes, seconds] = dms
    let dd = degrees + minutes / 60 + seconds / 3600
    if (ref === 'S' || ref === 'W') dd = -dd
    return dd
  }

  const handleApplyMetadata = async (option: 'exif' | 'bulk' | 'blank', bulkDate?: string, bulkLocation?: string, bulkTripId?: string) => {
    if (!uploadedPhotoIds.length) return

    const updates: any = {}
    
    if (option === 'exif' && extractedExif.date) {
      updates.taken_at = extractedExif.date
      if (extractedExif.latitude) updates.latitude = extractedExif.latitude
      if (extractedExif.longitude) updates.longitude = extractedExif.longitude
    } else if (option === 'bulk') {
      if (bulkDate) updates.taken_at = bulkDate
      if (bulkLocation) updates.location = bulkLocation
    }
    
    // Handle trip assignment
    if (bulkTripId !== undefined) {
      updates.trip_id = bulkTripId || null
    }
    
    if (Object.keys(updates).length > 0) {
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
    setBulkTripId('')
    setNotification({ type: 'success', message: 'Metadata applied successfully!' })
    loadPhotos()
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

  const toggleSelectMode = () => {
    setSelectMode(!selectMode)
    setSelectedPhotos(new Set())
  }

  const togglePhotoSelection = (photoId: string) => {
    const newSelected = new Set(selectedPhotos)
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId)
    } else {
      newSelected.add(photoId)
    }
    setSelectedPhotos(newSelected)
  }

  const selectAllPhotos = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set())
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)))
    }
  }

  const handleBulkEdit = () => {
    if (selectedPhotos.size === 0) return
    setBulkEditing(true)
    setEditDate('')
    setEditLocation('')
    setEditNotes('')
    setEditJournal('')
    setEditTripId('')
    setEditDayId('')
  }

  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0) return
    if (!confirm(`Delete ${selectedPhotos.size} photo${selectedPhotos.size !== 1 ? 's' : ''}? This cannot be undone.`)) return

    const photosToDelete = photos.filter(p => selectedPhotos.has(p.id))
    let deletedCount = 0

    for (const photo of photosToDelete) {
      const urlParts = photo.url.split('/photos/')
      if (urlParts.length < 2) continue
      const filePath = urlParts[1]

      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([filePath])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        continue
      }

      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id)

      if (dbError) {
        console.error('Database delete error:', dbError)
      } else {
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      setNotification({ type: 'success', message: `${deletedCount} photo${deletedCount !== 1 ? 's' : ''} deleted!` })
      setSelectedPhotos(new Set())
      setSelectMode(false)
      loadPhotos()
    } else {
      setNotification({ type: 'error', message: 'Failed to delete photos' })
    }
  }

  const handleBulkSave = async () => {
    if (selectedPhotos.size === 0) return

    // Auto-assign day if date and trip are set
    let autoDayId = editDayId
    if (editDate && editTripId && editTripId !== 'null' && !autoDayId) {
      const matchingDay = days.find(d => 
        d.trip_id === editTripId && 
        d.date === editDate
      )
      if (matchingDay) {
        autoDayId = matchingDay.id
      }
    }

    const updates: any = {}
    if (editDate) updates.taken_at = editDate
    if (editLocation) updates.location = editLocation
    if (editNotes) updates.notes = editNotes
    if (editJournal) updates.journal_entry = editJournal
    if (editTripId) {
      // Handle "null" string as actual null
      updates.trip_id = editTripId === 'null' ? null : editTripId
    }
    if (autoDayId) updates.day_id = autoDayId

    if (Object.keys(updates).length === 0) {
      setNotification({ type: 'error', message: 'No fields to update' })
      return
    }

    const { error } = await supabase
      .from('photos')
      .update(updates)
      .in('id', Array.from(selectedPhotos))

    if (error) {
      setNotification({ type: 'error', message: `Failed to save: ${error.message}` })
    } else {
      setNotification({ type: 'success', message: `${selectedPhotos.size} photos updated!` })
      setBulkEditing(false)
      setSelectedPhotos(new Set())
      setSelectMode(false)
      loadPhotos()
    }
  }

  const handleLongPressStart = (photoId: string) => {
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      if (!selectMode) {
        setSelectMode(true)
      }
      togglePhotoSelection(photoId)
    }, 500)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handlePhotoClick = (photo: Photo) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }
    if (selectMode) {
      togglePhotoSelection(photo.id)
    } else {
      setSelectedPhoto(photo)
    }
  }

  const sortedPhotos = [...displayPhotos].sort((a, b) => {
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
      padding: '1.25rem',
      paddingTop: '76px',
      paddingBottom: '86px'
    }}>
      <TopBar 
        title="Photos" 
        subtitle={locationState?.locationLabel ? `${displayPhotos.length} photos in ${locationState.locationLabel}` : `${photos.length} memories captured`} 
      />
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {locationState?.locationLabel && (
          <div style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#D4AF37', fontSize: '0.9rem' }}>
              📍 {locationState.locationLabel}
            </span>
            <button
              onClick={() => navigate('/photos')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                padding: '0.25rem 0.5rem'
              }}
            >
              ✕ Clear
            </button>
          </div>
        )}
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

        {/* Sort Controls */}
        <div className="glass-card" style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          padding: '0.75rem'
        }}>
          {(['date', 'trip', 'location'] as const).map(sort => (
            <button
              key={sort}
              onClick={() => {
                setSortBy(sort)
                setFilterValue('')
              }}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                border: sortBy === sort ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid transparent',
                background: sortBy === sort
                  ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(229, 196, 88, 0.08) 100%)'
                  : 'transparent',
                color: sortBy === sort ? '#D4AF37' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontSize: '0.85rem',
                fontWeight: sortBy === sort ? 600 : 400,
                transition: 'all 0.3s ease'
              }}
            >
              {sort}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gold-glow"
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
              color: '#1A0E2E',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              opacity: uploading ? 0.7 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {uploading ? `Uploading ${Math.round(uploadProgress)}%` : '+ Add Photos'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={toggleSelectMode}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              border: selectMode ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid transparent',
              background: selectMode
                ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(229, 196, 88, 0.1) 100%)'
                : 'transparent',
              color: selectMode ? '#D4AF37' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontWeight: selectMode ? 600 : 400,
              fontSize: '0.85rem',
              transition: 'all 0.3s ease'
            }}
          >
            {selectMode ? '✓ Selecting' : '☐ Select'}
          </button>
        </div>

        {/* Filter/Search Bar */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
            type="text"
            value={filterValue}
            onChange={(e) => {
              setFilterValue(e.target.value)
              setShowFilterDropdown(true)
            }}
            onFocus={() => setShowFilterDropdown(true)}
            placeholder={
              sortBy === 'date' ? 'Search by month (e.g., January 2026)' :
              sortBy === 'trip' ? 'Search by trip name' :
              'Search by location'
            }
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(45, 27, 78, 0.6)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
          />
          {filterValue && (
            <button
              onClick={() => {
                setFilterValue('')
                setShowFilterDropdown(false)
              }}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0',
                lineHeight: 1
              }}
            >
              ×
            </button>
          )}
          
          {/* Dropdown with matching options */}
          {showFilterDropdown && filterValue && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.5rem',
                background: 'rgba(45, 27, 78, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 100,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
              }}
            >
              {filterOptions
                .filter(opt => opt.toLowerCase().includes(filterValue.toLowerCase()))
                .slice(0, 10)
                .map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setFilterValue(option)
                      setShowFilterDropdown(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: idx < Math.min(filterOptions.filter(o => o.toLowerCase().includes(filterValue.toLowerCase())).length, 10) - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                      color: 'white',
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {option}
                  </button>
                ))}
              {filterOptions.filter(opt => opt.toLowerCase().includes(filterValue.toLowerCase())).length === 0 && (
                <div style={{
                  padding: '1rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}>
                  No matches found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Select Mode Actions */}
        {selectMode && (
          <div className="fade-in" style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={selectAllPhotos}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(45, 27, 78, 0.6)',
                backdropFilter: 'blur(10px)',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {selectedPhotos.size === displayPhotos.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedPhotos.size > 0 && (
              <button
                onClick={handleBulkEdit}
                className="gold-glow"
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(229, 196, 88, 0.08) 100%)',
                  color: '#D4AF37',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                ✏️ Edit {selectedPhotos.size}
              </button>
            )}
          </div>
        )}

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div className="fade-in glass-card" style={{
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.6 }}>📸</div>
            <p style={{ marginBottom: '0.5rem', opacity: 0.7 }}>No photos yet</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.4 }}>Upload photos from a trip page</p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedPhotos).map(([group, groupPhotos]) => (
              <div key={group} style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: 'rgba(212, 175, 55, 0.7)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid rgba(212, 175, 55, 0.1)'
                }}>
                  {group}
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {groupPhotos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="fade-in"
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: '12px',
                        background: 'rgba(45, 27, 78, 0.3)',
                        border: selectedPhotos.has(photo.id)
                          ? '2px solid #D4AF37'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        boxShadow: selectedPhotos.has(photo.id)
                          ? '0 0 16px rgba(212, 175, 55, 0.3)'
                          : 'none',
                        transition: 'all 0.3s ease',
                        animationDelay: `${idx * 0.03}s`
                      }}
                      onMouseDown={() => handleLongPressStart(photo.id)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={() => handleLongPressStart(photo.id)}
                      onTouchEnd={handleLongPressEnd}
                    >
                      <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }}>
                        <img
                          src={photo.url}
                          alt={photo.caption || 'Photo'}
                          onClick={() => handlePhotoClick(photo)}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            transition: 'transform 0.3s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      </div>
                      {selectMode && (
                        <div
                          onClick={() => togglePhotoSelection(photo.id)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: selectedPhotos.has(photo.id)
                              ? 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)'
                              : 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(4px)',
                            border: '2px solid rgba(255, 255, 255, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: 'white',
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {selectedPhotos.has(photo.id) ? '✓' : ''}
                        </div>
                      )}
                      {!selectMode && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            e.nativeEvent.stopImmediatePropagation()
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation()
                            e.nativeEvent.stopImmediatePropagation()
                          }}
                          onTouchEnd={(e) => {
                            e.stopPropagation()
                            e.nativeEvent.stopImmediatePropagation()
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            e.nativeEvent.stopImmediatePropagation()
                          }}
                          onMouseUp={(e) => {
                            e.stopPropagation()
                            e.nativeEvent.stopImmediatePropagation()
                          }}
                          style={{ 
                            position: 'absolute', 
                            top: '4px', 
                            right: '4px', 
                            zIndex: 10,
                            pointerEvents: 'auto'
                          }}
                        >
                          <ActionMenu actions={[
                            { label: '✏️ Edit Details', onClick: () => handleOpenEdit(photo) },
                            { label: '🗑️ Delete Photo', onClick: () => handleDeletePhoto(photo.id, photo.url), danger: true }
                          ]}
                        />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          photos={displayPhotos}
          onClose={() => setSelectedPhoto(null)}
          onNavigate={setSelectedPhoto}
          onEdit={() => {
            setSelectedPhoto(null)
            handleOpenEdit(selectedPhoto)
          }}
          onDelete={async (photoId: string, photoUrl: string) => {
            await handleDeletePhoto(photoId, photoUrl)
            const remaining = displayPhotos.filter(p => p.id !== photoId)
            if (remaining.length > 0) {
              setSelectedPhoto(remaining[0])
            } else {
              setSelectedPhoto(null)
            }
          }}
          onSetCover={() => {}}
        />
      )}

      {/* Edit Photo Modal */}
      {editingPhoto && (
        <div
          onClick={() => setEditingPhoto(null)}
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
            {/* Preview */}
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '1.25rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
            }}>
              <img
                src={editingPhoto.url}
                alt=""
                style={{
                  width: '100%',
                  maxHeight: '200px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>

            <h3 style={{
              color: 'white',
              marginBottom: '1.25rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Edit Photo Details
            </h3>

            {/* Date */}
            <label style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Date Taken
            </label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
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
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
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

            {/* Trip */}
            <label style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Trip
            </label>
            <select
              value={editTripId}
              onChange={(e) => setEditTripId(e.target.value)}
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
            >
              <option value="" style={{ background: '#2D1B4E' }}>No trip</option>
              {trips.map(t => (
                <option key={t.id} value={t.id} style={{ background: '#2D1B4E' }}>{t.name}</option>
              ))}
            </select>

            {/* Day */}
            {editTripId && (
              <>
                <label style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  Day (auto-assigned by date)
                </label>
                <select
                  value={editDayId}
                  onChange={(e) => setEditDayId(e.target.value)}
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
                >
                  <option value="" style={{ background: '#2D1B4E' }}>Auto (match by date)</option>
                  {days.filter(d => d.trip_id === editTripId).map(d => (
                    <option key={d.id} value={d.id} style={{ background: '#2D1B4E' }}>
                      {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {d.location || 'No location'}
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Notes */}
            <label style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Notes
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Quick notes about this photo..."
              rows={2}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'white',
                marginBottom: '1rem',
                fontSize: '0.95rem',
                resize: 'vertical',
                transition: 'all 0.3s ease'
              }}
            />

            {/* Journal Entry */}
            <label style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Journal Entry
            </label>
            <textarea
              value={editJournal}
              onChange={(e) => setEditJournal(e.target.value)}
              placeholder="Write about this moment..."
              rows={4}
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
                onClick={() => setEditingPhoto(null)}
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
                onClick={handleSaveEdit}
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

      {/* Bulk Edit Modal */}
      {bulkEditing && (
        <div
          onClick={() => setBulkEditing(false)}
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
              marginBottom: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Edit {selectedPhotos.size} Photos
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}>
              Only filled fields will be updated. Leave blank to keep existing values.
            </p>

            {/* Date */}
            <label style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Date Taken
            </label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'white',
                marginBottom: '1rem',
                fontSize: '0.95rem'
              }}
            />

            {/* Location */}
            <label style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Location
            </label>
            <input
              type="text"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              placeholder="e.g. Lima, Peru"
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'white',
                marginBottom: '1rem',
                fontSize: '0.95rem'
              }}
            />

            {/* Trip */}
            <label style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Trip
            </label>
            <select
              value={editTripId}
              onChange={(e) => setEditTripId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'white',
                marginBottom: '1.5rem',
                fontSize: '0.95rem'
              }}
            >
              <option value="" style={{ background: '#2D1B4E' }}>No change</option>
              <option value="null" style={{ background: '#2D1B4E' }}>No trip</option>
              {trips.map(t => (
                <option key={t.id} value={t.id} style={{ background: '#2D1B4E' }}>{t.name}</option>
              ))}
            </select>

            {/* Notes */}
            <label style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Notes
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Quick notes..."
              rows={2}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'white',
                marginBottom: '1.5rem',
                fontSize: '0.95rem',
                resize: 'vertical'
              }}
            />

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setBulkEditing(false)}
                style={{
                  flex: 1,
                  padding: '0.9rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSave}
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
                  letterSpacing: '0.02em'
                }}
              >
                Update All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Action Bar */}
      {selectMode && selectedPhotos.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '76px',
          left: '0.75rem',
          right: '0.75rem',
          background: 'rgba(26, 14, 46, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(212, 175, 55, 0.2)',
          borderRadius: '16px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1500,
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.4)'
        }}>
          <span style={{
            color: '#D4AF37',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            {selectedPhotos.size} selected
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setSelectedPhotos(new Set())}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Clear
            </button>
            <button
              onClick={handleBulkEdit}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                background: 'rgba(212, 175, 55, 0.1)',
                color: '#D4AF37',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              ✏️ Edit
            </button>
            <button
              onClick={handleBulkDelete}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, rgba(192, 57, 43, 0.8) 0%, rgba(231, 76, 60, 0.8) 100%)',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      )}

      {/* Metadata Modal */}
      {showMetadataModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          className="fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '1rem'
          }}
        >
          <div className="glass-card" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '2rem',
            borderRadius: '20px',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            background: 'rgba(26, 14, 46, 0.95)'
          }}>
            <h2 style={{
              color: '#D4AF37',
              marginBottom: '1rem',
              fontSize: '1.5rem',
              fontWeight: 700
            }}>
              📷 Add Photo Details
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '1.5rem',
              fontSize: '0.95rem'
            }}>
              Uploaded {uploadedPhotoIds.length} photo{uploadedPhotoIds.length > 1 ? 's' : ''}. How would you like to add details?
            </p>

            <button
              onClick={() => handleApplyMetadata('exif', undefined, undefined, bulkTripId)}
              disabled={!extractedExif.date}
              className="glass-card"
              style={{
                width: '100%',
                padding: '1.1rem',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(45, 27, 78, 0.6)',
                color: 'white',
                cursor: !extractedExif.date ? 'not-allowed' : 'pointer',
                marginBottom: '1rem',
                textAlign: 'left',
                opacity: !extractedExif.date ? 0.5 : 1,
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
                Date: {extractedExif.date || 'Not available'}
                {extractedExif.latitude && extractedExif.longitude && ` • Location: ${extractedExif.latitude.toFixed(4)}, ${extractedExif.longitude.toFixed(4)}`}
              </div>
            </button>

            <button
              onClick={() => handleApplyMetadata('bulk', bulkDate, bulkLocation, bulkTripId)}
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

            {/* Trip Selector */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Assign to Trip
              </label>
              <select
                value={bulkTripId}
                onChange={(e) => setBulkTripId(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'white',
                  fontSize: '0.9rem'
                }}
              >
                <option value="" style={{ background: '#2D1B4E' }}>No trip</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id} style={{ background: '#2D1B4E' }}>{t.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleApplyMetadata('blank', undefined, undefined, bulkTripId)}
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
