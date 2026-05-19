import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Radio, ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type BookingStatus = "pending" | "accepted" | "declined" | "cancelled";

type Booking = {
  id: string;
  fan_id: string;
  artist_id: string;
  requested_date?: string;
  message?: string;
  status: BookingStatus;
  created_at: string;
};

type EventRow = {
  id: string;
  artist_id: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  created_at: string;
};

export default function BookArtist() {
  const { user } = useAuth();
  const [artistId, setArtistId] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [updates, setUpdates] = useState<EventRow[]>([]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  const load = async () => {
    setError("");
    try {
      const [bookingsRes, updatesRes] = await Promise.all([
        fetch("/api/bookings", { headers: { Authorization: `Bearer ${user?.id}` } }),
        fetch("/api/fan/updates/events", { headers: { Authorization: `Bearer ${user?.id}` } }),
      ]);
      const bk = await bookingsRes.json();
      if (Array.isArray(bk)) setBookings(bk);
      const ev = await updatesRes.json();
      if (Array.isArray(ev)) setUpdates(ev);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bookings");
    }
  };

  const submit = async () => {
    if (!user) return;
    setError("");
    if (!artistId.trim()) {
      setError("Artist ID is required");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({
          artist_id: artistId.trim(),
          requested_date: requestedDate ? new Date(requestedDate).toISOString() : undefined,
          message: message || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to send booking request");
      setArtistId("");
      setRequestedDate("");
      setMessage("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send booking request");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-40 border-b border-border/40 glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Radio className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CheckinPurple
            </span>
          </Link>
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="glass rounded-2xl p-6">
            <h1 className="text-xl font-bold mb-4">Book an Artist</h1>
            <div className="grid sm:grid-cols-3 gap-3">
              <input
                value={artistId}
                onChange={e => setArtistId(e.target.value)}
                className="bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Artist user id"
              />
              <input
                type="datetime-local"
                value={requestedDate}
                onChange={e => setRequestedDate(e.target.value)}
                className="bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Message (optional)"
              />
            </div>
            <button
              onClick={submit}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {loading ? "Sending..." : "Send Request"}
            </button>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Updates From Artists You Follow</h2>
            <div className="space-y-2">
              {updates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming gigs or concerts yet.</p>
              ) : (
                updates.map(ev => (
                  <div key={ev.id} className="p-3 rounded-xl border border-border/40 bg-card/20">
                    <p className="font-semibold text-sm">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(ev.event_date).toLocaleString()}</p>
                    {ev.location && <p className="text-xs text-muted-foreground">{ev.location}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Artist: {ev.artist_id}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">My Booking Requests</h2>
            <div className="space-y-2">
              {bookings.filter(b => b.fan_id === user.id).length === 0 ? (
                <p className="text-sm text-muted-foreground">No booking requests yet.</p>
              ) : (
                bookings
                  .filter(b => b.fan_id === user.id)
                  .map(b => (
                    <div key={b.id} className="p-3 rounded-xl border border-border/40 bg-card/20">
                      <p className="font-semibold text-sm">Artist: {b.artist_id}</p>
                      {b.requested_date && <p className="text-xs text-muted-foreground">{new Date(b.requested_date).toLocaleString()}</p>}
                      {b.message && <p className="text-xs text-muted-foreground mt-1">{b.message}</p>}
                      <p className="text-xs text-muted-foreground mt-1">Status: {b.status}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

