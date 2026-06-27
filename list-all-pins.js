const SUPABASE_URL = 'https://baunrordpbmquujmjivs.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdW5yb3JkcGJtcXV1am1qaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzkzMTcsImV4cCI6MjA5Nzg1NTMxN30._GBUtR5KfadP0md1BF-SnvQA51kBRGoA-kuUTnotnbs'

async function listAllPins() {
  console.log('Listing all pins...')
  
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/pins?select=*`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  )

  const pins = await response.json()

  if (pins.length === 0) {
    console.log('No pins found')
    return
  }

  console.log(`Found ${pins.length} pin(s):`)
  pins.forEach(pin => {
    console.log(`  - ID: ${pin.id}`)
    console.log(`    Location: ${pin.location}`)
    console.log(`    Date: ${pin.date}`)
    console.log(`    Notes: ${pin.notes || '(none)'}`)
    console.log(`    Photo URL: ${pin.photo_url || '(none)'}`)
    console.log('')
  })
}

listAllPins()
