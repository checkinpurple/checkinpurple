import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { ProfileType } from "@shared/api";

const ALLOWED_PROFILES: ProfileType[] = ["fan", "artist", "merchant", "influencer"];

async function getProfileLimitForUser(userId: string): Promise<number> {
  const { data: user } = await supabase.from("users").select("role").eq("id", userId).single();
  if (user?.role === "admin") return 999;

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("subscription_tiers!inner(profile_limit)")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  const limit = (subscription?.subscription_tiers as any)?.profile_limit;
  return typeof limit === "number" && limit > 0 ? limit : 1;
}

async function userHasProfile(userId: string, profileType: ProfileType): Promise<boolean> {
  const { data } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("profile_type", profileType)
    .maybeSingle();
  return Boolean(data);
}

export const getMyProfiles: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [{ data: profiles, error: profilesError }, { data: user, error: userError }] = await Promise.all([
      supabase.from("user_profiles").select("profile_type").eq("user_id", userId).order("created_at"),
      supabase.from("users").select("role").eq("id", userId).single(),
    ]);

    if (profilesError) throw profilesError;
    if (userError) throw userError;

    const profileLimit = await getProfileLimitForUser(userId);

    res.json({
      active_profile: user.role,
      profiles: (profiles || []).map((p: any) => p.profile_type),
      profile_limit: profileLimit,
    });
  } catch (error) {
    console.error("Error getting profiles:", error);
    res.status(500).json({ error: "Failed to get profiles" });
  }
};

export const addProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const profile_type = req.body?.profile_type as ProfileType | undefined;
    if (!profile_type || !ALLOWED_PROFILES.includes(profile_type)) {
      return res.status(400).json({ error: "Invalid profile_type" });
    }

    const profileLimit = await getProfileLimitForUser(userId);
    const { count } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (typeof count === "number" && count >= profileLimit) {
      return res.status(403).json({ error: `Profile limit reached (${profileLimit}). Upgrade your plan to add more profiles.` });
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .insert({ user_id: userId, profile_type })
      .select("*")
      .single();

    if (error) {
      if ((error as any).code === "23505") {
        return res.status(409).json({ error: "Profile already exists for this user" });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error("Error adding profile:", error);
    res.status(500).json({ error: "Failed to add profile" });
  }
};

export const switchActiveProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const profile_type = req.body?.profile_type as ProfileType | undefined;
    if (!profile_type || !ALLOWED_PROFILES.includes(profile_type)) {
      return res.status(400).json({ error: "Invalid profile_type" });
    }

    const hasProfile = await userHasProfile(userId, profile_type);
    if (!hasProfile) return res.status(403).json({ error: "Profile not enabled for this user" });

    const { data, error } = await supabase
      .from("users")
      .update({ role: profile_type })
      .eq("id", userId)
      .select("id, role")
      .single();

    if (error) throw error;
    res.json({ success: true, user: data });
  } catch (error) {
    console.error("Error switching active profile:", error);
    res.status(500).json({ error: "Failed to switch profile" });
  }
};

