import { supabase } from "./supabase";

export async function logCoinRiskEvent(
  userId: string,
  eventType: string,
  reason: string,
  severity: "low" | "medium" | "high" = "low",
  metadata: Record<string, unknown> = {},
) {
  try {
    await supabase.from("coin_risk_events").insert({
      user_id: userId,
      event_type: eventType,
      reason,
      severity,
      metadata,
    });
  } catch (error) {
    console.error("coin risk event insert failed", error);
  }
}
