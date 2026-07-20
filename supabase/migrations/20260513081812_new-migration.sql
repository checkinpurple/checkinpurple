

-- Note: JWT secret must be configured in the Supabase Project Settings (Settings → API → JWT secret). Do not set it via migrations.
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR NOT NULL,
  username VARCHAR UNIQUE NOT NULL,
  role VARCHAR CHECK (role IN ('artist', 'fan', 'artist_fan', 'admin')) NOT NULL,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Streams table
CREATE TABLE streams (
  id VARCHAR PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR CHECK (status IN ('live', 'ended')) DEFAULT 'live',
  listener_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  livepeer_stream_id VARCHAR UNIQUE,
  livepeer_playback_id VARCHAR UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on streams
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;

-- Anyone can view live streams
CREATE POLICY "Anyone can view live streams" ON streams
  FOR SELECT USING (status = 'live');

-- Artists can create streams
CREATE POLICY "Artists can create streams" ON streams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Artists can update their own streams
CREATE POLICY "Artists can update own streams" ON streams
  FOR UPDATE USING (auth.uid() = user_id);

-- Artists can delete their own streams
CREATE POLICY "Artists can delete own streams" ON streams
  FOR DELETE USING (auth.uid() = user_id);

-- Tracks table (for future use)
CREATE TABLE tracks (
  id VARCHAR PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tracks
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Artists can manage their own tracks
CREATE POLICY "Artists can manage own tracks" ON tracks
  FOR ALL USING (auth.uid() = user_id);

-- Follows table (social feature)
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, followed_id)
);

-- Enable RLS on follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users can view follows involving themselves
CREATE POLICY "Users can view own follows" ON follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = followed_id);

-- Users can follow others
CREATE POLICY "Users can follow" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Likes table (social feature)
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stream_id VARCHAR NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, stream_id)
);

-- Enable RLS on likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes
CREATE POLICY "Anyone can view likes" ON likes
  FOR SELECT USING (true);

-- Users can like streams
CREATE POLICY "Users can like streams" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unlike
CREATE POLICY "Users can unlike" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Comments table (social feature)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stream_id VARCHAR NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments on live streams
CREATE POLICY "Anyone can view comments on live streams" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM streams
      WHERE streams.id = comments.stream_id AND streams.status = 'live'
    )
  );

-- Users can comment on live streams
CREATE POLICY "Users can comment on live streams" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM streams
      WHERE streams.id = stream_id AND streams.status = 'live'
    )
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Only service role can insert analytics events (for security)
CREATE POLICY "Service role can insert analytics" ON analytics_events
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own analytics (if needed)
CREATE POLICY "Users can view own analytics" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

-- Subscription tiers table
CREATE TABLE subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  track_limit INTEGER,
  features JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on subscription_tiers
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Anyone can view subscription tiers
CREATE POLICY "Anyone can view subscription tiers" ON subscription_tiers
  FOR SELECT USING (true);

-- User subscriptions table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id) ON DELETE CASCADE,
  status VARCHAR CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- One active subscription per user
);

-- Enable RLS on user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own subscriptions
CREATE POLICY "Users can manage own subscriptions" ON user_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Payment methods table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR CHECK (type IN ('paypal', 'fatpay', 'stripe', 'other')) NOT NULL,
  url VARCHAR, -- For PayPal personal URL or other links
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Anyone can view active payment methods
CREATE POLICY "Anyone can view active payment methods" ON payment_methods
  FOR SELECT USING (is_active = true);

-- Coins store table
CREATE TABLE coin_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  coin_amount INTEGER NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on coin_packages
ALTER TABLE coin_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active coin packages
CREATE POLICY "Anyone can view coin packages" ON coin_packages
  FOR SELECT USING (is_active = true);

-- User coin balance table
CREATE TABLE user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on user_coins
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;

