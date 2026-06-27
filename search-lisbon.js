const SUPABASE_URL = 'https://baunrordpbmquujmjivs.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdW5yb3JkcGJtcXV1am1qaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzkzMTcsImV4cCI6MjA5Nzg1NTMxN30._GBUtR5KfadP0md1BF-SnvQA51kBRGoA-kuUTnotnbs'

async function searchLisbon() {
  console.log('Searching for Lisbon in all photos...\n')
  
  // Get all photos
  const photosResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/photos?select=id,location,taken_at,uploaded_at,latitude,longitude,trip_id`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  )
  
  const photos = await photosResponse.json()
  console.log(`Total photos: ${photos.length}\n`)
  
  // Search for Lisbon
  const lisbonPhotos = photos.filter(p => 
    p.location && p.location.toLowerCase().includes('lisbon')
  )
  
  if (lisbonPhotos.length > 0) {
    console.log(`Found ${lisbonPhotos.length} photo(s) with Lisbon:\n`)
    lisbonPhotos.forEach(p => {
      console.log(`ID: ${p.id}`)
      console.log(`  Location: ${p.location}`)
      console.log(`  Taken: ${p.taken_at || '(none)'}`)
      console.log(`  Uploaded: ${p.uploaded_at}`)
      console.log(`  Coords: ${p.latitude}, ${p.longitude}`)
      console.log(`  Trip: ${p.trip_id || '(none)'}`)
      console.log('')
    })
  } else {
    console.log('No photos with Lisbon in location')
    console.log('\nAll unique locations:')
    const locations = [...new Set(photos.map(p => p.location).filter(Boolean))]
    locations.forEach(loc => console.log(`  - ${loc}`))
  }
}

searchLisbon()
