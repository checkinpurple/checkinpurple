import { useState, useEffect } from "react";
import { Music, Radio, Headphones } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

interface FanStatusProps {
  userId?: string;
  editable?: boolean;
}

export default function FanStatus({ userId, editable = false }: FanStatusProps) {
  const { user } = useAuth();
  const targetId = userId || user?.id;
  const [status, setStatus] = useState<{ listening_to?: string; listening_artist?: string; is_live_listener?: boolean } | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ listening_to: "", listening_artist: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!targetId) return;
    supabase.from("users").select("listening_to, listening_artist, is_live_listener").eq("id", targetId).single()
      .then(({ data }) => {
        if (data) {
          setStatus(data);
          setDraft({ listening_to: data.listening_to || "", listening_artist: data.listening_artist || "" });
        }
      });
  }, [targetId]);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    await supabase.from("users").update({
      listening_to: draft.listening_to || null,
      listening_artist: draft.listening_artist || null,
    }).eq("id", user.id);
    setStatus(s => ({ ...s, listening_to: draft.listening_to, listening_artist: draft.listening_artist }));
    setSaving(false);
    setEditing(false);
  };

  const clear = async () => {
    if (!user?.id) return;
    await supabase.from("users").update({ listening_to: null, listening_artist: null }).eq("id", user.id);
    setStatus(s => ({ ...s, listening_to: undefined, listening_artist: undefined }));
    setDraft({ listening_to: "", listening_artist: "" });
    setEditing(false);
  };

  if (!status?.listening_to && !editable) return null;

  if (editing && editable) {
    return (
      <div className="p-3 rounded-xl border border-accent/20 bg-accent/5">
        <p className="text-xs font-semibold text-accent mb-2 flex items-center gap-1">
          <Headphones className="w-3.5 h-3.5" /> Set what you're listening to
        </p>
        <div className="space-y-2">
          <input
            value={draft.listening_to}
            onChange={e => setDraft(d => ({ ...d, listening_to: e.target.value }))}
            placeholder="Track name"
            className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          <input
            value={draft.listening_artist}
            onChange={e => setDraft(d => ({ ...d, listening_artist: e.target.value }))}
            placeholder="Artist name"
            className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !draft.listening_to}
              className="flex-1 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50">
              {saving ? "Saving..." : "Update"}
            </button>
            <button onClick={clear} className="px-3 py-1.5 rounded-lg border border-border/40 text-xs text-muted-foreground hover:text-foreground">
              Clear
            </button>
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg border border-border/40 text-xs text-muted-foreground">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => editable && setEditing(true)}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border border-accent/20 bg-accent/5 ${editable ? "cursor-pointer hover:bg-accent/10 transition-colors" : ""}`}
    >
      <div className="relative flex-shrink-0">
        <Headphones className="w-4 h-4 text-accent" />
        {status?.is_live_listener && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
        )}
      </div>
      <div className="min-w-0">
        {status?.listening_to ? (
          <>
            <p className="text-xs font-semibold truncate">{status.listening_to}</p>
            {status.listening_artist && (
              <p className="text-xs text-muted-foreground truncate">by {status.listening_artist}</p>
            )}
          </>
        ) : editable ? (
          <p className="text-xs text-muted-foreground">Tap to set what you're listening to</p>
        ) : null}
      </div>
      {status?.is_live_listener && (
        <span className="ml-auto text-xs text-red-400 font-medium flex-shrink-0 flex items-center gap-1">
          <Radio className="w-3 h-3" /> Live
        </span>
      )}
    </div>
  );
}
