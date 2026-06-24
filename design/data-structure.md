# Trace — Data Structure

## Core Entities

### User
```
id: UUID
email: string
name: string
created_at: timestamp
```

### Location (for map pins and travel log)
```
id: UUID
user_id: UUID (foreign key)
trip_id: UUID (optional, foreign key)
name: string
latitude: decimal
longitude: decimal
city: string
country: string
visit_date: date
notes: text (optional)
photo_count: integer (computed)
```

### Trip
```
id: UUID
user_id: UUID (foreign key)
name: string
start_date: date
end_date: date
cover_photo_url: string (optional)
notes: text (optional)
created_at: timestamp
updated_at: timestamp
```

### Day
```
id: UUID
trip_id: UUID (foreign key)
date: date
notes: text (optional)
```

### Activity
```
id: UUID
day_id: UUID (foreign key)
trip_id: UUID (foreign key)
name: string
time: time (optional)
location: string (optional)
notes: text (optional)
booking_reference: string (optional)
document_id: UUID (optional, foreign key)
created_at: timestamp
```

### Photo
```
id: UUID
trip_id: UUID (foreign key)
day_id: UUID (optional, foreign key)
activity_id: UUID (optional, foreign key)
url: string
caption: text (optional)
location: string (optional)
latitude: decimal (optional)
longitude: decimal (optional)
taken_at: timestamp
uploaded_at: timestamp
```

### JournalEntry
```
id: UUID
trip_id: UUID (foreign key)
location_id: UUID (optional, foreign key)
date: date
location: string (optional)
latitude: decimal (optional)
longitude: decimal (optional)
content: text
created_at: timestamp
updated_at: timestamp
```

## Relationships

- User has many Trips
- User has many Locations (map pins)
- Trip has many Days
- Trip has many Locations (optional, if location is part of a trip)
- Day has many Activities
- Day has many Photos
- Day has many Documents
- Activity belongs to Day
- Activity can have one Document
- Photo belongs to Trip (and optionally Day, Activity, Location)
- Document belongs to Trip (and optionally Day, Activity)
- JournalEntry belongs to Trip
- JournalEntry can have a Location (optional)
- Location belongs to User (and optionally Trip)

## Example Data

### Trip: Peru 2026
- Start: 2026-05-23
- End: 2026-06-03
- Days: 12

### Day: 2026-05-25 (Paracas)
- Activities:
  - Ballestas Islands tour (9:00 AM)
  - Lunch at restaurant
  - Check into hotel
- Photos: 15
- Documents: tour confirmation PDF

### Photo
- URL: s3://trace/photos/abc123.jpg
- Caption: "Sea lions on the islands"
- Location: Paracas, Peru
- Taken at: 2026-05-25 10:30:00

### Document
- URL: s3://trace/documents/xyz789.pdf
- Name: "Ballestas Islands Tour Confirmation"
- Type: PDF
- Notes: "Booking reference: BL-12345"

## Database Schema (PostgreSQL)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  UNIQUE(trip_id, date)
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID REFERENCES days(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  time TIME,
  location VARCHAR(255),
  notes TEXT,
  booking_reference VARCHAR(255),
  document_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  day_id UUID REFERENCES days(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  caption TEXT,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  taken_at TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  day_id UUID REFERENCES days(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  notes TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for activity.document_id
ALTER TABLE activities
ADD CONSTRAINT fk_document
FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_days_trip_id ON days(trip_id);
CREATE INDEX idx_activities_day_id ON activities(day_id);
CREATE INDEX idx_photos_trip_id ON photos(trip_id);
CREATE INDEX idx_documents_trip_id ON documents(trip_id);
```
