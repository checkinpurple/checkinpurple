import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";

// Handle Supabase webhooks
export const handleWebhook: RequestHandler = async (req, res) => {
  try {
    const event = req.body;

    // Verify webhook signature (in production, implement proper verification)
    // For now, assume it's valid

    console.log("Received webhook:", event.type, event.table, event.record);

    // Handle different event types
    switch (event.type) {
      case "INSERT":
        await handleInsert(event);
        break;
      case "UPDATE":
        await handleUpdate(event);
        break;
      case "DELETE":
        await handleDelete(event);
        break;
      default:
        console.log("Unhandled event type:", event.type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

async function handleInsert(event: any) {
  const { table, record } = event;

  switch (table) {
    case "users":
      console.log("New user created:", record.username);
      // Could send welcome email, etc.
      break;
    case "streams":
      console.log("New stream started:", record.title);
      // Could notify followers, etc.
      break;
    case "follows":
      console.log("New follow:", record.follower_id, "->", record.followed_id);
      break;
    case "likes":
      console.log("New like:", record.user_id, "liked", record.stream_id);
      break;
    case "comments":
      console.log("New comment:", record.content);
      break;
    default:
      console.log("Insert on table:", table);
  }
}

async function handleUpdate(event: any) {
  const { table, record, old_record } = event;

  switch (table) {
    case "streams":
      if (record.status !== old_record.status) {
        console.log("Stream status changed:", record.id, old_record.status, "->", record.status);
        // Could send notifications when stream ends
      }
      break;
    default:
      console.log("Update on table:", table);
  }
}

async function handleDelete(event: any) {
  const { table, old_record } = event;

  switch (table) {
    case "streams":
      console.log("Stream deleted:", old_record.title);
      break;
    default:
      console.log("Delete on table:", table);
  }
}