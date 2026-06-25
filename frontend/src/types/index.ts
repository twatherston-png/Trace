export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Trip {
  id: string
  user_id: string
  name: string
  start_date: string
  end_date: string
  cover_photo_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Day {
  id: string
  trip_id: string
  date: string
  notes?: string
  created_at: string
}

export interface Activity {
  id: string
  day_id?: string
  trip_id: string
  name: string
  time?: string
  location?: string
  notes?: string
  booking_reference?: string
  activity_type?: 'transport' | 'accommodation' | 'activity' | 'food'
  transport_type?: 'flight' | 'train' | 'bus' | 'car' | 'taxi' | 'other'
  flight_number?: string
  created_at: string
}

export interface Photo {
  id: string
  trip_id: string
  day_id?: string
  activity_id?: string
  location_id?: string
  url: string
  caption?: string
  location?: string
  latitude?: number
  longitude?: number
  taken_at?: string
  uploaded_at: string
}

export interface Document {
  id: string
  trip_id: string
  day_id?: string
  activity_id?: string
  url: string
  name: string
  type: string
  notes?: string
  uploaded_at: string
}

export interface JournalEntry {
  id: string
  trip_id: string
  location_id?: string
  date: string
  location?: string
  latitude?: number
  longitude?: number
  content: string
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  user_id: string
  trip_id?: string
  name: string
  latitude?: number
  longitude?: number
  city?: string
  country?: string
  visit_date?: string
  notes?: string
  created_at: string
}
