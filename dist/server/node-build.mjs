import path from "node:path";
import "dotenv/config";
import * as express$1 from "express";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
//#region server/routes/demo.ts
var handleDemo = (req, res) => {
	res.status(200).json({ message: "Hello from Express server" });
};
//#endregion
//#region server/lib/supabase.ts
dotenv.config();
var supabaseUrl = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseServiceKey) console.warn("Supabase URL or Key is missing. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY");
var supabase = createClient(supabaseUrl || "http://localhost:54321", supabaseServiceKey || "public-anon-key");
//#endregion
//#region server/routes/streams.ts
var createStream = async (req, res) => {
	try {
		const { userId, title, genre } = req.body;
		if (!userId || !title) return res.status(400).json({ error: "userId and title required" });
		const streamData = {
			id: `stream_${Date.now()}`,
			user_id: userId,
			title,
			status: "live",
			listener_count: 0,
			started_at: (/* @__PURE__ */ new Date()).toISOString(),
			livepeer_stream_id: req.body.livepeerStreamId || null,
			livepeer_playback_id: req.body.playbackId || null
		};
		const wallMetadata = {
			isLive: true,
			viewerCount: 0,
			genre: genre || "Various"
		};
		const { data, error } = await supabase.from("streams").insert(streamData).select().single();
		if (error) {
			console.error("Error creating stream:", error);
			return res.status(500).json({ error: "Failed to create stream" });
		}
		await supabase.from("wall_posts").insert({
			user_id: userId,
			type: "stream",
			caption: title,
			metadata: wallMetadata
		});
		res.json({
			success: true,
			stream: {
				id: data.id,
				title: data.title,
				livepeerStreamId: data.livepeer_stream_id,
				playbackId: data.livepeer_playback_id
			}
		});
	} catch (error) {
		console.error("Error in createStream:", error);
		res.status(500).json({ error: "Failed to create stream" });
	}
};
var endStream = async (req, res) => {
	try {
		const { streamId } = req.params;
		const { data, error } = await supabase.from("streams").update({
			status: "ended",
			ended_at: (/* @__PURE__ */ new Date()).toISOString(),
			listener_count: 0
		}).eq("id", streamId).eq("status", "live").select().single();
		if (error) return res.status(404).json({ error: "Stream not found or already ended" });
		res.json({
			success: true,
			message: "Stream ended and cache cleared"
		});
	} catch (error) {
		res.status(500).json({ error: "Failed to end stream" });
	}
};
var getStream = async (req, res) => {
	try {
		const { streamId } = req.params;
		const { data, error } = await supabase.from("streams").select("*").eq("id", streamId).single();
		if (error || !data) return res.status(404).json({ error: "Stream not found" });
		res.json({
			success: true,
			stream: {
				id: data.id,
				title: data.title,
				livepeerStreamId: data.livepeer_stream_id,
				playbackId: data.livepeer_playback_id,
				listenerCount: data.listener_count,
				startedAt: data.started_at
			}
		});
	} catch {
		res.status(500).json({ error: "Failed to fetch stream" });
	}
};
var updateListenerCount = async (req, res) => {
	try {
		const { streamId } = req.params;
		const { count } = req.body;
		const { data, error } = await supabase.from("streams").update({ listener_count: count }).eq("id", streamId).eq("status", "live").select("listener_count").single();
		if (error || !data) return res.status(404).json({ error: "Stream not found" });
		res.json({
			success: true,
			listenerCount: data.listener_count
		});
	} catch {
		res.status(500).json({ error: "Failed to update listener count" });
	}
};
var listActiveStreams = async (_req, res) => {
	try {
		const { data, error } = await supabase.from("streams").select("id, user_id, title, listener_count, started_at, livepeer_playback_id").eq("status", "live").order("started_at", { ascending: false });
		if (error) return res.status(500).json({ error: "Failed to list streams" });
		const userIds = Array.from(new Set((data || []).map((stream) => stream.user_id).filter(Boolean)));
		const { data: users } = userIds.length ? await supabase.from("users").select("id, username, avatar_url").in("id", userIds) : { data: [] };
		const userMap = new Map((users || []).map((user) => [user.id, user]));
		res.json({
			success: true,
			streams: (data || []).map((stream) => {
				const artist = userMap.get(stream.user_id);
				return {
					id: stream.id,
					userId: stream.user_id,
					title: stream.title,
					listenerCount: stream.listener_count,
					startedAt: stream.started_at,
					playbackId: stream.livepeer_playback_id,
					username: artist?.username,
					avatar_url: artist?.avatar_url
				};
			}),
			total: data?.length || 0
		});
	} catch {
		res.status(500).json({ error: "Failed to list streams" });
	}
};
//#endregion
//#region server/routes/notifications.ts
/**
* Insert a notification row for a user.
* Silently swallows errors — notifications are non-critical.
*/
async function createNotification(params) {
	try {
		await supabase.from("notifications").insert({
			user_id: params.userId,
			type: params.type,
			title: params.title,
			message: params.message,
			action_url: params.actionUrl || null,
			read: false
		});
	} catch (err) {
		console.error("createNotification failed (non-fatal):", err);
	}
}
/** Shorthand helpers */
var notifyBookingRequest = (artistId, fanUsername) => createNotification({
	userId: artistId,
	type: "booking_request",
	title: "New booking request",
	message: `@${fanUsername} wants to book you`,
	actionUrl: "/bookings"
});
var notifyBookingAccepted = (fanId, artistUsername) => createNotification({
	userId: fanId,
	type: "booking_accepted",
	title: "Booking confirmed!",
	message: `@${artistUsername} accepted your booking request`,
	actionUrl: "/bookings"
});
var notifyBookingDeclined = (fanId, artistUsername) => createNotification({
	userId: fanId,
	type: "booking_declined",
	title: "Booking update",
	message: `@${artistUsername} is unable to take your booking`,
	actionUrl: "/bookings"
});
var notifyNewFollower = (artistId, followerUsername) => createNotification({
	userId: artistId,
	type: "new_follower",
	title: "New follower",
	message: `@${followerUsername} started following you`,
	actionUrl: `/fan/${followerUsername}`
});
var notifyCoinTip = (artistId, fromUsername, amount) => createNotification({
	userId: artistId,
	type: "coin_tip",
	title: `${amount} coins received!`,
	message: `@${fromUsername} tipped you ${amount} coins`,
	actionUrl: "/wallet"
});
//#endregion
//#region server/routes/social.ts
var getFollows = async (req, res) => {
	try {
		const userId = req.query.user_id;
		if (!userId) return res.status(400).json({ error: "user_id required" });
		const { data, error } = await supabase.from("follows").select("followed_id, users!follows_followed_id_fkey(id, username, avatar_url)").eq("follower_id", userId);
		if (error) throw error;
		res.json({
			success: true,
			following: (data || []).map((follow) => follow.users).filter(Boolean)
		});
	} catch (error) {
		console.error("Error getting follows:", error);
		res.status(500).json({ error: "Failed to get follows" });
	}
};
var followUser = async (req, res) => {
	try {
		const { followed_id } = req.body;
		const follower_id = req.user?.id;
		if (!follower_id || !followed_id) return res.status(400).json({ error: "Invalid request" });
		const { data, error } = await supabase.from("follows").insert({
			follower_id,
			followed_id
		}).select().single();
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error following user:", error);
		res.status(500).json({ error: "Failed to follow user" });
	}
};
var unfollowUser = async (req, res) => {
	try {
		const { followed_id } = req.body;
		const follower_id = req.user?.id;
		if (!follower_id || !followed_id) return res.status(400).json({ error: "Invalid request" });
		const { error } = await supabase.from("follows").delete().eq("follower_id", follower_id).eq("followed_id", followed_id);
		if (error) throw error;
		try {
			const { data: follower } = await supabase.from("users").select("username").eq("id", follower_id).single();
			await notifyNewFollower(followed_id, follower?.username || "Someone");
		} catch {}
		res.json({ success: true });
	} catch (error) {
		console.error("Error unfollowing user:", error);
		res.status(500).json({ error: "Failed to unfollow user" });
	}
};
var getLikes = async (req, res) => {
	try {
		const streamId = req.query.stream_id;
		if (!streamId) return res.status(400).json({ error: "stream_id required" });
		const { data, error } = await supabase.from("likes").select("*").eq("stream_id", streamId);
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error getting likes:", error);
		res.status(500).json({ error: "Failed to get likes" });
	}
};
var likeStream = async (req, res) => {
	try {
		const { stream_id } = req.body;
		const user_id = req.user?.id;
		if (!user_id || !stream_id) return res.status(400).json({ error: "Invalid request" });
		const { data, error } = await supabase.from("likes").insert({
			user_id,
			stream_id
		}).select().single();
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error liking stream:", error);
		res.status(500).json({ error: "Failed to like stream" });
	}
};
var unlikeStream = async (req, res) => {
	try {
		const { stream_id } = req.body;
		const user_id = req.user?.id;
		if (!user_id || !stream_id) return res.status(400).json({ error: "Invalid request" });
		const { error } = await supabase.from("likes").delete().eq("user_id", user_id).eq("stream_id", stream_id);
		if (error) throw error;
		res.json({ success: true });
	} catch (error) {
		console.error("Error unliking stream:", error);
		res.status(500).json({ error: "Failed to unlike stream" });
	}
};
var getComments = async (req, res) => {
	try {
		const streamId = req.query.stream_id;
		if (!streamId) return res.status(400).json({ error: "stream_id required" });
		const { data, error } = await supabase.from("comments").select(`
        *,
        users!inner(username)
      `).eq("stream_id", streamId).order("created_at", { ascending: true });
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error getting comments:", error);
		res.status(500).json({ error: "Failed to get comments" });
	}
};
var addComment = async (req, res) => {
	try {
		const { stream_id, content } = req.body;
		const user_id = req.user?.id;
		if (!user_id || !stream_id || !content) return res.status(400).json({ error: "Invalid request" });
		const { data, error } = await supabase.from("comments").insert({
			user_id,
			stream_id,
			content
		}).select(`
        *,
        users!inner(username)
      `).single();
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error adding comment:", error);
		res.status(500).json({ error: "Failed to add comment" });
	}
};
var deleteComment = async (req, res) => {
	try {
		const commentId = req.params.id;
		const user_id = req.user?.id;
		if (!user_id || !commentId) return res.status(400).json({ error: "Invalid request" });
		const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user_id);
		if (error) throw error;
		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting comment:", error);
		res.status(500).json({ error: "Failed to delete comment" });
	}
};
//#endregion
//#region server/routes/analytics.ts
var trackEvent = async (req, res) => {
	try {
		const { event_type, event_data } = req.body;
		const user_id = req.user?.id;
		if (!event_type) return res.status(400).json({ error: "event_type required" });
		const { data, error } = await supabase.from("analytics_events").insert({
			user_id,
			event_type,
			event_data: event_data || {}
		}).select().single();
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error tracking event:", error);
		res.status(500).json({ error: "Failed to track event" });
	}
};
var getEvents = async (req, res) => {
	try {
		const limit = parseInt(req.query.limit) || 100;
		const eventType = req.query.event_type;
		let query = supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(limit);
		if (eventType) query = query.eq("event_type", eventType);
		const { data, error } = await query;
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error getting events:", error);
		res.status(500).json({ error: "Failed to get events" });
	}
};
//#endregion
//#region server/routes/webhooks.ts
var handleWebhook = async (req, res) => {
	try {
		const event = req.body;
		console.log("Received webhook:", event.type, event.table, event.record);
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
			default: console.log("Unhandled event type:", event.type);
		}
		res.status(200).json({ received: true });
	} catch (error) {
		console.error("Webhook error:", error);
		res.status(500).json({ error: "Webhook processing failed" });
	}
};
async function handleInsert(event) {
	const { table, record } = event;
	switch (table) {
		case "users":
			console.log("New user created:", record.username);
			break;
		case "streams":
			console.log("New stream started:", record.title);
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
		default: console.log("Insert on table:", table);
	}
}
async function handleUpdate(event) {
	const { table, record, old_record } = event;
	switch (table) {
		case "streams":
			if (record.status !== old_record.status) console.log("Stream status changed:", record.id, old_record.status, "->", record.status);
			break;
		default: console.log("Update on table:", table);
	}
}
async function handleDelete(event) {
	const { table, old_record } = event;
	switch (table) {
		case "streams":
			console.log("Stream deleted:", old_record.title);
			break;
		default: console.log("Delete on table:", table);
	}
}
//#endregion
//#region server/routes/health.ts
var healthCheck = async (req, res) => {
	try {
		const { data, error } = await supabase.from("users").select("count").limit(1);
		if (error) throw error;
		const response = {
			status: "healthy",
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			uptime: process.uptime()
		};
		res.json(response);
	} catch (error) {
		console.error("Health check failed:", error);
		const response = {
			status: "unhealthy",
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			uptime: process.uptime()
		};
		res.status(503).json(response);
	}
};
//#endregion
//#region server/lib/coin-risk.ts
async function logCoinRiskEvent(userId, eventType, reason, severity = "low", metadata = {}) {
	try {
		await supabase.from("coin_risk_events").insert({
			user_id: userId,
			event_type: eventType,
			reason,
			severity,
			metadata
		});
	} catch (error) {
		console.error("coin risk event insert failed", error);
	}
}
//#endregion
//#region server/routes/subscriptions.ts
var getSubscriptionTiers = async (req, res) => {
	try {
		const { data, error } = await supabase.from("subscription_tiers").select("*").order("price_monthly");
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error getting subscription tiers:", error);
		res.status(500).json({ error: "Failed to get subscription tiers" });
	}
};
var getUserSubscription = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		const { data, error } = await supabase.from("user_subscriptions").select(`
        *,
        subscription_tiers (*)
      `).eq("user_id", userId).eq("status", "active").single();
		if (error && error.code !== "PGRST116") throw error;
		res.json(data || null);
	} catch (error) {
		console.error("Error getting user subscription:", error);
		res.status(500).json({ error: "Failed to get user subscription" });
	}
};
var subscribeToTier = async (req, res) => {
	try {
		const userId = req.user?.id;
		const tier_id = req.body?.tier_id || req.body?.tierId;
		if (!userId || !tier_id) return res.status(400).json({ error: "tier_id required" });
		const { data: existing } = await supabase.from("user_subscriptions").select("id").eq("user_id", userId).eq("status", "active").single();
		if (existing) {
			const { data, error } = await supabase.from("user_subscriptions").update({
				tier_id,
				status: "active",
				current_period_start: (/* @__PURE__ */ new Date()).toISOString(),
				current_period_end: new Date(Date.now() + 720 * 60 * 60 * 1e3).toISOString()
			}).eq("id", existing.id).select(`
          *,
          subscription_tiers (*)
        `).single();
			if (error) throw error;
			return res.json(data);
		}
		const { data, error } = await supabase.from("user_subscriptions").insert({
			user_id: userId,
			tier_id,
			status: "active",
			current_period_start: (/* @__PURE__ */ new Date()).toISOString(),
			current_period_end: new Date(Date.now() + 720 * 60 * 60 * 1e3).toISOString()
		}).select(`
        *,
        subscription_tiers (*)
      `).single();
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error subscribing to tier:", error);
		res.status(500).json({ error: "Failed to subscribe" });
	}
};
var getCoinPackages = async (req, res) => {
	try {
		const { data, error } = await supabase.from("coin_packages").select("*").eq("is_active", true).order("price_usd");
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error getting coin packages:", error);
		res.status(500).json({ error: "Failed to get coin packages" });
	}
};
var getUserCoins = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		const { data, error } = await supabase.from("user_coins").select("*").eq("user_id", userId).single();
		if (error && error.code !== "PGRST116") throw error;
		res.json(data || {
			balance: 0,
			total_earned: 0,
			total_spent: 0
		});
	} catch (error) {
		console.error("Error getting user coins:", error);
		res.status(500).json({ error: "Failed to get user coins" });
	}
};
var purchaseCoins = async (req, res) => {
	try {
		const userId = req.user?.id;
		const { package_id } = req.body;
		if (!userId || !package_id) return res.status(400).json({ error: "package_id required" });
		const { data: pkg, error: pkgError } = await supabase.from("coin_packages").select("*").eq("id", package_id).single();
		if (pkgError) throw pkgError;
		if (pkg.coin_amount > 2e4) await logCoinRiskEvent(userId, "purchase", "Large coin package purchase", "medium", {
			package_id,
			coin_amount: pkg.coin_amount
		});
		const { data: transaction, error: txError } = await supabase.from("coin_transactions").insert({
			user_id: userId,
			transaction_type: "purchase",
			amount: pkg.coin_amount,
			description: `Purchased ${pkg.name}`
		}).select().single();
		if (txError) throw txError;
		const { data: updatedCoins, error: updateError } = await supabase.rpc("increment_user_coins", {
			user_id: userId,
			amount: pkg.coin_amount
		});
		if (updateError) throw updateError;
		res.json({
			transaction,
			new_balance: updatedCoins
		});
	} catch (error) {
		console.error("Error purchasing coins:", error);
		res.status(500).json({ error: "Failed to purchase coins" });
	}
};
var tipArtist = async (req, res) => {
	try {
		const userId = req.user?.id;
		const { to_user_id, stream_id, amount, message } = req.body;
		if (!userId || !to_user_id || !amount) return res.status(400).json({ error: "to_user_id and amount required" });
		const { data: userCoins, error: balanceError } = await supabase.from("user_coins").select("balance").eq("user_id", userId).single();
		if (balanceError) throw balanceError;
		if (!userCoins || userCoins.balance < amount) {
			await logCoinRiskEvent(userId, "tip", "Insufficient balance tip attempt", "high", {
				to_user_id,
				amount,
				balance: userCoins?.balance ?? 0
			});
			return res.status(400).json({ error: "Insufficient coin balance" });
		}
		const { data: tip, error: tipError } = await supabase.from("tips").insert({
			from_user_id: userId,
			to_user_id,
			stream_id,
			amount,
			message
		}).select().single();
		if (tipError) throw tipError;
		if (amount >= 5e3) await logCoinRiskEvent(userId, "tip", "High-value tip", "medium", {
			to_user_id,
			amount,
			stream_id: stream_id || null
		});
		await supabase.from("coin_transactions").insert({
			user_id: userId,
			transaction_type: "tip",
			amount: -amount,
			description: `Tipped artist`,
			reference_id: tip.id
		});
		await supabase.rpc("decrement_user_coins", {
			user_id: userId,
			amount
		});
		await supabase.rpc("increment_user_coins", {
			user_id: to_user_id,
			amount
		});
		try {
			const { data: fromUser } = await supabase.from("users").select("username").eq("id", userId).single();
			if (tip?.to_user_id) await notifyCoinTip(tip.to_user_id, fromUser?.username || "Someone", amount);
		} catch {}
		res.json(tip);
	} catch (error) {
		console.error("Error tipping artist:", error);
		res.status(500).json({ error: "Failed to tip artist" });
	}
};
var getScheduledReleases = async (req, res) => {
	try {
		const { data, error } = await supabase.from("scheduled_releases").select("*").eq("status", "scheduled").order("release_date");
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error getting scheduled releases:", error);
		res.status(500).json({ error: "Failed to get scheduled releases" });
	}
};
var createScheduledRelease = async (req, res) => {
	try {
		const userId = req.user?.id;
		const { title, description, release_date, price_coins, max_bookings } = req.body;
		if (!userId || !title || !release_date) return res.status(400).json({ error: "title and release_date required" });
		const { data: subscription, error: subError } = await supabase.from("user_subscriptions").select(`
        *,
        subscription_tiers!inner(name)
      `).eq("user_id", userId).eq("status", "active").single();
		let hasStandardAccess = false;
		if (!subError && subscription && subscription.subscription_tiers?.name === "Standard") hasStandardAccess = true;
		if (!hasStandardAccess) {
			const { data: user, error: userError } = await supabase.from("users").select("role").eq("id", userId).single();
			if (!userError && user?.role === "admin") hasStandardAccess = true;
		}
		if (!hasStandardAccess) return res.status(403).json({ error: "Standard subscription required" });
		const { data, error } = await supabase.from("scheduled_releases").insert({
			user_id: userId,
			title,
			description,
			release_date,
			price_coins: price_coins || 0,
			max_bookings
		}).select().single();
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error creating scheduled release:", error);
		res.status(500).json({ error: "Failed to create scheduled release" });
	}
};
var getPaymentMethods = async (req, res) => {
	try {
		const { data, error } = await supabase.from("payment_methods").select("*").eq("is_active", true).order("name");
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error getting payment methods:", error);
		res.status(500).json({ error: "Failed to get payment methods" });
	}
};
var createPaymentMethod = async (req, res) => {
	try {
		const userId = req.user?.id;
		const { name, type, url, method, currency, amount, coins, paypalEmail, bankName, accountNumber, branchCode } = req.body;
		if (method && amount) {
			const { data: userData } = await supabase.from("users").select("username, email").eq("id", userId).single();
			const username = userData?.username || userId;
			const { data, error } = await supabase.from("payout_requests").insert({
				user_id: userId,
				method,
				currency: currency || "ZAR",
				amount,
				coins,
				paypal_email: paypalEmail || null,
				bank_name: bankName || null,
				account_number: accountNumber || null,
				branch_code: branchCode || null,
				status: "pending"
			}).select().single();
			if (error && error.code !== "42P01") throw error;
			const resendKey = process.env.RESEND_API_KEY;
			if (resendKey) try {
				await fetch("https://api.resend.com/emails", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${resendKey}`
					},
					body: JSON.stringify({
						from: "noreply@checkinpurple.com",
						to: ["checkinpurple@gmail.com"],
						subject: `💰 New payout request from @${username} — ${currency === "USD" ? "$" : "R"}${amount}`,
						html: `
                <h2>New Payout Request</h2>
                <p><strong>Artist:</strong> @${username}</p>
                <p><strong>Amount:</strong> ${currency === "USD" ? "$" : "R"}${amount} (${coins} coins)</p>
                <p><strong>Method:</strong> ${method === "paypal" ? `PayPal — ${paypalEmail}` : `Bank — ${bankName}, acc ${accountNumber}, branch ${branchCode}`}</p>
                <p><strong>Currency:</strong> ${currency}</p>
                <p><strong>Status:</strong> Pending</p>
                <hr/>
                <p>Log into the admin panel to approve this request.</p>
              `
					})
				});
			} catch (emailErr) {
				console.error("Payout email failed (non-fatal):", emailErr);
			}
			return res.json({
				success: true,
				message: "Payout request submitted"
			});
		}
		if (!name || !type) return res.status(400).json({ error: "name and type required" });
		const { data, error } = await supabase.from("payment_methods").insert({
			name,
			type,
			url,
			is_active: true
		}).select().single();
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error creating payment method:", error);
		res.status(500).json({ error: "Failed to create payment method" });
	}
};
var bookRelease = async (req, res) => {
	try {
		const userId = req.user?.id;
		const { release_id } = req.body;
		if (!userId || !release_id) return res.status(400).json({ error: "release_id required" });
		const { data: release, error: releaseError } = await supabase.from("scheduled_releases").select("*").eq("id", release_id).single();
		if (releaseError) throw releaseError;
		if (release.max_bookings && release.current_bookings >= release.max_bookings) return res.status(400).json({ error: "Release is fully booked" });
		if (release.price_coins > 0) {
			const { data: userCoins, error: balanceError } = await supabase.from("user_coins").select("balance").eq("user_id", userId).single();
			if (balanceError) throw balanceError;
			if (!userCoins || userCoins.balance < release.price_coins) return res.status(400).json({ error: "Insufficient coin balance" });
		}
		const { data: booking, error: bookingError } = await supabase.from("release_bookings").insert({
			release_id,
			user_id: userId
		}).select().single();
		if (bookingError) throw bookingError;
		await supabase.from("scheduled_releases").update({ current_bookings: release.current_bookings + 1 }).eq("id", release_id);
		if (release.price_coins > 0) await supabase.rpc("transfer_coins", {
			from_user_id: userId,
			to_user_id: release.user_id,
			amount: release.price_coins
		});
		res.json(booking);
	} catch (error) {
		console.error("Error booking release:", error);
		res.status(500).json({ error: "Failed to book release" });
	}
};
var getUserTips = async (req, res) => {
	try {
		const userId = req.query.user_id;
		if (!userId) return res.status(400).json({ error: "user_id required" });
		const { data, error } = await supabase.from("tips").select(`
        *,
        users!tips_from_user_id_fkey(username)
      `).eq("to_user_id", userId).order("created_at", { ascending: false }).limit(50);
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error getting user tips:", error);
		res.status(500).json({ error: "Failed to get user tips" });
	}
};
//#endregion
//#region server/routes/payments.ts
async function manualClaim(req, res) {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		const { amount, txId, notes, tierId, tierName, type } = req.body;
		if (!amount || !txId) return res.status(400).json({ error: "amount and txId are required" });
		if (Number(amount) >= 1e4) await logCoinRiskEvent(userId, "withdraw_or_claim", "Large manual payment claim", "high", {
			amount,
			txId,
			type: type || null
		});
		const { error } = await supabase.from("manual_payments").insert([{
			user_id: userId,
			amount: String(amount),
			tx_id: String(txId),
			notes: notes || (tierName ? `${type || "subscription"}: ${tierName} (tier: ${tierId})` : null)
		}]);
		if (error) {
			console.error("manual-claim insert error", error);
			if (error.code === "42P01") return res.json({
				ok: true,
				warning: "Recorded manually"
			});
			throw error;
		}
		return res.json({ ok: true });
	} catch (err) {
		console.error("manual-claim error", err);
		return res.status(500).json({ error: err.message || "internal" });
	}
}
async function createPayPalOrder(req, res) {
	try {
		const { amount, currency = "USD" } = req.body;
		if (!amount) return res.status(400).json({ error: "amount required" });
		const clientId = process.env.PAYPAL_CLIENT_ID;
		const secret = process.env.PAYPAL_SECRET;
		if (!clientId || !secret) return res.status(500).json({ error: "PayPal not configured" });
		const accessToken = (await (await globalThis.fetch(`https://api-m.sandbox.paypal.com/v1/oauth2/token`, {
			method: "POST",
			headers: {
				"Authorization": "Basic " + Buffer.from(`${clientId}:${secret}`).toString("base64"),
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: "grant_type=client_credentials"
		})).json()).access_token;
		if (!accessToken) return res.status(500).json({ error: "failed to get paypal token" });
		const orderJson = await (await globalThis.fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				intent: "CAPTURE",
				purchase_units: [{ amount: {
					currency_code: currency,
					value: String(amount)
				} }]
			})
		})).json();
		return res.json(orderJson);
	} catch (err) {
		console.error("createPayPalOrder error", err);
		return res.status(500).json({ error: err.message || "internal" });
	}
}
async function capturePayPalOrder(req, res) {
	try {
		const { orderId } = req.body;
		if (!orderId) return res.status(400).json({ error: "orderId required" });
		const clientId = process.env.PAYPAL_CLIENT_ID;
		const secret = process.env.PAYPAL_SECRET;
		if (!clientId || !secret) return res.status(500).json({ error: "PayPal not configured" });
		const accessToken = (await (await globalThis.fetch(`https://api-m.sandbox.paypal.com/v1/oauth2/token`, {
			method: "POST",
			headers: {
				"Authorization": "Basic " + Buffer.from(`${clientId}:${secret}`).toString("base64"),
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: "grant_type=client_credentials"
		})).json()).access_token;
		const capJson = await (await globalThis.fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				"Content-Type": "application/json"
			}
		})).json();
		return res.json(capJson);
	} catch (err) {
		console.error("capturePayPalOrder error", err);
		return res.status(500).json({ error: err.message || "internal" });
	}
}
//#endregion
//#region server/routes/profiles.ts
var ALLOWED_PROFILES = [
	"fan",
	"artist",
	"merchant",
	"influencer"
];
async function getProfileLimitForUser(userId) {
	const { data: user } = await supabase.from("users").select("role").eq("id", userId).single();
	if (user?.role === "admin") return 999;
	const { data: subscription } = await supabase.from("user_subscriptions").select("subscription_tiers!inner(profile_limit)").eq("user_id", userId).eq("status", "active").single();
	const limit = (subscription?.subscription_tiers)?.profile_limit;
	return typeof limit === "number" && limit > 0 ? limit : 1;
}
async function userHasProfile$1(userId, profileType) {
	const { data } = await supabase.from("user_profiles").select("id").eq("user_id", userId).eq("profile_type", profileType).maybeSingle();
	return Boolean(data);
}
var getMyProfiles = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		const [{ data: profiles, error: profilesError }, { data: user, error: userError }] = await Promise.all([supabase.from("user_profiles").select("profile_type").eq("user_id", userId).order("created_at"), supabase.from("users").select("role").eq("id", userId).single()]);
		if (profilesError) throw profilesError;
		if (userError) throw userError;
		const profileLimit = await getProfileLimitForUser(userId);
		res.json({
			active_profile: user.role,
			profiles: (profiles || []).map((p) => p.profile_type),
			profile_limit: profileLimit
		});
	} catch (error) {
		console.error("Error getting profiles:", error);
		res.status(500).json({ error: "Failed to get profiles" });
	}
};
var addProfile = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		const profile_type = req.body?.profile_type;
		if (!profile_type || !ALLOWED_PROFILES.includes(profile_type)) return res.status(400).json({ error: "Invalid profile_type" });
		const profileLimit = await getProfileLimitForUser(userId);
		const { count } = await supabase.from("user_profiles").select("*", {
			count: "exact",
			head: true
		}).eq("user_id", userId);
		if (typeof count === "number" && count >= profileLimit) return res.status(403).json({ error: `Profile limit reached (${profileLimit}). Upgrade your plan to add more profiles.` });
		const { data, error } = await supabase.from("user_profiles").insert({
			user_id: userId,
			profile_type
		}).select("*").single();
		if (error) {
			if (error.code === "23505") return res.status(409).json({ error: "Profile already exists for this user" });
			throw error;
		}
		res.json(data);
	} catch (error) {
		console.error("Error adding profile:", error);
		res.status(500).json({ error: "Failed to add profile" });
	}
};
var switchActiveProfile = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		const profile_type = req.body?.profile_type;
		if (!profile_type || !ALLOWED_PROFILES.includes(profile_type)) return res.status(400).json({ error: "Invalid profile_type" });
		if (!await userHasProfile$1(userId, profile_type)) return res.status(403).json({ error: "Profile not enabled for this user" });
		const { data, error } = await supabase.from("users").update({ role: profile_type }).eq("id", userId).select("id, role").single();
		if (error) throw error;
		res.json({
			success: true,
			user: data
		});
	} catch (error) {
		console.error("Error switching active profile:", error);
		res.status(500).json({ error: "Failed to switch profile" });
	}
};
//#endregion
//#region server/routes/artist.ts
async function userHasProfile(userId, profileType) {
	const { data } = await supabase.from("user_profiles").select("id").eq("user_id", userId).eq("profile_type", profileType).maybeSingle();
	return Boolean(data);
}
var upsertArtistProfile = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		if (!await userHasProfile(userId, "artist")) return res.status(403).json({ error: "Artist profile is not enabled for this user" });
		const { genre, explicit_content, is_dj } = req.body || {};
		if (!genre || typeof genre !== "string") return res.status(400).json({ error: "genre required" });
		const { data, error } = await supabase.from("artist_profiles").upsert({
			user_id: userId,
			genre,
			explicit_content: Boolean(explicit_content),
			is_dj: Boolean(is_dj),
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		}, { onConflict: "user_id" }).select("*").single();
		if (error) throw error;
		res.json(data);
		try {
			const fanUsername = data?.fan?.username || req.user?.username || "Someone";
			if (data?.artist_id) await notifyBookingRequest(data.artist_id, fanUsername);
		} catch {}
	} catch (error) {
		console.error("Error updating artist profile:", error);
		res.status(500).json({ error: "Failed to update artist profile" });
	}
};
var getArtistProfile = async (req, res) => {
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
var createArtistEvent = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		if (!await userHasProfile(userId, "artist")) return res.status(403).json({ error: "Artist profile is not enabled for this user" });
		const { title, description, event_date, location } = req.body || {};
		if (!title || typeof title !== "string") return res.status(400).json({ error: "title required" });
		if (!event_date || typeof event_date !== "string") return res.status(400).json({ error: "event_date required" });
		const { data, error } = await supabase.from("artist_events").insert({
			artist_id: userId,
			title,
			description,
			event_date,
			location
		}).select("*").single();
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error creating artist event:", error);
		res.status(500).json({ error: "Failed to create artist event" });
	}
};
var listArtistEvents = async (req, res) => {
	try {
		const artistId = req.params.artistId;
		if (!artistId) return res.status(400).json({ error: "artistId required" });
		const { data, error } = await supabase.from("artist_events").select("*").eq("artist_id", artistId).order("event_date", { ascending: true });
		if (error) throw error;
		res.json(data || []);
	} catch (error) {
		console.error("Error listing artist events:", error);
		res.status(500).json({ error: "Failed to list artist events" });
	}
};
var getFanUpdates = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		const { data: follows, error: followsError } = await supabase.from("follows").select("followed_id").eq("follower_id", userId);
		if (followsError) throw followsError;
		const artistIds = (follows || []).map((f) => f.followed_id);
		if (artistIds.length === 0) return res.json([]);
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		const { data: events, error: eventsError } = await supabase.from("artist_events").select("*").in("artist_id", artistIds).gte("event_date", nowIso).order("event_date", { ascending: true });
		if (eventsError) throw eventsError;
		res.json(events || []);
	} catch (error) {
		console.error("Error getting fan updates:", error);
		res.status(500).json({ error: "Failed to get updates" });
	}
};
var createBookingRequest = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		if (!await userHasProfile(userId, "fan")) return res.status(403).json({ error: "Fan profile is not enabled for this user" });
		const { artist_id, requested_date, message } = req.body || {};
		if (!artist_id || typeof artist_id !== "string") return res.status(400).json({ error: "artist_id required" });
		const { data, error } = await supabase.from("artist_booking_requests").insert({
			fan_id: userId,
			artist_id,
			requested_date,
			message
		}).select("*").single();
		if (error) throw error;
		res.json(data);
	} catch (error) {
		console.error("Error creating booking request:", error);
		res.status(500).json({ error: "Failed to create booking request" });
	}
};
var listMyBookingRequests = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		const { data, error } = await supabase.from("artist_booking_requests").select("*").or(`fan_id.eq.${userId},artist_id.eq.${userId}`).order("created_at", { ascending: false });
		if (error) throw error;
		res.json(data || []);
	} catch (error) {
		console.error("Error listing booking requests:", error);
		res.status(500).json({ error: "Failed to list booking requests" });
	}
};
var updateBookingRequestStatus = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		const id = req.params.id;
		const status = req.body?.status;
		if (!id) return res.status(400).json({ error: "id required" });
		if (!status || ![
			"pending",
			"accepted",
			"declined",
			"cancelled"
		].includes(status)) return res.status(400).json({ error: "Invalid status" });
		const { data: existing, error: existingError } = await supabase.from("artist_booking_requests").select("artist_id").eq("id", id).single();
		if (existingError) throw existingError;
		if (existing.artist_id !== userId) return res.status(403).json({ error: "Only the artist can update this request" });
		const { data, error } = await supabase.from("artist_booking_requests").update({ status }).eq("id", id).select("*, fan:fan_id(email, username), artist:artist_id(username)").single();
		if (error) throw error;
		if (status === "accepted" || status === "declined") {
			const resendKey = process.env.RESEND_API_KEY;
			const fanEmail = data?.fan?.email;
			const fanUsername = data?.fan?.username || "Fan";
			const artistUsername = data?.artist?.username || "the artist";
			if (resendKey && fanEmail) {
				const subject = status === "accepted" ? `✅ Booking confirmed by @${artistUsername}!` : `Booking update from @${artistUsername}`;
				const html = status === "accepted" ? `<h2>Great news, ${fanUsername}!</h2>
             <p>@${artistUsername} has <strong>accepted</strong> your booking request.</p>
             <p>They will be in touch to confirm the details. Log in to CheckinPurple to continue the conversation.</p>` : `<h2>Hey ${fanUsername},</h2>
             <p>@${artistUsername} is unfortunately unable to accommodate your booking request at this time.</p>
             <p>Try reaching out again for a different date, or explore other artists on CheckinPurple.</p>`;
				try {
					await fetch("https://api.resend.com/emails", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${resendKey}`
						},
						body: JSON.stringify({
							from: "noreply@checkinpurple.com",
							to: [fanEmail],
							subject,
							html
						})
					});
				} catch (emailErr) {
					console.error("Booking email failed (non-fatal):", emailErr);
				}
			}
			const fanId = data?.fan?.id || data?.fan_id;
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
//#endregion
//#region server/routes/livepeer.ts
var createLivepeerStreamKey = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		const apiKey = process.env.LIVEPEER_API_KEY || process.env.VITE_LIVEPEER_API_KEY;
		if (!apiKey) return res.status(500).json({ error: "LIVEPEER_API_KEY is not configured in environment variables" });
		const name = req.body?.name || `checkinpurple_${userId}_${Date.now()}`;
		const response = await fetch("https://livepeer.studio/api/stream", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				name,
				record: req.body?.record === true
			})
		});
		const text = await response.text().catch(() => "");
		let data = null;
		try {
			data = text ? JSON.parse(text) : null;
		} catch {
			data = null;
		}
		if (!response.ok) return res.status(response.status).json({ error: data && (data.error || data.message) || text || "Failed to create Livepeer stream" });
		const streamKey = typeof data?.streamKey === "object" ? data.streamKey.value || data.streamKey : data?.streamKey || (typeof data?.stream_key === "object" ? data.stream_key.value || data.stream_key : data?.stream_key);
		const playbackId = typeof data?.playbackId === "object" ? data.playbackId.value || data.playbackId : data?.playbackId || (typeof data?.playback_id === "object" ? data.playback_id.value || data.playback_id : data?.playback_id);
		if (!streamKey) return res.status(500).json({
			error: "Livepeer returned an invalid stream key",
			details: data
		});
		res.json({
			success: true,
			streamKey,
			playbackId,
			livepeerStreamId: data?.id
		});
	} catch (error) {
		console.error("Livepeer stream key error:", error);
		res.status(500).json({ error: "Failed to create Livepeer stream key" });
	}
};
//#endregion
//#region server/routes/admin.ts
async function ensureAdmin(userId) {
	if (!userId) return false;
	const { data, error } = await supabase.from("users").select("role").eq("id", userId).single();
	if (error) return false;
	return data.role === "admin";
}
var listUsers = async (req, res) => {
	try {
		if (!await ensureAdmin(req.user?.id)) return res.status(403).json({ error: "Forbidden" });
		const { data: profileData, error: profileError, count } = await supabase.from("users").select("id,email,username,role,is_verified,is_banned,created_at", { count: "exact" }).order("created_at", { ascending: false });
		if (profileError) throw profileError;
		res.json({
			users: profileData || [],
			total: count ?? profileData?.length ?? 0
		});
	} catch (error) {
		console.error("Error listing users:", error);
		res.status(500).json({ error: "Failed to list users" });
	}
};
var updateUserRole = async (req, res) => {
	try {
		if (!await ensureAdmin(req.user?.id)) return res.status(403).json({ error: "Forbidden" });
		const userId = req.params.userId;
		const role = req.body?.role;
		if (!userId || !role) return res.status(400).json({ error: "userId and role required" });
		if (![
			"artist",
			"fan",
			"merchant",
			"influencer",
			"artist_fan",
			"admin"
		].includes(role)) return res.status(400).json({ error: "Invalid role" });
		const { data, error } = await supabase.from("users").update({ role }).eq("id", userId).select("*").single();
		if (error) throw error;
		res.json({
			success: true,
			user: data
		});
	} catch (error) {
		console.error("Error updating user role:", error);
		res.status(500).json({ error: "Failed to update role" });
	}
};
var setUserBanned = async (req, res) => {
	try {
		if (!await ensureAdmin(req.user?.id)) return res.status(403).json({ error: "Forbidden" });
		const userId = req.params.userId;
		const banned = Boolean(req.body?.banned);
		if (!userId) return res.status(400).json({ error: "userId required" });
		const { data, error } = await supabase.from("users").update({ is_banned: banned }).eq("id", userId).select("*").single();
		if (error) throw error;
		res.json({
			success: true,
			user: data
		});
	} catch (error) {
		console.error("Error banning user:", error);
		res.status(500).json({ error: "Failed to update ban" });
	}
};
var listSubmissions = async (req, res) => {
	if (!await ensureAdmin(req.user?.id)) return res.status(403).json({ error: "Forbidden" });
	res.json({ submissions: [] });
};
//#endregion
//#region server/routes/parties.ts
var listParties = async (_req, res) => {
	res.json({ parties: [] });
};
//#endregion
//#region server/routes/wall.ts
var getWallFeed = async (_req, res) => {
	try {
		const wallRes = await supabase.from("wall_posts").select("id,user_id,type,caption,media_url,thumbnail_url,metadata,created_at").order("created_at", { ascending: false }).limit(40);
		const [streamsRes, productsRes, usersRes] = await Promise.all([
			supabase.from("streams").select("id,title,listener_count,status,started_at,user_id").order("started_at", { ascending: false }).limit(15),
			supabase.from("products").select("id,title,price_zar,category,image_url,created_at,merchant_id").eq("is_active", true).order("created_at", { ascending: false }).limit(20),
			supabase.from("users").select("id,username,role,avatar_url,is_verified,created_at,streaming_spotify").order("created_at", { ascending: false }).limit(20)
		]);
		const users = usersRes.data || [];
		if ((wallRes.data || []).length > 0) {
			const mapped = (wallRes.data || []).map((p) => {
				const author = users.find((u) => u.id === p.user_id);
				return {
					id: p.id,
					type: p.type,
					author: author?.username || "user",
					authorRole: author?.role || "fan",
					authorAvatar: author?.avatar_url || void 0,
					verified: Boolean(author?.is_verified),
					timestamp: new Date(p.created_at).toLocaleString("en-ZA"),
					caption: p.caption || void 0,
					mediaUrl: p.media_url || void 0,
					thumbnailUrl: p.thumbnail_url || void 0,
					...p.metadata || {},
					likes: 0,
					comments: 0
				};
			});
			return res.json({
				success: true,
				posts: mapped
			});
		}
		const userMap = new Map(users.map((u) => [u.id, u]));
		const streamPosts = (streamsRes.data || []).map((stream) => {
			const author = userMap.get(stream.user_id);
			return {
				id: `stream_${stream.id}`,
				type: "stream",
				author: author?.username || "artist",
				authorRole: author?.role || "artist",
				authorAvatar: author?.avatar_url || void 0,
				verified: Boolean(author?.is_verified),
				timestamp: stream.status === "live" ? "Live now" : new Date(stream.started_at).toLocaleString("en-ZA"),
				caption: stream.title,
				isLive: stream.status === "live",
				viewerCount: stream.listener_count || 0,
				likes: 0,
				comments: 0
			};
		});
		const productsByMerchant = /* @__PURE__ */ new Map();
		for (const p of productsRes.data || []) {
			const arr = productsByMerchant.get(p.merchant_id) || [];
			arr.push(p);
			productsByMerchant.set(p.merchant_id, arr);
		}
		const cataloguePosts = Array.from(productsByMerchant.entries()).slice(0, 8).map(([merchantId, products]) => {
			const merchant = userMap.get(merchantId);
			return {
				id: `catalogue_${merchantId}`,
				type: "catalogue",
				author: merchant?.username || "merchant",
				authorRole: "merchant",
				authorAvatar: merchant?.avatar_url || void 0,
				verified: Boolean(merchant?.is_verified),
				timestamp: "Recently",
				caption: `${merchant?.username || "Merchant"} — store drops available now.`,
				products: products.slice(0, 4).map((p) => ({
					id: p.id,
					name: p.title,
					price: `R${p.price_zar}`,
					image: p.image_url || void 0,
					category: p.category
				})),
				likes: 0,
				comments: 0
			};
		});
		const reelPosts = users.filter((u) => u.role === "artist" || u.role === "artist_fan").slice(0, 8).map((u, idx) => ({
			id: `reel_${u.id}`,
			type: "reel",
			author: u.username,
			authorRole: "artist",
			authorAvatar: u.avatar_url || void 0,
			verified: Boolean(u.is_verified),
			timestamp: "Recently",
			caption: `${u.username} — new music in progress.`,
			thumbnailUrl: u.avatar_url || void 0,
			duration: "0:30",
			trackTitle: "Studio Reel",
			genre: "Music",
			likes: 0,
			comments: 0
		}));
		const posts = [
			...streamPosts,
			...reelPosts,
			...cataloguePosts
		];
		res.json({
			success: true,
			posts
		});
	} catch (error) {
		console.error("Wall feed error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to load wall feed"
		});
	}
};
//#endregion
//#region server/routes/playlists.ts
async function getPlaylistLimit(artistId) {
	const [{ data: sub }, { data: slots }] = await Promise.all([supabase.from("user_subscriptions").select("subscription_tiers!inner(name)").eq("user_id", artistId).eq("status", "active").maybeSingle(), supabase.from("artist_playlist_slots").select("extra_slots").eq("artist_id", artistId).maybeSingle()]);
	return ((sub?.subscription_tiers)?.name === "Premium" ? 999 : 3) + (slots?.extra_slots || 0);
}
var listMyPlaylists = async (req, res) => {
	const artistId = req.user?.id;
	if (!artistId) return res.status(401).json({ error: "Unauthorized" });
	const { data, error } = await supabase.from("artist_playlists").select("*, artist_playlist_tracks(*)").eq("artist_id", artistId).order("created_at", { ascending: false });
	if (error) return res.status(500).json({ error: "Failed to fetch playlists" });
	const limit = await getPlaylistLimit(artistId);
	return res.json({
		playlists: data || [],
		limit
	});
};
var createPlaylist = async (req, res) => {
	const artistId = req.user?.id;
	if (!artistId) return res.status(401).json({ error: "Unauthorized" });
	const { title, notes, target_type, target_user_ids, tracks, booking_id } = req.body || {};
	if (!title || !target_type) return res.status(400).json({ error: "title and target_type required" });
	const { count } = await supabase.from("artist_playlists").select("*", {
		count: "exact",
		head: true
	}).eq("artist_id", artistId);
	const limit = await getPlaylistLimit(artistId);
	if ((count || 0) >= limit) return res.status(403).json({ error: `Playlist limit reached (${limit}). Buy extra playlist slots in Store.` });
	const { data: playlist, error } = await supabase.from("artist_playlists").insert({
		artist_id: artistId,
		title,
		notes: notes || null,
		target_type,
		target_user_ids: target_user_ids || [],
		booking_id: booking_id || null
	}).select("*").single();
	if (error || !playlist) return res.status(500).json({ error: "Failed to create playlist" });
	const trackRows = Array.isArray(tracks) ? tracks : [];
	if (trackRows.length > 0) await supabase.from("artist_playlist_tracks").insert(trackRows.map((t, idx) => ({
		playlist_id: playlist.id,
		track_title: t.track_title,
		artist_name: t.artist_name || null,
		sort_order: idx
	})));
	return res.json({
		success: true,
		playlistId: playlist.id
	});
};
var buyPlaylistSlotWithCoins = async (req, res) => {
	const artistId = req.user?.id;
	if (!artistId) return res.status(401).json({ error: "Unauthorized" });
	const SLOT_COST = 300;
	const { data: wallet } = await supabase.from("user_coins").select("balance").eq("user_id", artistId).maybeSingle();
	if (!wallet || wallet.balance < SLOT_COST) return res.status(400).json({ error: `Need ${SLOT_COST} coins to buy 1 playlist slot` });
	await supabase.rpc("decrement_user_coins", {
		user_id: artistId,
		amount: SLOT_COST
	});
	await supabase.from("coin_transactions").insert({
		user_id: artistId,
		transaction_type: "tip",
		amount: -SLOT_COST,
		description: "Bought extra playlist slot"
	});
	const { data: slots } = await supabase.from("artist_playlist_slots").select("extra_slots").eq("artist_id", artistId).maybeSingle();
	const next = (slots?.extra_slots || 0) + 1;
	await supabase.from("artist_playlist_slots").upsert({
		artist_id: artistId,
		extra_slots: next,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}, { onConflict: "artist_id" });
	return res.json({
		success: true,
		extra_slots: next,
		slot_cost: SLOT_COST
	});
};
//#endregion
//#region server/routes/store.ts
var getStoreSettings = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({
			success: false,
			error: "Unauthorized"
		});
		const { data, error } = await supabase.from("store_settings").select("*").eq("user_id", userId).single();
		if (error && error.code !== "PGRST116") {
			console.error("Error fetching store settings:", error);
			return res.status(500).json({
				success: false,
				error: "Failed to fetch store settings"
			});
		}
		return res.json({
			success: true,
			settings: data || null
		});
	} catch (err) {
		console.error("Store settings error:", err);
		return res.status(500).json({
			success: false,
			error: "Internal server error"
		});
	}
};
var updateStoreSettings = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({
			success: false,
			error: "Unauthorized"
		});
		const { brand_name, delivery_radius, delivery_note } = req.body;
		const { data, error } = await supabase.from("store_settings").upsert({
			user_id: userId,
			brand_name: brand_name || null,
			delivery_radius: delivery_radius || null,
			delivery_note: delivery_note || null,
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		}, { onConflict: "user_id" }).select().single();
		if (error) {
			console.error("Error updating store settings:", error);
			return res.status(500).json({
				success: false,
				error: "Failed to save store settings"
			});
		}
		return res.json({
			success: true,
			settings: data
		});
	} catch (err) {
		console.error("Store settings update error:", err);
		return res.status(500).json({
			success: false,
			error: "Internal server error"
		});
	}
};
var getMerchantProducts = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({
			success: false,
			error: "Unauthorized"
		});
		const { data, error } = await supabase.from("products").select("*").eq("merchant_id", userId).order("created_at", { ascending: false });
		if (error) {
			console.error("Error fetching products:", error);
			return res.status(500).json({
				success: false,
				error: "Failed to fetch products"
			});
		}
		return res.json({
			success: true,
			products: data || []
		});
	} catch (err) {
		console.error("Products error:", err);
		return res.status(500).json({
			success: false,
			error: "Internal server error"
		});
	}
};
var getPublicProducts = async (_req, res) => {
	try {
		const { data, error } = await supabase.from("products").select(`
        *,
        users:merchant_id (username, avatar_url)
      `).eq("is_active", true).order("created_at", { ascending: false });
		if (error) {
			console.error("Error fetching public products:", error);
			return res.status(500).json({
				success: false,
				error: "Failed to fetch products"
			});
		}
		const products = (data || []).map((p) => ({
			...p,
			merchant_username: p.users?.username || "Unknown",
			merchant_avatar: p.users?.avatar_url || null
		}));
		return res.json({
			success: true,
			products
		});
	} catch (err) {
		console.error("Public products error:", err);
		return res.status(500).json({
			success: false,
			error: "Internal server error"
		});
	}
};
var createProduct = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({
			success: false,
			error: "Unauthorized"
		});
		const { title, description, price_zar, category, stock, image_url } = req.body;
		if (!title || price_zar === void 0) return res.status(400).json({
			success: false,
			error: "Title and price are required"
		});
		const { data, error } = await supabase.from("products").insert({
			merchant_id: userId,
			title,
			description: description || null,
			price_zar: parseFloat(price_zar),
			category: category || "merch",
			stock: stock ?? -1,
			image_url: image_url || null,
			is_active: true
		}).select().single();
		if (error) {
			console.error("Error creating product:", error);
			return res.status(500).json({
				success: false,
				error: "Failed to create product"
			});
		}
		return res.json({
			success: true,
			product: data
		});
	} catch (err) {
		console.error("Create product error:", err);
		return res.status(500).json({
			success: false,
			error: "Internal server error"
		});
	}
};
var getMerchantOrders = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({
			success: false,
			error: "Unauthorized"
		});
		const { data, error } = await supabase.from("orders").select(`
        *,
        products:product_id (title),
        buyers:buyer_id (username)
      `).eq("merchant_id", userId).order("created_at", { ascending: false });
		if (error) {
			console.error("Error fetching orders:", error);
			return res.status(500).json({
				success: false,
				error: "Failed to fetch orders"
			});
		}
		const orders = (data || []).map((o) => ({
			...o,
			product_title: o.products?.title || "Unknown Product",
			buyer_username: o.buyers?.username || "Unknown"
		}));
		return res.json({
			success: true,
			orders
		});
	} catch (err) {
		console.error("Orders error:", err);
		return res.status(500).json({
			success: false,
			error: "Internal server error"
		});
	}
};
//#endregion
//#region server/index.ts
var authMiddleware = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) return next();
		req.user = { id: authHeader.substring(7) };
		next();
	} catch (error) {
		console.error("Auth error:", error);
		next();
	}
};
var loggingMiddleware = (req, res, next) => {
	const start = Date.now();
	console.log(`${req.method} ${req.url} - ${(/* @__PURE__ */ new Date()).toISOString()}`);
	res.on("finish", () => {
		const duration = Date.now() - start;
		console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
	});
	next();
};
function createServer() {
	const app = express();
	app.use(cors());
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use(loggingMiddleware);
	app.use(authMiddleware);
	app.post("/api/streams", createStream);
	app.get("/api/streams", listActiveStreams);
	app.get("/api/streams/:streamId", getStream);
	app.post("/api/streams/:streamId/listeners", updateListenerCount);
	app.delete("/api/streams/:streamId", endStream);
	app.post("/api/stream/livepeer-key", createLivepeerStreamKey);
	app.get("/api/profiles", getMyProfiles);
	app.post("/api/profiles", addProfile);
	app.post("/api/profiles/switch", switchActiveProfile);
	app.put("/api/artist/profile", upsertArtistProfile);
	app.get("/api/artist/:artistId/profile", getArtistProfile);
	app.post("/api/artist/events", createArtistEvent);
	app.get("/api/artist/:artistId/events", listArtistEvents);
	app.get("/api/fan/updates/events", getFanUpdates);
	app.post("/api/bookings", createBookingRequest);
	app.get("/api/bookings", listMyBookingRequests);
	app.patch("/api/bookings/:id", updateBookingRequestStatus);
	app.get("/api/social/follows", getFollows);
	app.post("/api/social/follow", followUser);
	app.delete("/api/social/follow", unfollowUser);
	app.get("/api/social/likes", getLikes);
	app.post("/api/social/like", likeStream);
	app.delete("/api/social/like", unlikeStream);
	app.get("/api/social/comments", getComments);
	app.post("/api/social/comment", addComment);
	app.delete("/api/social/comment/:id", deleteComment);
	app.post("/api/analytics/track", trackEvent);
	app.get("/api/analytics/events", getEvents);
	app.post("/api/webhooks/supabase", handleWebhook);
	app.get("/api/health", healthCheck);
	app.get("/api/admin/coin-risk-events", async (req, res) => {
		try {
			if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
			if ((await supabase.from("users").select("role").eq("id", req.user.id).single()).data?.role !== "admin") return res.status(403).json({ error: "Forbidden" });
			const out = await supabase.from("coin_risk_events").select("*").order("created_at", { ascending: false }).limit(200);
			return res.json({ events: out.data || [] });
		} catch {
			return res.status(500).json({ error: "Failed to fetch risk events" });
		}
	});
	app.get("/api/admin/users", listUsers);
	app.patch("/api/admin/users/:userId/role", updateUserRole);
	app.patch("/api/admin/users/:userId/ban", setUserBanned);
	app.get("/api/admin/submissions", listSubmissions);
	app.get("/api/playlists", listMyPlaylists);
	app.post("/api/playlists", createPlaylist);
	app.post("/api/playlists/buy-slot", buyPlaylistSlotWithCoins);
	app.get("/api/parties", listParties);
	app.get("/api/store/settings", getStoreSettings);
	app.post("/api/store/settings", updateStoreSettings);
	app.get("/api/store/products", getMerchantProducts);
	app.get("/api/store/products/public", getPublicProducts);
	app.post("/api/store/products", createProduct);
	app.get("/api/store/orders", getMerchantOrders);
	app.get("/api/subscriptions/tiers", getSubscriptionTiers);
	app.get("/api/subscriptions/user", getUserSubscription);
	app.post("/api/subscriptions/subscribe", subscribeToTier);
	app.get("/api/payments/methods", getPaymentMethods);
	app.post("/api/payments/methods", createPaymentMethod);
	app.get("/api/coins/packages", getCoinPackages);
	app.get("/api/coins/balance", getUserCoins);
	app.post("/api/coins/purchase", purchaseCoins);
	app.post("/api/coins/tip", tipArtist);
	app.get("/api/coins/tips", getUserTips);
	app.post("/api/payments/manual-claim", manualClaim);
	app.post("/api/payments/paypal/create-order", createPayPalOrder);
	app.post("/api/payments/paypal/capture", capturePayPalOrder);
	app.get("/api/releases", getScheduledReleases);
	app.post("/api/releases", createScheduledRelease);
	app.post("/api/releases/book", bookRelease);
	app.get("/api/wall/feed", getWallFeed);
	app.get("/api/public/stats", async (_req, res) => {
		try {
			const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
			if (error) throw error;
			const total = data?.total ?? data?.users?.length ?? 0;
			if (!total) {
				const { count } = await supabase.from("users").select("*", {
					count: "exact",
					head: true
				});
				return res.json({ userCount: count ?? 0 });
			}
			res.json({ userCount: total });
		} catch {
			try {
				const { count } = await supabase.from("users").select("*", {
					count: "exact",
					head: true
				});
				res.json({ userCount: count ?? 0 });
			} catch {
				res.json({ userCount: 0 });
			}
		}
	});
	app.delete("/api/account", async (req, res) => {
		try {
			if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
			await supabase.from("users").delete().eq("id", req.user.id);
			return res.json({ success: true });
		} catch {
			return res.status(500).json({ error: "Failed to delete account" });
		}
	});
	app.get("/api/ping", (_req, res) => {
		const ping = process.env.PING_MESSAGE ?? "ping";
		res.json({ message: ping });
	});
	app.get("/api/demo", handleDemo);
	return app;
}
//#endregion
//#region server/node-build.ts
var app = createServer();
var port = process.env.PORT || 3e3;
var __dirname = import.meta.dirname;
var distPath = path.join(__dirname, "../spa");
app.use(express$1.static(distPath));
app.get("*", (req, res) => {
	if (req.path.startsWith("/api/") || req.path.startsWith("/health")) return res.status(404).json({ error: "API endpoint not found" });
	res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
	console.log(`🚀 Fusion Starter server running on port ${port}`);
	console.log(`📱 Frontend: http://localhost:${port}`);
	console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
	console.log("🛑 Received SIGTERM, shutting down gracefully");
	process.exit(0);
});
process.on("SIGINT", () => {
	console.log("🛑 Received SIGINT, shutting down gracefully");
	process.exit(0);
});
//#endregion
export {};

//# sourceMappingURL=node-build.mjs.map