import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Radio, Play, Trash2, Eye, EyeOff, Globe,
  Users, Lock, Clock, Edit3, Check, X
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AppSidebar from "@/components/AppSidebar";

interface SavedStream {
  id: string;
  title: string;
  livepeer_playback_id: string;
  duration_seconds?: number;
  visibility: "public" | "followers" | "private";
  view_count: number;
  created_at: string;
}

const VISIBILITY_META = {
  public: { label: "Public", icon: <Globe className="w-3.5 h-3.5" />, color: "text-green-400 bg-green-500/10 border-green-500/20" },
  followers: { label: "Followers", icon: <Users className="w-3.5 h-3.5" />, color: "text-accent bg-accent/10 border-accent/20" },
  private: { label: "Private", icon: <Lock className="w-3.5 h-3.5" />, color: "text-muted-foreground bg-card/50 border-border/40" },
};

function formatDuration(seconds?: number) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export default function PastStreams() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<SavedStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editVisibility, setEditVisibility] = useState<SavedStream["visibility"]>("public");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchStreams();
  }, [user]);

  const fetchStreams = async () => {
    try {
      const res = await fetch("/api/streams/saved", {
        headers: { Authorization: `Bearer ${user?.id}` },
      });
      const data = await res.json();
      if (data.success) setStreams(data.streams || []);
    } catch {}
    finally { setLoading(false); }
  };

  const startEdit = (s: SavedStream) => {
    setEditingId(s.id);
    setEditTitle(s.title);
    setEditVisibility(s.visibility);
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/streams/saved/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({ title: editTitle, visibility: editVisibility }),
      });
      if (res.ok) {
        setStreams(prev => prev.map(s => s.id === id ? { ...s, title: editTitle, visibility: editVisibility } : s));
        setEditingId(null);
      }
    } catch {}
    finally { setSaving(false); }
  };

  const deleteStream = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/streams/saved/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.id}` },
      });
      setStreams(prev => prev.filter(s => s.id !== id));
    } catch {}
    finally { setDeletingId(null); }
  };

  const playbackUrl = (playbackId: string) =>
    `https://stream.mux.com/${playbackId}.m3u8`;

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0">
        <div className="max-w-3xl mx-auto px-4 py-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Radio className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Past Streams</h1>
              <p className="text-xs text-muted-foreground">Your saved recordings — manage visibility and replay links</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl border border-border/40 bg-card/30 animate-pulse" />
              ))}
            </div>
          ) : streams.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-border/40 bg-card/20">
              <Radio className="w-10 h-10 text-muted-foreground opacity-30 mx-auto mb-3" />
              <p className="font-semibold text-muted-foreground">No saved streams yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Toggle "Save this stream" before going live to record it.</p>
              <Link to="/broadcast"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                Go Live Now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {streams.map(stream => {
                const vis = VISIBILITY_META[stream.visibility];
                const isEditing = editingId === stream.id;

                return (
                  <div key={stream.id} className="p-4 rounded-2xl border border-border/40 bg-card/30">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <div className="flex gap-2">
                          {(["public", "followers", "private"] as const).map(v => (
                            <button key={v} onClick={() => setEditVisibility(v)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${editVisibility === v ? VISIBILITY_META[v].color : "border-border/40 text-muted-foreground"}`}>
                              {VISIBILITY_META[v].icon} {VISIBILITY_META[v].label}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(stream.id)} disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50">
                            <Check className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
                          </button>
                          <button onClick={cancelEdit}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/40 text-xs text-muted-foreground hover:text-foreground">
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                          <Radio className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{stream.title}</p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {formatDuration(stream.duration_seconds)}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDate(stream.created_at)}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {stream.view_count} views
                            </span>
                            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${vis.color}`}>
                              {vis.icon} {vis.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a href={playbackUrl(stream.livepeer_playback_id)} target="_blank" rel="noreferrer"
                            className="p-2 rounded-lg border border-border/40 hover:bg-card/50 transition-colors">
                            <Play className="w-4 h-4" />
                          </a>
                          <button onClick={() => startEdit(stream)}
                            className="p-2 rounded-lg border border-border/40 hover:bg-card/50 transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteStream(stream.id)}
                            disabled={deletingId === stream.id}
                            className="p-2 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
