import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radio, Calendar, Plus, Music, Users, Check, X, Clock, ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type ReleaseType = "single" | "ep" | "album" | "live_event";
type ReleaseStatus = "scheduled" | "live" | "published" | "cancelled";
type CollabStatus = "pending" | "accepted" | "declined";

interface Release {
  id: string;
  title: string;
  release_type: ReleaseType;
  scheduled_for: string;
  status: ReleaseStatus;
  description?: string;
  collaborators: string[];
  cover_url?: string;
}

interface CollabRequest {
  id: string;
  requester_username: string;
  requester_avatar?: string;
  release_title: string;
  message: string;
  status: CollabStatus;
  created_at: string;
}

const RELEASE_TYPE_META: Record<ReleaseType, { label: string; color: string }> = {
  single: { label: "Single", color: "text-primary bg-primary/10 border-primary/20" },
  ep: { label: "EP", color: "text-accent bg-accent/10 border-accent/20" },
  album: { label: "Album", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  live_event: { label: "Live Event", color: "text-red-400 bg-red-500/10 border-red-500/20" },
};

export default function Releases() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [releases, setReleases] = useState<Release[]>([]);
  const [collabRequests, setCollabRequests] = useState<CollabRequest[]>([]);
  const [tab, setTab] = useState<"releases" | "collabs">("releases");
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Collaboration invite form
  const [inviteArtist, setInviteArtist] = useState("");
  const [inviteReleaseId, setInviteReleaseId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviting, setInviting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    release_type: "single" as ReleaseType,
    scheduled_for: "",
    description: "",
  });

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    if (user.role !== "artist" && user.role !== "artist_fan" && user.role !== "admin") {
      navigate("/dashboard"); return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [rRes, cRes] = await Promise.all([
        fetch("/api/releases", { headers: { Authorization: `Bearer ${user?.id}` } }),
        fetch("/api/collaborations", { headers: { Authorization: `Bearer ${user?.id}` } }),
      ]);
      const [rData, cData] = await Promise.all([rRes.json(), cRes.json()]);
      if (rData.success) setReleases(rData.releases || []);
      if (cData.success) setCollabRequests(cData.collaborations || []);
    } catch { } finally { setLoading(false); }
  };

  const addRelease = async () => {
    if (!form.title || !form.scheduled_for) { setError("Title and date are required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule release");
      setReleases(r => [...r, data.release]);
      setShowAdd(false);
      setForm({ title: "", release_type: "single", scheduled_for: "", description: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally { setSaving(false); }
  };

  const sendCollabInvite = async () => {
    if (!inviteArtist || !inviteReleaseId) { setError("Select a release and enter artist username"); return; }
    setInviting(true); setError("");
    try {
      const res = await fetch("/api/collaborations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({
          recipientUsername: inviteArtist,
          releaseId: inviteReleaseId,
          message: inviteMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      setInviteArtist(""); setInviteMessage(""); setInviteReleaseId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally { setInviting(false); }
  };

  const respondToCollab = async (id: string, accepted: boolean) => {
    try {
      await fetch(`/api/collaborations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({ status: accepted ? "accepted" : "declined" }),
      });
      setCollabRequests(c => c.map(r => r.id === id ? { ...r, status: accepted ? "accepted" : "declined" } : r));
    } catch { }
  };

  const cancelRelease = async (id: string) => {
    await fetch(`/api/releases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
      body: JSON.stringify({ status: "cancelled" }),
    });
    setReleases(r => r.map(x => x.id === id ? { ...x, status: "cancelled" } : x));
  };

  const pendingCollabs = collabRequests.filter(c => c.status === "pending").length;

  if (!user) return null;

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
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="w-4 h-4" />Dashboard
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Releases & Collaborations</h1>
              <p className="text-muted-foreground">Schedule your music and invite artists to collaborate</p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />Schedule Release
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button onClick={() => setTab("releases")} className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${tab === "releases" ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
              Releases ({releases.length})
            </button>
            <button onClick={() => setTab("collabs")} className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all border relative ${tab === "collabs" ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
              Collaborations
              {pendingCollabs > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {pendingCollabs}
                </span>
              )}
            </button>
          </div>

          {/* Add release form */}
          {showAdd && (
            <div className="glass rounded-2xl p-6 border-2 border-primary/20">
              <h3 className="font-bold mb-4">Schedule a Release</h3>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Track or album title" className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Type *</label>
                  <select value={form.release_type} onChange={e => setForm(f => ({ ...f, release_type: e.target.value as ReleaseType }))} className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
                    <option value="single">Single</option>
                    <option value="ep">EP</option>
                    <option value="album">Album</option>
                    <option value="live_event">Live Event</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Release Date & Time *</label>
                  <input type="datetime-local" value={form.scheduled_for} onChange={e => setForm(f => ({ ...f, scheduled_for: e.target.value }))} className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
              </div>
              {error && <p className="text-destructive text-sm mb-3">{error}</p>}
              <div className="flex gap-2">
                <button onClick={addRelease} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  <Check className="w-4 h-4" />{saving ? "Scheduling..." : "Schedule"}
                </button>
                <button onClick={() => setShowAdd(false)} className="flex items-center gap-2 px-4 py-2 border border-border/40 rounded-lg text-sm hover:bg-card/40">
                  <X className="w-4 h-4" />Cancel
                </button>
              </div>
            </div>
          )}

          {/* RELEASES */}
          {tab === "releases" && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
              ) : releases.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center">
                  <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-semibold text-muted-foreground">No releases scheduled</p>
                  <p className="text-sm text-muted-foreground mt-1">Click "Schedule Release" to add your first one</p>
                </div>
              ) : (
                releases.map(r => {
                  const meta = RELEASE_TYPE_META[r.release_type];
                  const releaseDate = new Date(r.scheduled_for);
                  const isPast = releaseDate < new Date();
                  return (
                    <div key={r.id} className={`glass rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap ${r.status === "cancelled" ? "opacity-50" : ""}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Music className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold">{r.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${meta.color}`}>{meta.label}</span>
                            {r.status === "cancelled" && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">Cancelled</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{isPast ? "Released" : "Scheduled"}: {releaseDate.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          {r.collaborators?.length > 0 && (
                            <p className="text-xs text-accent mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3" />{r.collaborators.length} collaborator{r.collaborators.length !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </div>
                      {r.status !== "cancelled" && (
                        <button onClick={() => cancelRelease(r.id)} className="text-xs px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg font-semibold transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* COLLABORATIONS */}
          {tab === "collabs" && (
            <div className="space-y-6">
              {/* Send invite */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold mb-1 flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Invite a Collaborator</h3>
                <p className="text-sm text-muted-foreground mb-4">Invite another artist to collaborate on one of your scheduled releases.</p>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Artist Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                      <input value={inviteArtist} onChange={e => setInviteArtist(e.target.value)} placeholder="artistname" className="w-full bg-input text-foreground rounded-lg pl-7 pr-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Release</label>
                    <select value={inviteReleaseId} onChange={e => setInviteReleaseId(e.target.value)} className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
                      <option value="">Select a release...</option>
                      {releases.filter(r => r.status !== "cancelled").map(r => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-muted-foreground mb-1 block">Message (optional)</label>
                  <input value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} placeholder="Hey, want to collab on this?" className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                {error && <p className="text-destructive text-sm mb-3">{error}</p>}
                <button onClick={sendCollabInvite} disabled={inviting || !inviteArtist || !inviteReleaseId} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  <Send className="w-4 h-4" />{inviting ? "Sending..." : "Send Invite"}
                </button>
              </div>

              {/* Incoming requests */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border/40">
                  <h3 className="font-bold">Collaboration Requests</h3>
                </div>
                {collabRequests.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No collaboration requests yet</p>
                  </div>
                ) : (
                  collabRequests.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-5 border-b border-border/20 last:border-0 flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                          {c.requester_username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">@{c.requester_username}</p>
                          <p className="text-xs text-muted-foreground">For: <span className="text-foreground">{c.release_title}</span></p>
                          {c.message && <p className="text-xs text-muted-foreground mt-0.5">"{c.message}"</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.status === "pending" ? (
                          <>
                            <button onClick={() => respondToCollab(c.id, true)} className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-xs font-semibold">
                              <Check className="w-3 h-3" />Accept
                            </button>
                            <button onClick={() => respondToCollab(c.id, false)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs font-semibold">
                              <X className="w-3 h-3" />Decline
                            </button>
                          </>
                        ) : (
                          <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${c.status === "accepted" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                            {c.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
