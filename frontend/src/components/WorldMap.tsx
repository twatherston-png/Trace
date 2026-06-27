import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { supabase } from '../lib/supabase'

interface LocationItem {
  id: string
  url: string
  latitude: number
  longitude: number
  trip_id?: string
  location?: string
  city?: string
  country?: string
  type: 'photo' | 'pin' | 'day'
  date?: string
  notes?: string
}

interface CityCluster {
  city: string
  country: string
  latitude: number
  longitude: number
  items: LocationItem[]
  tripIds: string[]
}

interface Props {
  onCountryCount?: (count: number) => void
}

// Normalize city names to handle variations from Mapbox
const normalizeCityName = (city: string): string => {
  const normalizations: Record<string, string> = {
    'lisboa': 'Lisbon',
    'lisboa, portugal': 'Lisbon',
    'singapore city': 'Singapore',
    'singapore, singapore': 'Singapore',
    'kyōto': 'Kyoto',
    'ōsaka': 'Osaka',
    'tōkyō': 'Tokyo',
    'münchen': 'Munich',
    'köln': 'Cologne',
    'münchen, germany': 'Munich',
    'praia': 'Praia',
    'buenos aires.': 'Buenos Aires',
    'rio de janeiro.': 'Rio de Janeiro',
    'são paulo': 'São Paulo',
    'sao paulo': 'São Paulo',
  }
  
  const lower = city.toLowerCase().trim()
  return normalizations[lower] || city
}

