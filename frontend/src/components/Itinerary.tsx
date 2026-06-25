import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Day, Activity, Photo } from '../types'
import ActionMenu from './ActionMenu'

interface ItineraryProps {
  tripId: string
  tripStartDate: string
  tripEndDate: string
}

export default function Itinerary({ tripId, tripStartDate, tripEndDate }: ItineraryProps) {
  const [days, setDays] = useState<Day[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showAddDay, setShowAddDay] = useState(false)
  const [showAddActivity, setShowAddActivity] = useState<string | null>(null)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [newDay, setNewDay] = useState({ date: '', notes: '', location: '' })
  const [newActivity, setNewActivity] = useState<{
    name: string
    time: string
    location: string
    notes: string
    activity_type: 'transport' | 'accommodation' | 'activity' | 'food'
    transport_type: string
    flight_number: string
    booking_reference: string
  }>({
    name: '',
    time: '',
    location: '',
    notes: '',
    activity_type: 'activity',
    transport_type: 'other',
    flight_number: '',
    booking_reference: ''
  })

  const [editingActivity, setEditingActivity] = useState<string | null>(null)
  const [editActivityData, setEditActivityData] = useState<{
    name: string
    time: string
    location: string
    notes: string
    activity_type: 'transport' | 'accommodation' | 'activity' | 'food'
    transport_type: string
    flight_number: string
    booking_reference: string
  }>({
    name: '',
    time: '',
    location: '',
    notes: '',
    activity_type: 'activity',
    transport_type: 'other',
    flight_number: '',
    booking_reference: ''
  })

  const [editingDayNotes, setEditingDayNotes] = useState<string | null>(null)
  const [dayNotesText, setDayNotesText] = useState('')
  const [editingDayIdeas, setEditingDayIdeas] = useState<string | null>(null)
  const [dayIdeasText, setDayIdeasText] = useState('')
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [editDayData, setEditDayData] = useState<{ date: string; notes: string; location: string }>({
    date: '',
    notes: '',
    location: ''
  })

  useEffect(() => {
    loadData()
  }, [tripId])

  const loadData = async () => {
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
      .order('time')

    if (activitiesData) setActivities(activitiesData)

    const { data: photosData } = await supabase
      .from('photos')
      .select('*')
      .eq('trip_id', tripId)
      .order('taken_at', { ascending: false })

    if (photosData) setPhotos(photosData)
  }

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(dayId)) {
        next.delete(dayId)
      } else {
        next.add(dayId)
      }
      return next
    })
  }

  const handleAddDay = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('days').insert({
      trip_id: tripId,
      date: newDay.date,
      notes: newDay.notes || null,
      location: newDay.location || null
    })

    if (!error) {
      setShowAddDay(false)
      setNewDay({ date: '', notes: '', location: '' })
      loadData()
    }
  }

  const handleAddActivity = async (dayId: string, e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('activities').insert({
      trip_id: tripId,
      day_id: dayId,
      name: newActivity.name,
      time: newActivity.time || null,
      location: newActivity.location || null,
      notes: newActivity.notes || null,
      activity_type: newActivity.activity_type,
      transport_type: newActivity.transport_type,
      flight_number: newActivity.flight_number || null,
      booking_reference: newActivity.booking_reference || null
    })

    if (!error) {
      setShowAddActivity(null)
      setNewActivity({
        name: '',
        time: '',
        location: '',
        notes: '',
        activity_type: 'activity',
        transport_type: 'other',
        flight_number: '',
        booking_reference: ''
      })
      loadData()
    }
  }

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity.id)
    setEditActivityData({
      name: activity.name,
      time: activity.time || '',
      location: activity.location || '',
      notes: activity.notes || '',
      activity_type: activity.activity_type as 'transport' | 'accommodation' | 'activity' | 'food' || 'activity',
      transport_type: activity.transport_type || 'other',
      flight_number: activity.flight_number || '',
      booking_reference: activity.booking_reference || ''
    })
  }

  const handleUpdateActivity = async (activityId: string, e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('activities').update({
      name: editActivityData.name,
      time: editActivityData.time || null,
      location: editActivityData.location || null,
      notes: editActivityData.notes || null,
      activity_type: editActivityData.activity_type,
      transport_type: editActivityData.transport_type,
      flight_number: editActivityData.flight_number || null,
      booking_reference: editActivityData.booking_reference || null
    }).eq('id', activityId)

    if (!error) {
      setEditingActivity(null)
      setEditActivityData({
        name: '',
        time: '',
        location: '',
        notes: '',
        activity_type: 'activity',
        transport_type: 'other',
        flight_number: '',
        booking_reference: ''
      })
      loadData()
    }
  }

  const handleUpdateDayNotes = async (dayId: string) => {
    const { error } = await supabase.from('days').update({
      notes: dayNotesText || null
    }).eq('id', dayId)

    if (!error) {
      setEditingDayNotes(null)
      setDayNotesText('')
      loadData()
    }
  }

  const handleUpdateDayIdeas = async (dayId: string) => {
    const { error } = await supabase.from('days').update({
      ideas: dayIdeasText || null
    }).eq('id', dayId)

    if (!error) {
      setEditingDayIdeas(null)
      setDayIdeasText('')
      loadData()
    }
  }

  const handleEditDay = (day: Day) => {
    setEditingDay(day.id)
    setEditDayData({
      date: day.date,
      notes: day.notes || '',
      location: day.location || ''
    })
  }

  const handleUpdateDay = async (dayId: string) => {
    const { error } = await supabase.from('days').update({
      date: editDayData.date,
      notes: editDayData.notes || null,
      location: editDayData.location || null
    }).eq('id', dayId)

    if (!error) {
      setEditingDay(null)
      setEditDayData({ date: '', notes: '', location: '' })
      loadData()
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Delete this activity?')) return
    const { error } = await supabase.from('activities').delete().eq('id', activityId)
    if (!error) loadData()
  }

  const handleDeleteDay = async (dayId: string) => {
    if (!confirm('Delete this day and all its activities?')) return
    const { error } = await supabase.from('days').delete().eq('id', dayId)
    if (!error) loadData()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transport': return '🚗'
      case 'accommodation': return '🏨'
      case 'activity': return '🎯'
      case 'food': return '🍽️'
      default: return '📍'
    }
  }

  const getActivitiesForDay = (dayId: string) => {
    return activities.filter(a => a.day_id === dayId)
  }

  const getPhotosForDay = (dayId: string) => {
    return photos.filter(p => p.day_id === dayId)
  }

  const getDaySummary = (dayId: string) => {
    const dayActivities = getActivitiesForDay(dayId)
    if (dayActivities.length === 0) return 'No activities'
    
    const types = dayActivities.reduce((acc, a) => {
      const type = a.activity_type || 'activity'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const parts = []
    if (types.transport) parts.push(`${types.transport} transport`)
    if (types.accommodation) parts.push(`${types.accommodation} stay`)
    if (types.activity) parts.push(`${types.activity} activity`)
    if (types.food) parts.push(`${types.food} food`)

    return parts.join(', ')
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Itinerary</h2>
        <button
          onClick={() => setShowAddDay(!showAddDay)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #6B4D8E 0%, #8B6DB0 100%)',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          {showAddDay ? 'Cancel' : '+ Add Day'}
        </button>
      </div>

      {showAddDay && (
        <form onSubmit={handleAddDay} style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <input
            type="date"
            value={newDay.date}
            onChange={(e) => setNewDay({ ...newDay, date: e.target.value })}
            required
            min={tripStartDate}
            max={tripEndDate}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '1rem'
            }}
          />
          <input
            type="text"
            placeholder="Location (e.g., Lima, Cusco)"
            value={newDay.location}
            onChange={(e) => setNewDay({ ...newDay, location: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '1rem'
            }}
          />
          <textarea
            placeholder="Notes (optional)"
            value={newDay.notes}
            onChange={(e) => setNewDay({ ...newDay, notes: e.target.value })}
            rows={2}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '1rem',
              resize: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
              color: '#2D1B4E',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Add Day
          </button>
        </form>
      )}

      {days.length === 0 ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          opacity: 0.7
        }}>
          No days added yet. Add your first day!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {days.map(day => {
            const isExpanded = expandedDays.has(day.id)
            const dayActivities = getActivitiesForDay(day.id)
            
            return (
              <div key={day.id} style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                {/* Day Header - Clickable */}
                <div 
                  onClick={() => toggleDay(day.id)}
                  style={{
                    padding: '1rem 1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isExpanded ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        display: 'inline-block'
                      }}>
                        ▶
                      </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      {day.location && (
                        <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>📍 {day.location}</span>
                      )}
                    </div>
                    {!isExpanded && (
                      <div style={{ fontSize: '0.85rem', opacity: 0.6, marginLeft: '1.5rem' }}>
                        {getDaySummary(day.id)}
                      </div>
                    )}
                    {isExpanded && day.notes && (
                      <div style={{ fontSize: '0.9rem', opacity: 0.8, marginLeft: '1.5rem' }}>{day.notes}</div>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu actions={[
                      { label: '➕ Add Activity', onClick: () => setShowAddActivity(day.id) },
                      { label: '✏️ Edit Day', onClick: () => handleEditDay(day) },
                      { label: '🗑️ Delete Day', onClick: () => handleDeleteDay(day.id), danger: true }
                    ]} />
                  </div>
                </div>

                {/* Edit Day Form */}
                {editingDay === day.id && (
                  <form onSubmit={(e) => { e.preventDefault(); handleUpdateDay(day.id); }} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <input
                      type="date"
                      value={editDayData.date}
                      onChange={(e) => setEditDayData({ ...editDayData, date: e.target.value })}
                      required
                      min={tripStartDate}
                      max={tripEndDate}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '1rem'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Location (e.g., Lima, Cusco)"
                      value={editDayData.location}
                      onChange={(e) => setEditDayData({ ...editDayData, location: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '1rem'
                      }}
                    />
                    <textarea
                      placeholder="Notes (optional)"
                      value={editDayData.notes}
                      onChange={(e) => setEditDayData({ ...editDayData, notes: e.target.value })}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '1rem',
                        resize: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
                          color: '#2D1B4E',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDay(null)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          background: 'transparent',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    {/* Photos for this day */}
                    {getPhotosForDay(day.id).length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>📸 Photos</div>
                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                          {getPhotosForDay(day.id).map(photo => (
                            <img
                              key={photo.id}
                              src={photo.url}
                              alt={photo.caption || ''}
                              onClick={() => setSelectedPhoto(photo)}
                              style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '6px',
                                objectFit: 'cover',
                                cursor: 'pointer'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activities for this day */}
                    {dayActivities.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        {dayActivities.map(activity => (
                          <div key={activity.id} style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '0.5rem'
                          }}>
                            {editingActivity === activity.id ? (
                              <form onSubmit={(e) => handleUpdateActivity(activity.id, e)}>
                                {/* Activity Type Selector */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                                  {[
                                    { type: 'transport', icon: '🚗', label: 'Transport' },
                                    { type: 'accommodation', icon: '🏨', label: 'Accommodation' },
                                    { type: 'activity', icon: '🎯', label: 'Activity' },
                                    { type: 'food', icon: '🍽️', label: 'Food & Drink' }
                                  ].map(({ type, icon, label }) => (
                                    <button
                                      key={type}
                                      type="button"
                                      onClick={() => setEditActivityData({ ...editActivityData, activity_type: type as any })}
                                      style={{
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: editActivityData.activity_type === type ? '2px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.2)',
                                        background: editActivityData.activity_type === type ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                      }}
                                    >
                                      <span>{icon}</span>
                                      <span>{label}</span>
                                    </button>
                                  ))}
                                </div>

                                <input
                                  type="text"
                                  placeholder={editActivityData.activity_type === 'transport' ? 'Transport Name' :
                                              editActivityData.activity_type === 'accommodation' ? 'Accommodation Name' :
                                              editActivityData.activity_type === 'food' ? 'Restaurant Name' : 'Activity Name'}
                                  value={editActivityData.name}
                                  onChange={(e) => setEditActivityData({ ...editActivityData, name: e.target.value })}
                                  required
                                  style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    marginBottom: '0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '1rem'
                                  }}
                                />

                                <input
                                  type="time"
                                  value={editActivityData.time}
                                  onChange={(e) => setEditActivityData({ ...editActivityData, time: e.target.value })}
                                  style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    marginBottom: '0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '1rem'
                                  }}
                                />

                                <input
                                  type="text"
                                  placeholder="Location (optional)"
                                  value={editActivityData.location}
                                  onChange={(e) => setEditActivityData({ ...editActivityData, location: e.target.value })}
                                  style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    marginBottom: '0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '1rem'
                                  }}
                                />

                                {editActivityData.activity_type === 'transport' && (
                                  <>
                                    <select
                                      value={editActivityData.transport_type}
                                      onChange={(e) => setEditActivityData({ ...editActivityData, transport_type: e.target.value })}
                                      style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        marginBottom: '0.75rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        fontSize: '1rem'
                                      }}
                                    >
                                      <option value="flight">✈️ Flight</option>
                                      <option value="train">🚂 Train</option>
                                      <option value="bus">🚌 Bus</option>
                                      <option value="car">🚗 Car</option>
                                      <option value="taxi">🚕 Taxi</option>
                                      <option value="other">Other</option>
                                    </select>

                                    {editActivityData.transport_type === 'flight' && (
                                      <input
                                        type="text"
                                        placeholder="Flight number (e.g., AA1234)"
                                        value={editActivityData.flight_number}
                                        onChange={(e) => setEditActivityData({ ...editActivityData, flight_number: e.target.value })}
                                        style={{
                                          width: '100%',
                                          padding: '0.75rem',
                                          marginBottom: '0.75rem',
                                          borderRadius: '8px',
                                          border: 'none',
                                          background: 'rgba(255, 255, 255, 0.1)',
                                          color: 'white',
                                          fontSize: '1rem'
                                        }}
                                      />
                                    )}
                                  </>
                                )}

                                <input
                                  type="text"
                                  placeholder="Booking reference (optional)"
                                  value={editActivityData.booking_reference}
                                  onChange={(e) => setEditActivityData({ ...editActivityData, booking_reference: e.target.value })}
                                  style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    marginBottom: '0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '1rem'
                                  }}
                                />

                                <textarea
                                  placeholder="Notes (optional)"
                                  value={editActivityData.notes}
                                  onChange={(e) => setEditActivityData({ ...editActivityData, notes: e.target.value })}
                                  rows={2}
                                  style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    marginBottom: '0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '1rem',
                                    resize: 'none'
                                  }}
                                />

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    type="submit"
                                    style={{
                                      flex: 1,
                                      padding: '0.75rem',
                                      borderRadius: '8px',
                                      border: 'none',
                                      background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
                                      color: '#2D1B4E',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      fontSize: '1rem'
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingActivity(null)}
                                    style={{
                                      flex: 1,
                                      padding: '0.75rem',
                                      borderRadius: '8px',
                                      border: '1px solid rgba(255, 255, 255, 0.3)',
                                      background: 'transparent',
                                      color: 'white',
                                      cursor: 'pointer',
                                      fontSize: '1rem'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <div style={{ fontSize: '1.5rem' }}>{getActivityIcon(activity.activity_type || 'activity')}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{activity.name}</div>
                                  {activity.activity_type === 'transport' && activity.transport_type && (
                                    <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                                      {activity.transport_type === 'flight' ? '✈️' :
                                       activity.transport_type === 'train' ? '🚂' :
                                       activity.transport_type === 'bus' ? '🚌' :
                                       activity.transport_type === 'car' ? '🚗' :
                                       activity.transport_type === 'taxi' ? '🚕' : '🚗'} {activity.transport_type.charAt(0).toUpperCase() + activity.transport_type.slice(1)}
                                    </div>
                                  )}
                                  {activity.time && (
                                    <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                                      🕐 {activity.time}
                                    </div>
                                  )}
                                  {activity.location && (
                                    <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                                      📍 {activity.location}
                                    </div>
                                  )}
                                  {activity.flight_number && (
                                    <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                                      ✈️ {activity.flight_number}
                                    </div>
                                  )}
                                  {activity.booking_reference && (
                                    <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                                      🎫 {activity.booking_reference}
                                    </div>
                                  )}
                                  {activity.notes && (
                                    <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
                                      {activity.notes}
                                    </div>
                                  )}
                                </div>
                                <ActionMenu actions={[
                                  { label: '✏️ Edit', onClick: () => handleEditActivity(activity) },
                                  { label: '🗑️ Delete', onClick: () => handleDeleteActivity(activity.id), danger: true }
                                ]} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes Section */}
                    {editingDayNotes === day.id ? (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <textarea
                          value={dayNotesText}
                          onChange={(e) => setDayNotesText(e.target.value)}
                          placeholder="Add notes like 'If we have time, travel to Miraflores, go shoe shopping...'"
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '0.9rem',
                            resize: 'vertical'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleUpdateDayNotes(day.id)}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
                              color: '#2D1B4E',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingDayNotes(null)
                              setDayNotesText('')
                            }}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              background: 'transparent',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        cursor: 'pointer'
                      }} onClick={() => {
                        setEditingDayNotes(day.id)
                        setDayNotesText(day.notes || '')
                      }}>
                        {day.notes ? (
                          <div style={{ fontSize: '0.9rem', opacity: 0.9, whiteSpace: 'pre-wrap' }}>
                            {day.notes}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.9rem', opacity: 0.5, fontStyle: 'italic' }}>
                            + Add Notes
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ideas Section */}
                    {editingDayIdeas === day.id ? (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <textarea
                          value={dayIdeasText}
                          onChange={(e) => setDayIdeasText(e.target.value)}
                          placeholder="Ideas for this day..."
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '0.9rem',
                            resize: 'vertical'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleUpdateDayIdeas(day.id)}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
                              color: '#2D1B4E',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingDayIdeas(null)
                              setDayIdeasText('')
                            }}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              background: 'transparent',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        cursor: 'pointer'
                      }} onClick={() => {
                        setEditingDayIdeas(day.id)
                        setDayIdeasText((day as any).ideas || '')
                      }}>
                        {(day as any).ideas ? (
                          <>
                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', opacity: 0.6, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              💡 Ideas
                            </div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9, whiteSpace: 'pre-wrap' }}>
                              {(day as any).ideas}
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: '0.9rem', opacity: 0.5, fontStyle: 'italic' }}>
                            💡 Ideas for this day...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Add Activity Form */}
                    {showAddActivity === day.id && (
                      <form onSubmit={(e) => handleAddActivity(day.id, e)} style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginTop: '0.5rem'
                      }}>
                        {/* Activity Type Selector */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                          {[
                            { type: 'transport', icon: '🚗', label: 'Transport' },
                            { type: 'accommodation', icon: '🏨', label: 'Accommodation' },
                            { type: 'activity', icon: '🎯', label: 'Activity' },
                            { type: 'food', icon: '🍽️', label: 'Food & Drink' }
                          ].map(({ type, icon, label }) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setNewActivity({ ...newActivity, activity_type: type as any })}
                              style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: newActivity.activity_type === type ? '2px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.2)',
                                background: newActivity.activity_type === type ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              <span>{icon}</span>
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>

                        <input
                          type="text"
                          placeholder={newActivity.activity_type === 'transport' ? 'Transport Name' :
                                      newActivity.activity_type === 'accommodation' ? 'Accommodation Name' :
                                      newActivity.activity_type === 'food' ? 'Restaurant Name' : 'Activity Name'}
                          value={newActivity.name}
                          onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '1rem'
                          }}
                        />

                        <input
                          type="time"
                          value={newActivity.time}
                          onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '1rem'
                          }}
                        />

                        <input
                          type="text"
                          placeholder="Location (optional)"
                          value={newActivity.location}
                          onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '1rem'
                          }}
                        />

                        {newActivity.activity_type === 'transport' && (
                          <>
                            <select
                              value={newActivity.transport_type}
                              onChange={(e) => setNewActivity({ ...newActivity, transport_type: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                marginBottom: '0.75rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                fontSize: '1rem'
                              }}
                            >
                              <option value="flight">✈️ Flight</option>
                              <option value="train">🚂 Train</option>
                              <option value="bus">🚌 Bus</option>
                              <option value="car">🚗 Car</option>
                              <option value="taxi">🚕 Taxi</option>
                              <option value="other">Other</option>
                            </select>

                            {newActivity.transport_type === 'flight' && (
                              <input
                                type="text"
                                placeholder="Flight number (e.g., AA1234)"
                                value={newActivity.flight_number}
                                onChange={(e) => setNewActivity({ ...newActivity, flight_number: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  marginBottom: '0.75rem',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  color: 'white',
                                  fontSize: '1rem'
                                }}
                              />
                            )}
                          </>
                        )}

                        <input
                          type="text"
                          placeholder="Booking reference (optional)"
                          value={newActivity.booking_reference}
                          onChange={(e) => setNewActivity({ ...newActivity, booking_reference: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '1rem'
                          }}
                        />

                        <textarea
                          placeholder="Notes (optional)"
                          value={newActivity.notes}
                          onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '1rem',
                            resize: 'none'
                          }}
                        />

                        <button
                          type="submit"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #D4AF37 0%, #E5C458 100%)',
                            color: '#2D1B4E',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '1rem'
                          }}
                        >
                          Add Activity
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5000,
            padding: '1rem'
          }}
        >
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.caption || ''}
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              borderRadius: '8px'
            }}
          />
        </div>
      )}
    </div>
  )
}
