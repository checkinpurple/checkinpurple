import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";

// Toggle merchant "Currently available" flag. Side-effect: when flipping
// from false -> true, insert a wall_posts row so followers see the drop.
export const setMerchantAvailability: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const isAvailable = Boolean(req.body?.is_available);
  const note = (req.body?.availability_note as string | undefined) || null;

  const { data: prev } = await supabase
    .from("users")
    .select("is_available, username, avatar_url, is_verified")
    .eq("id", userId)
    .maybeSingle();

  const wasAvailable = Boolean(prev?.is_available);

  const { error } = await supabase
    .from("users")
    .update({ is_available: isAvailable, availability_note: note })
    .eq("id", userId);

  if (error) return res.status(500).json({ error: error.message });

  // Side-effect: announce on the wall when becoming available
  if (isAvailable && !wasAvailable && prev) {
    await supabase.from("wall_posts").insert({
      user_id: userId,
      
      type: "catalogue",
      caption: note || `${prev.username || "Merchant"} is now available for orders.`,
      thumbnail_url: prev.avatar_url || null,
    });
  }

  return res.json({ success: true, is_available: isAvailable });
};

// Update an influencer deal status. On 'accepted', insert a wall post so
// fans see the partnership announcement.
export const setDealStatus: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const dealId = req.params.id;
  const status = req.body?.status as string | undefined;
  if (!dealId || !status) return res.status(400).json({ error: "id and status required" });
  if (!["accepted", "declined", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const { data: deal, error: fetchErr } = await supabase
    .from("influencer_deals")
    .select("id, artist_id, influencer_id, amount_zar, status")
    .eq("id", dealId)
    .single();
  if (fetchErr || !deal) return res.status(404).json({ error: "Deal not found" });

  // Only the influencer party can accept/decline incoming deals
  if (deal.influencer_id !== userId && deal.artist_id !== userId) {
    return res.status(403).json({ error: "Not your deal" });
  }

  const { error } = await supabase
    .from("influencer_deals")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", dealId);
  if (error) return res.status(500).json({ error: error.message });

  if (status === "accepted" && deal.status !== "accepted") {
    const [{ data: inf }, { data: art }] = await Promise.all([
      supabase.from("users").select("username, avatar_url").eq("id", deal.influencer_id).maybeSingle(),
      supabase.from("users").select("username").eq("id", deal.artist_id).maybeSingle(),
    ]);
    await supabase.from("wall_posts").insert({
      user_id: deal.influencer_id,
      
      type: "promo",
      caption: `${inf?.username || "Influencer"} just teamed up with ${art?.username || "an artist"}.`,
      thumbnail_url: inf?.avatar_url || null,
    });
  }

  return res.json({ success: true, status });
};
