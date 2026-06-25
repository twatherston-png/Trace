-- Add ideas/additional notes field to days table
ALTER TABLE public.days
ADD COLUMN IF NOT EXISTS ideas TEXT;
