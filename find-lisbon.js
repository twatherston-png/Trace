const SUPABASE_URL = 'https://baunrordpbmquujmjivs.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdW5yb3JkcGJtcXV1am1qaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzkzMTcsImV4cCI6MjA5Nzg1NTMxN30._GBUtR5KfadP0md1BF-SnvQA51kBRGoA-kuUTnotnbs'

async function findLisbonData() {
  console.log('Searching for Lisbon in all location sources...\n')
  
  // Check photos
  const photosResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/photos?location=like.*Lisbon.*&select=id,location,taken_at,trip_id`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  )
  
  const photos = await photosResponse.json()
  console.log(`Photos with Lisbon: ${photos.length}`)
  photos.forEach(p => {
    console.log(`  - ID: ${p.id}`)
    console.log(`    Location: ${p.location}`)
    console.log(`    Date: ${p.taken_at || '(none)'}`)
    console.log(`    Trip ID: ${p.trip_id || '(none)'}`)
    console.log('')
  })
  
  // Check days
  const daysResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/days?location=like.*Lisbon.*&select=id,location,date,trip_id`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  )
  
  const days = await daysResponse.json()
  console.log(`\nTrip days with Lisbon: ${days.length}`)
  days.forEach(d => {
    console.log(`  - ID: ${d.id}`)
    console.log(`    Location: ${d.location}`)
    console.log(`    Date: ${d.date}`)
    console.log(`    Trip ID: ${d.trip_id}`)
    console.log('')
  })
  
  if (photos.length === 0 && days.length === 0) {
    console.log('No Lisbon data found in photos or trip days')
  }
}

findLisbonData()
