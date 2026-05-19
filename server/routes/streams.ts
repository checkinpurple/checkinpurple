import { RequestHandler } from "express";
import { supabase, DatabaseStream } from "../lib/supabase";

// Stream management with Supabase database

export const createStream: RequestHandler = async (req, res) => {
  try {
    const { userId, title } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: "userId and title required" });
    }

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

    const { data, error } = await supabase
      .from('streams')
      .insert(streamData)
      .select()
      .single();

    if (error) {
      console.error('Error creating stream:', error);
      return res.status(500).json({ error: "Failed to create stream" });
    }

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

export const endStream: RequestHandler = async (req, res) => {
  try {
    const { streamId } = req.params;

    const { data, error } = await supabase
      .from('streams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        listener_count: 0
      })
      .eq('id', streamId)
      .eq('status', 'live')
      .select()
      .single();

    if (error) {
      console.error('Error ending stream:', error);
      return res.status(404).json({ error: "Stream not found or already ended" });
    }

    res.json({
      success: true,
      message: "Stream ended and cache cleared",
    });
  } catch (error) {
    console.error('Error in endStream:', error);
    res.status(500).json({ error: "Failed to end stream" });
  }
};

export const getStream: RequestHandler = async (req, res) => {
  try {
    const { streamId } = req.params;

    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .eq('id', streamId)
      .single();

    if (error || !data) {
      console.error('Error fetching stream:', error);
      return res.status(404).json({ error: "Stream not found" });
    }

    res.json({
      success: true,
      stream: {
        id: data.id,
        title: data.title,
        livepeerStreamId: data.livepeer_stream_id,
        playbackId: data.livepeer_playback_id,
        listenerCount: data.listener_count,
        startedAt: data.started_at,
      },
    });
  } catch (error) {
    console.error('Error in getStream:', error);
    res.status(500).json({ error: "Failed to fetch stream" });
  }
};

export const updateListenerCount: RequestHandler = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { count } = req.body;

    const { data, error } = await supabase
      .from('streams')
      .update({ listener_count: count })
      .eq('id', streamId)
      .eq('status', 'live')
      .select('listener_count')
      .single();

    if (error || !data) {
      console.error('Error updating listener count:', error);
      return res.status(404).json({ error: "Stream not found" });
    }

    res.json({
      success: true,
      listenerCount: data.listener_count,
    });
  } catch (error) {
    console.error('Error in updateListenerCount:', error);
    res.status(500).json({ error: "Failed to update listener count" });
  }
};

export const listActiveStreams: RequestHandler = async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('streams')
      .select('id, title, listener_count, started_at')
      .eq('status', 'live')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error listing streams:', error);
      return res.status(500).json({ error: "Failed to list streams" });
    }

    res.json({
      success: true,
      streams: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('Error in listActiveStreams:', error);
    res.status(500).json({ error: "Failed to list streams" });
  }
};
