const SUPABASE_URL = 'https://baunrordpbmquujmjivs.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdW5yb3JkcGJtcXV1am1qaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzkzMTcsImV4cCI6MjA5Nzg1NTMxN30._GBUtR5KfadP0md1BF-SnvQA51kBRGoA-kuUTnotnbs'

async function checkTripDays() {
  console.log('Checking trip days for Lisbon...\n')
  
  // Get all trip days
  const daysResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/days?select=id,trip_id,date,location,latitude,longitude`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  )
  
  const days = await daysResponse.json()
  console.log(`Total trip days: ${days.length}\n`)
  
  // Search for Lisbon
  const lisbonDays = days.filter(d => 
    d.location && d.location.toLowerCase().includes('lisbon')
  )
  
  if (lisbonDays.length > 0) {
    console.log(`Found ${lisbonDays.length} trip day(s) with Lisbon:\n`)
    lisbonDays.forEach(d => {
      console.log(`Day ID: ${d.id}`)
      console.log(`  Trip ID: ${d.trip_id}`)
      console.log(`  Date: ${d.date}`)
      console.log(`  Location: ${d.location}`)
      console.log(`  Coords: ${d.latitude}, ${d.longitude}`)
      console.log('')
    })
  } else {
    console.log('No trip days with Lisbon in location')
    console.log('\nAll unique locations in trip days:')
    const locations = [...new Set(days.map(d => d.location).filter(Boolean))]
    locations.forEach(loc => console.log(`  - ${loc}`))
  }
}

checkTripDays()
