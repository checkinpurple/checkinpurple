import { RequestHandler } from "express";

export const createLivepeerStreamKey: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const importMetaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : undefined;
    const apiKey = importMetaEnv?.VITE_LIVEPEER_API_KEY || process.env.VITE_LIVEPEER_API_KEY || process.env.LIVEPEER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "LIVEPEER_API_KEY or VITE_LIVEPEER_API_KEY is not configured" });

    const name = (req.body?.name as string | undefined) || `checkinpurple_${userId}_${Date.now()}`;

    const response = await fetch("https://livepeer.studio/api/stream", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        record: false,
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
      return res.status(500).json({
        error: (data && (data.error || data.message)) || text || "Failed to create Livepeer stream",
      });
    }

    const streamKey = typeof data?.streamKey === "object" ? data.streamKey.value || data.streamKey : data?.streamKey;
    const playbackId = typeof data?.playbackId === "object" ? data.playbackId.value || data.playbackId : data?.playbackId;

    if (!streamKey) {
      return res.status(500).json({ error: "Livepeer returned an invalid stream key" });
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
