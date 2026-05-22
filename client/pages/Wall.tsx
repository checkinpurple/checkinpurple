import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Play, Pause, Heart, MessageCircle, Share2, ExternalLink,
  Music, TrendingUp, ShoppingBag, Video, Mic, Radio,
  ChevronRight, Volume2, VolumeX, Repeat, Star, Coins
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AppSidebar from "@/components/AppSidebar";

type PostType = "reel" | "snippet" | "promo" | "catalogue" | "stream" | "gig";

interface WallPost {
  id: string;
  type: PostType;
  author: string;
  authorRole: "artist" | "influencer" | "merchant" | "fan";
  authorAvatar?: string;
  verified?: boolean;
  timestamp: string;
  caption?: string;
  // reel / snippet
  mediaUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  trackTitle?: string;
  genre?: string;
  // promo
  promoArtist?: string;
  promoTrack?: string;
  commissionNote?: string;
  // catalogue
  products?: { id: string; name: string; price: string; image?: string; category: string }[];
  // stream
  isLive?: boolean;
  viewerCount?: number;
  // engagement
  likes: number;
  comments: number;
  liked?: boolean;
}

// Fallback mock feed
const MOCK_POSTS: WallPost[] = [
  {
    id: "1", type: "stream", author: "Nova Shade", authorRole: "artist", verified: true,
    timestamp: "Live now", isLive: true, viewerCount: 247,
    caption: "🔴 LIVE — Amapiano session, come through!",
    thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600",
    likes: 84, comments: 32,
  },
  {
    id: "2", type: "reel", author: "Mira Lane", authorRole: "artist",
    timestamp: "2h ago", trackTitle: "City Glow", genre: "Afrobeats",
    caption: "New snippet from City Glow 🌆 dropping Friday",
    thumbnailUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600",
    duration: "0:30", likes: 312, comments: 45,
  },
  {
    id: "3", type: "snippet", author: "Reel Beats", authorRole: "artist",
    timestamp: "4h ago", trackTitle: "Midnight Vibes", genre: "Hip Hop",
    caption: "Listen to this — Midnight Vibes snippet 🎧",
    thumbnailUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600",
    duration: "1:10", likes: 198, comments: 18,
  },
  {
    id: "4", type: "promo", author: "StylexKing", authorRole: "influencer",
    timestamp: "5h ago",
    caption: "This track by @ZaraSol is absolutely 🔥 — link in bio to listen and tip her!",
    promoArtist: "Zara Sol", promoTrack: "Golden Hour",
    thumbnailUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600",
    commissionNote: "Commission negotiated directly with the artist",
    likes: 541, comments: 77,
  },
  {
    id: "5", type: "catalogue", author: "ThreadsBy_Ama", authorRole: "merchant",
    timestamp: "6h ago",
    caption: "New drops for the culture 🧵 — dressed for the stage, priced for real life",
    products: [
      { id: "p1", name: "Stage Jacket", price: "R890", category: "Fashion", image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200" },
      { id: "p2", name: "Artist Hoodie", price: "R420", category: "Merch", image: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=200" },
      { id: "p3", name: "Tour Tee", price: "R180", category: "Merch", image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=200" },
    ],
    likes: 129, comments: 14,
  },
  {
    id: "6", type: "snippet", author: "KDot Wave", authorRole: "artist",
    timestamp: "8h ago", trackTitle: "Frequency", genre: "Electronic",
    caption: "Late night studio session 🎛️ — frequency is almost ready",
    thumbnailUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600",
    duration: "0:45", likes: 87, comments: 6,
  },
  {
    id: "7", type: "promo", author: "InfluenceHub_ZA", authorRole: "influencer",
    timestamp: "10h ago",
    caption: "Caught @NovaShade live last night — go check the replay and support! This artist is the real deal 💜",
    promoArtist: "Nova Shade", promoTrack: "Purple Nights",
    thumbnailUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600",
    commissionNote: "Artist-negotiated deal",
    likes: 203, comments: 29,
  },
  {
    id: "8", type: "catalogue", author: "LuxeByNdovi", authorRole: "merchant",
    timestamp: "12h ago",
    caption: "Music and fashion are one 🎶👗 — styling artists, one fit at a time",
    products: [
      { id: "p4", name: "Performance Set", price: "R1200", category: "Fashion", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200" },
      { id: "p5", name: "VIP Ticket — Live Show", price: "R350", category: "Ticket", image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200" },
    ],
    likes: 67, comments: 9,
  },
];

const ROLE_COLORS: Record<string, string> = {
  artist: "bg-purple-500/20 text-purple-400",
  influencer: "bg-pink-500/20 text-pink-400",
  merchant: "bg-orange-500/20 text-orange-400",
  fan: "bg-accent/20 text-accent",
};

const TYPE_LABELS: Record<PostType, { label: string; color: string; icon: React.ReactNode }> = {
  reel: { label: "Reel", color: "bg-red-500/20 text-red-400", icon: <Video className="w-3 h-3" /> },
  snippet: { label: "Song Snippet", color: "bg-purple-500/20 text-purple-400", icon: <Music className="w-3 h-3" /> },
  promo: { label: "Influencer Promo", color: "bg-pink-500/20 text-pink-400", icon: <TrendingUp className="w-3 h-3" /> },
  catalogue: { label: "Merchant Drop", color: "bg-orange-500/20 text-orange-400", icon: <ShoppingBag className="w-3 h-3" /> },
  stream: { label: "Live", color: "bg-red-500 text-white", icon: <Radio className="w-3 h-3" /> },
  gig: { label: "Gig", color: "bg-green-500/20 text-green-400", icon: <Mic className="w-3 h-3" /> },
};

function PostCard({ post, onLike }: { post: WallPost; onLike: (id: string) => void }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const typeMeta = TYPE_LABELS[post.type];

  return (
    <article className="border border-border/40 bg-card/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {post.author[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/artist/${post.author.toLowerCase().replace(/\s/g, "")}`} className="font-semibold text-sm hover:underline">
              {post.author}
            </Link>
            {post.verified && <span className="text-primary text-xs">✓</span>}
            <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize ${ROLE_COLORS[post.authorRole]}`}>{post.authorRole}</span>
          </div>
          <p className="text-xs text-muted-foreground">{post.timestamp}</p>
        </div>
        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${typeMeta.color}`}>
          {typeMeta.icon} {typeMeta.label}
        </span>
      </div>

      {/* Caption */}
      {post.caption && (
        <p className="px-4 py-2 text-sm leading-relaxed">{post.caption}</p>
      )}

      {/* Media — Reel / Snippet / Stream / Promo */}
      {post.thumbnailUrl && post.type !== "catalogue" && (
        <div className="relative mx-4 mb-3 rounded-xl overflow-hidden bg-black aspect-video">
          <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-80" />

          {post.isLive && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE · {post.viewerCount} watching
            </div>
          )}

          {post.duration && (
            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">{post.duration}</span>
          )}

          {(post.type === "reel" || post.type === "snippet") && (
            <>
              <button
                onClick={() => setPlaying(p => !p)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
                  {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                </div>
              </button>
              <button
                onClick={() => setMuted(m => !m)}
                className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
              >
                {muted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
              </button>
            </>
          )}

          {post.isLive && (
            <Link to="/listen" className="absolute inset-0 flex items-end justify-center pb-4">
              <span className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-full hover:opacity-90 transition-opacity">
                Join Stream
              </span>
            </Link>
          )}

          {/* Track info overlay */}
          {(post.trackTitle || post.promoTrack) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-2">
              <p className="text-white text-xs font-semibold">{post.trackTitle || post.promoTrack}</p>
              {post.genre && <p className="text-white/60 text-xs">{post.genre}</p>}
              {post.promoArtist && <p className="text-white/80 text-xs">by {post.promoArtist}</p>}
            </div>
          )}
        </div>
      )}

      {/* Influencer Promo Note */}
      {post.type === "promo" && post.commissionNote && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-pink-500/5 border border-pink-500/20">
          <p className="text-xs text-pink-400">{post.commissionNote}</p>
        </div>
      )}

      {/* Merchant Catalogue */}
      {post.type === "catalogue" && post.products && (
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
            {post.products.map(p => (
              <div key={p.id} className="flex-shrink-0 w-32 snap-start border border-border/40 bg-background rounded-xl overflow-hidden">
                {p.image && (
                  <img src={p.image} alt={p.name} className="w-full h-20 object-cover" />
                )}
                <div className="p-2">
                  <p className="text-xs font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                  <p className="text-xs font-bold text-orange-400 mt-0.5">{p.price}</p>
                </div>
              </div>
            ))}
            <Link to="/store" className="flex-shrink-0 w-20 snap-start border border-dashed border-border/40 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-card/50 transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">See all</p>
            </Link>
          </div>
        </div>
      )}

      {/* Engagement */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-border/30">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked ? "text-red-400" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Heart className={`w-4 h-4 ${post.liked ? "fill-red-400" : ""}`} />
          {post.likes}
        </button>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="w-4 h-4" />
          {post.comments}
        </button>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto">
          <Share2 className="w-4 h-4" />
          Share
        </button>
        {post.isLive && (
          <Link to="/listen" className="flex items-center gap-1 text-xs text-primary font-semibold hover:opacity-80">
            <Radio className="w-3.5 h-3.5" /> Watch Live
          </Link>
        )}
        {(post.type === "snippet" || post.type === "reel") && (
          <Link to={`/artist/${post.author.toLowerCase().replace(/\s/g, "")}`} className="flex items-center gap-1 text-xs text-primary font-semibold hover:opacity-80 ml-auto">
            <ExternalLink className="w-3.5 h-3.5" /> Artist Profile
          </Link>
        )}
      </div>
    </article>
  );
}

const FILTERS: { id: PostType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "stream", label: "🔴 Live" },
  { id: "reel", label: "Reels" },
  { id: "snippet", label: "Snippets" },
  { id: "promo", label: "Promos" },
  { id: "catalogue", label: "Drops" },
];

export default function Wall() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [filter, setFilter] = useState<PostType | "all">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/wall/feed");
        const data = await res.json();
        if (data.success && Array.isArray(data.posts)) setPosts(data.posts);
        else setPosts([]);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const handleLike = (id: string) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const filtered = filter === "all" ? posts : posts.filter(p => p.type === filter);
  const liveCount = posts.filter(p => p.isLive).length;

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />

      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0">
        <div className="max-w-xl mx-auto px-4 py-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Wall</h1>
              <p className="text-xs text-muted-foreground">Reels · Snippets · Promos · Drops</p>
            </div>
            {liveCount > 0 && (
              <Link to="/listen" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                {liveCount} Live
              </Link>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 snap-x">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex-shrink-0 snap-start px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card/50 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-card"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="border border-border/40 bg-card/30 rounded-2xl h-64 animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Nothing here yet. Follow artists and creators to fill your wall.
              </div>
            ) : (
              filtered.map(post => (
                <PostCard key={post.id} post={post} onLike={handleLike} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
