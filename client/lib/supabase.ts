import { createClient } from '@supabase/supabase-js';
import type { ProfileType } from '@shared/api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseAnonKey || 'public-anon-key');

export type User = {
  id: string;
  email: string;
  username: string;
  role: 'artist' | 'fan' | 'merchant' | 'influencer' | 'artist_fan' | 'admin';
  profiles?: ProfileType[];
  tier?: 'Basic' | 'Standard' | 'Premium';
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  is_verified?: boolean;
  created_at: string;
};

export type Stream = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'live' | 'ended';
  listener_count: number;
  started_at: string;
  ended_at?: string;
  livepeer_stream_id?: string;
  livepeer_playback_id?: string;
};

export type Track = {
  id: string;
  user_id: string;
  title: string;
  duration: number;
  created_at: string;
};
