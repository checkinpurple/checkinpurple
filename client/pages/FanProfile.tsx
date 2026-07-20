import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Headphones, Users, Heart, Music,
  Calendar, UserPlus, UserCheck, Radio, AlertTriangle,
  MapPin, Clock
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import FanStatus from "@/components/FanStatus";
import OGMeta from "@/components/OGMeta";
import AppSidebar from "@/components/AppSidebar";

interface FanUser {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  listening_to?: string;
  listening_artist?: string;
  is_live_listener?: boolean;
  follower_count?: number;
  following_count?: number;
  created_at?: string;
}

interface FollowedArtist {
  id: string;
  username: string;
  avatar_url?: string;
  is_live?: boolean;
}

interface Availability {
  days: string[];
  note: string;
}

export default function FanProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fan, setFan] = useState<FanUser | null>(null);
  const [following, setFollowing] = useState<FollowedArtist[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"about" | "artists" | "availability">("about");

  const isOwn = user?.username === username;

  useEffect(() => {
    if (!username) return;
    fetchFan();
  }, [username]);

  const fetchFan = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, avatar_url, bio, location, listening_to, listening_artist, is_live_listener, created_at")
        .eq("username", username)
        .single();

      if (error || !data) { setLoading(false); return; }
      setFan(data);
      setFollowerCount(0); // fetch from follows table if exists

      // Fetch artists this fan follows
      const { data: followData } = await supabase
        .from("follows")
        .select("followed_id, users!follows_followed_id_fkey(id, username, avatar_url)")
        .eq("follower_id", data.id)
        .limit(20);

      if (followData) {
        setFollowing(followData.map((f: any) => ({
          id: f.users?.id,
          username: f.users?.username,
          avatar_url: f.users?.avatar_url,
        })).filter(Boolean));
      }

      // Check if viewer follows this fan
      if (user && user.id !== data.id) {
        const { data: myFollow } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("followed_id", data.id)
          .single();
        setIsFollowing(!!myFollow);
      }

      // Fetch fan schedule/availability if they've set it
      const { data: schedData } = await supabase
        .from("fan_availability")
        .select("days, note")
        .eq("user_id", data.id)
        .single();
      if (schedData) setAvailability(schedData);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!user) { navigate("/signin"); return; }
    if (!fan) return;
    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("followed_id", fan.id);
        setIsFollowing(false);
        setFollowerCount(c => Math.max(0, c - 1));
      } else {
        await supabase.from("follows").insert({ follower_id: user.id, followed_id: fan.id });
        setIsFollowing(true);
        setFollowerCount(c => c + 1);
      }
    } catch {}
  };

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );

  if (!fan) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <AlertTriangle className="w-10 h-10 text-muted-foreground" />
      <p className="text-muted-foreground">Fan profile not found.</p>
      <Link to="/" className="text-primary underline text-sm">Go Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {user && <AppSidebar />}

      <OGMeta
        title={`${fan.username} · Fan on CheckinPurple`}
        description={fan.bio || `${fan.username} is a music fan on CheckinPurple.`}
        image={fan.avatar_url}
        url={`${window.location.origin}/fan/${fan.username}`}
        type="profile"
      />

      <main className={`flex-1 ${user ? "lg:ml-56" : ""} pt-${user ? "16 lg:pt-0" : "6"}`}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Back */}
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {fan.avatar_url
                ? <img src={fan.avatar_url} alt={fan.username} className="w-full h-full rounded-2xl object-cover" />
                : fan.username[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold">@{fan.username}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">Fan</span>
              </div>
              {fan.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" /> {fan.location}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span><b className="text-foreground">{following.length}</b> following</span>
                <span><b className="text-foreground">{followerCount}</b> followers</span>
              </div>
              {!isOwn && (
                <button
                  onClick={toggleFollow}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isFollowing
                      ? "bg-card border border-border/40 text-muted-foreground hover:text-foreground"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {isFollowing ? <><UserCheck className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
                </button>
              )}
            </div>
          </div>

          {/* Currently listening */}
          {(fan.listening_to || isOwn) && (
            <div className="mb-5">
              <FanStatus userId={fan.id} editable={isOwn} />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/40 mb-5">
            {[
              { id: "about", label: "About" },
              { id: "artists", label: `Following (${following.length})` },
              { id: "availability", label: "Schedule" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* About */}
          {tab === "about" && (
            <div className="space-y-4">
              {fan.bio ? (
                <div className="p-4 rounded-xl border border-border/40 bg-card/30">
                  <p className="text-sm leading-relaxed text-muted-foreground">{fan.bio}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No bio yet.</p>
              )}
              {fan.created_at && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Member since {new Date(fan.created_at).toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          )}

          {/* Artists following */}
          {tab === "artists" && (
            <div className="space-y-2">
              {following.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Not following any artists yet.</p>
              ) : following.map(a => (
                <Link key={a.id} to={`/artist/${a.username}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/30 hover:bg-card/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {a.username[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">@{a.username}</p>
                  </div>
                  {a.is_live && (
                    <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" /> LIVE
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Schedule / availability */}
          {tab === "availability" && (
            <div className="space-y-4">
              {isOwn ? (
                <FanAvailabilityEditor userId={fan.id} initial={availability} onChange={setAvailability} />
              ) : availability ? (
                <div className="p-4 rounded-xl border border-border/40 bg-card/30">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent" /> Available for events
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {DAYS.map(d => (
                      <span key={d} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                        availability.days.includes(d)
                          ? "bg-accent/10 border-accent/30 text-accent"
                          : "border-border/30 text-muted-foreground opacity-40"
                      }`}>{d}</span>
                    ))}
                  </div>
                  {availability.note && <p className="text-sm text-muted-foreground">{availability.note}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">No schedule set.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Inline availability editor for own profile
function FanAvailabilityEditor({
  userId, initial, onChange
}: {
  userId: string;
  initial: Availability | null;
  onChange: (a: Availability) => void;
}) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [days, setDays] = useState<string[]>(initial?.days || []);
  const [note, setNote] = useState(initial?.note || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleDay = (d: string) =>
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("fan_availability").upsert({ user_id: userId, days, note }, { onConflict: "user_id" });
      if (!error) { onChange({ days, note }); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 rounded-xl border border-border/40 bg-card/30 space-y-4">
      <p className="text-sm font-semibold">Set your event availability</p>
      <div className="flex flex-wrap gap-2">
        {DAYS.map(d => (
          <button key={d} onClick={() => toggleDay(d)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              days.includes(d)
                ? "bg-accent/10 border-accent/30 text-accent"
                : "border-border/40 text-muted-foreground hover:border-accent/30 hover:text-accent"
            }`}>{d}</button>
        ))}
      </div>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
        placeholder="e.g. Available most weekends for shows and listening parties"
        className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none" />
      <button onClick={save} disabled={saving}
        className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50">
        {saved ? "Saved ✓" : saving ? "Saving..." : "Save Schedule"}
      </button>
    </div>
  );
}
