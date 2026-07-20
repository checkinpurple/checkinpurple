import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { notifyDealProposal, notifyDressingOffer } from "./notifications";

// ── Merchant: toggle "Currently available" ───────────────────────────────────
// Side-effect: when flipping false → true, insert a wall_posts row.
// wall_posts uses user_id + type (NOT author_id + post_type).
export const setMerchantAvailability: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const isAvailable = Boolean(req.body?.is_available);
  const note = (req.body?.availability_note as string | undefined) || null;

  const { data: prev } = await supabase
    .from("users")
    .select("is_available, username, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  const wasAvailable = Boolean(prev?.is_available);

  const { error } = await supabase
    .from("users")
    .update({ is_available: isAvailable, availability_note: note })
    .eq("id", userId);

  if (error) return res.status(500).json({ error: error.message });

  // Announce on Wall when becoming available (false → true only)
  if (isAvailable && !wasAvailable && prev) {
    await supabase.from("wall_posts").insert({
      user_id: userId,                                    // ← correct column
      type: "catalogue",                                  // ← correct column
      caption: note || `${prev.username || "Merchant"} is now available for orders.`,
      thumbnail_url: prev.avatar_url || null,
      metadata: { is_available: true },
    });
  }

  return res.json({ success: true, is_available: isAvailable });
};

// ── Influencer: update deal status ───────────────────────────────────────────
// On 'accepted', insert a wall_posts promo card.
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
    .select("id, artist_id, influencer_id, amount_zar, status, notes")
    .eq("id", dealId)
    .single();

  if (fetchErr || !deal) return res.status(404).json({ error: "Deal not found" });

  // Only parties to the deal can update it
  if (deal.influencer_id !== userId && deal.artist_id !== userId) {
    return res.status(403).json({ error: "Not your deal" });
  }

  const { error } = await supabase
    .from("influencer_deals")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", dealId);

  if (error) return res.status(500).json({ error: error.message });

  // On acceptance: post to Wall + notify artist
  if (status === "accepted" && deal.status !== "accepted") {
    const [{ data: inf }, { data: art }] = await Promise.all([
      supabase.from("users").select("username, avatar_url").eq("id", deal.influencer_id).maybeSingle(),
      supabase.from("users").select("username").eq("id", deal.artist_id).maybeSingle(),
    ]);

    // Wall post — correct columns
    await supabase.from("wall_posts").insert({
      user_id: deal.influencer_id,                       // ← correct column
      type: "promo",                                      // ← correct column
      caption: `@${inf?.username || "Influencer"} just partnered with @${art?.username || "an artist"} 🎵`,
      thumbnail_url: inf?.avatar_url || null,
      metadata: { deal_id: dealId, artist_id: deal.artist_id },
    });

    // Notify artist that deal was accepted
    if (deal.artist_id) {
      try {
        await supabase.from("notifications").insert({
          user_id: deal.artist_id,
          type: "deal_accepted",
          title: "Promotion deal accepted!",
          message: `@${inf?.username || "Influencer"} accepted your promotion deal`,
          action_url: "/influencer",
          read: false,
        });
      } catch {}
    }
  }

  return res.json({ success: true, status });
};

// ── Collab invite ────────────────────────────────────────────────────────────
export const createCollabInvite: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { collaborator_id } = req.body;
  if (!collaborator_id) return res.status(400).json({ error: "collaborator_id required" });

  const { data, error } = await supabase
    .from("artist_collaborators")
    .insert({ artist_id: userId, collaborator_id, status: "pending" })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Notify collaborator
  try {
    const { data: me } = await supabase.from("users").select("username").eq("id", userId).single();
    await notifyCollabInviteHelper(collaborator_id, me?.username || "An artist");
  } catch {}

  return res.json({ success: true, collab: data });
};

export const updateCollabStatus: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.params;
  const { status } = req.body;

  if (!["accepted", "declined"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const { data, error } = await supabase
    .from("artist_collaborators")
    .update({ status })
    .eq("id", id)
    .eq("collaborator_id", userId) // only the recipient can accept/decline
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true, collab: data });
};

// ── Dressing request ─────────────────────────────────────────────────────────
export const createDressingRequest: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { artist_id, note } = req.body;
  if (!artist_id) return res.status(400).json({ error: "artist_id required" });

  const { data, error } = await supabase
    .from("dressing_requests")
    .insert({ merchant_id: userId, artist_id, note: note || null, status: "pending" })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Notify artist
  try {
    const { data: me } = await supabase.from("users").select("username").eq("id", userId).single();
    await notifyDressingOffer(artist_id, me?.username || "A merchant");
  } catch {}

  return res.json({ success: true, request: data });
};

export const updateDressingStatus: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.params;
  const { status } = req.body;

  if (!["accepted", "declined"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const { data, error } = await supabase
    .from("dressing_requests")
    .update({ status })
    .eq("id", id)
    .eq("artist_id", userId) // only the artist can respond
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true, request: data });
};

// Helper (avoids circular import)
async function notifyCollabInviteHelper(collaboratorId: string, artistUsername: string) {
  await supabase.from("notifications").insert({
    user_id: collaboratorId,
    type: "collab_invite",
    title: "Collaboration invite",
    message: `@${artistUsername} wants to collaborate with you`,
    action_url: `/artist/${artistUsername}`,
    read: false,
  });
}
