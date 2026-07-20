import { RequestHandler } from "express";

export const createLivepeerStreamKey: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const apiKey = process.env.LIVEPEER_API_KEY || process.env.VITE_LIVEPEER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "LIVEPEER_API_KEY is not configured in environment variables" });

    const name = (req.body?.name as string | undefined) || `checkinpurple_${userId}_${Date.now()}`;

    const response = await fetch("https://livepeer.studio/api/stream", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        record: req.body?.record === true,
      }),
    });

    const text = await response.text().catch(() => "");
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!response.ok) {
      return res.status(response.status).json({
        error: (data && (data.error || data.message)) || text || "Failed to create Livepeer stream",
      });
    }

    const streamKey =
      typeof data?.streamKey === "object"
        ? data.streamKey.value || data.streamKey
        : data?.streamKey ||
          (typeof data?.stream_key === "object"
            ? data.stream_key.value || data.stream_key
            : data?.stream_key);
    const playbackId =
      typeof data?.playbackId === "object"
        ? data.playbackId.value || data.playbackId
        : data?.playbackId ||
          (typeof data?.playback_id === "object"
            ? data.playback_id.value || data.playback_id
            : data?.playback_id);

    if (!streamKey) {
      return res.status(500).json({
        error: "Livepeer returned an invalid stream key",
        details: data,
      });
    }

    res.json({
      success: true,
      streamKey,
      playbackId,
      livepeerStreamId: data?.id,
    });
  } catch (error) {
    console.error("Livepeer stream key error:", error);
    res.status(500).json({ error: "Failed to create Livepeer stream key" });
  }
};
