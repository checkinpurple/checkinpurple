import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { logCoinRiskEvent } from "../lib/coin-risk";
import {
  SubscriptionTier,
  UserSubscription,
  CoinPackage,
  UserCoins,
  CoinTransaction,
  ScheduledRelease,
  ReleaseBooking,
  Tip,
  PurchaseCoinsRequest,
  TipArtistRequest,
  CreateScheduledReleaseRequest,
  BookReleaseRequest,
  PaymentMethod
} from "@shared/api";

// Helper: Check if user can create tracks based on subscription
export async function canCreateTrack(userId: string): Promise<{ allowed: boolean; reason?: string; limit?: number }> {
  try {
    // Get user's current subscription
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription_tiers!inner(track_limit)
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (subError || !subscription) {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (!userError && user?.role === 'admin') {
        return { allowed: true };
      }

      // Check track count for free user
      const { count, error: countError } = await supabase
        .from("tracks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (!countError && count !== null && count >= 10) {
        return { allowed: false, reason: "Track limit reached. Upgrade to Standard for unlimited tracks.", limit: 10 };
      }
      return { allowed: true, limit: 10 };
    }

    // Check track limit for subscription tier
    const trackLimit = (subscription.subscription_tiers as any)?.track_limit;
    if (trackLimit) {
      const { count, error: countError } = await supabase
        .from("tracks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (!countError && count !== null && count >= trackLimit) {
        return { allowed: false, reason: `Track limit (${trackLimit}) reached.`, limit: trackLimit };
      }
    }

    return { allowed: true, limit: trackLimit };
  } catch (error) {
    console.error("Error checking track limit:", error);
    return { allowed: true }; // Allow on error
  }
}

// Get all subscription tiers
export const getSubscriptionTiers: RequestHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("subscription_tiers")
      .select("*")
      .order("price_monthly");

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error getting subscription tiers:", error);
    res.status(500).json({ error: "Failed to get subscription tiers" });
  }
};

// Get user's current subscription
export const getUserSubscription: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription_tiers (*)
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

    res.json(data || null);
  } catch (error) {
    console.error("Error getting user subscription:", error);
    res.status(500).json({ error: "Failed to get user subscription" });
  }
};

// Subscribe to a tier
export const subscribeToTier: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const tier_id = req.body?.tier_id || req.body?.tierId;

    if (!userId || !tier_id) {
      return res.status(400).json({ error: "tier_id required" });
    }

    // Check if user already has an active subscription
    const { data: existing } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .update({
          tier_id,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", existing.id)
        .select(`
          *,
          subscription_tiers (*)
        `)
        .single();

      if (error) throw error;
      return res.json(data);
    }

    const { data, error } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        tier_id,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select(`
        *,
        subscription_tiers (*)
      `)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error subscribing to tier:", error);
    res.status(500).json({ error: "Failed to subscribe" });
  }
};

// Get coin packages
export const getCoinPackages: RequestHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("coin_packages")
      .select("*")
      .eq("is_active", true)
      .order("price_usd");

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error getting coin packages:", error);
    res.status(500).json({ error: "Failed to get coin packages" });
  }
};

// Get user coin balance
export const getUserCoins: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data, error } = await supabase
      .from("user_coins")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json(data || { balance: 0, total_earned: 0, total_spent: 0 });
  } catch (error) {
    console.error("Error getting user coins:", error);
    res.status(500).json({ error: "Failed to get user coins" });
  }
};

// Purchase coins
export const purchaseCoins: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { package_id }: PurchaseCoinsRequest = req.body;

    if (!userId || !package_id) {
      return res.status(400).json({ error: "package_id required" });
    }

    // Get package details
    const { data: pkg, error: pkgError } = await supabase
      .from("coin_packages")
      .select("*")
      .eq("id", package_id)
      .single();

    if (pkgError) throw pkgError;

    if (pkg.coin_amount > 20000) {
      await logCoinRiskEvent(userId, "purchase", "Large coin package purchase", "medium", { package_id, coin_amount: pkg.coin_amount });
    }

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from("coin_transactions")
      .insert({
        user_id: userId,
        transaction_type: "purchase",
        amount: pkg.coin_amount,
        description: `Purchased ${pkg.name}`
      })
      .select()
      .single();

    if (txError) throw txError;

    // Update user balance
    const { data: updatedCoins, error: updateError } = await supabase
      .rpc("increment_user_coins", {
        user_id: userId,
        amount: pkg.coin_amount
      });

    if (updateError) throw updateError;

    res.json({ transaction, new_balance: updatedCoins });
  } catch (error) {
    console.error("Error purchasing coins:", error);
    res.status(500).json({ error: "Failed to purchase coins" });
  }
};

