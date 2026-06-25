-- Add pinned_locations table for manual map pins
CREATE TABLE IF NOT EXISTS public.pinned_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_id UUID REFERENCES public.days(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pinned_locations_trip ON public.pinned_locations(trip_id);
