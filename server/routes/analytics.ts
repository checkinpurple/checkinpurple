import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { TrackAnalyticsRequest } from "@shared/api";

// Track an analytics event
export const trackEvent: RequestHandler = async (req, res) => {
  try {
    const { event_type, event_data }: TrackAnalyticsRequest = req.body;
    const user_id = req.user?.id;

    if (!event_type) {
      return res.status(400).json({ error: "event_type required" });
    }

    const { data, error } = await supabase
      .from("analytics_events")
      .insert({
        user_id,
        event_type,
        event_data: event_data || {}
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error tracking event:", error);
    res.status(500).json({ error: "Failed to track event" });
  }
};

// Get analytics events (for admin purposes)
export const getEvents: RequestHandler = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const eventType = req.query.event_type as string;

    let query = supabase
      .from("analytics_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error getting events:", error);
    res.status(500).json({ error: "Failed to get events" });
  }
};