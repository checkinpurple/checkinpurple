import { useEffect, useState } from "react";
import AppSidebar from "@/components/AppSidebar";

interface Stream {
  id: string;
  artist_id: string;
  title: string;
  genre?: string;
  is_live: boolean;
  listener_count: number;
}

export default function Listen() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStreams = async () => {
      try {
        const res = await fetch("/api/streams");
        const data = await res.json();
        setStreams(Array.isArray(data.streams) ? data.streams : []);
      } catch {
        setStreams([]);
      } finally {
        setLoading(false);
      }
    };

    loadStreams();
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0 p-6">
        <h1 className="text-2xl font-bold mb-1">Listen</h1>
        <p className="text-muted-foreground text-sm mb-5">Discover active streams on CheckinPurple.</p>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading streams…</p>
        ) : streams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active streams at the moment.</p>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {streams.map((stream) => (
              <div key={stream.id} className="rounded-xl border border-border/40 p-4 bg-card/30">
                <p className="font-semibold">{stream.title}</p>
                <p className="text-xs text-muted-foreground">Genre: {stream.genre || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">Listeners: {stream.listener_count}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
