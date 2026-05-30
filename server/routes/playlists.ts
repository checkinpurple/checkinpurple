import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";

async function getPlaylistLimit(artistId: string): Promise<number> {
  const [{ data: sub }, { data: slots }] = await Promise.all([
    supabase
      .from("user_subscriptions")
      .select("subscription_tiers!inner(name)")
      .eq("user_id", artistId)
      .eq("status", "active")
      .maybeSingle(),
    supabase.from("artist_playlist_slots").select("extra_slots").eq("artist_id", artistId).maybeSingle(),
  ]);

  const tierName = (sub?.subscription_tiers as any)?.name as string | undefined;
  const base = tierName === "Premium" ? 999 : 3;
  return base + (slots?.extra_slots || 0);
}

export const listMyPlaylists: RequestHandler = async (req, res) => {
  const artistId = req.user?.id;
  if (!artistId) return res.status(401).json({ error: "Unauthorized" });

  const { data, error } = await supabase
    .from("artist_playlists")
    .select("*, artist_playlist_tracks(*)")
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Failed to fetch playlists" });
  const limit = await getPlaylistLimit(artistId);
  return res.json({ playlists: data || [], limit });
};

export const createPlaylist: RequestHandler = async (req, res) => {
  const artistId = req.user?.id;
  if (!artistId) return res.status(401).json({ error: "Unauthorized" });

  const { title, notes, target_type, target_user_ids, tracks, booking_id } = req.body || {};
  if (!title || !target_type) return res.status(400).json({ error: "title and target_type required" });

  const { count } = await supabase.from("artist_playlists").select("*", { count: "exact", head: true }).eq("artist_id", artistId);
  const limit = await getPlaylistLimit(artistId);
  if ((count || 0) >= limit) return res.status(403).json({ error: `Playlist limit reached (${limit}). Buy extra playlist slots in Store.` });

  const { data: playlist, error } = await supabase
    .from("artist_playlists")
    .insert({ artist_id: artistId, title, notes: notes || null, target_type, target_user_ids: target_user_ids || [], booking_id: booking_id || null })
    .select("*")
    .single();

  if (error || !playlist) return res.status(500).json({ error: "Failed to create playlist" });

  const trackRows = Array.isArray(tracks) ? tracks : [];
  if (trackRows.length > 0) {
    await supabase.from("artist_playlist_tracks").insert(
      trackRows.map((t: any, idx: number) => ({ playlist_id: playlist.id, track_title: t.track_title, artist_name: t.artist_name || null, sort_order: idx })),
    );
  }

  return res.json({ success: true, playlistId: playlist.id });
};

export const deletePlaylist: RequestHandler = async (req, res) => {
  const artistId = req.user?.id;
  if (!artistId) return res.status(401).json({ error: "Unauthorized" });
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });

  // Ensure ownership
  const { data: pl } = await supabase.from("artist_playlists").select("artist_id").eq("id", id).maybeSingle();
  if (!pl) return res.status(404).json({ error: "Playlist not found" });
  if (pl.artist_id !== artistId) return res.status(403).json({ error: "Not your playlist" });

  // tracks have ON DELETE CASCADE in the suggested schema; delete anyway in case it's missing
  await supabase.from("artist_playlist_tracks").delete().eq("playlist_id", id);
  const { error } = await supabase.from("artist_playlists").delete().eq("id", id);
  if (error) return res.status(500).json({ error: "Failed to delete playlist" });
  return res.json({ success: true });
};

export const buyPlaylistSlotWithCoins: RequestHandler = async (req, res) => {
  const artistId = req.user?.id;
  if (!artistId) return res.status(401).json({ error: "Unauthorized" });

  const SLOT_COST = 300;
  const { data: wallet } = await supabase.from("user_coins").select("balance").eq("user_id", artistId).maybeSingle();
  if (!wallet || wallet.balance < SLOT_COST) return res.status(400).json({ error: `Need ${SLOT_COST} coins to buy 1 playlist slot` });

  await supabase.rpc("decrement_user_coins", { user_id: artistId, amount: SLOT_COST });
  await supabase.from("coin_transactions").insert({ user_id: artistId, transaction_type: "tip", amount: -SLOT_COST, description: "Bought extra playlist slot" });

  const { data: slots } = await supabase.from("artist_playlist_slots").select("extra_slots").eq("artist_id", artistId).maybeSingle();
  const next = (slots?.extra_slots || 0) + 1;
  await supabase.from("artist_playlist_slots").upsert({ artist_id: artistId, extra_slots: next, updated_at: new Date().toISOString() }, { onConflict: "artist_id" });

  return res.json({ success: true, extra_slots: next, slot_cost: SLOT_COST });
};
