import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase URL or Key is missing. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseServiceKey || 'public-anon-key');

export type DatabaseStream = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'live' | 'ended';
  listener_count: number;
  started_at: string;
  ended_at?: string;
  mux_stream_id?: string;
  mux_playback_id?: string;
};
