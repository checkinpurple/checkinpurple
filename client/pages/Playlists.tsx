import { useEffect, useState } from "react";
import { Plus, Trash2, Music2, Users, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AppSidebar from "@/components/AppSidebar";

interface Track { track_title: string; artist_name?: string }
interface Playlist {
  id: string;
  title: string;
  notes?: string | null;
  target_type: "individual" | "group";
  artist_playlist_tracks?: { track_title: string; artist_name?: string | null; sort_order?: number }[];
  created_at: string;
}

export default function PlaylistsPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [limit, setLimit] = useState(3);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [targetType, setTargetType] = useState<"individual" | "group">("individual");
  const [tracksText, setTracksText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const res = await fetch("/api/playlists", { headers: { Authorization: `Bearer ${user.id}` } });
    const data = await res.json();
    setPlaylists(data.playlists || []);
    setLimit(data.limit || 3);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const create = async () => {
    if (!user || !title.trim()) return;
    setSaving(true);
    const tracks: Track[] = tracksText
      .split("\n").map(l => l.trim()).filter(Boolean)
      .map(line => {
        const [t, a] = line.split(" - ").map(s => s.trim());
        return { track_title: t, artist_name: a };
      });
    const r = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
      body: JSON.stringify({ title: title.trim(), notes: notes || null, target_type: targetType, tracks }),
    });
    const d = await r.json();
    setMsg(d.error || "Playlist created ✓");
    if (!d.error) {
      setTitle(""); setNotes(""); setTracksText(""); setShowForm(false);
    }
    setSaving(false);
    await load();
    setTimeout(() => setMsg(null), 3000);
  };

  const remove = async (id: string) => {
    if (!user) return;
    if (!confirm("Delete this playlist?")) return;
    const r = await fetch(`/api/playlists/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user.id}` },
    });
    const d = await r.json();
    setMsg(d.error || "Deleted");
    await load();
    setTimeout(() => setMsg(null), 3000);
  };

  const buySlot = async () => {
    if (!user) return;
    const r = await fetch("/api/playlists/buy-slot", { method: "POST", headers: { Authorization: `Bearer ${user.id}` } });
    const d = await r.json();
    setMsg(d.error || `Slot purchased. Limit is now ${d.extra_slots + 3}.`);
    await load();
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0 p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Music2 className="w-6 h-6 text-primary" /> Personalised Playlists</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {playlists.length} of {limit} used. Basic artists get 3; Premium artists are unlimited.
            </p>
          </div>
          <button
            onClick={() => setShowForm(s => !s)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {msg && <div className="text-xs px-3 py-2 rounded-lg bg-muted/40 border border-border/40">{msg}</div>}

        {showForm && (
          <section className="rounded-xl border border-border/40 p-5 bg-card/30 space-y-3">
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Playlist title"
              className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <textarea
              rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Optional note for the recipient(s)"
              className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <div className="flex gap-2">
              <button
                type="button" onClick={() => setTargetType("individual")}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold ${targetType === "individual" ? "bg-primary text-primary-foreground border-primary" : "border-border/40 text-muted-foreground"}`}
              ><User className="w-3.5 h-3.5" /> Individual</button>
              <button
                type="button" onClick={() => setTargetType("group")}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold ${targetType === "group" ? "bg-primary text-primary-foreground border-primary" : "border-border/40 text-muted-foreground"}`}
              ><Users className="w-3.5 h-3.5" /> Group</button>
            </div>
            <textarea
              rows={6} value={tracksText} onChange={e => setTracksText(e.target.value)}
              placeholder={"One track per line — format:\nSong Title - Artist Name"}
              className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <div className="flex gap-2">
              <button onClick={create} disabled={saving || !title.trim()}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {saving ? "Creating..." : "Create playlist"}
              </button>
              <button onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg border border-border/40 text-sm">Cancel</button>
            </div>
          </section>
        )}

        {playlists.length >= limit && (
          <button onClick={buySlot} className="w-full text-sm py-2 rounded-lg border border-dashed border-primary/40 text-primary hover:bg-primary/5">
            Buy +1 playlist slot (300 coins)
          </button>
        )}

        <div className="space-y-3">
          {playlists.length === 0 && !showForm && (
            <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border/40 rounded-xl">
              No playlists yet. Create one for a fan or a group.
            </div>
          )}
          {playlists.map(p => (
            <div key={p.id} className="rounded-xl border border-border/40 p-4 bg-card/30">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{p.title}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{p.target_type}{p.notes ? ` · ${p.notes}` : ""}</p>
                </div>
                <button onClick={() => remove(p.id)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {p.artist_playlist_tracks && p.artist_playlist_tracks.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {p.artist_playlist_tracks.sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)).map((t, i) => (
                    <li key={i} className="text-xs text-muted-foreground">
                      <span className="text-foreground">{t.track_title}</span>
                      {t.artist_name && <span> — {t.artist_name}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