-- Users can view their own coin balance
CREATE POLICY "Users can view own coin balance" ON user_coins
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own coin balance (for spending)
CREATE POLICY "Users can update own coin balance" ON user_coins
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  chosen_role VARCHAR := COALESCE(NEW.raw_user_meta_data->>'role', 'fan');
BEGIN
  INSERT INTO public.users (id, email, username, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    chosen_role,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.user_coins (user_id, balance, total_earned, total_spent)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  IF chosen_role = 'artist_fan' THEN
    INSERT INTO public.user_subscriptions (user_id, tier_id, status, current_period_start, current_period_end)
    SELECT NEW.id, id, 'active', NOW(), NOW() + INTERVAL '1 month'
    FROM public.subscription_tiers
    WHERE name = 'Standard'
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Coin transactions table
CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR CHECK (transaction_type IN ('purchase', 'tip', 'bonus', 'refund')) NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  reference_id UUID, -- Can reference streams, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on coin_transactions
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON coin_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert transactions
CREATE POLICY "Service role can insert transactions" ON coin_transactions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Scheduled releases table (for Standard tier)
CREATE TABLE scheduled_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  release_date TIMESTAMP WITH TIME ZONE NOT NULL,
  price_coins INTEGER DEFAULT 0,
  max_bookings INTEGER,
  current_bookings INTEGER DEFAULT 0,
  status VARCHAR CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')) DEFAULT 'scheduled',
  stream_id VARCHAR REFERENCES streams(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on scheduled_releases
ALTER TABLE scheduled_releases ENABLE ROW LEVEL SECURITY;

-- Artists can manage their own releases
CREATE POLICY "Artists can manage own releases" ON scheduled_releases
  FOR ALL USING (auth.uid() = user_id);

-- Anyone can view scheduled releases
CREATE POLICY "Anyone can view scheduled releases" ON scheduled_releases
  FOR SELECT USING (status = 'scheduled');

-- Bookings table for scheduled releases
CREATE TABLE release_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES scheduled_releases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR CHECK (status IN ('confirmed', 'cancelled', 'attended')) DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(release_id, user_id)
);

-- Enable RLS on release_bookings
ALTER TABLE release_bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON release_bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Artists can view bookings for their releases
CREATE POLICY "Artists can view bookings for their releases" ON release_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scheduled_releases
      WHERE scheduled_releases.id = release_bookings.release_id
      AND scheduled_releases.user_id = auth.uid()
    )
  );

-- Users can create bookings
CREATE POLICY "Users can create bookings" ON release_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own bookings
CREATE POLICY "Users can cancel own bookings" ON release_bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Tips table
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stream_id VARCHAR REFERENCES streams(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tips
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- Anyone can view tips (public)
CREATE POLICY "Anyone can view tips" ON tips
  FOR SELECT USING (true);

-- Users can create tips
CREATE POLICY "Users can create tips" ON tips
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Insert default subscription tiers
INSERT INTO subscription_tiers (name, description, price_monthly, track_limit, features) VALUES
('Basic', 'Create and stream live audio content - Limited to 10 tracks', 0.00, 10, '{"live_streaming": true, "basic_analytics": true, "track_limit": 10}'),
('Standard', 'Everything in Basic plus scheduled releases and bookings - Unlimited tracks', 19.99, NULL, '{"live_streaming": true, "scheduled_releases": true, "bookings": true, "advanced_analytics": true, "unlimited_tracks": true}');

-- Insert default coin packages
INSERT INTO coin_packages (name, description, coin_amount, price_usd) VALUES
('Starter Pack', 'Perfect for trying out tipping', 100, 4.99),
('Popular Pack', 'Most popular choice', 250, 9.99),
('Pro Pack', 'For dedicated fans', 500, 17.99),
('VIP Pack', 'Show your ultimate support', 1000, 29.99);

-- Payment methods
INSERT INTO payment_methods (name, type, url, is_active) VALUES
('PayPal', 'paypal', 'https://www.paypal.com/paypalme/yourusername', true),
('FatPay', 'fatpay', 'https://fatpay.com/payment', true);

-- Function to initialize user coin balance
CREATE OR REPLACE FUNCTION public.initialize_user_coins()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_coins (user_id, balance, total_earned, total_spent)
  VALUES (NEW.id, 0, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create coin balance on user creation
CREATE TRIGGER on_user_created_coins
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_coins();

-- Function to increment user coins
CREATE OR REPLACE FUNCTION public.increment_user_coins(user_id UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  INSERT INTO user_coins (user_id, balance, total_earned)
  VALUES (user_id, amount, amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = user_coins.balance + amount,
    total_earned = user_coins.total_earned + amount,
    updated_at = NOW()
  RETURNING balance INTO new_balance;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement user coins
CREATE OR REPLACE FUNCTION public.decrement_user_coins(user_id UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE user_coins
  SET balance = balance - amount,
      total_spent = total_spent + amount,
      updated_at = NOW()
  WHERE user_id = user_id AND balance >= amount
  RETURNING balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to transfer coins between users
CREATE OR REPLACE FUNCTION public.transfer_coins(from_user_id UUID, to_user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Decrement from sender
  PERFORM decrement_user_coins(from_user_id, amount);

  -- Increment for receiver
  PERFORM increment_user_coins(to_user_id, amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;