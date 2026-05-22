import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Search, UserPlus, Check, X, Clock, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

interface Collaborator {
  id: string;
  username: string;
  avatar_url?: string;
  status: "pending" | "accepted" | "declined";
  direction: "sent" | "received";
}

interface ArtistResult {
  id: string;
  username: string;
  avatar_url?: string;
}

interface ArtistCollabsProps {
  /** If passed, renders read-only view of a specific artist's accepted collabs */
  viewUserId?: string;
}

export default function ArtistCollabs({ viewUserId }: ArtistCollabsProps) {
  const { user } = useAuth();
  const targetId = viewUserId || user?.id;
  const isOwn = !viewUserId || viewUserId === user?.id;

  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ArtistResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    if (!targetId) return;
    fetchCollabs();
  }, [targetId]);

  const fetchCollabs = async () => {
    setLoading(true);
    try {
      // Sent requests
      const { data: sent } = await supabase
        .from("artist_collaborators")
        .select("id, collaborator_id, status, users!artist_collaborators_collaborator_id_fkey(username, avatar_url)")
        .eq("artist_id", targetId);

      // Received requests
      const { data: received } = await supabase
        .from("artist_collaborators")
        .select("id, artist_id, status, users!artist_collaborators_artist_id_fkey(username, avatar_url)")
        .eq("collaborator_id", targetId);

      const mapped: Collaborator[] = [
        ...(sent || []).map((r: any) => ({
          id: r.id,
          username: r.users?.username || "Unknown",
          avatar_url: r.users?.avatar_url,
          status: r.status,
          direction: "sent" as const,
        })),
        ...(received || []).map((r: any) => ({
          id: r.id,
          username: r.users?.username || "Unknown",
          avatar_url: r.users?.avatar_url,
          status: r.status,
          direction: "received" as const,
        })),
      ];
      setCollabs(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const searchArtists = async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const { data } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .ilike("username", `%${q}%`)
        .in("role", ["artist"])
        .neq("id", user?.id)
        .limit(5);
      setResults(data || []);
    } catch {}
    finally { setSearching(false); }
  };

  const sendCollab = async (artistId: string) => {
    if (!user?.id) return;
    setSending(artistId);
    try {
      await supabase.from("artist_collaborators").insert({
        artist_id: user.id,
        collaborator_id: artistId,
        status: "pending",
      });
      await fetchCollabs();
      setSearch("");
      setResults([]);
    } catch {}
    finally { setSending(null); }
  };

  const respond = async (collabId: string, status: "accepted" | "declined") => {
    try {
      await supabase.from("artist_collaborators").update({ status }).eq("id", collabId);
      setCollabs(prev => prev.map(c => c.id === collabId ? { ...c, status } : c));
    } catch {}
  };

  const acceptedCollabs = collabs.filter(c => c.status === "accepted");
  const pendingReceived = collabs.filter(c => c.status === "pending" && c.direction === "received");
  const pendingSent = collabs.filter(c => c.status === "pending" && c.direction === "sent");

  // Read-only view for other users' profiles
  if (!isOwn) {
    if (acceptedCollabs.length === 0) return null;
    return (
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> Works with
        </p>
        <div className="flex flex-wrap gap-2">
          {acceptedCollabs.map(c => (
            <Link
              key={c.id}
              to={`/artist/${c.username}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-xs font-medium text-purple-400 hover:bg-purple-500/10 transition-colors"
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs text-white font-bold">
                {c.username[0]?.toUpperCase()}
              </div>
              @{c.username}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search to invite */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Find an artist to collaborate with</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); searchArtists(e.target.value); }}
            placeholder="Search by username..."
            className="w-full bg-input border border-border/40 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        {results.length > 0 && (
          <div className="mt-1 border border-border/40 rounded-xl bg-card overflow-hidden">
            {results.map(r => (
              <div key={r.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-card/80 transition-colors">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {r.username[0]?.toUpperCase()}
                </div>
                <span className="text-sm flex-1">@{r.username}</span>
                <button
                  onClick={() => sendCollab(r.id)}
                  disabled={sending === r.id || collabs.some(c => c.username === r.username)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 disabled:opacity-50 transition-colors"
                >
                  {sending === r.id ? "..." : collabs.some(c => c.username === r.username) ? <><Check className="w-3 h-3" />Sent</> : <><UserPlus className="w-3 h-3" />Invite</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending received */}
      {pendingReceived.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Incoming requests</p>
          <div className="space-y-2">
            {pendingReceived.map(c => (
              <div key={c.id} className="flex items-center gap-2 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-xs font-bold text-white">
                  {c.username[0]?.toUpperCase()}
                </div>
                <span className="text-sm flex-1">@{c.username} wants to collab</span>
                <button onClick={() => respond(c.id, "accepted")} className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => respond(c.id, "declined")} className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted collabs */}
      {acceptedCollabs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Active collaborators</p>
          <div className="flex flex-wrap gap-2">
            {acceptedCollabs.map(c => (
              <Link
                key={c.id}
                to={`/artist/${c.username}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-xs font-medium text-purple-400 hover:bg-purple-500/10 transition-colors"
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs text-white font-bold">
                  {c.username[0]?.toUpperCase()}
                </div>
                @{c.username}
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pending sent */}
      {pendingSent.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Pending invites</p>
          <div className="flex flex-wrap gap-2">
            {pendingSent.map(c => (
              <span key={c.id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border/40 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" /> @{c.username}
              </span>
            ))}
          </div>
        </div>
      )}

      {acceptedCollabs.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 && !search && (
        <p className="text-xs text-muted-foreground text-center py-4">No collaborators yet. Search for artists to invite.</p>
      )}
    </div>
  );
}
