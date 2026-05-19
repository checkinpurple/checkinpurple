import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { HealthResponse } from "@shared/api";

// Health check endpoint
export const healthCheck: RequestHandler = async (req, res) => {
  try {
    // Check database connection
    const { data, error } = await supabase.from("users").select("count").limit(1);

    if (error) {
      throw error;
    }

    const response: HealthResponse = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    res.json(response);
  } catch (error) {
    console.error("Health check failed:", error);
    const response: HealthResponse = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
    res.status(503).json(response);
  }
};