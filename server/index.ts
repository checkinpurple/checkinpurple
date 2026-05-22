import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  createStream,
  endStream,
  getStream,
  updateListenerCount,
  listActiveStreams,
} from "./routes/streams";
import {
  getFollows,
  followUser,
  unfollowUser,
  getLikes,
  likeStream,
  unlikeStream,
  getComments,
  addComment,
  deleteComment,
} from "./routes/social";
import { trackEvent, getEvents } from "./routes/analytics";
import { handleWebhook } from "./routes/webhooks";
import { healthCheck } from "./routes/health";
import {
  getSubscriptionTiers,
  getUserSubscription,
  subscribeToTier,
  getCoinPackages,
  getUserCoins,
  purchaseCoins,
  tipArtist,
  getScheduledReleases,
  createScheduledRelease,
  bookRelease,
  getUserTips,
  getPaymentMethods,
  createPaymentMethod,
} from "./routes/subscriptions";
import { manualClaim, createPayPalOrder, capturePayPalOrder } from "./routes/payments";
import { getMyProfiles, addProfile, switchActiveProfile } from "./routes/profiles";
import {
  upsertArtistProfile,
  getArtistProfile,
  createArtistEvent,
  listArtistEvents,
  getFanUpdates,
  createBookingRequest,
  listMyBookingRequests,
  updateBookingRequestStatus,
} from "./routes/artist";
import { createLivepeerStreamKey } from "./routes/livepeer";
import { listUsers, updateUserRole, setUserBanned, listSubmissions } from "./routes/admin";
import { listParties } from "./routes/parties";
import { listMyPlaylists, createPlaylist, buyPlaylistSlotWithCoins } from "./routes/playlists";
import { getWallFeed } from "./routes/wall";
import { supabase } from "./lib/supabase";
import {
  getStoreSettings,
  updateStoreSettings,
  getMerchantProducts,
  getPublicProducts,
  createProduct,
  getMerchantOrders,
} from "./routes/store";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

// Auth middleware
const authMiddleware: express.RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Allow anonymous for some routes
    }

    const token = authHeader.substring(7);
    // For simplicity, assume token is user id (in production, verify JWT)
    req.user = { id: token };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    next();
  }
};

// Logging middleware
const loggingMiddleware: express.RequestHandler = (req, res, next) => {
  const start = Date.now();
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(loggingMiddleware);
  app.use(authMiddleware);

  // Stream management routes
  app.post("/api/streams", createStream);
  app.get("/api/streams", listActiveStreams);
  app.get("/api/streams/:streamId", getStream);
  app.post("/api/streams/:streamId/listeners", updateListenerCount);
  app.delete("/api/streams/:streamId", endStream);

  // Livepeer
  app.post("/api/stream/livepeer-key", createLivepeerStreamKey);

  // Profiles
  app.get("/api/profiles", getMyProfiles);
  app.post("/api/profiles", addProfile);
  app.post("/api/profiles/switch", switchActiveProfile);

  // Artist profile & updates
  app.put("/api/artist/profile", upsertArtistProfile);
  app.get("/api/artist/:artistId/profile", getArtistProfile);
  app.post("/api/artist/events", createArtistEvent);
  app.get("/api/artist/:artistId/events", listArtistEvents);
  app.get("/api/fan/updates/events", getFanUpdates);

  // Bookings (fan -> artist)
  app.post("/api/bookings", createBookingRequest);
  app.get("/api/bookings", listMyBookingRequests);
  app.patch("/api/bookings/:id", updateBookingRequestStatus);

  // Social routes
  app.get("/api/social/follows", getFollows);
  app.post("/api/social/follow", followUser);
  app.delete("/api/social/follow", unfollowUser);
  app.get("/api/social/likes", getLikes);
  app.post("/api/social/like", likeStream);
  app.delete("/api/social/like", unlikeStream);
  app.get("/api/social/comments", getComments);
  app.post("/api/social/comment", addComment);
  app.delete("/api/social/comment/:id", deleteComment);

  // Analytics routes
  app.post("/api/analytics/track", trackEvent);
  app.get("/api/analytics/events", getEvents);

  // Webhooks
  app.post("/api/webhooks/supabase", handleWebhook);

  // Monitoring
  app.get("/api/health", healthCheck);

  // Admin
  app.get("/api/admin/coin-risk-events", async (req, res) => {
    try {
      if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
      const admin = await supabase.from("users").select("role").eq("id", req.user.id).single();
      if (admin.data?.role !== "admin") return res.status(403).json({ error: "Forbidden" });
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

  // Playlists
  app.get("/api/playlists", listMyPlaylists);
  app.post("/api/playlists", createPlaylist);
  app.post("/api/playlists/buy-slot", buyPlaylistSlotWithCoins);

  // Parties
  app.get("/api/parties", listParties);

  // Store (Merchant)
  app.get("/api/store/settings", getStoreSettings);
  app.post("/api/store/settings", updateStoreSettings);
  app.get("/api/store/products", getMerchantProducts);
  app.get("/api/store/products/public", getPublicProducts);
  app.post("/api/store/products", createProduct);
  app.get("/api/store/orders", getMerchantOrders);

  // Subscription routes
  app.get("/api/subscriptions/tiers", getSubscriptionTiers);
  app.get("/api/subscriptions/user", getUserSubscription);
  app.post("/api/subscriptions/subscribe", subscribeToTier);

  // Payment methods routes
  app.get("/api/payments/methods", getPaymentMethods);
  app.post("/api/payments/methods", createPaymentMethod);

  // Coin routes
  app.get("/api/coins/packages", getCoinPackages);
  app.get("/api/coins/balance", getUserCoins);
  app.post("/api/coins/purchase", purchaseCoins);
  app.post("/api/coins/tip", tipArtist);
  app.get("/api/coins/tips", getUserTips);

  // Payments
  app.post("/api/payments/manual-claim", manualClaim);
  app.post("/api/payments/paypal/create-order", createPayPalOrder);
  app.post("/api/payments/paypal/capture", capturePayPalOrder);

  // Scheduled releases routes
  app.get("/api/releases", getScheduledReleases);
  app.post("/api/releases", createScheduledRelease);
  app.post("/api/releases/book", bookRelease);

    // Wall
  app.get("/api/wall/feed", getWallFeed);

  // Public stats (user count for homepage)
  app.get("/api/public/stats", async (_req, res) => {
    try {
      const { count } = await supabase.from("users").select("*", { count: "exact", head: true });
      res.json({ userCount: count ?? 0 });
    } catch {
      res.json({ userCount: 0 });
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

  // Legacy routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  return app;
}
