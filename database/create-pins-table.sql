-- Create pins table for standalone location markers
CREATE TABLE IF NOT EXISTS public.pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Users can view own pins" ON public.pins;
DROP POLICY IF EXISTS "Users can insert own pins" ON public.pins;
DROP POLICY IF EXISTS "Users can update own pins" ON public.pins;
DROP POLICY IF EXISTS "Users can delete own pins" ON public.pins;

-- Users can view their own pins
CREATE POLICY "Users can view own pins"
  ON public.pins
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own pins
CREATE POLICY "Users can insert own pins"
  ON public.pins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pins
CREATE POLICY "Users can update own pins"
  ON public.pins
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own pins
CREATE POLICY "Users can delete own pins"
  ON public.pins
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_pins_user_id ON public.pins(user_id);
CREATE INDEX IF NOT EXISTS idx_pins_date ON public.pins(date);
