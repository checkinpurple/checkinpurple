import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, TrendingUp, Users, Star, ExternalLink,
  Instagram, Twitter, Globe, Coins, AlertTriangle,
  CheckCircle, Send, UserPlus, UserCheck, Music
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import OGMeta from "@/components/OGMeta";
import AppSidebar from "@/components/AppSidebar";

interface InfluencerUser {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  is_verified?: boolean;
  social_instagram?: string;
  social_twitter?: string;
  social_tiktok?: string;
  social_youtube?: string;
  influencer_reach?: string;
  influencer_platforms?: string[];
  influencer_rate?: string;
  follower_count?: number;
}

interface ActivePromo {
  id: string;
  artist_username: string;
  track_title?: string;
  note?: string;
  commission_offer?: string;
  status: string;
  created_at: string;
}

export default function InfluencerPublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [influencer, setInfluencer] = useState<InfluencerUser | null>(null);
  const [promos, setPromos] = useState<ActivePromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [showDealForm, setShowDealForm] = useState(false);
  const [dealOffer, setDealOffer] = useState("");
  const [dealNote, setDealNote] = useState("");
  const [dealSent, setDealSent] = useState(false);
  const [dealLoading, setDealLoading] = useState(false);
  const [tab, setTab] = useState<"about" | "promos">("about");

  const isOwn = user?.username === username;
  const isArtist = user?.profiles?.includes("artist") || user?.role === "artist";

  useEffect(() => {
    if (!username) return;
    fetchInfluencer();
  }, [username]);

  const fetchInfluencer = async () => {
    try {
      const { data } = await supabase
        .from("users")
        .select("id, username, avatar_url, bio, location, is_verified, social_instagram, social_twitter, social_tiktok, social_youtube, influencer_reach, influencer_platforms, influencer_rate")
        .eq("username", username)
        .single();

      if (!data) { setLoading(false); return; }
      setInfluencer(data);

      // Active promos (accepted influencer deals)
      const { data: dealData } = await supabase
        .from("influencer_deals")
        .select("id, artist_username, track_title, note, commission_offer, status, created_at")
        .eq("influencer_id", data.id)
        .eq("status", "accepted")
        .order("created_at", { ascending: false })
        .limit(10);
      setPromos(dealData || []);

      // Follow check
      if (user && user.id !== data.id) {
        const { data: f } = await supabase
          .from("follows").select("id")
          .eq("follower_id", user.id).eq("following_id", data.id).single();
        setIsFollowing(!!f);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const toggleFollow = async () => {
    if (!user) { navigate("/signin"); return; }
    if (!influencer) return;
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", influencer.id);
      setIsFollowing(false); setFollowerCount(c => Math.max(0, c - 1));
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: influencer.id });
      setIsFollowing(true); setFollowerCount(c => c + 1);
    }
  };

  const sendDeal = async () => {
    if (!user || !influencer || !dealOffer) return;
    setDealLoading(true);
    try {
      const res = await fetch("/api/influencer/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({
          influencer_id: influencer.id,
          amount_zar: parseFloat(dealOffer.replace(/[^0-9.]/g, "")) || 0,
          notes: `${dealOffer}\n${dealNote}`,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setDealSent(true);
    } catch {}
    finally { setDealLoading(false); }
  };

  const PLATFORM_ICONS: Record<string, string> = {
    instagram: "📸", twitter: "𝕏", tiktok: "🎵", youtube: "▶️", facebook: "📘",
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );

  if (!influencer) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <AlertTriangle className="w-10 h-10 text-muted-foreground" />
      <p className="text-muted-foreground">Influencer not found.</p>
      <Link to="/" className="text-primary underline text-sm">Go Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {user && <AppSidebar />}

      <OGMeta
        title={`${influencer.username} · Influencer on CheckinPurple`}
        description={influencer.bio || `${influencer.username} promotes music on CheckinPurple. ${influencer.influencer_reach ? `Reach: ${influencer.influencer_reach}` : ""}`}
        image={influencer.avatar_url}
        url={`${window.location.origin}/influencer/${influencer.username}`}
        type="profile"
      />

      <main className={`flex-1 ${user ? "lg:ml-56" : ""} pt-${user ? "16 lg:pt-0" : "6"}`}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {influencer.avatar_url
                ? <img src={influencer.avatar_url} alt={influencer.username} className="w-full h-full rounded-2xl object-cover" />
                : influencer.username[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold">{influencer.username}</h1>
                {influencer.is_verified && <CheckCircle className="w-5 h-5 text-primary" />}
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">Influencer</span>
              </div>

              {influencer.influencer_reach && (
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {influencer.influencer_reach} reach
                </p>
              )}

              {/* Platform tags */}
              {influencer.influencer_platforms && influencer.influencer_platforms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {influencer.influencer_platforms.map(p => (
                    <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-card border border-border/40 text-muted-foreground">
                      {PLATFORM_ICONS[p] || "🌐"} {p}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {!isOwn && (
                  <button onClick={toggleFollow}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isFollowing ? "bg-card border border-border/40 text-muted-foreground" : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}>
                    {isFollowing ? <><UserCheck className="w-4 h-4" />Following</> : <><UserPlus className="w-4 h-4" />Follow</>}
                  </button>
                )}
                {isArtist && !isOwn && (
                  <button onClick={() => setShowDealForm(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20 transition-colors">
                    <TrendingUp className="w-4 h-4" /> Propose Deal
                  </button>
                )}
                {influencer.social_instagram && (
                  <a href={`https://instagram.com/${influencer.social_instagram}`} target="_blank" rel="noreferrer"
                    className="p-2 rounded-lg border border-border/40 hover:bg-card/50 transition-colors">
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {influencer.social_twitter && (
                  <a href={`https://twitter.com/${influencer.social_twitter}`} target="_blank" rel="noreferrer"
                    className="p-2 rounded-lg border border-border/40 hover:bg-card/50 transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Rate */}
          {influencer.influencer_rate && (
            <div className="p-4 rounded-xl border border-pink-500/20 bg-pink-500/5 mb-5">
              <p className="text-sm font-semibold flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-pink-400" /> Promotion Rate
              </p>
              <p className="text-sm text-muted-foreground">{influencer.influencer_rate}</p>
              <p className="text-xs text-pink-400 mt-1">Commission is negotiated directly with the artist — not a CheckinPurple cut.</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/40 mb-5">
            {[
              { id: "about", label: "About" },
              { id: "promos", label: `Active Promos (${promos.length})` },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id ? "border-pink-400 text-pink-400" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "about" && (
            <div className="space-y-3">
              {influencer.bio ? (
                <div className="p-4 rounded-xl border border-border/40 bg-card/30">
                  <p className="text-sm leading-relaxed text-muted-foreground">{influencer.bio}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No bio yet.</p>
              )}
            </div>
          )}

          {tab === "promos" && (
            <div className="space-y-3">
              {promos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No active promotions right now.</p>
              ) : promos.map(p => (
                <div key={p.id} className="p-4 rounded-xl border border-border/40 bg-card/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Music className="w-4 h-4 text-pink-400" />
                    <p className="font-semibold text-sm">@{p.artist_username}</p>
                    {p.track_title && <span className="text-xs text-muted-foreground">— {p.track_title}</span>}
                  </div>
                  {p.note && <p className="text-xs text-muted-foreground mb-1">{p.note}</p>}
                  <p className="text-xs text-pink-400">Commission: {p.commission_offer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Deal proposal modal */}
      {showDealForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDealForm(false)}>
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border/40" onClick={e => e.stopPropagation()}>
            {dealSent ? (
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="font-semibold">Deal proposal sent!</p>
                <p className="text-sm text-muted-foreground mt-1">{influencer.username} will review it.</p>
                <button onClick={() => setShowDealForm(false)} className="mt-4 px-4 py-2 rounded-lg border border-border/40 text-sm">Close</button>
              </div>
            ) : (
              <>
                <h3 className="font-bold mb-1">Propose a Promotion Deal</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Your commission is paid from your artist earnings — not a CheckinPurple platform fee.
                </p>
                <div className="space-y-3 mb-4">
                  <input value={dealOffer} onChange={e => setDealOffer(e.target.value)}
                    placeholder="Commission offer (e.g. 10% of tips, R500 flat)"
                    className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  <textarea value={dealNote} onChange={e => setDealNote(e.target.value)} rows={3}
                    placeholder="Tell them about your track and what you need promoted..."
                    className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowDealForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border/40 text-sm">Cancel</button>
                  <button onClick={sendDeal} disabled={dealLoading || !dealOffer}
                    className="flex-1 px-4 py-2 rounded-lg bg-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                    {dealLoading ? "Sending..." : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
