import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Trip, Day, Activity, Photo, JournalEntry } from '../types'

export default function TripOverview() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [days, setDays] = useState<Day[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])

  useEffect(() => {
    if (tripId) loadTripData()
  }, [tripId])

  const loadTripData = async () => {
    if (!tripId) return

    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()

    if (tripData) setTrip(tripData)

    const { data: daysData } = await supabase
      .from('days')
      .select('*')
      .eq('trip_id', tripId)
      .order('date')

    if (daysData) setDays(daysData)

    const { data: activitiesData } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', tripId)

    if (activitiesData) setActivities(activitiesData)

    const { data: photosData } = await supabase
      .from('photos')
      .select('*')
      .eq('trip_id', tripId)

    if (photosData) setPhotos(photosData)

    const { data: journalData } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('trip_id', tripId)
      .order('date')

    if (journalData) setJournalEntries(journalData)
  }

  if (!trip) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #2D1B4E 0%, #4A2D6B 100%)',
      padding: '1rem'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingTop: '1rem'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{trip.name}</h1>
          <button
            onClick={() => navigate('/trips')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Back
          </button>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
          </div>
          {trip.notes && <div style={{ opacity: 0.8 }}>{trip.notes}</div>}
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#D4AF37' }}>
              {days.length}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Days</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#D4AF37' }}>
              {photos.length}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Photos</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#D4AF37' }}>
              {journalEntries.length}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Journal</div>
          </div>
        </div>

        {/* Activities */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Activities</h2>
          {activities.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              opacity: 0.7
            }}>
              No activities yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activities.map(activity => (
                <div
                  key={activity.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {activity.name}
                  </div>
                  {activity.time && (
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                      {activity.time}
                    </div>
                  )}
                  {activity.location && (
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                      📍 {activity.location}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Journal Entries */}
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Journal</h2>
          {journalEntries.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              opacity: 0.7
            }}>
              No journal entries yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {journalEntries.map(entry => (
                <div
                  key={entry.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '1.5rem'
                  }}
                >
                  <div style={{
                    fontSize: '0.9rem',
                    opacity: 0.7,
                    marginBottom: '0.5rem'
                  }}>
                    {new Date(entry.date).toLocaleDateString()}
                    {entry.location && ` • ${entry.location}`}
                  </div>
                  <div style={{ lineHeight: '1.6' }}>
                    {entry.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
