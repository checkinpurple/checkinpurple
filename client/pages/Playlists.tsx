import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import AppSidebar from "@/components/AppSidebar";

export default function PlaylistsPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [limit, setLimit] = useState(3);
  const [title, setTitle] = useState("");
  const [targetType, setTargetType] = useState<"individual" | "group">("individual");
  const [tracks, setTracks] = useState("Song A\nSong B");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await fetch("/api/playlists", { headers: { Authorization: `Bearer ${user?.id}` } });
    const data = await res.json();
    setPlaylists(data.playlists || []);
    setLimit(data.limit || 3);
  };

  useEffect(() => { if (user) load(); }, [user]);

  return <div className="min-h-screen bg-background flex"><AppSidebar /><main className="flex-1 lg:ml-56 pt-16 lg:pt-0 p-6 space-y-4">
    <h1 className="text-2xl font-bold">Personalized Playlists</h1>
    <p className="text-sm text-muted-foreground">{playlists.length}/{limit} used. Basic artists are limited to 3 playlists.</p>
    <div className="rounded-xl border p-4 space-y-2">
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Playlist title" className="w-full border rounded px-3 py-2 bg-input"/>
      <select value={targetType} onChange={e=>setTargetType(e.target.value as any)} className="w-full border rounded px-3 py-2 bg-input"><option value="individual">Individual</option><option value="group">Group</option></select>
      <textarea value={tracks} onChange={e=>setTracks(e.target.value)} rows={4} className="w-full border rounded px-3 py-2 bg-input"/>
      <button onClick={async()=>{const t=tracks.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>({track_title:x})); const r=await fetch('/api/playlists',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${user?.id}`},body:JSON.stringify({title,target_type:targetType,tracks:t})}); const d=await r.json(); setMsg(d.error||'Created'); await load();}} className="px-3 py-2 bg-primary text-primary-foreground rounded">Create Playlist</button>
      <button onClick={async()=>{const r=await fetch('/api/playlists/buy-slot',{method:'POST',headers:{Authorization:`Bearer ${user?.id}`}}); const d=await r.json(); setMsg(d.error||'Bought slot'); await load();}} className="px-3 py-2 border rounded ml-2">Buy +1 Slot (300 coins)</button>
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
    <div className="space-y-2">{playlists.map(p=><div key={p.id} className="border rounded p-3"><p className="font-semibold">{p.title}</p><p className="text-xs text-muted-foreground">Target: {p.target_type}</p></div>)}</div>
  </main></div>;
}
