import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";

async function ensureAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabase.from("users").select("role").eq("id", userId).single();
  if (error) return false;
  return data.role === "admin";
}

export const listUsers: RequestHandler = async (req, res) => {
  try {
    const ok = await ensureAdmin(req.user?.id);
    if (!ok) return res.status(403).json({ error: "Forbidden" });

    // List auth users from Supabase so the count includes every registered account.
    const authUsers: any[] = [];
    let page = 1;
    let totalUsers = 0;

    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000, page });
      if (error) throw error;
      if (!data?.users?.length) break;

      authUsers.push(...data.users);
      const typedData = data as any;
      totalUsers = typedData.total ?? authUsers.length;
      if (data.users.length < 1000) break;
      page += 1;
    }

    // Get profile rows for extra fields (role, username, is_verified, is_banned)
    const { data: profileData } = await supabase
      .from("users")
      .select("id,email,username,role,is_verified,is_banned,created_at")
      .order("created_at", { ascending: false });

    const profileMap = new Map((profileData || []).map((u: any) => [u.id, u]));

    // Merge: every auth user gets a row, with profile data if it exists
    const merged = authUsers.map((au: any) => {
      const profile = profileMap.get(au.id);
      return {
        id: au.id,
        email: au.email || profile?.email || "",
        username: profile?.username || au.user_metadata?.username || au.email?.split("@")[0] || "—",
        role: profile?.role || au.user_metadata?.role || "fan",
        is_verified: profile?.is_verified || false,
        is_banned: profile?.is_banned || false,
        created_at: au.created_at,
        has_profile: !!profile,
      };
    });

    res.json({ users: merged, total: totalUsers || merged.length });
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({ error: "Failed to list users" });
  }
};

export const updateUserRole: RequestHandler = async (req, res) => {
  try {
    const ok = await ensureAdmin(req.user?.id);
    if (!ok) return res.status(403).json({ error: "Forbidden" });

    const userId = req.params.userId;
    const role = req.body?.role as string | undefined;
    if (!userId || !role) return res.status(400).json({ error: "userId and role required" });

    const allowed = ["artist", "fan", "merchant", "influencer", "artist_fan", "admin"];
    if (!allowed.includes(role)) return res.status(400).json({ error: "Invalid role" });

    const { data, error } = await supabase.from("users").update({ role }).eq("id", userId).select("*").single();
    if (error) throw error;
    res.json({ success: true, user: data });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
};

export const setUserBanned: RequestHandler = async (req, res) => {
  try {
    const ok = await ensureAdmin(req.user?.id);
    if (!ok) return res.status(403).json({ error: "Forbidden" });

    const userId = req.params.userId;
    const banned = Boolean(req.body?.banned);
    if (!userId) return res.status(400).json({ error: "userId required" });

    const { data, error } = await supabase
      .from("users")
      .update({ is_banned: banned })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) throw error;
    res.json({ success: true, user: data });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ error: "Failed to update ban" });
  }
};

export const listSubmissions: RequestHandler = async (req, res) => {
  const ok = await ensureAdmin(req.user?.id);
  if (!ok) return res.status(403).json({ error: "Forbidden" });
  res.json({ submissions: [] });
};

