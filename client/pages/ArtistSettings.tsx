import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Radio, Save, Mic, Music, Zap, AlertCircle,
  ArrowLeft, Check, DollarSign, Coins, Instagram,
  Twitter, Globe, Info, Youtube, Facebook, Headphones,
  Podcast, Palette, Volume2, Sliders
  , Camera
} from "lucide-react";

const SKILLS = [
  { id: "sound_engineer", label: "Sound Engineer", emoji: "🎚️" },
  { id: "podcast_host", label: "Podcast Host", emoji: "🎙️" },
  { id: "graphic_designer", label: "Graphic Designer", emoji: "🎨" },
  { id: "music_producer", label: "Music Producer", emoji: "🎛️" },
  { id: "session_musician", label: "Session Musician", emoji: "🎸" },
  { id: "vocalist", label: "Vocalist / Session Singer", emoji: "🎤" },
  { id: "mixing_mastering", label: "Mixing & Mastering", emoji: "🔊" },
  { id: "videographer", label: "Music Videographer", emoji: "🎬" },
  { id: "photographer", label: "Music Photographer", emoji: "📸" },
  { id: "beat_maker", label: "Beat Maker", emoji: "🥁" },
];
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";

const ALL_GENRES = [
  "Afrobeats", "Amapiano", "Gqom", "Kwaito", "Hip Hop",
  "Trap", "R&B", "Soul", "Jazz", "Blues", "Electronic",
  "House", "Techno", "Rock", "Pop", "Classical", "Gospel",
  "Reggae", "Dancehall", "Various"
];

