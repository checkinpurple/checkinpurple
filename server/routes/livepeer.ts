import { RequestHandler } from "express";

const MUX_INGEST_URL = "rtmp://global-live.mux.com:5222/app";

export const createMuxStreamKey: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;
    if (!tokenId || !tokenSecret) {
      return res.status(500).json({ error: "MUX_TOKEN_ID and MUX_TOKEN_SECRET are not configured" });
    }

    const name = (req.body?.name as string | undefined) || `checkinpurple_${userId}_${Date.now()}`;
    const body: Record<string, unknown> = {
      playback_policy: ["public"],
      reduced_latency: true,
      test: false,
    };
    if (req.body?.record === true) {
      body.new_asset_settings = { playback_policy: ["public"] };
    }

    const response = await fetch("https://api.mux.com/video/v1/live-streams", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, passthrough: name }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.messages?.join(", ") || data?.error || "Failed to create Mux stream",
      });
    }

    const liveStream = data?.data;
    const playbackId = liveStream?.playback_ids?.[0]?.id;
    if (!liveStream?.stream_key || !playbackId) {
      return res.status(502).json({ error: "Mux returned incomplete stream credentials" });
    }

    res.json({
      success: true,
      streamKey: liveStream.stream_key,
      playbackId,
      muxStreamId: liveStream.id,
      rtmpIngestUrl: MUX_INGEST_URL,
      playbackUrl: `https://stream.mux.com/${playbackId}.m3u8`,
    });
  } catch (error) {
    console.error("Mux stream key error:", error);
    res.status(500).json({ error: "Failed to create Mux stream key" });
  }
};
