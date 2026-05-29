import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp, Users, Link as LinkIcon, Coins, Copy, Check,
  Star, Zap, Music, Headphones, Play, Pause, Radio,
  Search, ExternalLink
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AppSidebar from "@/components/AppSidebar";

interface InfluencerStats {
  totalEarned: number;
  referrals: number;
  activePromotions: number;
  thisMonthEarned: number;
}

interface Promotion {
  id: string;
  artistUsername: string;
  referralCode: string;
  tipsGenerated: number;
  earned: number;
  status: string;
  commissionRate: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  genre?: string;
}

export default function InfluencerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<InfluencerStats>({ totalEarned: 0, referrals: 0, activePromotions: 0, thisMonthEarned: 0 });
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [tab, setTab] = useState<"promotions" | "discover" | "earnings">("promotions");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchArtist, setSearchArtist] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);
  const [discoverTracks, setDiscoverTracks] = useState<Track[]>([]);

  const referralLink = `${window.location.origin}/signup?ref=${user?.id?.slice(0, 8)}`;

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    if (!user.profiles?.includes("influencer") && user.role !== "influencer" && user.role !== "admin") {
      navigate("/dashboard"); return;
    }
    setLoading(false);
    // Fetch real streams for discover tab
    fetch("/api/streams/active")
      .then(r => r.json())
      .then(d => {
        if (d.streams && d.streams.length > 0) {
          const tracks = d.streams.map((s: any) => ({
            id: s.id,
            title: s.title || "Live Stream",
            artist: s.artist_username || s.username || "Artist",
            duration: "LIVE",
            genre: s.genre || "Music",
            isLive: true,
          }));
          setDiscoverTracks(tracks);
        }
      })
      .catch(() => {});
  }, [user]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!user) return null;

  const TABS = [
    { id: "promotions", label: "Promotions" },
    { id: "discover", label: "Discover Music" },
    { id: "earnings", label: "Earnings" },
  ] as { id: typeof tab; label: string }[];

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />

      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Influencer Hub</h1>
              <p className="text-xs text-muted-foreground">Promote artists · Earn your commission</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Earned", value: `${stats.totalEarned} coins`, color: "text-pink-400" },
              { label: "This Month", value: `${stats.thisMonthEarned} coins`, color: "text-purple-400" },
              { label: "Referrals", value: stats.referrals, color: "text-accent" },
              { label: "Active Deals", value: stats.activePromotions, color: "text-orange-400" },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl border border-border/40 bg-card/30">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Referral Link */}
          <div className="p-4 rounded-xl border border-pink-500/20 bg-pink-500/5 mb-6">
            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-pink-400" /> Your Referral Link
            </p>
            <div className="flex gap-2">
              <input value={referralLink} readOnly className="flex-1 bg-background border border-border/40 rounded-lg px-3 py-2 text-xs text-muted-foreground" />
              <button onClick={() => copyToClipboard(referralLink, "ref")}
                className="px-3 py-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 transition-colors">
                {copiedCode === "ref" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/40 mb-5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id ? "border-pink-400 text-pink-400" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Promotions Tab */}
          {tab === "promotions" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border/40 bg-card/30">
                <p className="text-sm font-semibold mb-1">Find an Artist to Promote</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Browse artist profiles and send a deal proposal. Your commission is negotiated directly with the artist — it comes from their earnings, not CheckinPurple's cut.
                </p>
                <div className="flex gap-2">
                  <input
                    value={searchArtist}
                    onChange={e => setSearchArtist(e.target.value)}
                    placeholder="Search artist username..."
                    className="flex-1 bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                  />
                  <Link
                    to={searchArtist ? `/artist/${searchArtist}` : "#"}
                    className="px-4 py-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-medium hover:bg-pink-500/20 transition-colors flex items-center gap-1"
                  >
                    <Search className="w-4 h-4" /> Find
                  </Link>
                </div>
              </div>

              {promotions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No active promotions yet. Browse artist profiles and send a deal proposal.
                </div>
              ) : promotions.map(p => (
                <div key={p.id} className="p-4 rounded-xl border border-border/40 bg-card/30 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{p.artistUsername}</p>
                    <p className="text-xs text-muted-foreground">Commission: {p.commissionRate}</p>
                    <p className="text-xs text-muted-foreground">{p.tipsGenerated} tips generated · {p.earned} coins earned</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === "active" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                    }`}>{p.status}</span>
                    <button onClick={() => copyToClipboard(p.referralCode, p.id)}
                      className="p-1.5 rounded-lg border border-border/40 hover:bg-card/50">
                      {copiedCode === p.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Discover Music Tab */}
          {tab === "discover" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">Listen to tracks, find artists to promote, and build your music taste.</p>
              {discoverTracks.map(track => (
                <div key={track.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/30 hover:bg-card/50 transition-colors">
                  <button
                    onClick={() => setPlaying(playing === track.id ? null : track.id)}
                    className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 hover:bg-pink-500/20 flex-shrink-0"
                  >
                    {playing === track.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground">{track.artist} · {track.genre}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{track.duration}</span>
                    <Link to={`/artist/${track.artist.toLowerCase().replace(/\s/g, "")}`}
                      className="p-1.5 rounded-lg border border-border/40 hover:bg-card/50 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Earnings Tab */}
          {tab === "earnings" && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-border/40 bg-card/30 text-center">
                <p className="text-3xl font-bold text-pink-400">{stats.totalEarned}</p>
                <p className="text-sm text-muted-foreground">Total Coins Earned</p>
              </div>
              <div className="p-4 rounded-xl border border-border/40 bg-card/30">
                <p className="text-sm font-semibold mb-2">How commissions work</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your commission is negotiated directly with each artist. When fans you refer tip an artist, your agreed percentage comes from the artist's share — CheckinPurple does not take a cut from your commission.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
