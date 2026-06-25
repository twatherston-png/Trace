import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

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
  activities: Activity[]
  days: Day[]
}

interface GeocodedLocation {
  lng: number
  lat: number
  name: string
}

export default function TripMap({ activities, days }: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [viewMode, setViewMode] = useState<'route' | 'detail'>('route')
  const [geocodedDays, setGeocodedDays] = useState<(Day & GeocodedLocation)[]>([])
  const [geocodedActivities, setGeocodedActivities] = useState<(Activity & GeocodedLocation)[]>([])

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

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Geocode day locations for route view
  useEffect(() => {
    const geocodeDays = async () => {
      const results: (Day & GeocodedLocation)[] = []

      for (const day of days) {
        if (!day.location) continue

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

      setGeocodedDays(results)
    }

    geocodeDays()
  }, [days])

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
      })

      // Fit bounds
      const bounds = new mapboxgl.LngLatBounds()
      sorted.forEach(d => bounds.extend([d.lng, d.lat]))
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 })

    } else if (viewMode === 'detail' && geocodedActivities.length > 0) {
      // Add activity markers
      const bounds = new mapboxgl.LngLatBounds()

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
        bounds.extend([activity.lng, activity.lat])
      })

      // Fit bounds
      if (geocodedActivities.length > 0) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 })
      }
    }
  }, [viewMode, geocodedDays, geocodedActivities, days])

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
        gap: '0.5rem'
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
      </div>

      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '400px', 
          borderRadius: '12px',
          overflow: 'hidden'
        }} 
      />
    </div>
  )
}
