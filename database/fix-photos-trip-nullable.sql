-- Make trip_id nullable on photos table
-- This allows photos to exist without being assigned to a trip

ALTER TABLE public.photos ALTER COLUMN trip_id DROP NOT NULL;

-- Update RLS policies to allow photos without trip_id
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view photos from own trips" ON public.photos;
DROP POLICY IF EXISTS "Users can create photos for own trips" ON public.photos;
DROP POLICY IF EXISTS "Users can update photos for own trips" ON public.photos;
DROP POLICY IF EXISTS "Users can delete photos for own trips" ON public.photos;

-- Recreate policies that allow photos with or without trip_id
CREATE POLICY "Users can view own photos" ON public.photos
  FOR SELECT USING (
    trip_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = photos.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own photos" ON public.photos
  FOR INSERT WITH CHECK (
    trip_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = photos.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own photos" ON public.photos
  FOR UPDATE USING (
    trip_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = photos.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own photos" ON public.photos
  FOR DELETE USING (
    trip_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = photos.trip_id
      AND trips.user_id = auth.uid()
    )
  );
