const SUPABASE_URL = 'https://baunrordpbmquujmjivs.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdW5yb3JkcGJtcXV1am1qaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzkzMTcsImV4cCI6MjA5Nzg1NTMxN30._GBUtR5KfadP0md1BF-SnvQA51kBRGoA-kuUTnotnbs'

async function checkDatabase() {
  console.log('Checking database tables...')
  
  // Try to query pins table
  const pinsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/pins?select=*&limit=1`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  )

  console.log('Pins table status:', pinsResponse.status)
  
  if (pinsResponse.status === 404) {
    console.log('❌ Pins table does not exist yet')
    console.log('You need to run the migration: database/create-pins-table.sql')
  } else if (pinsResponse.status === 200) {
    const pins = await pinsResponse.json()
    console.log('✓ Pins table exists')
    console.log(`Found ${pins.length} pin(s)`)
  } else {
    const error = await pinsResponse.text()
    console.log('Error:', error)
  }
}

checkDatabase()
