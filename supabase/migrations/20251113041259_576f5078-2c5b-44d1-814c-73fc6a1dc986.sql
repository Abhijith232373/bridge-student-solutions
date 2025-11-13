-- Add priority/urgency field to problems table
ALTER TABLE public.problems 
ADD COLUMN is_urgent boolean NOT NULL DEFAULT false;

-- Add index for faster queries on urgent problems
CREATE INDEX idx_problems_urgent ON public.problems(is_urgent) WHERE is_urgent = true;

-- Add comment for documentation
COMMENT ON COLUMN public.problems.is_urgent IS 'Indicates if the problem requires immediate attention';