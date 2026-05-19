import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radio, TrendingUp, Users, Link as LinkIcon, Coins, Copy, Check, ArrowLeft, Star, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ProfileCard from "@/components/ProfileCard";
import { ADMIN_EMAIL } from "@/lib/config";

interface InfluencerStats {
  totalEarned: number;
  referrals: number;
  activePromotions: number;
  thisMonthEarned: number;
}

interface Promotion {
  id: string;
  artistUsername: string;
  artistAvatar?: string;
  referralCode: string;
  tipsGenerated: number;
  earned: number;
  status: string;
}

interface Referral {
  id: string;
  username: string;
  joinedAt: string;
  coinsSpent: number;
  commissionEarned: number;
}

export default function InfluencerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<InfluencerStats>({ totalEarned: 0, referrals: 0, activePromotions: 0, thisMonthEarned: 0 });
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [tab, setTab] = useState<"promotions" | "referrals" | "earnings">("promotions");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchArtist, setSearchArtist] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);

  const contactEmail = ADMIN_EMAIL;
  const [influencerSocialLinks, setInfluencerSocialLinks] = useState([
    { platform: "TikTok", url: "https://tiktok.com/@yourprofile", activity: "150K views" },
    { platform: "Facebook", url: "https://facebook.com/yourpage", activity: "22K followers" },
    { platform: "Instagram", url: "https://instagram.com/yourprofile", activity: "48K likes" },
    { platform: "YouTube", url: "https://youtube.com/channel/yourchannel", activity: "8K subscribers" },
  ]);
  const [newSocial, setNewSocial] = useState({ platform: '', url: '', activity: '' });

  const previewTracks = [
    { id: "track-1", title: "Purple Nights", artist: "Nova Shade", duration: "1:22", src: "/tracks/purple-nights-preview.mp3" },
    { id: "track-2", title: "City Glow", artist: "Mira Lane", duration: "0:58", src: "/tracks/city-glow-preview.mp3" },
    { id: "track-3", title: "Midnight Vibes", artist: "Reel Beats", duration: "1:10", src: "/tracks/midnight-vibes-preview.mp3" },
  ];

  const referralLink = `${window.location.origin}/signup?ref=${user?.id?.slice(0, 8)}`;

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    if (user.role !== "influencer" && user.role !== "admin") { navigate("/dashboard"); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(false);
    // Data loads from API — empty state shown for now
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const promoteArtist = async () => {
    if (!searchArtist.trim() || !user) return;
    setPromoting(true);
    try {
      const res = await fetch("/api/influencer/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ artistUsername: searchArtist }),
      });
      const data = await res.json();
      if (res.ok) {
        setPromotions(p => [...p, data.promotion]);
        setSearchArtist("");
      }
    } catch { } finally { setPromoting(false); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-40 border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">CheckinPurple</span>
          </Link>
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />Dashboard
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Profile */}
          <ProfileCard
            editable
            userId={user.id}
            username={user.username}
            avatarUrl={user.avatar_url}
            role="influencer"
            isVerified={user.is_verified}
          />

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Earned", value: `${stats.totalEarned} coins`, icon: <Coins className="w-5 h-5 text-yellow-500" />, color: "text-yellow-500" },
              { label: "This Month", value: `${stats.thisMonthEarned} coins`, icon: <TrendingUp className="w-5 h-5 text-green-500" />, color: "text-green-500" },
              { label: "Referrals", value: stats.referrals, icon: <Users className="w-5 h-5 text-primary" />, color: "text-primary" },
              { label: "Promotions", value: stats.activePromotions, icon: <Star className="w-5 h-5 text-pink-500" />, color: "text-pink-500" },
            ].map(s => (
              <div key={s.label} className="glass rounded-2xl p-4">
                <div className="mb-2">{s.icon}</div>
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Referral link */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold mb-1 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              Your Referral Link
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share this link. When someone signs up and buys coins, you earn <strong className="text-foreground">10% commission</strong>.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-input border border-border/40 rounded-lg px-4 py-2.5 text-sm text-muted-foreground truncate">
                {referralLink}
              </div>
              <button
                onClick={() => copyToClipboard(referralLink, "referral")}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                {copiedCode === "referral" ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
              </button>
            </div>
          </div>

          {/* Social media activity */}
          <div className="glass rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-bold">Social Media Activity</h3>
                <p className="text-sm text-muted-foreground">Track your audience performance and share your influencer links across every platform.</p>
              </div>
              <div className="text-sm text-muted-foreground">Need help? Email <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>.</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {influencerSocialLinks.map(link => (
                <a key={link.platform + link.url} href={link.url} target="_blank" rel="noreferrer" className="glass rounded-2xl p-4 transition hover:-translate-y-0.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{link.platform}</p>
                      <p className="text-sm text-muted-foreground">{link.activity}</p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-primary">Visit</span>
                  </div>
                </a>
              ))}
              {/* Add new social link (local state + optional API save) */}
              <div className="glass rounded-2xl p-4">
                <h4 className="font-semibold mb-2">Add Social Link</h4>
                <div className="grid grid-cols-1 gap-2">
                  <input placeholder="Platform (TikTok, Facebook...)" value={newSocial.platform} onChange={e => setNewSocial(s => ({ ...s, platform: e.target.value }))} className="w-full bg-input text-foreground rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="URL" value={newSocial.url} onChange={e => setNewSocial(s => ({ ...s, url: e.target.value }))} className="w-full bg-input text-foreground rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Activity (e.g. 12K followers)" value={newSocial.activity} onChange={e => setNewSocial(s => ({ ...s, activity: e.target.value }))} className="w-full bg-input text-foreground rounded-lg px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      if (!newSocial.platform || !newSocial.url) return;
                      setInfluencerSocialLinks(l => [newSocial, ...l]);
                      // optional: try to persist
                      try { await fetch('/api/influencer/social-links', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${user?.id}` }, body: JSON.stringify(newSocial) }); } catch (e) { }
                      setNewSocial({ platform: '', url: '', activity: '' });
                    }} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Add</button>
                    <button onClick={() => setNewSocial({ platform: '', url: '', activity: '' })} className="px-3 py-2 border rounded-lg text-sm">Clear</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Artist reel previews */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold">Artist Reel Preview</h3>
                <p className="text-sm text-muted-foreground">Preview the latest artist tracks with reels, play samples, and recommend your favorites.</p>
              </div>
              <div className="text-sm text-muted-foreground">Contact admin: <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {previewTracks.map(track => (
                <div key={track.id} className="rounded-3xl bg-gradient-to-br from-slate-950/80 to-black/80 border border-border/30 p-4 text-white shadow-xl overflow-hidden">
                  <div className="mb-4 rounded-3xl bg-white/5 p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-pink-300">Reel</p>
                    <h4 className="mt-3 text-lg font-bold">{track.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{track.artist}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                      <span>{track.duration}</span>
                      <span className="rounded-full bg-white/10 px-2 py-1">Preview</span>
                    </div>
                    <audio
                      controls
                      src={track.src}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950"
                      onPlay={() => setCurrentPreview(track.id)}
                      onPause={() => setCurrentPreview(null)}
                    />
                    <button
                      onClick={() => setCurrentPreview(track.id)}
                      className={`w-full rounded-2xl px-4 py-2 text-sm font-semibold transition ${currentPreview === track.id ? "bg-pink-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                    >
                      {currentPreview === track.id ? "Playing now" : "Play reel"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {(["promotions", "referrals", "earnings"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm capitalize transition-all border ${
                  tab === t ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Promotions tab */}
          {tab === "promotions" && (
            <div className="space-y-4">
              {/* Add promotion */}
              <div className="glass rounded-2xl p-5">
                <h3 className="font-bold mb-3">Promote an Artist</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Promote an artist and earn <strong className="text-foreground">10% of all tips</strong> their fans send via your referral link.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                    <input
                      value={searchArtist}
                      onChange={e => setSearchArtist(e.target.value)}
                      placeholder="artist username"
                      className="w-full bg-input text-foreground rounded-lg pl-7 pr-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <button
                    onClick={promoteArtist}
                    disabled={promoting || !searchArtist.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                  >
                    {promoting ? "..." : "Promote"}
                  </button>
                </div>
              </div>

              {promotions.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center">
                  <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-semibold text-muted-foreground">No active promotions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Add an artist above to start earning</p>
                </div>
              ) : (
                promotions.map(p => (
                  <div key={p.id} className="glass rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {p.artistUsername.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">@{p.artistUsername}</p>
                        <p className="text-xs text-muted-foreground">Referral code: {p.referralCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-yellow-500">{p.tipsGenerated}</p>
                        <p className="text-xs text-muted-foreground">tips generated</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-500">{p.earned} coins</p>
                        <p className="text-xs text-muted-foreground">earned</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/listen?ref=${p.referralCode}`, p.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-lg text-xs font-semibold"
                      >
                        {copiedCode === p.id ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Share Link</>}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Referrals tab */}
          {tab === "referrals" && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border/40">
                <h3 className="font-bold">People You Referred</h3>
                <p className="text-sm text-muted-foreground mt-1">Earn 10% every time they buy coins</p>
              </div>
              {referrals.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No referrals yet. Share your referral link to start earning.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-card/40">
                    <tr>
                      {["User", "Joined", "Coins Spent", "You Earned"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map(r => (
                      <tr key={r.id} className="border-t border-border/20 hover:bg-card/20">
                        <td className="px-5 py-3 font-semibold">@{r.username}</td>
                        <td className="px-5 py-3 text-muted-foreground">{new Date(r.joinedAt).toLocaleDateString("en-ZA")}</td>
                        <td className="px-5 py-3 text-yellow-500 font-semibold">{r.coinsSpent}</td>
                        <td className="px-5 py-3 text-green-500 font-bold">{r.commissionEarned} coins</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Earnings tab */}
          {tab === "earnings" && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold mb-4">How You Earn</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-card/30 rounded-xl border border-border/20">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Coins className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Coin Purchase Commission</p>
                    <p className="text-sm text-muted-foreground mt-0.5">When someone signs up via your referral link and buys coins, you earn <strong className="text-foreground">10%</strong> of the coin value.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-card/30 rounded-xl border border-border/20">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Artist Tip Revenue Share</p>
                    <p className="text-sm text-muted-foreground mt-0.5">When a fan you referred tips a promoted artist, you earn <strong className="text-foreground">10%</strong> of that tip from the platform's 30% cut.</p>
                  </div>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-muted-foreground">
                  💡 Earnings accumulate as coins in your wallet. Request a payout anytime via <strong className="text-foreground">PayPal</strong> or <strong className="text-foreground">bank transfer</strong> — minimum R200.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
