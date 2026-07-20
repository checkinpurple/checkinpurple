import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Radio, Users, Play, Heart, LogOut, Search, Filter,
  Pause, Coins, UserPlus, UserCheck, LayoutDashboard,
  Volume2, Rss, Globe, Share2, Check
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Chat from "@/components/Chat";

interface Stream {
  id: string;
  title: string;
  listenerCount: number;
  startedAt: string;
  artist?: string;
  artistId?: string;
  artistAvatar?: string;
  genre?: string;
  liked?: boolean;
  playbackId?: string;
}

interface FollowedArtist {
  id: string;
  username: string;
  avatar_url?: string;
  isLive?: boolean;
}

const GENRES = ["All", "Jazz", "Electronic", "Hip Hop", "Acoustic", "Classical", "Rock", "Afrobeats"];

export default function Listen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [followedArtists, setFollowedArtists] = useState<FollowedArtist[]>([]);
  const [coins, setCoins] = useState(0);
  const [tipAmount, setTipAmount] = useState(10);
  const [tipping, setTipping] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);
  const [volume, setVolume] = useState(1);
  const [feedTab, setFeedTab] = useState<"discover" | "following">("discover");
  const [sharedStream, setSharedStream] = useState<string | null>(null);

  useEffect(() => {
    if (!user) navigate("/signin");
  }, [user, navigate]);

  useEffect(() => {
    fetchStreams();
    if (user) { fetchCoins(); fetchFollowing(); }
  }, [user]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedStream) return;
    if (!selectedStream.playbackId) {
      audio.removeAttribute("src");
      audio.load();
      return;
    }
    audio.src = `https://livepeercdn.studio/hls/${selectedStream.playbackId}/index.m3u8`;
    audio.load();
    if (isPlaying) audio.play().catch(console.error);
  }, [selectedStream]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedStream?.playbackId) return;
    if (isPlaying) audio.play().catch(console.error);
    else audio.pause();
  }, [isPlaying, selectedStream?.playbackId]);


  const fetchStreams = async () => {
    try {
      const r = await fetch("/api/streams");
      const d = await r.json();
      if (d.success) {
        setStreams((d.streams || []).map((s: any) => ({
          id: s.id, title: s.title,
          listenerCount: s.listenerCount,
          startedAt: s.startedAt,
          artist: s.username || "Unknown Artist",
          artistId: s.userId,
          artistAvatar: s.avatar_url,
          genre: s.genre || "Various",
          liked: false,
          playbackId: s.playbackId,
        })));
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchCoins = async () => {
    try {
      const r = await fetch("/api/coins/balance", { headers: { Authorization: `Bearer ${user?.id}` } });
      const d = await r.json();
      if (d.success) setCoins(d.coins?.balance ?? 0);
    } catch {}
  };

  const fetchFollowing = async () => {
    try {
      const r = await fetch("/api/social/follows", { headers: { Authorization: `Bearer ${user?.id}` } });
      const d = await r.json();
      if (d.success) setFollowedArtists(d.following || []);
    } catch {}
  };

  const toggleLike = (id: string) => setStreams(p => p.map(s => s.id === id ? { ...s, liked: !s.liked } : s));

  const isFollowing = (artistId?: string) => followedArtists.some(a => a.id === artistId);

  const toggleFollow = async (stream: Stream) => {
    if (!user || !stream.artistId) return;
    const already = isFollowing(stream.artistId);
    try {
      await fetch("/api/social/follow", {
        method: already ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ followingId: stream.artistId }),
      });
      if (already) {
        setFollowedArtists(p => p.filter(a => a.id !== stream.artistId));
      } else {
        setFollowedArtists(p => [...p, { id: stream.artistId!, username: stream.artist || "", artistAvatar: stream.artistAvatar }]);
      }
    } catch {}
  };

  const sendTip = async () => {
    if (!user || !selectedStream?.artistId || coins < tipAmount) return;
    setTipping(true);
    try {
      const r = await fetch("/api/coins/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ recipientId: selectedStream.artistId, amount: tipAmount, streamId: selectedStream.id }),
      });
      if (r.ok) {
        setCoins(p => p - tipAmount);
        setTipSuccess(true);
        setTimeout(() => setTipSuccess(false), 2000);
      }
    } catch {} finally { setTipping(false); }
  };

  const handleLogout = async () => { await signOut(); navigate("/"); };

  // Following feed — streams from followed artists
  const followingStreams = streams.filter(s => isFollowing(s.artistId));

  const filteredStreams = (feedTab === "following" ? followingStreams : streams).filter(s => {
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || (s.artist || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchGenre = selectedGenre === "All" || s.genre === selectedGenre;
    return matchSearch && matchGenre;
  });

  const AvatarOrInitial = ({ url, name, size = "sm" }: { url?: string; name: string; size?: "sm" | "md" }) => {
    const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
    return url ? (
      <img src={url} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
    ) : (
      <div className={`${dim} rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0`}>
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <audio ref={audioRef} />

      {/* Header */}
      <nav className="fixed top-0 w-full z-40 border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Radio className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">CheckinPurple</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:block">Dashboard</span>
            </Link>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-bold text-yellow-500">{coins}</span>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className={`pt-20 ${selectedStream ? "pb-36" : "pb-8"}`}>

        {/* Now Playing Bar */}
        {selectedStream && (
          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/40 glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <AvatarOrInitial url={selectedStream.artistAvatar} name={selectedStream.artist || "A"} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{selectedStream.title}</p>
                  <p className="text-xs text-muted-foreground">@{selectedStream.artist}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-16 accent-primary" />
                </div>
                <button onClick={() => toggleFollow(selectedStream)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${isFollowing(selectedStream.artistId) ? "border-primary/40 bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary"}`}>
                  {isFollowing(selectedStream.artistId) ? <><UserCheck className="w-3 h-3" />Following</> : <><UserPlus className="w-3 h-3" />Follow</>}
                </button>
                <div className="flex items-center gap-2">
                  <select value={tipAmount} onChange={e => setTipAmount(Number(e.target.value))} className="bg-input text-foreground rounded-lg px-2 py-1.5 border border-border/40 text-xs">
                    {[10, 25, 50, 100].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <button onClick={sendTip} disabled={tipping || coins < tipAmount} className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
                    <Coins className="w-3 h-3" />{tipSuccess ? "Sent!" : "Tip"}
                  </button>
                  <button onClick={() => setIsPlaying(p => !p)} className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg font-semibold hover:opacity-90 flex items-center gap-2 text-sm">
                    {isPlaying ? <><Pause className="w-4 h-4" />Pause</> : <><Play className="w-4 h-4" />Play</>}
                  </button>
                  <button onClick={() => setSelectedStream(null)} className="text-muted-foreground hover:text-foreground p-1">✕</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">

            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Discover Music</h1>
              <p className="text-muted-foreground">Live streams from artists on CheckinPurple</p>
            </div>

            {/* Following bar */}
            {followedArtists.length > 0 && (
              <div className="mb-6 glass rounded-2xl p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
                  <Rss className="w-3 h-3" />FOLLOWING ({followedArtists.length})
                </p>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {followedArtists.map(a => (
                    <div key={a.id} className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="relative">
                        {a.avatar_url ? (
                          <img src={a.avatar_url} alt={a.username} className="w-12 h-12 rounded-full object-cover border-2 border-border/40" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border-2 border-border/40">
                            {a.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {a.isLive && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[56px] text-center">@{a.username}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feed tabs + search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex gap-2">
                <button onClick={() => setFeedTab("discover")} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${feedTab === "discover" ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
                  <Globe className="w-4 h-4" />Discover
                </button>
                <button onClick={() => setFeedTab("following")} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${feedTab === "following" ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
                  <Rss className="w-4 h-4" />Following
                  {followedArtists.length > 0 && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{followedArtists.length}</span>}
                </button>
              </div>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search streams or artists..." className="w-full bg-input text-foreground rounded-lg pl-11 pr-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
              </div>
            </div>

            {/* Genre filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
              <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              {GENRES.map(g => (
                <button key={g} onClick={() => setSelectedGenre(g)} className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${selectedGenre === g ? "bg-primary text-primary-foreground border-transparent" : "bg-card/30 border-border/40 text-muted-foreground hover:text-foreground"}`}>
                  {g}
                </button>
              ))}
            </div>

            {/* Streams grid */}
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              </div>
            ) : filteredStreams.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Radio className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h3 className="font-bold text-lg mb-1">
                  {feedTab === "following" ? "No live streams from artists you follow" : "No streams found"}
                </h3>
                <p className="text-sm">
                  {feedTab === "following" ? "Switch to Discover to find new artists" : "Try adjusting your search or genre filter"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStreams.map(stream => (
                  <div key={stream.id} className="group rounded-2xl border-2 border-border/30 hover:border-primary/40 overflow-hidden glass transition-all">
                    <button onClick={() => { setSelectedStream(stream); setIsPlaying(true); }} className="w-full text-left">
                      <div className="aspect-video bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 relative overflow-hidden">
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-red-500/20 border border-red-500 rounded-full">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-red-500 font-bold text-xs">LIVE</span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center">
                            <Play className="w-8 h-8 text-white fill-white ml-1" />
                          </div>
                        </div>
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur rounded-full">
                          <Users className="w-3 h-3 text-white" />
                          <span className="text-white text-xs font-semibold">{stream.listenerCount}</span>
                        </div>
                      </div>
                    </button>

                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <AvatarOrInitial url={stream.artistAvatar} name={stream.artist || "A"} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm truncate">{stream.title}</h3>
                          <p className="text-xs text-muted-foreground">@{stream.artist}</p>
                        </div>
                        <button onClick={() => toggleLike(stream.id)} className="p-1 hover:bg-primary/10 rounded transition-colors flex-shrink-0">
                          <Heart className={`w-5 h-5 ${stream.liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-card/60 border border-border/30 text-muted-foreground px-2 py-1 rounded-full">{stream.genre}</span>
<div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const link = `${window.location.origin}/listen?stream=${stream.id}`;
                              if (navigator.share) {
                                navigator.share({ title: stream.title, text: `Listen to ${stream.artist} live on CheckinPurple`, url: link });
                              } else {
                                navigator.clipboard?.writeText(link);
                                setSharedStream(stream.id);
                                setTimeout(() => setSharedStream(null), 2000);
                              }
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                          >
                            {sharedStream === stream.id ? <><Check className="w-3 h-3" />Copied</> : <><Share2 className="w-3 h-3" />Share</>}
                          </button>
                          <button onClick={() => toggleFollow(stream)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-colors ${isFollowing(stream.artistId) ? "border-primary/40 bg-primary/10 text-primary" : "border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary"}`}>
                            {isFollowing(stream.artistId) ? <><UserCheck className="w-3 h-3" />Following</> : <><UserPlus className="w-3 h-3" />Follow</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Chat for selected stream */}
            {selectedStream && (
              <div className="mt-8 max-w-3xl">
                <h3 className="text-lg font-bold mb-4">Live Chat — {selectedStream.title}</h3>
                <Chat streamId={selectedStream.id} userId={user?.id} username={user?.username} userRole={user?.role} userCoins={coins} onTip={() => setCoins(p => p - tipAmount)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
