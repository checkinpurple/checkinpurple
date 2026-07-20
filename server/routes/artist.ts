import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { notifyBookingRequest, notifyBookingAccepted, notifyBookingDeclined } from "./notifications";
import { BookingRequestStatus, ProfileType } from "@shared/api";

async function userHasProfile(userId: string, profileType: ProfileType): Promise<boolean> {
  const { data } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("profile_type", profileType)
    .maybeSingle();
  return Boolean(data);
}

export const upsertArtistProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const hasArtist = await userHasProfile(userId, "artist");
    if (!hasArtist) return res.status(403).json({ error: "Artist profile is not enabled for this user" });

    const { genre, explicit_content, is_dj } = req.body || {};
    if (!genre || typeof genre !== "string") return res.status(400).json({ error: "genre required" });

    const { data, error } = await supabase
      .from("artist_profiles")
      .upsert(
        {
          user_id: userId,
          genre,
          explicit_content: Boolean(explicit_content),
          is_dj: Boolean(is_dj),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();

    if (error) throw error;
    res.json(data);

    // Notify artist
    try {
      const fanUsername = (data as any)?.fan?.username || (req.user as any)?.username || "Someone";
      if (data?.artist_id) {
        await notifyBookingRequest(data.artist_id, fanUsername);
      }
    } catch {}
  } catch (error) {
    console.error("Error updating artist profile:", error);
    res.status(500).json({ error: "Failed to update artist profile" });
  }
};

export const getArtistProfile: RequestHandler = async (req, res) => {
  try {
    const artistId = req.params.artistId;
    if (!artistId) return res.status(400).json({ error: "artistId required" });

    const { data, error } = await supabase.from("artist_profiles").select("*").eq("user_id", artistId).maybeSingle();
    if (error) throw error;
    res.json(data || null);
  } catch (error) {
    console.error("Error getting artist profile:", error);
    res.status(500).json({ error: "Failed to get artist profile" });
  }
};

export const createArtistEvent: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const hasArtist = await userHasProfile(userId, "artist");
    if (!hasArtist) return res.status(403).json({ error: "Artist profile is not enabled for this user" });

    const { title, description, event_date, location } = req.body || {};
    if (!title || typeof title !== "string") return res.status(400).json({ error: "title required" });
    if (!event_date || typeof event_date !== "string") return res.status(400).json({ error: "event_date required" });

    const { data, error } = await supabase
      .from("artist_events")
      .insert({ artist_id: userId, title, description, event_date, location })
      .select("*")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error creating artist event:", error);
    res.status(500).json({ error: "Failed to create artist event" });
  }
};

export const listArtistEvents: RequestHandler = async (req, res) => {
  try {
    const artistId = req.params.artistId;
    if (!artistId) return res.status(400).json({ error: "artistId required" });

    const { data, error } = await supabase
      .from("artist_events")
      .select("*")
      .eq("artist_id", artistId)
      .order("event_date", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error listing artist events:", error);
    res.status(500).json({ error: "Failed to list artist events" });
  }
};

export const getFanUpdates: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { data: follows, error: followsError } = await supabase
      .from("follows")
      .select("followed_id")
      .eq("follower_id", userId);

    if (followsError) throw followsError;
    const artistIds = (follows || []).map((f: any) => f.followed_id);
    if (artistIds.length === 0) return res.json([]);

    const nowIso = new Date().toISOString();
    const { data: events, error: eventsError } = await supabase
      .from("artist_events")
      .select("*")
      .in("artist_id", artistIds)
      .gte("event_date", nowIso)
      .order("event_date", { ascending: true });

    if (eventsError) throw eventsError;
    res.json(events || []);
  } catch (error) {
    console.error("Error getting fan updates:", error);
    res.status(500).json({ error: "Failed to get updates" });
  }
};

export const createBookingRequest: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const hasFan = await userHasProfile(userId, "fan");
    if (!hasFan) return res.status(403).json({ error: "Fan profile is not enabled for this user" });

    const { artist_id, requested_date, message } = req.body || {};
    if (!artist_id || typeof artist_id !== "string") return res.status(400).json({ error: "artist_id required" });

    const { data, error } = await supabase
      .from("artist_booking_requests")
      .insert({ fan_id: userId, artist_id, requested_date, message })
      .select("*")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error creating booking request:", error);
    res.status(500).json({ error: "Failed to create booking request" });
  }
};

export const listMyBookingRequests: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabase
      .from("artist_booking_requests")
      .select("*")
      .or(`fan_id.eq.${userId},artist_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error listing booking requests:", error);
    res.status(500).json({ error: "Failed to list booking requests" });
  }
};

export const updateBookingRequestStatus: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = req.params.id;
    const status = req.body?.status as BookingRequestStatus | undefined;
    if (!id) return res.status(400).json({ error: "id required" });
    if (!status || !["pending", "accepted", "declined", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { data: existing, error: existingError } = await supabase
      .from("artist_booking_requests")
      .select("artist_id")
      .eq("id", id)
      .single();

    if (existingError) throw existingError;
    if (existing.artist_id !== userId) return res.status(403).json({ error: "Only the artist can update this request" });

    const { data, error } = await supabase
      .from("artist_booking_requests")
      .update({ status })
      .eq("id", id)
      .select("*, fan:fan_id(email, username), artist:artist_id(username)")
      .single();

    if (error) throw error;

    // Send email notification when artist accepts or declines
    if (status === "accepted" || status === "declined") {
      const resendKey = process.env.RESEND_API_KEY;
      const fanEmail = (data as any)?.fan?.email;
      const fanUsername = (data as any)?.fan?.username || "Fan";
      const artistUsername = (data as any)?.artist?.username || "the artist";

      if (resendKey && fanEmail) {
        const subject = status === "accepted"
          ? `✅ Booking confirmed by @${artistUsername}!`
          : `Booking update from @${artistUsername}`;

        const html = status === "accepted"
          ? `<h2>Great news, ${fanUsername}!</h2>
             <p>@${artistUsername} has <strong>accepted</strong> your booking request.</p>
             <p>They will be in touch to confirm the details. Log in to CheckinPurple to continue the conversation.</p>`
          : `<h2>Hey ${fanUsername},</h2>
             <p>@${artistUsername} is unfortunately unable to accommodate your booking request at this time.</p>
             <p>Try reaching out again for a different date, or explore other artists on CheckinPurple.</p>`;

        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: "noreply@checkinpurple.com",
              to: [fanEmail],
              subject,
              html,
            }),
          });
        } catch (emailErr) {
          console.error("Booking email failed (non-fatal):", emailErr);
        }
      }

      // In-app notification
      const fanId = (data as any)?.fan?.id || (data as any)?.fan_id;
      if (fanId) {
        if (status === "accepted") await notifyBookingAccepted(fanId, artistUsername);
        else if (status === "declined") await notifyBookingDeclined(fanId, artistUsername);
      }
    }

    res.json(data);
  } catch (error) {
    console.error("Error updating booking request:", error);
    res.status(500).json({ error: "Failed to update booking request" });
  }
};

