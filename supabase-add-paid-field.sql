-- Add paid field to opportunities table
-- This script adds a boolean field to track whether opportunities are paid or unpaid

-- Add the paid column to the opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN paid boolean DEFAULT false;

-- Update existing opportunities to have a default value
UPDATE public.opportunities 
SET paid = false 
WHERE paid IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE public.opportunities 
ALTER COLUMN paid SET NOT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN public.opportunities.paid IS 'Indicates whether the opportunity is paid (true) or unpaid (false)';

-- Success message
SELECT 'Successfully added paid field to opportunities table. All existing opportunities are set to unpaid by default.' as status;