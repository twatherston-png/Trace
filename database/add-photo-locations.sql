-- Create photo_locations table for caching geocoded photo locations
CREATE TABLE IF NOT EXISTS public.photo_locations (
  photo_id UUID PRIMARY KEY REFERENCES public.photos(id) ON DELETE CASCADE,
  city VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.photo_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own photo locations
CREATE POLICY "Users can view own photo locations" ON public.photo_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.photos
      WHERE photos.id = photo_locations.photo_id
      AND photos.trip_id IN (
        SELECT id FROM public.trips WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create own photo locations" ON public.photo_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.photos
      WHERE photos.id = photo_locations.photo_id
      AND photos.trip_id IN (
        SELECT id FROM public.trips WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own photo locations" ON public.photo_locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.photos
      WHERE photos.id = photo_locations.photo_id
      AND photos.trip_id IN (
        SELECT id FROM public.trips WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own photo locations" ON public.photo_locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.photos
      WHERE photos.id = photo_locations.photo_id
      AND photos.trip_id IN (
        SELECT id FROM public.trips WHERE user_id = auth.uid()
      )
    )
  );

-- Index for performance
CREATE INDEX idx_photo_locations_city_country ON public.photo_locations(city, country);
