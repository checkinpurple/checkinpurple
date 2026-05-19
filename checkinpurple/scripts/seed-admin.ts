import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@soundsync.test';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminRole = 'admin';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  console.log('Seeding admin user:', adminEmail);

  const { data: existingUser, error: existingError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', adminEmail)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError;
  }

  if (existingUser) {
    console.log('Admin user already exists with id:', existingUser.id);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      username: adminUsername,
      role: adminRole,
    },
  });

  if (error) {
    throw error;
  }

  console.log('Admin user seeded successfully:', data.user?.id);
  console.log('Login with:', adminEmail, adminPassword);
}

main().catch((error) => {
  console.error('Failed to seed admin user:', error);
  process.exit(1);
});
