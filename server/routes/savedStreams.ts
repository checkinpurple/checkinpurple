import { Request, Response } from "express";
import { supabase } from "../lib/supabase";

export const getSavedStreams = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabase
      .from("saved_streams")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, streams: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const saveStream = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { livepeer_playback_id, title, duration_seconds, visibility } = req.body;
    if (!livepeer_playback_id) return res.status(400).json({ error: "livepeer_playback_id required" });

    const { data, error } = await supabase
      .from("saved_streams")
      .insert({
        user_id: userId,
        livepeer_playback_id,
        title: title || "Untitled Stream",
        duration_seconds: duration_seconds || null,
        visibility: visibility || "public",
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, stream: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSavedStream = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { title, visibility } = req.body;
    const { data, error } = await supabase
      .from("saved_streams")
      .update({ title, visibility })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, stream: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSavedStream = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await supabase.from("saved_streams").delete().eq("id", id).eq("user_id", userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getPublicSavedStreams = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user?.id;

    let query = supabase
      .from("saved_streams")
      .select("*, users!saved_streams_user_id_fkey(username, avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // If viewer is not the owner, filter by visibility
    if (viewerId !== userId) {
      // Check if viewer follows this artist
      const { data: followData } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", viewerId || "")
        .eq("following_id", userId)
        .single();

      const isFollower = !!followData;
      if (isFollower) {
        query = query.in("visibility", ["public", "followers"]);
      } else {
        query = query.eq("visibility", "public");
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, streams: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
