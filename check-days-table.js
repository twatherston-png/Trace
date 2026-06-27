const SUPABASE_URL = 'https://baunrordpbmquujmjivs.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdW5yb3JkcGJtcXV1am1qaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzkzMTcsImV4cCI6MjA5Nzg1NTMxN30._GBUtR5KfadP0md1BF-SnvQA51kBRGoA-kuUTnotnbs'

async function checkDaysTable() {
  console.log('Checking if days table exists...\n')
  
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/days?select=id&limit=1`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  )
  
  console.log('Status:', response.status)
  
  if (response.status === 200) {
    const data = await response.json()
    console.log('Days table exists')
    console.log('Sample data:', data)
  } else if (response.status === 404) {
    console.log('Days table does not exist')
  } else {
    const error = await response.text()
    console.log('Error:', error)
  }
}

checkDaysTable()
