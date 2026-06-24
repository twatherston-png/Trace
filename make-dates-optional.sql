-- Make dates optional for trips
ALTER TABLE public.trips ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE public.trips ALTER COLUMN end_date DROP NOT NULL;

-- Make dates optional for journal entries
ALTER TABLE public.journal_entries ALTER COLUMN date DROP NOT NULL;