export default function ArtistSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    artist_bio: "",
    genres: [] as string[],
    is_dj: false,
    explicit_content: false,
    booking_available: false,
    booking_fee_zar: "",
    booking_fee_usd: "",
    booking_fee_coins: "",
    booking_rate_type: "per_hour" as "per_hour" | "per_event" | "negotiable",
    booking_note: "",
    social_instagram: "",
    social_twitter: "",
    social_soundcloud: "",
    social_tiktok: "",
    social_facebook: "",
    social_youtube: "",
    streaming_spotify: "",
    streaming_apple: "",
    streaming_audiomack: "",
    streaming_youtube_music: "",
    streaming_deezer: "",
    gallery_images: [] as string[],
    skills: [] as string[],
  });

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    if (user.role !== "artist" && user.role !== "artist_fan" && user.role !== "admin") {
      navigate("/dashboard"); return;
    }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await supabase.from("users").select("*").eq("id", user?.id).single();
      if (data) {
        setForm({
          artist_bio: data.artist_bio || "",
          genres: data.genres || [],
          is_dj: data.is_dj || false,
          explicit_content: data.explicit_content || false,
          booking_available: data.booking_available || false,
          booking_fee_zar: data.booking_fee_zar?.toString() || "",
          booking_fee_usd: data.booking_fee_usd?.toString() || "",
          booking_fee_coins: data.booking_fee_coins?.toString() || "",
          booking_rate_type: data.booking_rate_type || "per_hour",
          booking_note: data.booking_note || "",
          social_instagram: data.social_instagram || "",
          social_twitter: data.social_twitter || "",
          social_soundcloud: data.social_soundcloud || "",
          social_tiktok: data.social_tiktok || "",
          social_facebook: data.social_facebook || "",
          social_youtube: data.social_youtube || "",
          streaming_spotify: data.streaming_spotify || "",
          streaming_apple: data.streaming_apple || "",
          streaming_audiomack: data.streaming_audiomack || "",
          streaming_youtube_music: data.streaming_youtube_music || "",
          streaming_deezer: data.streaming_deezer || "",
          skills: data.skills || [],
          gallery_images: data.gallery_images || [],
        });
      }
    } catch {}
  };

  const toggleGenre = (g: string) => {
    setForm(f => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g],
    }));
  };

  const save = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const { error: updateError } = await supabase.from("users").update({
        artist_bio: form.artist_bio || null,
        genres: form.genres.length > 0 ? form.genres : null,
        is_dj: form.is_dj,
        explicit_content: form.explicit_content,
        booking_available: form.booking_available,
        booking_fee_zar: form.booking_fee_zar ? parseFloat(form.booking_fee_zar) : null,
        booking_fee_usd: form.booking_fee_usd ? parseFloat(form.booking_fee_usd) : null,
        booking_fee_coins: form.booking_fee_coins ? parseInt(form.booking_fee_coins) : null,
        booking_rate_type: form.booking_rate_type,
        booking_note: form.booking_note || null,
        social_instagram: form.social_instagram || null,
        social_twitter: form.social_twitter || null,
        social_soundcloud: form.social_soundcloud || null,
        social_tiktok: form.social_tiktok || null,
        social_facebook: form.social_facebook || null,
        social_youtube: form.social_youtube || null,
        streaming_spotify: form.streaming_spotify || null,
        streaming_apple: form.streaming_apple || null,
        streaming_audiomack: form.streaming_audiomack || null,
        streaming_youtube_music: form.streaming_youtube_music || null,
        streaming_deezer: form.streaming_deezer || null,
        skills: form.skills.length > 0 ? form.skills : null,
        gallery_images: galleryImages.length > 0 ? galleryImages : null,
        booking_available_dates: availableDates,
      }).eq("id", user?.id);

      if (updateError) throw updateError;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
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
          <div className="flex items-center gap-3">
            <Link to={`/artist/${user.username}`} className="text-sm text-primary hover:underline">View Profile</Link>
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
              <ArrowLeft className="w-4 h-4" />Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-5">

          <div>
            <h1 className="text-3xl font-bold mb-1">Artist Settings</h1>
            <p className="text-muted-foreground">Customise your public profile, booking availability and genre tags</p>
          </div>

          {saved && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
              <Check className="w-5 h-5 text-green-500" />
              <p className="font-semibold text-green-500">Profile saved successfully!</p>
            </div>
          )}

          {/* Bio */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <h3 className="font-bold flex items-center gap-2"><Mic className="w-4 h-4 text-primary" />Artist Bio</h3>
            <textarea
              value={form.artist_bio}
              onChange={e => setForm(f => ({ ...f, artist_bio: e.target.value }))}
              placeholder="Tell fans about yourself, your style, your story..."
              rows={4}
              maxLength={500}
              className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{form.artist_bio.length}/500</p>
          </div>

          {/* Genres */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Music className="w-4 h-4 text-primary" />Your Genres</h3>
            <p className="text-sm text-muted-foreground mb-3">Select all genres that represent your music</p>
            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                    form.genres.includes(g)
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Profile flags */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="font-bold">Profile Tags</h3>

            <div className="flex items-start justify-between gap-4 p-4 bg-card/30 rounded-xl border border-border/20">
              <div>
                <p className="font-semibold flex items-center gap-2">🎧 I'm a DJ</p>
                <p className="text-xs text-muted-foreground mt-0.5">Shows a DJ badge on your profile and allows fans to book you for DJ sets</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, is_dj: !f.is_dj }))}
                className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.is_dj ? "bg-primary" : "bg-border/60"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_dj ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>

            <div className="flex items-start justify-between gap-4 p-4 bg-card/30 rounded-xl border border-border/20">
              <div>
                <p className="font-semibold flex items-center gap-2 text-red-400"><AlertCircle className="w-4 h-4" />Explicit Content</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your music or performances contain explicit language or content</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, explicit_content: !f.explicit_content }))}
                className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.explicit_content ? "bg-red-500" : "bg-border/60"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.explicit_content ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Booking settings */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" />Booking</h3>
              <button
                onClick={() => setForm(f => ({ ...f, booking_available: !f.booking_available }))}
                className={`w-12 h-6 rounded-full transition-colors ${form.booking_available ? "bg-yellow-500" : "bg-border/60"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.booking_available ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>

            {form.booking_available && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Rate Type</label>
                  <div className="flex gap-2">
                    {([
                      { id: "per_hour", label: "Per Hour" },
                      { id: "per_event", label: "Per Event" },
                      { id: "negotiable", label: "Negotiable" },
                    ] as const).map(r => (
                      <button
                        key={r.id}
                        onClick={() => setForm(f => ({ ...f, booking_rate_type: r.id }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${form.booking_rate_type === r.id ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:border-border/80"}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.booking_rate_type !== "negotiable" && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Rate (ZAR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R</span>
                        <input type="number" value={form.booking_fee_zar} onChange={e => setForm(f => ({ ...f, booking_fee_zar: e.target.value }))} placeholder="0" className="w-full bg-input text-foreground rounded-lg pl-6 pr-3 py-2 border border-border/40 focus:outline-none text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Rate (USD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                        <input type="number" value={form.booking_fee_usd} onChange={e => setForm(f => ({ ...f, booking_fee_usd: e.target.value }))} placeholder="0" className="w-full bg-input text-foreground rounded-lg pl-6 pr-3 py-2 border border-border/40 focus:outline-none text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Rate (coins)</label>
                      <input type="number" value={form.booking_fee_coins} onChange={e => setForm(f => ({ ...f, booking_fee_coins: e.target.value }))} placeholder="0" className="w-full bg-input text-foreground rounded-lg px-3 py-2 border border-border/40 focus:outline-none text-sm" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Available Booking Dates</label>
                  <AvailabilityCalendar value={availableDates} onChange={setAvailableDates} />
                </div>

                <div className="flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                  <Info className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Leave the rate blank to allow fans to make offers. All booking terms are between you and the fan — CheckinPurple doesn't take a cut on bookings.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Socials */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />Social Media</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { field: "social_instagram", label: "Instagram", icon: "📸", prefix: "@", placeholder: "yourhandle" },
                { field: "social_twitter", label: "X / Twitter", icon: "𝕏", prefix: "@", placeholder: "yourhandle" },
                { field: "social_tiktok", label: "TikTok", icon: "🎵", prefix: "@", placeholder: "yourhandle" },
                { field: "social_facebook", label: "Facebook", icon: "📘", prefix: "", placeholder: "facebook.com/yourpage" },
                { field: "social_youtube", label: "YouTube", icon: "▶️", prefix: "@", placeholder: "yourchannel" },
                { field: "social_soundcloud", label: "SoundCloud", icon: "☁️", prefix: "@", placeholder: "yourprofile" },
              ].map(s => (
                <div key={s.field}>
                  <label className="text-xs text-muted-foreground mb-1 block">{s.icon} {s.label}</label>
                  <div className="relative">
                    {s.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{s.prefix}</span>}
                    <input
                      value={(form as any)[s.field]}
                      onChange={e => setForm(f => ({ ...f, [s.field]: e.target.value }))}
                      placeholder={s.placeholder}
                      className={`w-full bg-input text-foreground rounded-lg ${s.prefix ? "pl-7" : "pl-3"} pr-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streaming Platforms */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Headphones className="w-4 h-4 text-green-400" />Music Streaming Links</h3>
            <p className="text-xs text-muted-foreground">Paste your full profile/artist URL on each platform</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { field: "streaming_spotify", label: "Spotify", icon: "🟢", placeholder: "open.spotify.com/artist/..." },
                { field: "streaming_apple", label: "Apple Music", icon: "🍎", placeholder: "music.apple.com/artist/..." },
                { field: "streaming_audiomack", label: "Audiomack", icon: "🎶", placeholder: "audiomack.com/yourname" },
                { field: "streaming_youtube_music", label: "YouTube Music", icon: "▶️", placeholder: "music.youtube.com/channel/..." },
                { field: "streaming_deezer", label: "Deezer", icon: "🎧", placeholder: "deezer.com/artist/..." },
              ].map(s => (
                <div key={s.field}>
                  <label className="text-xs text-muted-foreground mb-1 block">{s.icon} {s.label}</label>
                  <input
                    value={(form as any)[s.field]}
                    onChange={e => setForm(f => ({ ...f, [s.field]: e.target.value }))}
                    placeholder={s.placeholder}
                    className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Skills for Sale */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <h3 className="font-bold flex items-center gap-2"><Sliders className="w-4 h-4 text-accent" />Skills & Services</h3>
            <p className="text-xs text-muted-foreground">Select extra skills you offer — these appear on your profile and in the store</p>
            <div className="grid grid-cols-2 gap-2">
              {SKILLS.map(sk => {
                const active = form.skills.includes(sk.id);
                return (
                  <button
                    key={sk.id}
                    onClick={() => setForm(f => ({
                      ...f,
                      skills: active ? f.skills.filter(s => s !== sk.id) : [...f.skills, sk.id]
                    }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                      active
                        ? "bg-accent/10 border-accent/40 text-accent"
                        : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    <span>{sk.emoji}</span>
                    <span className="text-xs">{sk.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Camera className="w-4 h-4 text-purple-400" />Photo Gallery</h3>
            <p className="text-xs text-muted-foreground">Upload press shots and stage photos. Visible to followers only on your public profile.</p>

            <label
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-border/40 hover:border-primary/40 cursor-pointer transition-colors"
              onClick={() => galleryInputRef.current?.click()}
            >
              <Camera className="w-7 h-7 text-muted-foreground opacity-60" />
              <p className="text-sm text-muted-foreground">{galleryUploading ? "Uploading..." : "Tap to add photos"}</p>
              <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB each</p>
            </label>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length || !user) return;
                setGalleryUploading(true);
                try {
                  const { supabase } = await import("@/lib/supabase");
                  const uploaded: string[] = [];
                  for (const file of files) {
                    const ext = file.name.split(".").pop();
                    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                    const { error: upErr } = await supabase.storage
                      .from("artist-gallery")
                      .upload(path, file, { upsert: false });
                    if (!upErr) {
                      const { data: urlData } = supabase.storage.from("artist-gallery").getPublicUrl(path);
                      if (urlData?.publicUrl) uploaded.push(urlData.publicUrl);
                    }
                  }
                  setGalleryImages(prev => [...prev, ...uploaded]);
                } catch (err) {
                  console.error("Gallery upload error:", err);
                } finally {
                  setGalleryUploading(false);
                  if (galleryInputRef.current) galleryInputRef.current.value = "";
                }
              }}
            />

            {galleryImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {galleryImages.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setGalleryImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>


          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">{error}</div>
          )}

          <button onClick={save} disabled={saving} className="w-full py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-lg rounded-2xl hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            {saving ? "Saving..." : "Save Artist Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
