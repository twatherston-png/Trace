import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { supabase } from '../lib/supabase'
import type { PinnedLocation } from '../types'

interface Activity {
  id: string
  name: string
  location?: string
  activity_type?: string
  time?: string
  notes?: string
  day_id?: string
}

interface Day {
  id: string
  date: string
  location?: string
}

interface TripMapProps {
  tripId: string
  activities: Activity[]
  days: Day[]
}

interface GeocodedLocation {
  lng: number
  lat: number
  name: string
}

export default function TripMap({ tripId, activities, days }: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [viewMode, setViewMode] = useState<'route' | 'detail'>('route')
  const [geocodedDays, setGeocodedDays] = useState<(Day & GeocodedLocation)[]>([])
  const [geocodedActivities, setGeocodedActivities] = useState<(Activity & GeocodedLocation)[]>([])
  const [pinnedLocations, setPinnedLocations] = useState<PinnedLocation[]>([])
  const [isPinning, setIsPinning] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pendingPin, setPendingPin] = useState<{ lng: number; lat: number } | null>(null)
  const [pinName, setPinName] = useState('')
  const [pinDayId, setPinDayId] = useState('')
  const [pinNotes, setPinNotes] = useState('')

  useEffect(() => {
    if (!mapContainer.current) return

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

    if (!mapboxgl.accessToken) {
      console.error('Mapbox token not found')
      return
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 20],
      zoom: 2
    })

    // Handle click when in pinning mode
    map.current.on('click', (e) => {
      if (isPinning) {
        setPendingPin({ lng: e.lngLat.lng, lat: e.lngLat.lat })
        setShowPinModal(true)
        setIsPinning(false)
        if (map.current) {
          map.current.getCanvas().style.cursor = 'grab'
        }
      }
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [isPinning])

  // Load pinned locations
  useEffect(() => {
    const loadPins = async () => {
      const { data } = await supabase
        .from('pinned_locations')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at')

      if (data) setPinnedLocations(data)
    }
    loadPins()
  }, [tripId])

  // Geocode day locations for route view
  useEffect(() => {
    const geocodeDays = async () => {
      const results: (Day & GeocodedLocation)[] = []

      console.log('Geocoding days with pinnedLocations:', pinnedLocations)

      for (const day of days) {
        if (!day.location) continue

        // Check if there's a pinned location with matching name
        const pinnedForLocation = pinnedLocations.find(
          p => p.name.toLowerCase() === day.location!.toLowerCase()
        )

        console.log(`Day ${day.id} location "${day.location}":`, { pinnedForLocation })
        
        if (pinnedForLocation) {
          // Use pinned location coordinates
          console.log(`Using pin coordinates for ${day.location}`)
          results.push({ ...day, lng: pinnedForLocation.longitude, lat: pinnedForLocation.latitude, name: pinnedForLocation.name })
        } else {
          // Otherwise geocode the location text
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                day.location
              )}.json?access_token=${mapboxgl.accessToken}&limit=1`
            )
            const data = await response.json()

            if (data.features && data.features.length > 0) {
              const [lng, lat] = data.features[0].center
              results.push({ ...day, lng, lat, name: day.location })
            }
          } catch (error) {
            console.error('Geocoding error for day:', error)
          }
        }
      }

      setGeocodedDays(results)
    }

    geocodeDays()
  }, [days, pinnedLocations])

  // Geocode activity locations for detail view
  useEffect(() => {
    const geocodeActivities = async () => {
      const results: (Activity & GeocodedLocation)[] = []

      for (const activity of activities) {
        if (!activity.location) continue

        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
              activity.location
            )}.json?access_token=${mapboxgl.accessToken}&limit=1`
          )
          const data = await response.json()

          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center
            results.push({ ...activity, lng, lat, name: activity.location })
          }
        } catch (error) {
          console.error('Geocoding error for activity:', error)
        }
      }

      setGeocodedActivities(results)
    }

    geocodeActivities()
  }, [activities])

  // Save pinned location
  const handleSavePin = async () => {
    if (!pendingPin || !pinName.trim()) {
      console.log('Missing data:', { pendingPin, pinName })
      return
    }

    console.log('Saving pin:', { tripId, pinName, pendingPin, pinDayId, pinNotes })

    const { error } = await supabase.from('pinned_locations').insert({
      trip_id: tripId,
      name: pinName.trim(),
      latitude: pendingPin.lat,
      longitude: pendingPin.lng,
      day_id: pinDayId || null,
      notes: pinNotes || null
    })

    if (error) {
      console.error('Error saving pin:', error)
      alert(`Error saving pin: ${error.message}`)
      return
    }

    console.log('Pin saved successfully')

    // Reload pins
    const { data: newData } = await supabase
      .from('pinned_locations')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at')
    if (newData) setPinnedLocations(newData)

    // Reset form
    setShowPinModal(false)
    setPendingPin(null)
    setPinName('')
    setPinDayId('')
    setPinNotes('')
  }

  // Delete pinned location
  const handleDeletePin = async (pinId: string) => {
    const { error } = await supabase
      .from('pinned_locations')
      .delete()
      .eq('id', pinId)

    if (!error) {
      setPinnedLocations(prev => prev.filter(p => p.id !== pinId))
    }
  }

  // Render markers and route based on view mode
  useEffect(() => {
    if (!map.current) return

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Remove existing route line
    if (map.current.getLayer('route-line')) {
      map.current.removeLayer('route-line')
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route')
    }

    const allBounds = new mapboxgl.LngLatBounds()

    if (viewMode === 'route' && geocodedDays.length > 0) {
      // Sort by date
      const sorted = [...geocodedDays].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      // Add route line
      const coordinates = sorted.map(d => [d.lng, d.lat])
      
      if (coordinates.length >= 2) {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates
            }
          }
        })

        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#D4AF37',
            'line-width': 3,
            'line-opacity': 0.8
          }
        })
      }

      // Add day markers
      sorted.forEach((day, index) => {
        const el = document.createElement('div')
        el.className = 'marker'
        el.style.width = '36px'
        el.style.height = '36px'
        el.style.borderRadius = '50%'
        el.style.background = 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)'
        el.style.border = '3px solid white'
        el.style.cursor = 'pointer'
        el.style.display = 'flex'
        el.style.alignItems = 'center'
        el.style.justifyContent = 'center'
        el.style.fontSize = '14px'
        el.style.fontWeight = 'bold'
        el.style.color = '#2D1B4E'
        el.innerHTML = `${index + 1}`

        const dateStr = new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

        const marker = new mapboxgl.Marker(el)
          .setLngLat([day.lng, day.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="color: black; padding: 0.5rem;">
                <strong>Day ${index + 1} - ${day.name}</strong><br/>
                📅 ${dateStr}
              </div>
            `)
          )
          .addTo(map.current!)

        markers.current.push(marker)
        allBounds.extend([day.lng, day.lat])
      })

    } else if (viewMode === 'detail' && geocodedActivities.length > 0) {
      // Add activity markers
      geocodedActivities.forEach(activity => {
        const el = document.createElement('div')
        el.className = 'marker'
        el.style.width = '30px'
        el.style.height = '30px'
        el.style.borderRadius = '50%'
        el.style.background = getActivityColor(activity.activity_type)
        el.style.border = '3px solid white'
        el.style.cursor = 'pointer'
        el.style.display = 'flex'
        el.style.alignItems = 'center'
        el.style.justifyContent = 'center'
        el.style.fontSize = '16px'

        el.innerHTML = getActivityIcon(activity.activity_type)

        // Find date for this activity
        const day = days.find(d => d.id === activity.day_id)
        const dateStr = day ? new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''

        const marker = new mapboxgl.Marker(el)
          .setLngLat([activity.lng, activity.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="color: black; padding: 0.5rem;">
                <strong>${activity.name}</strong><br/>
                ${dateStr ? `📅 ${dateStr}<br/>` : ''}
                📍 ${activity.location}
              </div>
            `)
          )
          .addTo(map.current!)

        markers.current.push(marker)
        allBounds.extend([activity.lng, activity.lat])
      })
    }

    // Fit bounds if we have any markers
    if (!allBounds.isEmpty()) {
      map.current.fitBounds(allBounds, { padding: 50, maxZoom: 12 })
    }
  }, [viewMode, geocodedDays, geocodedActivities, pinnedLocations, days])

  // Expose delete function globally for popup button
  useEffect(() => {
    (window as any).__deletePin = (pinId: string) => {
      handleDeletePin(pinId)
    }
    return () => {
      delete (window as any).__deletePin
    }
  }, [])

  const handleStartPinning = () => {
    setIsPinning(true)
    if (map.current) {
      map.current.getCanvas().style.cursor = 'crosshair'
    }
  }

  const getActivityColor = (type?: string) => {
    switch (type) {
      case 'transport': return '#6B4D8E'
      case 'accommodation': return '#D4AF37'
      case 'activity': return '#E5C458'
      case 'food': return '#8B6DB0'
      default: return '#6B4D8E'
    }
  }

  const getActivityIcon = (type?: string) => {
    switch (type) {
      case 'transport': return '🚗'
      case 'accommodation': return '🏨'
      case 'activity': return '🎯'
      case 'food': return '🍽️'
      default: return '📍'
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Toggle Buttons */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 10,
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setViewMode('route')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'route' 
              ? 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)' 
              : 'rgba(0, 0, 0, 0.6)',
            color: viewMode === 'route' ? '#2D1B4E' : 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          🗺️ Route
        </button>
        <button
          onClick={() => setViewMode('detail')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'detail' 
              ? 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)' 
              : 'rgba(0, 0, 0, 0.6)',
            color: viewMode === 'detail' ? '#2D1B4E' : 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          📍 Detail
        </button>
        <button
          onClick={handleStartPinning}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: isPinning
              ? 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)'
              : 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          {isPinning ? '✕ Cancel' : '📌 Pin'}
        </button>
      </div>

      {/* Pinning instruction */}
      {isPinning && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: 'bold'
        }}>
          Click anywhere on the map to drop a pin
        </div>
      )}

      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '400px', 
          borderRadius: '12px',
          overflow: 'hidden'
        }} 
      />

      {/* Pin Modal */}
      {showPinModal && pendingPin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '16px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <h3 style={{ margin: '0 0 1rem', color: 'white', fontSize: '1.2rem' }}>
              📌 New Pin
            </h3>
            <input
              type="text"
              placeholder="Pin name (e.g., Huacachina Oasis)"
              value={pinName}
              onChange={(e) => setPinName(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            <select
              value={pinDayId}
              onChange={(e) => setPinDayId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Assign to day (optional)</option>
              {days.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(day => (
                <option key={day.id} value={day.id}>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {day.location ? ` - ${day.location}` : ''}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Notes (optional)"
              value={pinNotes}
              onChange={(e) => setPinNotes(e.target.value)}
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
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSavePin}
                disabled={!pinName.trim()}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: pinName.trim()
                    ? 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: pinName.trim() ? '#2D1B4E' : 'rgba(255, 255, 255, 0.3)',
                  fontWeight: 'bold',
                  cursor: pinName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '1rem'
                }}
              >
                Save Pin
              </button>
              <button
                onClick={() => {
                  setShowPinModal(false)
                  setPendingPin(null)
                  setPinName('')
                  setPinDayId('')
                  setPinNotes('')
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
