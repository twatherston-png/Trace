-- Add itinerary fields to activities table
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS activity_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS transport_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS flight_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(10);

-- Add date to journal_entries if it doesn't exist
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS day_id UUID REFERENCES public.days(id) ON DELETE SET NULL;

-- Create index for activity_type
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);
