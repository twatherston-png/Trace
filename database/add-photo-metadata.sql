-- Add metadata fields to photos table
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS taken_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS journal_entry TEXT,
ADD COLUMN IF NOT EXISTS day_id UUID REFERENCES public.days(id) ON DELETE SET NULL;

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON public.photos(taken_at);
CREATE INDEX IF NOT EXISTS idx_photos_day_id ON public.photos(day_id);

-- Enable RLS if not already enabled
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can view own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON public.photos;

-- Create RLS policies
CREATE POLICY "Users can view own photos"
ON public.photos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos"
ON public.photos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos"
ON public.photos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos"
ON public.photos
FOR DELETE
USING (auth.uid() = user_id);
