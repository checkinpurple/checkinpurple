import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";

type WallType = "reel" | "snippet" | "promo" | "catalogue" | "stream" | "gig";

export const getWallFeed: RequestHandler = async (_req, res) => {
  try {
    const wallRes = await supabase
      .from("wall_posts")
      .select("id,user_id,type,caption,media_url,thumbnail_url,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(40);

    const [streamsRes, productsRes, usersRes] = await Promise.all([
      supabase
        .from("streams")
        .select("id,title,listener_count,status,started_at,user_id")
        .order("started_at", { ascending: false })
        .limit(15),
      supabase
        .from("products")
        .select("id,title,price_zar,category,image_url,created_at,merchant_id")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("users")
        .select("id,username,role,avatar_url,is_verified,created_at,streaming_spotify")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const users = usersRes.data || [];
    if ((wallRes.data || []).length > 0) {
      const mapped = (wallRes.data || []).map((p: any) => {
        const author = users.find((u: any) => u.id === p.user_id);
        return {
          id: p.id,
          type: p.type,
          author: author?.username || "user",
          authorRole: author?.role || "fan",
          authorAvatar: author?.avatar_url || undefined,
          verified: Boolean(author?.is_verified),
          timestamp: new Date(p.created_at).toLocaleString("en-ZA"),
          caption: p.caption || undefined,
          mediaUrl: p.media_url || undefined,
          thumbnailUrl: p.thumbnail_url || undefined,
          ...((p.metadata as any) || {}),
          likes: 0,
          comments: 0,
        };
      });
      return res.json({ success: true, posts: mapped });
    }
    const userMap = new Map(users.map((u) => [u.id, u]));

    const streamPosts = (streamsRes.data || []).map((stream) => {
      const author = userMap.get(stream.user_id);
      return {
        id: `stream_${stream.id}`,
        type: "stream" as WallType,
        author: author?.username || "artist",
        authorRole: (author?.role || "artist") as string,
        authorAvatar: author?.avatar_url || undefined,
        verified: Boolean(author?.is_verified),
        timestamp: stream.status === "live" ? "Live now" : new Date(stream.started_at).toLocaleString("en-ZA"),
        caption: stream.title,
        isLive: stream.status === "live",
        viewerCount: stream.listener_count || 0,
        likes: 0,
        comments: 0,
      };
    });

    const productsByMerchant = new Map<string, any[]>();
    for (const p of productsRes.data || []) {
      const arr = productsByMerchant.get(p.merchant_id) || [];
      arr.push(p);
      productsByMerchant.set(p.merchant_id, arr);
    }

    const cataloguePosts = Array.from(productsByMerchant.entries()).slice(0, 8).map(([merchantId, products]) => {
      const merchant = userMap.get(merchantId);
      return {
        id: `catalogue_${merchantId}`,
        type: "catalogue" as WallType,
        author: merchant?.username || "merchant",
        authorRole: "merchant",
        authorAvatar: merchant?.avatar_url || undefined,
        verified: Boolean(merchant?.is_verified),
        timestamp: "Recently",
        caption: `${merchant?.username || "Merchant"} — store drops available now.`,
        products: products.slice(0, 4).map((p) => ({
          id: p.id,
          name: p.title,
          price: `R${p.price_zar}`,
          image: p.image_url || undefined,
          category: p.category,
        })),
        likes: 0,
        comments: 0,
      };
    });

    const reelPosts = users
      .filter((u) => u.role === "artist" || u.role === "artist_fan")
      .slice(0, 8)
      .map((u, idx) => ({
        id: `reel_${u.id}`,
        type: "reel" as WallType,
        author: u.username,
        authorRole: "artist",
        authorAvatar: u.avatar_url || undefined,
        verified: Boolean(u.is_verified),
        timestamp: "Recently",
        caption: `${u.username} — new music in progress.`,
        thumbnailUrl: u.avatar_url || undefined,
        duration: "0:30",
        trackTitle: "Studio Reel",
        genre: "Music",
        likes: 0,
        comments: 0,
      }));

    const posts = [...streamPosts, ...reelPosts, ...cataloguePosts];

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Wall feed error:", error);
    res.status(500).json({ success: false, error: "Failed to load wall feed" });
  }
};
