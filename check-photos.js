import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://baunrordpbmquujmjivs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdW5yb3JkcGJtcXV1am1qaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzkzMTcsImV4cCI6MjA5Nzg1NTMxN30._GBUtR5KfadP0md1BF-SnvQA51kBRGoA-kuUTnotnbs'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkPhotos() {
  console.log('Checking photos in database...\n')
  
  // Count total photos
  const { count: totalPhotos, error: totalError } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })
  
  if (totalError) {
    console.error('Error counting photos:', totalError)
    return
  }
  
  console.log(`Total photos: ${totalPhotos}`)
  
  // Count photos with GPS
  const { data: photosWithGPS, error: gpsError } = await supabase
    .from('photos')
    .select('id, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
  
  if (gpsError) {
    console.error('Error querying GPS photos:', gpsError)
    return
  }
  
  console.log(`Photos with GPS coordinates: ${photosWithGPS?.length || 0}`)
  
  if (photosWithGPS && photosWithGPS.length > 0) {
    console.log('\nSample photos with GPS:')
    photosWithGPS.slice(0, 5).forEach(photo => {
      console.log(`  ID: ${photo.id}, Lat: ${photo.latitude}, Lng: ${photo.longitude}`)
    })
  } else {
    console.log('\n⚠️  No photos have GPS coordinates!')
    console.log('This is why the world map is empty.')
  }
  
  // Check photo_locations cache
  const { count: cachedLocations, error: cacheError } = await supabase
    .from('photo_locations')
    .select('*', { count: 'exact', head: true })
  
  if (cacheError) {
    console.error('\nError checking cache:', cacheError)
  } else {
    console.log(`\nCached locations: ${cachedLocations || 0}`)
  }
}

checkPhotos().catch(console.error)
