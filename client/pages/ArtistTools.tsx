import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Radio, ArrowLeft, Save, CalendarPlus, Check, X } from "lucide-react";
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

export default function ArtistTools() {
  const { user } = useAuth();
  const [genre, setGenre] = useState("");
  const [explicitContent, setExplicitContent] = useState(false);
  const [isDj, setIsDj] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  const load = async () => {
    setError("");
    try {
      const [profileRes, eventsRes, bookingsRes] = await Promise.all([
        fetch(`/api/artist/${user?.id}/profile`),
        fetch(`/api/artist/${user?.id}/events`),
        fetch("/api/bookings", { headers: { Authorization: `Bearer ${user?.id}` } }),
      ]);

      const profile = await profileRes.json();
      if (profile) {
        setGenre(profile.genre || "");
        setExplicitContent(Boolean(profile.explicit_content));
        setIsDj(Boolean(profile.is_dj));
      }

      const ev = await eventsRes.json();
      if (Array.isArray(ev)) setEvents(ev);

      const bk = await bookingsRes.json();
      if (Array.isArray(bk)) setBookings(bk);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load artist tools");
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setError("");
    if (!genre.trim()) {
      setError("Genre is required");
      return;
    }
    setSavingProfile(true);
    try {
      const r = await fetch("/api/artist/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ genre, explicit_content: explicitContent, is_dj: isDj }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to save profile");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const addEvent = async () => {
    if (!user) return;
    setError("");
    if (!eventTitle.trim() || !eventDate) {
      setError("Title and date are required");
      return;
    }
    setCreatingEvent(true);
    try {
      const r = await fetch("/api/artist/events", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({
          title: eventTitle,
          event_date: new Date(eventDate).toISOString(),
          location: eventLocation || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to create event");
      setEventTitle("");
      setEventDate("");
      setEventLocation("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create event");
    } finally {
      setCreatingEvent(false);
    }
  };

  const setBookingStatus = async (id: string, status: BookingStatus) => {
    if (!user) return;
    setError("");
    try {
      const r = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to update booking");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update booking");
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
            <h1 className="text-xl font-bold mb-4">Artist Profile</h1>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <input
                  value={genre}
                  onChange={e => setGenre(e.target.value)}
                  className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Amapiano, Hip Hop, House..."
                />
              </div>
              <div className="flex items-center gap-4 pt-8">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={explicitContent} onChange={e => setExplicitContent(e.target.checked)} />
                  Explicit content
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={isDj} onChange={e => setIsDj(e.target.checked)} />
                  I am a DJ
                </label>
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Upcoming Gigs / Concerts</h2>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <input
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                className="bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Event title"
              />
              <input
                type="datetime-local"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                value={eventLocation}
                onChange={e => setEventLocation(e.target.value)}
                className="bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Location (optional)"
              />
            </div>
            <button
              onClick={addEvent}
              disabled={creatingEvent}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary font-semibold hover:bg-primary/20 disabled:opacity-60"
            >
              <CalendarPlus className="w-4 h-4" />
              {creatingEvent ? "Creating..." : "Add Event"}
            </button>

            <div className="mt-4 space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events yet.</p>
              ) : (
                events.map(ev => (
                  <div key={ev.id} className="p-3 rounded-xl border border-border/40 bg-card/20">
                    <p className="font-semibold text-sm">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(ev.event_date).toLocaleString()}</p>
                    {ev.location && <p className="text-xs text-muted-foreground">{ev.location}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Booking Requests</h2>
            <div className="space-y-2">
              {bookings.filter(b => b.artist_id === user.id).length === 0 ? (
                <p className="text-sm text-muted-foreground">No booking requests yet.</p>
              ) : (
                bookings
                  .filter(b => b.artist_id === user.id)
                  .map(b => (
                    <div key={b.id} className="p-3 rounded-xl border border-border/40 bg-card/20 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">From fan: {b.fan_id}</p>
                        {b.requested_date && <p className="text-xs text-muted-foreground">{new Date(b.requested_date).toLocaleString()}</p>}
                        {b.message && <p className="text-xs text-muted-foreground mt-1">{b.message}</p>}
                        <p className="text-xs text-muted-foreground mt-1">Status: {b.status}</p>
                      </div>
                      {b.status === "pending" && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => setBookingStatus(b.id, "accepted")}
                            className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500/20"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setBookingStatus(b.id, "declined")}
                            className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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

