import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://baunrordpbmquujmjivs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdW5yb3JkcGJtcXV1am1qaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzkzMTcsImV4cCI6MjA5Nzg1NTMxN30._GBUtR5KfadP0md1BF-SnvQA51kBRGoA-kuUTnotnbs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
