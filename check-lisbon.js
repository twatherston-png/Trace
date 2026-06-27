import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'frontend/.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

console.log('Checking pins table for Lisbon...')
const { data: pins, error: pinError } = await supabase
  .from('pins')
  .select('*')
  .ilike('location', '%lisb%')

if (pinError) console.error('Pin error:', pinError)
else console.log('Pins:', JSON.stringify(pins, null, 2))

console.log('\nChecking photos table for Lisbon...')
const { data: photos, error: photoError } = await supabase
  .from('photos')
  .select('*')
  .ilike('location', '%lisb%')

if (photoError) console.error('Photo error:', photoError)
else console.log('Photos:', JSON.stringify(photos, null, 2))

console.log('\nChecking photos with no trip_id...')
const { data: orphanPhotos, error: orphanError } = await supabase
  .from('photos')
  .select('*')
  .is('trip_id', null)
  .order('uploaded_at', { ascending: false })
  .limit(10)

if (orphanError) console.error('Orphan error:', orphanError)
else console.log('Orphan photos:', JSON.stringify(orphanPhotos, null, 2))