export default function WorldMap({ onCountryCount }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [cityClusters, setCityClusters] = useState<CityCluster[]>([])
  const [countryCount, setCountryCount] = useState(0)
  const [status, setStatus] = useState<string>('Loading map...')
  const [refreshKey, setRefreshKey] = useState(0)
  const [forceRefresh, setForceRefresh] = useState(false)

  const handleRefresh = () => {
    setStatus('Refreshing...')
    setRefreshKey(prev => prev + 1)
    setForceRefresh(false)
  }

  const handleForceRefresh = async () => {
    setStatus('Clearing cache and re-geocoding...')
    await supabase.from('photo_locations').delete().neq('photo_id', '')
    setForceRefresh(true)
    setRefreshKey(prev => prev + 1)
  }

  useEffect(() => {
    if (!mapContainer.current) return

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

    if (!mapboxgl.accessToken) {
      console.error('Mapbox token not found')
      return
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [0, 20],
      zoom: 0.5,
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

  useEffect(() => {
    const loadAllLocations = async () => {
      setStatus('Loading locations...')
      
      const { data: photos } = await supabase
        .from('photos')
        .select('id, url, latitude, longitude, location, trip_id, taken_at, uploaded_at')
        .or('latitude.not.is.null,location.not.is.null')

      const { data: pins } = await supabase
        .from('pins')
        .select('id, date, location, latitude, longitude, notes, photo_url')

      const { data: days } = await supabase
        .from('days')
        .select('id, date, location, latitude, longitude, trip_id')
        .not('location', 'is', null)

      const photoItems = photos || []
      const pinItems = pins || []
      const dayItems = days || []
      const totalItems = photoItems.length + pinItems.length + dayItems.length

      if (totalItems === 0) {
        setStatus('No location data found')
        return
      }

      setStatus(`Processing ${totalItems} locations...`)

      const allLocations: LocationItem[] = []

      // Process photos
      const photoIds = photoItems.map(p => p.id)
      let cachedMap = new Map()
      
      if (!forceRefresh && photoIds.length > 0) {
        const { data: cachedLocations } = await supabase
          .from('photo_locations')
          .select('photo_id, city, country, latitude, longitude')
          .in('photo_id', photoIds)

        if (cachedLocations) {
          cachedLocations.forEach(loc => cachedMap.set(loc.photo_id, loc))
        }
      }

      const needsGeocoding: typeof photoItems = []

      photoItems.forEach(photo => {
        const cached = cachedMap.get(photo.id)
        if (cached && cached.city && cached.country) {
          allLocations.push({
            id: photo.id,
            url: photo.url,
            latitude: cached.latitude,
            longitude: cached.longitude,
            trip_id: photo.trip_id || undefined,
            location: photo.location || undefined,
            city: cached.city,
            country: cached.country,
            type: 'photo',
            date: photo.taken_at || photo.uploaded_at
          })
        } else {
          needsGeocoding.push(photo)
        }
      })

      if (needsGeocoding.length > 0) {
        setStatus(`Geocoding ${needsGeocoding.length} photos...`)
      }

      for (const photo of needsGeocoding) {
        try {
          let lat = photo.latitude
          let lng = photo.longitude
          let city = ''
          let country = ''

          if (lat && lng) {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&limit=1`
            )
            const data = await response.json()
            if (data.features?.length > 0) {
              const context = data.features[0].context || []
              city = context.find((c: any) => c.id.startsWith('place.'))?.text || 'Unknown'
              country = context.find((c: any) => c.id.startsWith('country.'))?.text || 'Unknown'
            }
          } else if (photo.location) {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(photo.location)}.json?access_token=${mapboxgl.accessToken}&limit=1`
            )
            const data = await response.json()
            if (data.features?.length > 0) {
              ;[lng, lat] = data.features[0].center
              const context = data.features[0].context || []
              city = context.find((c: any) => c.id.startsWith('place.'))?.text || data.features[0].text || photo.location
              country = context.find((c: any) => c.id.startsWith('country.'))?.text || 'Unknown'
            }
          }

          if (city && country && lat && lng) {
            await supabase.from('photo_locations').upsert({
              photo_id: photo.id,
              city,
              country,
              latitude: lat,
              longitude: lng
            }, { onConflict: 'photo_id' })

            allLocations.push({
              id: photo.id,
              url: photo.url,
              latitude: lat,
              longitude: lng,
              trip_id: photo.trip_id || undefined,
              location: photo.location || undefined,
              city,
              country,
              type: 'photo',
              date: photo.taken_at || photo.uploaded_at
            })
          }
        } catch (error) {
          console.error('Photo geocoding error:', error)
        }
      }

      // Process pins
      if (pinItems.length > 0) {
        setStatus(`Processing ${pinItems.length} pins...`)
      }
      
      for (const pin of pinItems) {
        try {
          let lat = pin.latitude
          let lng = pin.longitude
          let city = ''
          let country = ''

          if (lat && lng) {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&limit=1`
            )
            const data = await response.json()
            if (data.features?.length > 0) {
              const context = data.features[0].context || []
              city = context.find((c: any) => c.id.startsWith('place.'))?.text || 'Unknown'
              country = context.find((c: any) => c.id.startsWith('country.'))?.text || 'Unknown'
            }
          } else if (pin.location) {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(pin.location)}.json?access_token=${mapboxgl.accessToken}&limit=1`
            )
            const data = await response.json()
            if (data.features?.length > 0) {
              ;[lng, lat] = data.features[0].center
              const context = data.features[0].context || []
              city = context.find((c: any) => c.id.startsWith('place.'))?.text || data.features[0].text || pin.location
              country = context.find((c: any) => c.id.startsWith('country.'))?.text || 'Unknown'
            }
          }

          if (city && country && lat && lng) {
            allLocations.push({
              id: `pin-${pin.id}`,
              url: pin.photo_url || '',
              latitude: lat,
              longitude: lng,
              location: pin.location || undefined,
              city,
              country,
              type: 'pin',
              date: pin.date,
              notes: pin.notes
            })
          }
        } catch (error) {
          console.error('Pin geocoding error:', error)
        }
      }

      // Process trip days
      if (dayItems.length > 0) {
        setStatus(`Processing ${dayItems.length} trip locations...`)
      }
      
      for (const day of dayItems) {
        try {
          let lat = day.latitude
          let lng = day.longitude
          let city = ''
          let country = ''

          if (lat && lng) {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&limit=1`
            )
            const data = await response.json()
            if (data.features?.length > 0) {
              const context = data.features[0].context || []
              city = context.find((c: any) => c.id.startsWith('place.'))?.text || 'Unknown'
              country = context.find((c: any) => c.id.startsWith('country.'))?.text || 'Unknown'
            }
          } else if (day.location) {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(day.location)}.json?access_token=${mapboxgl.accessToken}&limit=1`
            )
            const data = await response.json()
            if (data.features?.length > 0) {
              ;[lng, lat] = data.features[0].center
              const context = data.features[0].context || []
              city = context.find((c: any) => c.id.startsWith('place.'))?.text || data.features[0].text || day.location
              country = context.find((c: any) => c.id.startsWith('country.'))?.text || 'Unknown'
            }
          }

          if (city && country && lat && lng) {
            allLocations.push({
              id: `day-${day.id}`,
              url: '',
              latitude: lat,
              longitude: lng,
              trip_id: day.trip_id || undefined,
              location: day.location || undefined,
              city,
              country,
              type: 'day'
            })
          }
        } catch (error) {
          console.error('Day geocoding error:', error)
        }
      }

      // Cluster by city (with normalization)
      const clusterMap = new Map<string, CityCluster>()

      allLocations.forEach(item => {
        if (!item.city || !item.country) return

        // Normalize city name to handle variations
        const normalizedCity = normalizeCityName(item.city)
        const key = `${normalizedCity}-${item.country}`
        
        if (!clusterMap.has(key)) {
          clusterMap.set(key, {
            city: normalizedCity,
            country: item.country,
            latitude: item.latitude,
            longitude: item.longitude,
            items: [],
            tripIds: []
          })
        }

        const cluster = clusterMap.get(key)!
        cluster.items.push(item)
        if (item.trip_id && !cluster.tripIds.includes(item.trip_id)) {
          cluster.tripIds.push(item.trip_id)
        }
      })

      const clusters = Array.from(clusterMap.values())
      setCityClusters(clusters)

      const countries = new Set(clusters.map(c => c.country))
      setCountryCount(countries.size)
      onCountryCount?.(countries.size)
      setStatus(`${clusters.length} locations, ${countries.size} countries`)
    }

    loadAllLocations()
  }, [refreshKey, onCountryCount])

  // Render markers
  useEffect(() => {
    if (!map.current || cityClusters.length === 0) return

    markers.current.forEach(marker => marker.remove())
    markers.current = []

    cityClusters.forEach(cluster => {
      const totalCount = cluster.items.length
      const photoItems = cluster.items.filter(i => i.type === 'photo')
      const pinItems = cluster.items.filter(i => i.type === 'pin')

      const el = document.createElement('div')
      el.className = 'marker'
      el.style.width = '28px'
      el.style.height = '28px'
      el.style.borderRadius = '50%'
      el.style.background = 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)'
      el.style.border = '2px solid white'
      el.style.cursor = 'pointer'
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.fontSize = '11px'
      el.style.fontWeight = 'bold'
      el.style.color = '#2D1B4E'

      el.innerHTML = totalCount > 1 ? `${totalCount}` : '📍'

      // Build popup content
      const dayItems = cluster.items.filter(i => i.type === 'day')
      
      const photoIds = photoItems.map(i => i.id).join(',')
      const tripId = cluster.tripIds[0]
      
      let details = `<div style="margin-top: 0.5rem; font-size: 0.85rem;">`
      if (photoItems.length > 0) details += `📸 ${photoItems.length} photo${photoItems.length !== 1 ? 's' : ''}<br/>`
      if (pinItems.length > 0) details += `📍 ${pinItems.length} pin${pinItems.length !== 1 ? 's' : ''}<br/>`
      if (dayItems.length > 0) details += `✈️ ${dayItems.length} trip stop${dayItems.length !== 1 ? 's' : ''}<br/>`
      details += `</div>`
      
      // Show individual pin details (date, notes, delete)
      let pinDetails = ''
      if (pinItems.length > 0) {
        pinDetails = `<div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e0e0e0;">`
        pinItems.forEach(pin => {
          const pinId = pin.id.replace('pin-', '')
          if (pin.date) {
            const dateStr = new Date(pin.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            pinDetails += `<div style="font-size: 0.8rem; color: #666; margin-bottom: 0.25rem;">📅 ${dateStr}</div>`
          }
          if (pin.notes) {
            pinDetails += `<div style="font-size: 0.85rem; color: #333; margin-bottom: 0.5rem;">${pin.notes}</div>`
          }
          pinDetails += `<button onclick="window.__deletePin?.('${pinId}')" style="margin-top: 0.25rem; padding: 0.35rem 0.75rem; border: 1px solid #e74c3c; background: transparent; color: #e74c3c; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">🗑 Delete Pin</button>`
        })
        pinDetails += `</div>`
      }

      const popupContent = `
        <div style="color: black; padding: 0.5rem; min-width: 200px;">
          <strong style="font-size: 1.1rem;">${cluster.city}</strong><br/>
          <span style="color: #666; font-size: 0.9rem;">${cluster.country}</span>
          ${details}
          ${pinDetails}
          <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${photoIds ? `
              <button onclick="window.__viewPhotos?.('${photoIds}', '${cluster.city}, ${cluster.country}')" style="flex: 1; padding: 0.5rem; border: none; background: #D4AF37; color: white; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold;">
                View Photos
              </button>
            ` : ''}
            ${tripId ? `
              <button onclick="window.__viewTrip?.('${tripId}')" style="flex: 1; padding: 0.5rem; border: none; background: #6B4D8E; color: white; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold;">
                View Trip
              </button>
            ` : ''}
          </div>
        </div>
      `

      const marker = new mapboxgl.Marker(el)
        .setLngLat([cluster.longitude, cluster.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent))
        .addTo(map.current!)

      markers.current.push(marker)
    })
  }, [cityClusters])

  return (
    <div style={{ position: 'relative' }}>
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
          height: '400px', 
          borderRadius: '16px',
          overflow: 'hidden'
        }} 
      />
      
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          padding: '0.5rem 0.75rem',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.8)',
          border: '1px solid rgba(212, 175, 55, 0.2)'
        }}>
          {status}
        </div>
        <button
          onClick={handleRefresh}
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 0.6rem',
            borderRadius: '8px',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: '#D4AF37',
            cursor: 'pointer',
            fontSize: '0.9rem',
            lineHeight: 1
          }}
          title="Refresh map"
        >
          ↻
        </button>
        <button
          onClick={handleForceRefresh}
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 0.6rem',
            borderRadius: '8px',
            border: '1px solid rgba(231, 76, 60, 0.3)',
            color: '#E74C3C',
            cursor: 'pointer',
            fontSize: '0.9rem',
            lineHeight: 1
          }}
          title="Force re-geocode all photos"
        >
          ⟲
        </button>
      </div>
    </div>
  )
}
