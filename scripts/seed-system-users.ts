import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const seedPassword = process.env.SEED_PASSWORD || "Admin1234!";

type SeedUser = {
  email: string;
  username: string;
  role: "artist" | "fan" | "merchant" | "influencer";
};

const USERS: SeedUser[] = [
  { email: "adminartist@checkinpurple.com", username: "adminartist", role: "artist" },
  { email: "adminfan@checkinpurple.com", username: "adminfan", role: "fan" },
  { email: "adminmerchant@checkinpurple.com", username: "adminmerchant", role: "merchant" },
  { email: "admininfluencer@checkinpurple.com", username: "admininfluencer", role: "influencer" },
];

async function ensureUser(u: SeedUser) {
  const { data: existingUser, error: existingError } = await supabase
    .from("auth.users")
    .select("id")
    .eq("email", u.email)
    .single();

  if (existingError && existingError.code !== "PGRST116") {
    throw existingError;
  }

  if (existingUser) {
    console.log("Exists:", u.email, existingUser.id);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: seedPassword,
    email_confirm: true,
    user_metadata: {
      username: u.username,
      role: u.role,
      profiles: [u.role],
      tier: "Basic",
    },
  });

  if (error) throw error;
  console.log("Created:", u.email, data.user?.id);
}

async function main() {
  console.log("Seeding system users...");
  for (const u of USERS) {
    await ensureUser(u);
  }
  console.log("Done. Password:", seedPassword);
}

main().catch((error) => {
  console.error("Failed to seed system users:", error);
  process.exit(1);
});

