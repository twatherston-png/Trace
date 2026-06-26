import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { supabase } from '../lib/supabase'

interface PhotoLocation {
  id: string
  url: string
  latitude: number
  longitude: number
  trip_id?: string
  city?: string
  country?: string
}

interface CityCluster {
  city: string
  country: string
  latitude: number
  longitude: number
  photos: PhotoLocation[]
  tripIds: string[]
}

export default function WorldMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [cityClusters, setCityClusters] = useState<CityCluster[]>([])
  const [countryCount, setCountryCount] = useState(0)

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
      zoom: 1.5,
      projection: 'mercator'
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Load photos with GPS coordinates
  useEffect(() => {
    const loadPhotos = async () => {
      const { data: photos } = await supabase
        .from('photos')
        .select('id, url, latitude, longitude, trip_id')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

      if (!photos || photos.length === 0) return

      // Check which photos already have city/country data cached
      const photoIds = photos.map(p => p.id)
      const { data: cachedLocations } = await supabase
        .from('photo_locations')
        .select('photo_id, city, country')
        .in('photo_id', photoIds)

      const cachedMap = new Map()
      if (cachedLocations) {
        cachedLocations.forEach(loc => {
          cachedMap.set(loc.photo_id, { city: loc.city, country: loc.country })
        })
      }

      // Separate photos into cached and needs geocoding
      const needsGeocoding: PhotoLocation[] = []
      const photoLocations: PhotoLocation[] = []

      photos.forEach(photo => {
        const cached = cachedMap.get(photo.id)
        if (cached && cached.city && cached.country) {
          photoLocations.push({
            ...photo,
            city: cached.city,
            country: cached.country
          })
        } else {
          needsGeocoding.push(photo)
        }
      })

      // Geocode photos that don't have city/country data
      for (const photo of needsGeocoding) {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${photo.longitude},${photo.latitude}.json?access_token=${mapboxgl.accessToken}&limit=1`
          )
          const data = await response.json()

          if (data.features && data.features.length > 0) {
            const feature = data.features[0]
            const context = feature.context || []
            
            // Find city and country from context
            const cityContext = context.find((c: any) => c.id.startsWith('place.'))
            const countryContext = context.find((c: any) => c.id.startsWith('country.'))
            
            const city = cityContext?.text || 'Unknown'
            const country = countryContext?.text || 'Unknown'

            // Cache in database
            await supabase.from('photo_locations').upsert({
              photo_id: photo.id,
              city,
              country,
              latitude: photo.latitude,
              longitude: photo.longitude
            }, { onConflict: 'photo_id' })

            photoLocations.push({
              ...photo,
              city,
              country
            })
          }
        } catch (error) {
          console.error('Geocoding error:', error)
        }
      }

      // Cluster by city
      const clusterMap = new Map<string, CityCluster>()

      photoLocations.forEach(photo => {
        if (!photo.city || !photo.country) return

        const key = `${photo.city}-${photo.country}`
        
        if (!clusterMap.has(key)) {
          clusterMap.set(key, {
            city: photo.city,
            country: photo.country,
            latitude: photo.latitude,
            longitude: photo.longitude,
            photos: [],
            tripIds: []
          })
        }

        const cluster = clusterMap.get(key)!
        cluster.photos.push(photo)
        if (photo.trip_id && !cluster.tripIds.includes(photo.trip_id)) {
          cluster.tripIds.push(photo.trip_id)
        }
      })

      const clusters = Array.from(clusterMap.values())
      setCityClusters(clusters)

      // Count unique countries
      const countries = new Set(clusters.map(c => c.country))
      setCountryCount(countries.size)
    }

    loadPhotos()
  }, [])

  // Render markers
  useEffect(() => {
    if (!map.current || cityClusters.length === 0) return

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    cityClusters.forEach(cluster => {
      const el = document.createElement('div')
      el.className = 'marker'
      el.style.width = '24px'
      el.style.height = '24px'
      el.style.borderRadius = '50%'
      el.style.background = 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)'
      el.style.border = '2px solid white'
      el.style.cursor = 'pointer'
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.fontSize = '10px'
      el.style.fontWeight = 'bold'
      el.style.color = '#2D1B4E'

      el.innerHTML = cluster.photos.length > 1 ? `${cluster.photos.length}` : '📍'

      const popupContent = `
        <div style="color: black; padding: 0.5rem; min-width: 200px;">
          <strong style="font-size: 1.1rem;">${cluster.city}</strong><br/>
          <span style="color: #666; font-size: 0.9rem;">${cluster.country}</span>
          <div style="margin-top: 0.5rem; font-size: 0.85rem;">
            📸 ${cluster.photos.length} photo${cluster.photos.length !== 1 ? 's' : ''}
            ${cluster.tripIds.length > 0 ? `<br/>✈️ ${cluster.tripIds.length} trip${cluster.tripIds.length !== 1 ? 's' : ''}` : ''}
          </div>
          <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem;">
            <button onclick="window.__viewPhotos?.('${cluster.city}', '${cluster.country}')" style="flex: 1; padding: 0.5rem; border: none; background: #D4AF37; color: white; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold;">
              View Photos
            </button>
            ${cluster.tripIds.length > 0 ? `
              <button onclick="window.__viewTrip?.('${cluster.tripIds[0]}')" style="flex: 1; padding: 0.5rem; border: none; background: #6B4D8E; color: white; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold;">
                View Trip
              </button>
            ` : ''}
          </div>
        </div>
      `

      const marker = new mapboxgl.Marker(el)
        .setLngLat([cluster.longitude, cluster.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent)
        )
        .addTo(map.current!)

      markers.current.push(marker)
    })
  }, [cityClusters])

  return (
    <div style={{ position: 'relative' }}>
      {/* Country counter */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        color: 'white'
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {countryCount}
        </div>
        <div style={{
          fontSize: '0.7rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          Countries
        </div>
      </div>

      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '500px', 
          borderRadius: '16px',
          overflow: 'hidden'
        }} 
      />
    </div>
  )
}
