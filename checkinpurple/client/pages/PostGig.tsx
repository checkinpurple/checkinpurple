import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Radio, Calendar, MapPin, Ticket, Music, Upload,
  ArrowLeft, Check, AlertCircle, DollarSign, Users
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const GENRES = ["Afrobeats", "Amapiano", "Gqom", "Hip Hop", "Jazz", "Electronic", "R&B", "Soul", "Rock", "House", "Kwaito", "Various"];

export default function PostGig() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const coverRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    venue: "",
    city: "",
    country: "South Africa",
    event_date: "",
    doors_open: "",
    ticket_price_zar: "",
    ticket_price_usd: "",
    ticket_url: "",
    is_free: false,
    genres: [] as string[],
    explicit_content: false,
    max_capacity: "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    if (user.role !== "artist" && user.role !== "artist_fan" && user.role !== "admin") {
      navigate("/dashboard"); return;
    }
  }, [user]);

  const toggleGenre = (g: string) => {
    setForm(f => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g],
    }));
  };

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.venue || !form.city || !form.event_date) {
      setError("Title, venue, city and date are required"); return;
    }
    setSaving(true); setError("");

    try {
      let coverUrl = "";
      if (coverFile) {
        setUploading(true);
        const ext = coverFile.name.split(".").pop();
        const path = `gig-covers/${user?.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("tracks").upload(path, coverFile, { upsert: false });
        if (upErr) throw new Error("Failed to upload cover");
        const { data } = supabase.storage.from("tracks").getPublicUrl(path);
        coverUrl = data.publicUrl;
        setUploading(false);
      }

      const res = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({
          ...form,
          coverUrl: coverUrl || undefined,
          ticketPriceZar: form.ticket_price_zar ? parseFloat(form.ticket_price_zar) : undefined,
          ticketPriceUsd: form.ticket_price_usd ? parseFloat(form.ticket_price_usd) : undefined,
          maxCapacity: form.max_capacity ? parseInt(form.max_capacity) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post gig");

      setSuccess(true);
      setTimeout(() => navigate(`/artist/${user?.username}`), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post gig");
    } finally {
      setSaving(false); setUploading(false);
    }
  };

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
        <div className="max-w-2xl mx-auto space-y-5">

          <div>
            <h1 className="text-3xl font-bold mb-1">Post a Gig</h1>
            <p className="text-muted-foreground">Let your fans know about your upcoming performance</p>
          </div>

          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
              <Check className="w-6 h-6 text-green-500" />
              <p className="font-bold text-green-500">Gig posted! Redirecting to your profile...</p>
            </div>
          )}

          {/* Cover art */}
          <div className="glass rounded-2xl p-5">
            <label className="text-sm font-medium mb-3 block">Gig Poster / Cover Art</label>
            {coverPreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={coverPreview} alt="Cover" className="w-full h-48 object-cover" />
                <button onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                  ×
                </button>
              </div>
            ) : (
              <button onClick={() => coverRef.current?.click()} className="w-full h-36 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-sm text-muted-foreground group-hover:text-foreground">Upload gig poster</p>
              </button>
            )}
            <input ref={coverRef} type="file" accept="image/*" onChange={handleCover} className="hidden" />
          </div>

          {/* Main details */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="font-bold">Event Details</h3>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Event Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. SoundWave Night Vol. 3" className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell fans what to expect..." rows={3} className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Venue Name *</label>
                <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Club / Arena / Park" className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">City *</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Johannesburg" className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Country</label>
                <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max Capacity</label>
                <input type="number" value={form.max_capacity} onChange={e => setForm(f => ({ ...f, max_capacity: e.target.value }))} placeholder="Leave blank = unlimited" className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Event Date & Time *</label>
                <input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Doors Open</label>
                <input type="datetime-local" value={form.doors_open} onChange={e => setForm(f => ({ ...f, doors_open: e.target.value }))} className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Ticket className="w-4 h-4 text-primary" />Tickets</h3>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_free" checked={form.is_free} onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))} className="w-4 h-4" />
              <label htmlFor="is_free" className="text-sm font-medium text-green-500">Free Entry</label>
            </div>

            {!form.is_free && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Ticket Price (ZAR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R</span>
                    <input type="number" value={form.ticket_price_zar} onChange={e => setForm(f => ({ ...f, ticket_price_zar: e.target.value }))} placeholder="0.00" className="w-full bg-input text-foreground rounded-lg pl-7 pr-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Ticket Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <input type="number" value={form.ticket_price_usd} onChange={e => setForm(f => ({ ...f, ticket_price_usd: e.target.value }))} placeholder="0.00" className="w-full bg-input text-foreground rounded-lg pl-7 pr-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ticket Link (optional)</label>
              <input value={form.ticket_url} onChange={e => setForm(f => ({ ...f, ticket_url: e.target.value }))} placeholder="https://webtickets.co.za/..." className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
          </div>

          {/* Genres */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Music className="w-4 h-4 text-primary" />Genres</h3>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button key={g} onClick={() => toggleGenre(g)} className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${form.genres.includes(g) ? "bg-primary text-primary-foreground border-transparent" : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Content rating */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="explicit" checked={form.explicit_content} onChange={e => setForm(f => ({ ...f, explicit_content: e.target.checked }))} className="w-4 h-4" />
              <div>
                <label htmlFor="explicit" className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  This event contains explicit content
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">Fans will see an explicit content warning on this gig</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving || uploading || success}
            className="w-full py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-lg rounded-2xl hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
          >
            {uploading ? "Uploading cover..." : saving ? "Posting gig..." : success ? "Posted! ✓" : "Post Gig"}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            All followers will receive an in-app notification about this gig.
          </p>
        </div>
      </div>
    </div>
  );
}
