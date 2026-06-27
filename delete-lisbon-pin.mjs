import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://baunrordpbmquujmjivs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdW5yb3JkcGJtcXV1am1qaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzkzMTcsImV4cCI6MjA5Nzg1NTMxN30._GBUtR5KfadP0md1BF-SnvQA51kBRGoA-kuUTnotnbs'
)

async function deleteLisbonPin() {
  console.log('Finding Lisbon pins...')
  
  // Find pins with Lisbon in the location
  const { data: pins, error: findError } = await supabase
    .from('pins')
    .select('*')
    .ilike('location', '%Lisbon%')

  if (findError) {
    console.error('Error finding pins:', findError)
    return
  }

  if (!pins || pins.length === 0) {
    console.log('No Lisbon pins found')
    return
  }

  console.log(`Found ${pins.length} Lisbon pin(s):`)
  pins.forEach(pin => {
    console.log(`  - ID: ${pin.id}, Location: ${pin.location}, Date: ${pin.date}`)
  })

  // Delete all Lisbon pins
  const { error: deleteError } = await supabase
    .from('pins')
    .delete()
    .ilike('location', '%Lisbon%')

  if (deleteError) {
    console.error('Error deleting pins:', deleteError)
    return
  }

  console.log(`✓ Deleted ${pins.length} Lisbon pin(s)`)
}

deleteLisbonPin()
