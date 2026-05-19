-- Multi-profile accounts + artist booking + events + tier profile limits

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('artist', 'fan', 'merchant', 'influencer', 'artist_fan', 'admin'));

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_type VARCHAR CHECK (profile_type IN ('fan', 'artist', 'merchant', 'influencer')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, profile_type)
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profiles" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles" ON public.user_profiles
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.artist_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  genre TEXT NOT NULL,
  explicit_content BOOLEAN NOT NULL DEFAULT false,
  is_dj BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artist profiles" ON public.artist_profiles
  FOR SELECT USING (true);

CREATE POLICY "Artists can manage own artist profile" ON public.artist_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.artist_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.artist_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artist events" ON public.artist_events
  FOR SELECT USING (true);

CREATE POLICY "Artists can manage own events" ON public.artist_events
  FOR ALL USING (auth.uid() = artist_id) WITH CHECK (auth.uid() = artist_id);

CREATE TABLE IF NOT EXISTS public.artist_booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_date TIMESTAMP WITH TIME ZONE,
  message TEXT,
  status VARCHAR CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.artist_booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own booking requests" ON public.artist_booking_requests
  FOR SELECT USING (auth.uid() = fan_id OR auth.uid() = artist_id);

CREATE POLICY "Fans can create booking requests" ON public.artist_booking_requests
  FOR INSERT WITH CHECK (auth.uid() = fan_id);

CREATE POLICY "Artists can update booking requests" ON public.artist_booking_requests
  FOR UPDATE USING (auth.uid() = artist_id);

ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS profile_limit INTEGER NOT NULL DEFAULT 1;

UPDATE public.subscription_tiers
SET profile_limit = 1
WHERE name = 'Basic';

UPDATE public.subscription_tiers
SET profile_limit = 2
WHERE name = 'Standard';

INSERT INTO public.subscription_tiers (name, description, price_monthly, track_limit, features, profile_limit)
VALUES (
  'Premium',
  'All profiles unlocked plus everything in Standard',
  49.99,
  NULL,
  '{"live_streaming": true, "scheduled_releases": true, "bookings": true, "advanced_analytics": true, "unlimited_tracks": true, "all_profiles": true}',
  4
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  track_limit = EXCLUDED.track_limit,
  features = EXCLUDED.features,
  profile_limit = EXCLUDED.profile_limit;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  chosen_role VARCHAR := COALESCE(NEW.raw_user_meta_data->>'role', 'fan');
  profiles_json JSONB := NEW.raw_user_meta_data->'profiles';
  profile_text TEXT;
  tier_name TEXT := COALESCE(NEW.raw_user_meta_data->>'tier', 'Basic');
BEGIN
  INSERT INTO public.users (id, email, username, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    chosen_role,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_coins (user_id, balance, total_earned, total_spent)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  IF chosen_role = 'artist_fan' AND (profiles_json IS NULL OR jsonb_typeof(profiles_json) <> 'array') THEN
    profiles_json := '["artist","fan"]'::jsonb;
  END IF;

  IF chosen_role = 'artist_fan' AND tier_name = 'Basic' THEN
    tier_name := 'Standard';
  END IF;

  IF profiles_json IS NULL OR jsonb_typeof(profiles_json) <> 'array' THEN
    profiles_json := jsonb_build_array(chosen_role);
  END IF;

  FOR profile_text IN SELECT jsonb_array_elements_text(profiles_json) LOOP
    IF profile_text IN ('fan', 'artist', 'merchant', 'influencer') THEN
      INSERT INTO public.user_profiles (user_id, profile_type)
      VALUES (NEW.id, profile_text)
      ON CONFLICT (user_id, profile_type) DO NOTHING;
    END IF;
  END LOOP;

  IF tier_name IN ('Standard', 'Premium') THEN
    INSERT INTO public.user_subscriptions (user_id, tier_id, status, current_period_start, current_period_end)
    SELECT NEW.id, id, 'active', NOW(), NOW() + INTERVAL '1 month'
    FROM public.subscription_tiers
    WHERE name = tier_name
    LIMIT 1
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
