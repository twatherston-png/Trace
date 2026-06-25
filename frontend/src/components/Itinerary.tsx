import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Day, Activity } from '../types'
import ActionMenu from './ActionMenu'

interface ItineraryProps {
  tripId: string
  tripStartDate: string
  tripEndDate: string
}

export default function Itinerary({ tripId, tripStartDate, tripEndDate }: ItineraryProps) {
  const [days, setDays] = useState<Day[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [showAddDay, setShowAddDay] = useState(false)
  const [showAddActivity, setShowAddActivity] = useState<string | null>(null)
  const [newDay, setNewDay] = useState({ date: '', notes: '' })
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
  }

  const handleAddDay = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('days').insert({
      trip_id: tripId,
      date: newDay.date,
      notes: newDay.notes || null
    })

    if (!error) {
      setShowAddDay(false)
      setNewDay({ date: '', notes: '' })
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {days.map(day => (
            <div key={day.id} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  {day.notes && <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{day.notes}</div>}
                </div>
                <button
                  onClick={() => handleDeleteDay(day.id)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(244, 67, 54, 0.5)',
                    background: 'rgba(244, 67, 54, 0.1)',
                    color: '#f44336',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Delete
                </button>
              </div>

              {/* Activities for this day */}
              {getActivitiesForDay(day.id).length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  {getActivitiesForDay(day.id).map(activity => (
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
                          ]}
                        />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Activity Button */}
              <button
                onClick={() => setShowAddActivity(showAddActivity === day.id ? null : day.id)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255, 255, 255, 0.3)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  opacity: 0.7
                }}
              >
                {showAddActivity === day.id ? 'Cancel' : '+ Add Activity'}
              </button>

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
          ))}
        </div>
      )}
    </div>
  )
}
