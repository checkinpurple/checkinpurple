CREATE TABLE IF NOT EXISTS public.wall_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('reel','snippet','promo','catalogue','stream','gig')),
  caption text,
  media_url text,
  thumbnail_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wall_posts_created_at ON public.wall_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wall_posts_type ON public.wall_posts(type);
