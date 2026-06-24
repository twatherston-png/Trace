-- Trace Database Schema
-- Created: 2026-06-24
-- Supabase Project: https://baunrordpbmquujmjivs.supabase.co

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations (for map pins and travel log)
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city VARCHAR(255),
  country VARCHAR(255),
  visit_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Days
CREATE TABLE public.days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  UNIQUE(trip_id, date)
);

-- Activities
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID REFERENCES public.days(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  time TIME,
  location VARCHAR(255),
  notes TEXT,
  booking_reference VARCHAR(255),
  document_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_id UUID REFERENCES public.days(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  caption TEXT,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  taken_at TIMESTAMP WITH TIME ZONE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_id UUID REFERENCES public.days(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal Entries
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for activities.document_id
ALTER TABLE public.activities
ADD CONSTRAINT fk_activity_document
FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE SET NULL;

-- Add foreign key for locations.trip_id
ALTER TABLE public.locations
ADD CONSTRAINT fk_location_trip
FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_days_trip_id ON public.days(trip_id);
CREATE INDEX idx_activities_day_id ON public.activities(day_id);
CREATE INDEX idx_activities_trip_id ON public.activities(trip_id);
CREATE INDEX idx_photos_trip_id ON public.photos(trip_id);
CREATE INDEX idx_photos_day_id ON public.photos(day_id);
CREATE INDEX idx_photos_location_id ON public.photos(location_id);
CREATE INDEX idx_documents_trip_id ON public.documents(trip_id);
CREATE INDEX idx_journal_entries_trip_id ON public.journal_entries(trip_id);
CREATE INDEX idx_journal_entries_location_id ON public.journal_entries(location_id);
CREATE INDEX idx_locations_user_id ON public.locations(user_id);
CREATE INDEX idx_locations_trip_id ON public.locations(trip_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: can only see their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Trips: users can only see their own trips
CREATE POLICY "Users can view own trips" ON public.trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

-- Days: users can see days from their own trips
CREATE POLICY "Users can view days from own trips" ON public.days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create days for own trips" ON public.days
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update days for own trips" ON public.days
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete days for own trips" ON public.days
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Activities: users can see activities from their own trips
CREATE POLICY "Users can view activities from own trips" ON public.activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = activities.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activities for own trips" ON public.activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = activities.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update activities for own trips" ON public.activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = activities.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete activities for own trips" ON public.activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = activities.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Photos: users can see photos from their own trips
CREATE POLICY "Users can view photos from own trips" ON public.photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = photos.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create photos for own trips" ON public.photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = photos.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos for own trips" ON public.photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = photos.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos for own trips" ON public.photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = photos.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Documents: users can see documents from their own trips
CREATE POLICY "Users can view documents from own trips" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = documents.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents for own trips" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = documents.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents for own trips" ON public.documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = documents.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents for own trips" ON public.documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = documents.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Journal Entries: users can see journal entries from their own trips
CREATE POLICY "Users can view journal entries from own trips" ON public.journal_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = journal_entries.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create journal entries for own trips" ON public.journal_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = journal_entries.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update journal entries for own trips" ON public.journal_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = journal_entries.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete journal entries for own trips" ON public.journal_entries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = journal_entries.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Locations: users can see their own locations
CREATE POLICY "Users can view own locations" ON public.locations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own locations" ON public.locations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own locations" ON public.locations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own locations" ON public.locations
  FOR DELETE USING (user_id = auth.uid());
