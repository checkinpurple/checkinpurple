import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import AppSidebar from "@/components/AppSidebar";

interface StreamKeyResponse {
  success?: boolean;
  streamKey?: string;
  playbackId?: string;
  livepeerStreamId?: string;
  error?: string;
}

export default function Broadcast() {
  const { user } = useAuth();
  const [streamName, setStreamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StreamKeyResponse | null>(null);

  const createStreamKey = async () => {
    if (!user) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/livepeer/stream-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({ name: streamName || undefined }),
      });
      const data = (await response.json()) as StreamKeyResponse;
      if (!response.ok) throw new Error(data.error || "Unable to create stream key");
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0 p-6 space-y-4">
        <h1 className="text-2xl font-bold">Broadcast</h1>
        <p className="text-muted-foreground text-sm">Generate a Livepeer stream key for your next session.</p>

        <div className="max-w-xl rounded-xl border border-border/40 p-4 space-y-3 bg-card/30">
          <label className="block text-sm font-medium">Optional stream name</label>
          <input
            value={streamName}
            onChange={(e) => setStreamName(e.target.value)}
            placeholder="e.g. Friday Live Set"
            className="w-full rounded-lg border border-border/40 bg-input px-3 py-2 text-sm"
          />
          <button
            onClick={createStreamKey}
            disabled={loading || !user}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate Stream Key"}
          </button>

          {result?.error && <p className="text-sm text-red-400">{result.error}</p>}
          {result?.streamKey && (
            <div className="text-sm space-y-1">
              <p><span className="font-semibold">Stream Key:</span> {result.streamKey}</p>
              <p><span className="font-semibold">Playback ID:</span> {result.playbackId || "n/a"}</p>
              <p><span className="font-semibold">Livepeer Stream ID:</span> {result.livepeerStreamId || "n/a"}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
