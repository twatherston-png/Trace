const SUPABASE_URL = 'https://baunrordpbmquujmjivs.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdW5yb3JkcGJtcXV1am1qaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzkzMTcsImV4cCI6MjA5Nzg1NTMxN30._GBUtR5KfadP0md1BF-SnvQA51kBRGoA-kuUTnotnbs'

async function checkAllPhotos() {
  console.log('Checking all photos...\n')
  
  const photosResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/photos?select=id,location,taken_at,uploaded_at,latitude,longitude,trip_id&order=uploaded_at.desc&limit=20`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  )
  
  const photos = await photosResponse.json()
  console.log(`Total photos (last 20): ${photos.length}\n`)
  
  photos.forEach(p => {
    console.log(`ID: ${p.id}`)
    console.log(`  Location: ${p.location || '(none)'}`)
    console.log(`  Taken: ${p.taken_at || '(none)'}`)
    console.log(`  Uploaded: ${p.uploaded_at}`)
    console.log(`  Coords: ${p.latitude}, ${p.longitude}`)
    console.log(`  Trip: ${p.trip_id || '(none)'}`)
    console.log('')
  })
  
  // Check photo_locations cache
  console.log('\n--- Checking photo_locations cache ---\n')
  const cacheResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/photo_locations?select=*&limit=20`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  )
  
  const cached = await cacheResponse.json()
  console.log(`Cached locations: ${cached.length}\n`)
  
  cached.forEach(c => {
    console.log(`Photo ID: ${c.photo_id}`)
    console.log(`  City: ${c.city}`)
    console.log(`  Country: ${c.country}`)
    console.log(`  Coords: ${c.latitude}, ${c.longitude}`)
    console.log('')
  })
}

checkAllPhotos()
