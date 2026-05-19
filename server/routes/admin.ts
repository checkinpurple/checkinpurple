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

    const { data, error } = await supabase
      .from("users")
      .select("id,email,username,role,is_verified,is_banned,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ users: data || [] });
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

