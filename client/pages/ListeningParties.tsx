import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Radio, Calendar, Users, Clock, Check, ArrowLeft,
  Plus, X, Bell, Zap, Music, Play, Lock
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Party {
  id: string;
  host_username: string;
  host_id: string;
  title: string;
  description?: string;
  scheduled_for: string;
  genre?: string;
  rsvp_count: number;
  max_attendees: number;
  status: "upcoming" | "live" | "ended" | "cancelled";
  is_exclusive: boolean;
  cover_url?: string;
  stream_url?: string;
  user_rsvpd?: boolean;
}

function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-2">
      {[
        { value: timeLeft.days, label: "d" },
        { value: timeLeft.hours, label: "h" },
        { value: timeLeft.minutes, label: "m" },
        { value: timeLeft.seconds, label: "s" },
      ].map(({ value, label }) => (
        <div key={label} className="flex items-center gap-0.5">
          <span className="text-lg font-bold tabular-nums">{pad(value)}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ListeningParties() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "live" | "my">("upcoming");
  const [showCreate, setShowCreate] = useState(false);
  const [rsvping, setRsvping] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isArtist = user?.role === "artist" || user?.role === "artist_fan" || user?.role === "admin";

  // Create party form
  const [form, setForm] = useState({
    title: "", description: "", scheduled_for: "",
    genre: "Various", max_attendees: "-1", is_exclusive: false,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    fetchParties();
  }, [user]);

  const fetchParties = async () => {
    try {
      const res = await fetch("/api/parties", { headers: { Authorization: `Bearer ${user?.id}` } });
      const data = await res.json();
      if (data.success) setParties(data.parties || []);
    } catch {} finally { setLoading(false); }
  };

  const handleRSVP = async (partyId: string, currentlyRsvpd: boolean) => {
    if (!user) { navigate("/signin"); return; }
    setRsvping(partyId);
    try {
      const res = await fetch(`/api/parties/${partyId}/rsvp`, {
        method: currentlyRsvpd ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ username: user.username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "RSVP failed");

      setParties(p => p.map(party =>
        party.id === partyId ? {
          ...party,
          user_rsvpd: !currentlyRsvpd,
          rsvp_count: party.rsvp_count + (currentlyRsvpd ? -1 : 1),
        } : party
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "RSVP failed");
      setTimeout(() => setError(""), 3000);
    } finally { setRsvping(null); }
  };

  const createParty = async () => {
    if (!form.title || !form.scheduled_for) { setError("Title and date required"); return; }
    setCreating(true); setError("");
    try {
      const res = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({
          ...form,
          max_attendees: parseInt(form.max_attendees),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create party");
      setParties(p => [data.party, ...p]);
      setShowCreate(false);
      setForm({ title: "", description: "", scheduled_for: "", genre: "Various", max_attendees: "-1", is_exclusive: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally { setCreating(false); }
  };

  const filtered = parties.filter(p => {
    if (tab === "live") return p.status === "live";
    if (tab === "my") return p.host_id === user?.id || p.user_rsvpd;
    return p.status === "upcoming";
  });

  const PartyCard = ({ party }: { party: Party }) => {
    const isLive = party.status === "live";
    const isFull = party.max_attendees !== -1 && party.rsvp_count >= party.max_attendees;
    const canAccess = !party.is_exclusive || party.user_rsvpd || party.host_id === user?.id;

    return (
      <div className={`glass rounded-2xl overflow-hidden border-2 transition-all ${isLive ? "border-red-500/40" : "border-border/30 hover:border-primary/30"}`}>
        {/* Cover / header */}
        <div className={`relative h-36 flex items-center justify-center ${isLive ? "bg-gradient-to-br from-red-500/20 to-primary/20" : "bg-gradient-to-br from-primary/10 to-accent/10"}`}>
          {party.cover_url && <img src={party.cover_url} alt={party.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />}

          {isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 bg-red-500/90 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs font-bold">LIVE NOW</span>
            </div>
          )}

          {party.is_exclusive && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
              <Lock className="w-3 h-3 text-yellow-500" />
              <span className="text-yellow-500 text-xs font-semibold">RSVP Only</span>
            </div>
          )}

          {!isLive && party.status === "upcoming" && (
            <div className="text-center">
              <Countdown targetDate={party.scheduled_for} />
            </div>
          )}

          {isLive && canAccess && (
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur border border-white/30 text-white rounded-full font-semibold hover:bg-white/30 transition-colors">
              <Play className="w-4 h-4 fill-white" />Join Stream
            </button>
          )}

          {isLive && !canAccess && (
            <div className="flex flex-col items-center gap-2">
              <Lock className="w-8 h-8 text-white/60" />
              <p className="text-white/60 text-sm font-semibold">RSVP required for access</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate">{party.title}</h3>
              <p className="text-xs text-muted-foreground">by @{party.host_username}</p>
            </div>
            {party.genre && (
              <span className="text-xs bg-card/60 border border-border/30 text-muted-foreground px-2 py-1 rounded-full flex-shrink-0">{party.genre}</span>
            )}
          </div>

          {party.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{party.description}</p>
          )}

          <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(party.scheduled_for).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {party.rsvp_count} RSVP{party.rsvp_count !== 1 ? "s" : ""}
              {party.max_attendees !== -1 && ` / ${party.max_attendees}`}
            </span>
          </div>

          {/* RSVP perks */}
          {!party.user_rsvpd && party.status === "upcoming" && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {["🔔 Reminder", "⚡ Early Access", "🎖️ Chat Badge"].map(perk => (
                <span key={perk} className="text-xs bg-primary/5 border border-primary/10 text-muted-foreground px-2 py-0.5 rounded-full">{perk}</span>
              ))}
            </div>
          )}

          {/* RSVP button */}
          {party.status !== "ended" && party.status !== "cancelled" && party.host_id !== user?.id && (
            <button
              onClick={() => handleRSVP(party.id, !!party.user_rsvpd)}
              disabled={rsvping === party.id || (isFull && !party.user_rsvpd)}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                party.user_rsvpd
                  ? "bg-primary/10 border border-primary/30 text-primary hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500"
                  : isFull
                  ? "bg-card/30 border border-border/30 text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
              }`}
            >
              {rsvping === party.id ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : party.user_rsvpd ? (
                <><Check className="w-4 h-4" />RSVP'd — Click to cancel</>
              ) : isFull ? (
                "Party Full"
              ) : (
                <><Bell className="w-4 h-4" />RSVP for Free</>
              )}
            </button>
          )}

          {party.user_rsvpd && (
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-500">
              <Check className="w-3 h-3" />You're going · Early access guaranteed
            </div>
          )}

          {party.host_id === user?.id && (
            <div className="flex items-center justify-center gap-1 text-xs text-primary mt-1">
              <Music className="w-3 h-3" />You're hosting this party
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-40 border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Radio className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">CheckinPurple</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
              <ArrowLeft className="w-4 h-4" />Dashboard
            </Link>
            {isArtist && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />Host a Party
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">

          <div>
            <h1 className="text-3xl font-bold mb-1">Listening Parties</h1>
            <p className="text-muted-foreground">RSVP to scheduled listening events from your favourite artists</p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">{error}</div>
          )}

          {/* Create party form */}
          {showCreate && (
            <div className="glass rounded-2xl p-6 border-2 border-primary/20 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">Host a Listening Party</h2>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Party Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Album Drop Listening Party" className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Date & Time *</label>
                  <input type="datetime-local" value={form.scheduled_for} onChange={e => setForm(f => ({ ...f, scheduled_for: e.target.value }))} className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Genre</label>
                  <input value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} placeholder="Various" className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Max Attendees (-1 = unlimited)</label>
                  <input type="number" value={form.max_attendees} onChange={e => setForm(f => ({ ...f, max_attendees: e.target.value }))} className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell fans what to expect..." rows={2} className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none" />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="exclusive" checked={form.is_exclusive} onChange={e => setForm(f => ({ ...f, is_exclusive: e.target.checked }))} className="w-4 h-4" />
                <label htmlFor="exclusive" className="text-sm text-muted-foreground flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-yellow-500" />
                  Exclusive — only RSVP'd fans can access the stream
                </label>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <button onClick={createParty} disabled={creating} className="w-full py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                {creating ? "Creating..." : "Create Listening Party"}
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            {([
              { id: "upcoming", label: "Upcoming" },
              { id: "live", label: "🔴 Live Now", badge: parties.filter(p => p.status === "live").length },
              { id: "my", label: "My Parties" },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${tab === t.id ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
                {"badge" in t && t.badge > 0 && (
                  <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">{t.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Party grid */}
          {loading ? (
            <div className="text-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h3 className="font-bold text-lg mb-1">
                {tab === "live" ? "No live parties right now" : tab === "my" ? "You haven't joined any parties yet" : "No upcoming parties"}
              </h3>
              <p className="text-sm">
                {tab === "upcoming" && isArtist ? "Host the first one!" : "Check back soon."}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(party => <PartyCard key={party.id} party={party} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
