-- Add opportunity_id column to posts table
ALTER TABLE public.posts 
ADD COLUMN opportunity_id uuid;

-- Add foreign key constraint
ALTER TABLE public.posts 
ADD CONSTRAINT posts_opportunity_id_fkey 
FOREIGN KEY (opportunity_id) 
REFERENCES public.opportunities(id) 
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS posts_opportunity_id_idx 
ON public.posts(opportunity_id);