// Tip an artist
export const tipArtist: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { to_user_id, stream_id, amount, message }: TipArtistRequest = req.body;

    if (!userId || !to_user_id || !amount) {
      return res.status(400).json({ error: "to_user_id and amount required" });
    }

    // Check user has enough coins
    const { data: userCoins, error: balanceError } = await supabase
      .from("user_coins")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (balanceError) throw balanceError;

    if (!userCoins || userCoins.balance < amount) {
      await logCoinRiskEvent(userId, "tip", "Insufficient balance tip attempt", "high", { to_user_id, amount, balance: userCoins?.balance ?? 0 });
      return res.status(400).json({ error: "Insufficient coin balance" });
    }

    // Create tip
    const { data: tip, error: tipError } = await supabase
      .from("tips")
      .insert({
        from_user_id: userId,
        to_user_id,
        stream_id,
        amount,
        message
      })
      .select()
      .single();

    if (tipError) throw tipError;

    if (amount >= 5000) {
      await logCoinRiskEvent(userId, "tip", "High-value tip", "medium", { to_user_id, amount, stream_id: stream_id || null });
    }

    // Create transaction for spending
    await supabase
      .from("coin_transactions")
      .insert({
        user_id: userId,
        transaction_type: "tip",
        amount: -amount,
        description: `Tipped artist`,
        reference_id: tip.id
      });

    // Update balances
    await supabase.rpc("decrement_user_coins", {
      user_id: userId,
      amount: amount
    });

    await supabase.rpc("increment_user_coins", {
      user_id: to_user_id,
      amount: amount
    });

    // In-app notification to artist
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

// Get scheduled releases
export const getScheduledReleases: RequestHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("scheduled_releases")
      .select("*")
      .eq("status", "scheduled")
      .order("release_date");

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error getting scheduled releases:", error);
    res.status(500).json({ error: "Failed to get scheduled releases" });
  }
};

// Create scheduled release (Standard tier only)
export const createScheduledRelease: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { title, description, release_date, price_coins, max_bookings }: CreateScheduledReleaseRequest = req.body;

    if (!userId || !title || !release_date) {
      return res.status(400).json({ error: "title and release_date required" });
    }

    // Check if user has Standard subscription
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription_tiers!inner(name)
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    let hasStandardAccess = false;

    if (!subError && subscription && (subscription.subscription_tiers as any)?.name === 'Standard') {
      hasStandardAccess = true;
    }

    if (!hasStandardAccess) {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (!userError && user?.role === 'admin') {
        hasStandardAccess = true;
      }
    }

    if (!hasStandardAccess) {
      return res.status(403).json({ error: "Standard subscription required" });
    }

    const { data, error } = await supabase
      .from("scheduled_releases")
      .insert({
        user_id: userId,
        title,
        description,
        release_date,
        price_coins: price_coins || 0,
        max_bookings
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error creating scheduled release:", error);
    res.status(500).json({ error: "Failed to create scheduled release" });
  }
};

// Payment methods
export const getPaymentMethods: RequestHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error getting payment methods:", error);
    res.status(500).json({ error: "Failed to get payment methods" });
  }
};

export const createPaymentMethod: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, type, url, method, currency, amount, coins, paypalEmail, bankName, accountNumber, branchCode }:
      { name?: string; type?: string; url?: string; method?: string; currency?: string; amount?: number; coins?: number; paypalEmail?: string; bankName?: string; accountNumber?: string; branchCode?: string } = req.body;

    // Payout withdrawal request (from Wallet page)
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
        status: "pending",
      }).select().single();

      if (error && error.code !== "42P01") throw error; // ignore missing table gracefully

      // Send admin email via Resend
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
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
              `,
            }),
          });
        } catch (emailErr) {
          console.error("Payout email failed (non-fatal):", emailErr);
        }
      }

      return res.json({ success: true, message: "Payout request submitted" });
    }

    // Legacy: add a payment method to the platform catalogue
    if (!name || !type) return res.status(400).json({ error: "name and type required" });

    const { data, error } = await supabase
      .from("payment_methods")
      .insert({ name, type, url, is_active: true })
      .select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error creating payment method:", error);
    res.status(500).json({ error: "Failed to create payment method" });
  }
};

// Book a release
export const bookRelease: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { release_id }: BookReleaseRequest = req.body;

    if (!userId || !release_id) {
      return res.status(400).json({ error: "release_id required" });
    }

    // Check if release exists and has capacity
    const { data: release, error: releaseError } = await supabase
      .from("scheduled_releases")
      .select("*")
      .eq("id", release_id)
      .single();

    if (releaseError) throw releaseError;

    if (release.max_bookings && release.current_bookings >= release.max_bookings) {
      return res.status(400).json({ error: "Release is fully booked" });
    }

    // Check user has enough coins if there's a price
    if (release.price_coins > 0) {
      const { data: userCoins, error: balanceError } = await supabase
        .from("user_coins")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (balanceError) throw balanceError;

      if (!userCoins || userCoins.balance < release.price_coins) {
        return res.status(400).json({ error: "Insufficient coin balance" });
      }
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("release_bookings")
      .insert({
        release_id,
        user_id: userId
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Update booking count
    await supabase
      .from("scheduled_releases")
      .update({ current_bookings: release.current_bookings + 1 })
      .eq("id", release_id);

    // Process payment if applicable
    if (release.price_coins > 0) {
      await supabase.rpc("transfer_coins", {
        from_user_id: userId,
        to_user_id: release.user_id,
        amount: release.price_coins
      });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error booking release:", error);
    res.status(500).json({ error: "Failed to book release" });
  }
};

// Get tips for a user
export const getUserTips: RequestHandler = async (req, res) => {
  try {
    const userId = req.query.user_id as string;
    if (!userId) {
      return res.status(400).json({ error: "user_id required" });
    }

    const { data, error } = await supabase
      .from("tips")
      .select(`
        *,
        users!tips_from_user_id_fkey(username)
      `)
      .eq("to_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error getting user tips:", error);
    res.status(500).json({ error: "Failed to get user tips" });
  }
};
