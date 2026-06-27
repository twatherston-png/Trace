const SUPABASE_URL = 'https://baunrordpbmquujmjivs.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdW5yb3JkcGJtcXV1am1qaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzkzMTcsImV4cCI6MjA5Nzg1NTMxN30._GBUtR5KfadP0md1BF-SnvQA51kBRGoA-kuUTnotnbs'

async function deleteLisbonPin() {
  console.log('Finding Lisbon pins...')
  
  // Find pins with Lisbon in the location
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/pins?location=like.*Lisbon.*&select=*`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  )

  const pins = await response.json()

  if (pins.length === 0) {
    console.log('No Lisbon pins found')
    return
  }

  console.log(`Found ${pins.length} Lisbon pin(s):`)
  pins.forEach(pin => {
    console.log(`  - ID: ${pin.id}, Location: ${pin.location}, Date: ${pin.date}`)
  })

  // Delete all Lisbon pins
  const deleteResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/pins?location=like.*Lisbon.*`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  )

  if (deleteResponse.status === 204) {
    console.log(`✓ Deleted ${pins.length} Lisbon pin(s)`)
  } else {
    console.error('Error deleting pins:', await deleteResponse.text())
  }
}

deleteLisbonPin()
