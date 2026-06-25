import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface Activity {
  id: string
  name: string
  location?: string
  activity_type?: string
  time?: string
  notes?: string
}

interface TripMapProps {
  activities: Activity[]
}

export default function TripMap({ activities }: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!mapContainer.current) return

    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) {
      console.error('Mapbox token not found in environment variables')
      return
    }

    mapboxgl.accessToken = token

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [0, 20],
        zoom: 2
      })
    } catch (error) {
      console.error('Map initialization error:', error)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!map.current) return

    const addMarkers = async () => {
      // Clear existing markers
      markers.current.forEach(marker => marker.remove())
      markers.current = []

      const bounds = new mapboxgl.LngLatBounds()
      const activitiesWithLocations = []

      // Geocode all locations
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
            activitiesWithLocations.push({ ...activity, lng, lat })
            bounds.extend([lng, lat])
          }
        } catch (error) {
          console.error('Geocoding error:', error)
        }
      }

      // Add markers
      activitiesWithLocations.forEach(activity => {
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

        const marker = new mapboxgl.Marker(el)
          .setLngLat([activity.lng, activity.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="color: black; padding: 0.5rem;">
                <strong>${activity.name}</strong><br/>
                ${activity.time ? `🕐 ${activity.time}<br/>` : ''}
                ${activity.location ? `📍 ${activity.location}` : ''}
              </div>
            `)
          )
          .addTo(map.current!)

        markers.current.push(marker)
      })

      // Fit map to bounds
      if (activitiesWithLocations.length > 0) {
        map.current!.fitBounds(bounds, { padding: 50, maxZoom: 12 })
      }
    }

    addMarkers()
  }, [activities])

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
    <div 
      ref={mapContainer} 
      style={{ 
        width: '100%', 
        height: '400px', 
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '1rem'
      }} 
    />
  )
}
