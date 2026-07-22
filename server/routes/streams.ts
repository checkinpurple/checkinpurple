import { RequestHandler } from "express";
import { supabase, DatabaseStream } from "../lib/supabase";

// Stream management with Supabase database

export const createStream: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { title, genre } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!title) return res.status(400).json({ error: "title required" });

    const streamId = `stream_${Date.now()}`;

    const streamData = {
      id: streamId,
      user_id: userId,
      title,
      status: 'live' as const,
      listener_count: 0,
      started_at: new Date().toISOString(),
      livepeer_stream_id: req.body.livepeerStreamId || null,
      livepeer_playback_id: req.body.playbackId || null,
    };

    const wallMetadata = { isLive: true, viewerCount: 0, genre: genre || 'Various' };

    const { data, error } = await supabase
      .from('streams')
      .insert(streamData)
      .select()
      .single();

    if (error) {
      console.error('Error creating stream:', error);
      return res.status(500).json({ error: "Failed to create stream" });
    }

    await supabase.from("wall_posts").insert({
      user_id: userId,
      type: "stream",
      caption: title,
      metadata: wallMetadata,
    });

    res.json({
      success: true,
      stream: {
        id: data.id,
        title: data.title,
        livepeerStreamId: data.livepeer_stream_id,
        playbackId: data.livepeer_playback_id,
      },
    });
  } catch (error) {
    console.error('Error in createStream:', error);
    res.status(500).json({ error: "Failed to create stream" });
  }
};

export const endStream: RequestHandler = async (req, res) => { /* unchanged */
  try {
    const { streamId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { data, error } = await supabase.from('streams').update({ status:'ended', ended_at:new Date().toISOString(), listener_count:0 }).eq('id', streamId).eq('user_id', userId).eq('status','live').select().single();
    if (error) return res.status(404).json({ error: "Stream not found or already ended" });
    res.json({ success: true, message: "Stream ended and cache cleared" });
  } catch (error) { res.status(500).json({ error: "Failed to end stream" }); }
};

export const getStream: RequestHandler = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { data, error } = await supabase.from('streams').select('*').eq('id', streamId).single();
    if (error || !data) return res.status(404).json({ error: "Stream not found" });
    res.json({ success: true, stream: { id: data.id, title: data.title, livepeerStreamId: data.livepeer_stream_id, playbackId: data.livepeer_playback_id, listenerCount: data.listener_count, startedAt: data.started_at } });
  } catch { res.status(500).json({ error: "Failed to fetch stream" }); }
};

export const updateListenerCount: RequestHandler = async (req, res) => {
  try {
    const { streamId } = req.params; const { count } = req.body;
    const { data, error } = await supabase.from('streams').update({ listener_count: count }).eq('id', streamId).eq('status', 'live').select('listener_count').single();
    if (error || !data) return res.status(404).json({ error: "Stream not found" });
    res.json({ success: true, listenerCount: data.listener_count });
  } catch { res.status(500).json({ error: "Failed to update listener count" }); }
};

export const listActiveStreams: RequestHandler = async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('streams')
      .select('id, user_id, title, listener_count, started_at, livepeer_playback_id')
      .eq('status', 'live')
      .order('started_at', { ascending: false });
    if (error) return res.status(500).json({ error: "Failed to list streams" });

    const userIds = Array.from(new Set((data || []).map((stream: any) => stream.user_id).filter(Boolean)));
    const { data: users } = userIds.length
      ? await supabase.from('users').select('id, username, avatar_url').in('id', userIds)
      : { data: [] };
    const userMap = new Map((users || []).map((user: any) => [user.id, user]));

    res.json({
      success: true,
      streams: (data || []).map((stream: any) => {
        const artist = userMap.get(stream.user_id);
        return {
          id: stream.id,
          userId: stream.user_id,
          title: stream.title,
          listenerCount: stream.listener_count,
          startedAt: stream.started_at,
          playbackId: stream.livepeer_playback_id,
          username: artist?.username,
          avatar_url: artist?.avatar_url,
        };
      }),
      total: data?.length || 0,
    });
  } catch { res.status(500).json({ error: "Failed to list streams" }); }
};
