-- Add location field to days table for route mapping
ALTER TABLE public.days
ADD COLUMN IF NOT EXISTS location TEXT;
