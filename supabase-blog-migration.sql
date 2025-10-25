-- Blog feature migration
-- Add in_blog field to notes table

ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS in_blog boolean DEFAULT false NOT NULL;

-- Add index for blog posts
CREATE INDEX IF NOT EXISTS notes_in_blog_idx ON public.notes(in_blog) WHERE in_blog = true;

-- Update RLS policy to allow public read access to blog posts
CREATE POLICY "Anyone can view blog posts"
  ON public.notes FOR SELECT
  USING (in_blog = true);

-- Add comments
COMMENT ON COLUMN public.notes.in_blog IS 'Whether this note is published as a blog post';

