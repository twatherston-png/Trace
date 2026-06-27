const SUPABASE_URL = 'https://baunrordpbmquujmjivs.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdW5yb3JkcGJtcXV1am1qaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzkzMTcsImV4cCI6MjA5Nzg1NTMxN30._GBUtR5KfadP0md1BF-SnvQA51kBRGoA-kuUTnotnbs'

async function checkTrips() {
  console.log('Checking trips for Lisbon...\n')
  
  // Get all trips
  const tripsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/trips?select=id,name,start_date,end_date`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  )
  
  const trips = await tripsResponse.json()
  console.log(`Total trips: ${trips.length}\n`)
  
  // Search for Lisbon
  const lisbonTrips = trips.filter(t => 
    t.name && t.name.toLowerCase().includes('lisbon')
  )
  
  if (lisbonTrips.length > 0) {
    console.log(`Found ${lisbonTrips.length} trip(s) with Lisbon:\n`)
    lisbonTrips.forEach(t => {
      console.log(`Trip ID: ${t.id}`)
      console.log(`  Name: ${t.name}`)
      console.log(`  Start: ${t.start_date}`)
      console.log(`  End: ${t.end_date}`)
      console.log('')
    })
  } else {
    console.log('No trips with Lisbon in name')
    console.log('\nAll trips:')
    trips.forEach(t => console.log(`  - ${t.name} (${t.id})`))
  }
}

checkTrips()
