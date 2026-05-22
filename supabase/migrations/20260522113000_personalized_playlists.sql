CREATE TABLE IF NOT EXISTS public.artist_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text,
  target_type text NOT NULL CHECK (target_type IN ('individual','group')),
  target_user_ids uuid[] DEFAULT '{}',
  booking_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.artist_playlist_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES public.artist_playlists(id) ON DELETE CASCADE,
  track_title text NOT NULL,
  artist_name text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.artist_playlist_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  extra_slots int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
