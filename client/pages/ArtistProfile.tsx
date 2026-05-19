import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Radio, Mic, Music, Calendar, MapPin, Users,
  Star, ExternalLink, Instagram, Twitter, Coins,
  Zap, Check, UserPlus, UserCheck, AlertTriangle,
  Clock, Ticket, ArrowLeft, Send, Info
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface ArtistProfile {
  id: string;
  username: string;
  avatar_url?: string;
  artist_bio?: string;
  genres?: string[];
  is_dj?: boolean;
  explicit_content?: boolean;
  booking_available?: boolean;
  booking_fee_coins?: number;
  booking_fee_zar?: number;
  booking_fee_usd?: number;
  booking_rate_type?: string;
  booking_note?: string;
  social_instagram?: string;
  social_twitter?: string;
  social_soundcloud?: string;
  is_verified?: boolean;
  follower_count?: number;
  role: string;
}

interface Gig {
  id: string;
  title: string;
  venue: string;
  city: string;
  event_date: string;
  ticket_price_zar?: number;
  is_free?: boolean;
  ticket_url?: string;
  cover_url?: string;
  rsvp_count: number;
  status: string;
  user_rsvpd?: boolean;
}

export default function ArtistProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [rsvping, setRsvping] = useState<string | null>(null);
  const [tab, setTab] = useState<"about" | "gigs" | "book">("about");

  // Booking form
  const [bookingForm, setBookingForm] = useState({
    event_type: "dj_set",
    event_date: "",
    event_location: "",
    event_description: "",
    expected_duration_hours: "2",
    offered_fee_zar: "",
    offered_fee_coins: "",
    payment_method: "negotiable" as const,
    message: "",
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const EVENT_TYPES = [
    { id: "dj_set", label: "DJ Set" },
    { id: "live_performance", label: "Live Performance" },
    { id: "feature", label: "Feature / Verse" },
    { id: "collab", label: "Collaboration" },
    { id: "private_event", label: "Private Event" },
    { id: "corporate", label: "Corporate Event" },
    { id: "other", label: "Other" },
  ];

  useEffect(() => {
    if (!username) return;
    fetchArtist();
  }, [username]);

  const fetchArtist = async () => {
    try {
      const [aRes, gRes] = await Promise.all([
        fetch(`/api/artists/${username}`),
        fetch(`/api/gigs?artist=${username}`),
      ]);
      const [aData, gData] = await Promise.all([aRes.json(), gRes.json()]);
      if (aData.success) {
        setArtist(aData.artist);
        setFollowerCount(aData.artist.follower_count || 0);
        setIsFollowing(aData.isFollowing || false);
      }
      if (gData.success) setGigs(gData.gigs || []);
    } catch {} finally { setLoading(false); }
  };

  const toggleFollow = async () => {
    if (!user) { navigate("/signin"); return; }
    try {
      await fetch("/api/social/follow", {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ followingId: artist?.id }),
      });
      setIsFollowing(f => !f);
      setFollowerCount(c => c + (isFollowing ? -1 : 1));
    } catch {}
  };

  const rsvpGig = async (gigId: string, currentlyRsvpd: boolean) => {
    if (!user) { navigate("/signin"); return; }
    setRsvping(gigId);
    try {
      await fetch(`/api/gigs/${gigId}/rsvp`, {
        method: currentlyRsvpd ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ username: user.username }),
      });
      setGigs(g => g.map(x => x.id === gigId ? {
        ...x,
        user_rsvpd: !currentlyRsvpd,
        rsvp_count: x.rsvp_count + (currentlyRsvpd ? -1 : 1),
      } : x));
    } catch {} finally { setRsvping(null); }
  };

  const submitBooking = async () => {
    if (!user) { navigate("/signin"); return; }
    if (!bookingForm.event_type || !bookingForm.message.trim()) {
      setBookingError("Event type and message are required"); return;
    }
    setSubmittingBooking(true); setBookingError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({
          artistId: artist?.id,
          artistUsername: artist?.username,
          ...bookingForm,
          offeredFeeZar: bookingForm.offered_fee_zar ? parseFloat(bookingForm.offered_fee_zar) : undefined,
          offeredFeeCoins: bookingForm.offered_fee_coins ? parseInt(bookingForm.offered_fee_coins) : undefined,
          expectedDurationHours: bookingForm.expected_duration_hours ? parseFloat(bookingForm.expected_duration_hours) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setBookingSuccess(true);
      setBookingForm({ event_type: "dj_set", event_date: "", event_location: "", event_description: "", expected_duration_hours: "2", offered_fee_zar: "", offered_fee_coins: "", payment_method: "negotiable", message: "" });
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Booking failed");
    } finally { setSubmittingBooking(false); }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );

  if (!artist) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-center">
      <div>
        <p className="text-2xl font-bold mb-2">Artist not found</p>
        <Link to="/" className="text-primary hover:underline">Go back home</Link>
      </div>
    </div>
  );

  const isOwnProfile = user?.id === artist.id;
  const upcomingGigs = gigs.filter(g => g.status === "upcoming");
  const pastGigs = gigs.filter(g => g.status === "ended");

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
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="w-4 h-4" />Back
          </button>
        </div>
      </nav>

      <div className="pt-20 pb-12">
        {/* Hero banner */}
        <div className="relative h-48 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Avatar + name */}
          <div className="flex items-end gap-5 -mt-16 mb-6 relative z-10">
            <div className="w-28 h-28 rounded-2xl border-4 border-background overflow-hidden bg-primary/20 flex items-center justify-center flex-shrink-0 shadow-xl">
              {artist.avatar_url
                ? <img src={artist.avatar_url} alt={artist.username} className="w-full h-full object-cover" />
                : <span className="text-4xl font-bold text-primary">{artist.username.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">@{artist.username}</h1>
                {artist.is_verified && (
                  <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center" title="Verified">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </span>
                )}
                {artist.is_dj && (
                  <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-full">
                    🎧 DJ
                  </span>
                )}
                {artist.explicit_content && (
                  <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />EXPLICIT
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span>{followerCount.toLocaleString()} followers</span>
                {artist.genres && artist.genres.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    {artist.genres.slice(0, 3).join(" · ")}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pb-2 flex-shrink-0 flex-wrap">
              {!isOwnProfile && (
                <>
                  <button onClick={toggleFollow} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${isFollowing ? "border-primary/40 bg-primary/10 text-primary hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400" : "bg-primary text-primary-foreground hover:opacity-90 border-transparent"}`}>
                    {isFollowing ? <><UserCheck className="w-4 h-4" />Following</> : <><UserPlus className="w-4 h-4" />Follow</>}
                  </button>
                  {artist.booking_available && (
                    <button onClick={() => setTab("book")} className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:opacity-90 transition-opacity">
                      <Zap className="w-4 h-4" />Book Artist
                    </button>
                  )}
                </>
              )}
              {isOwnProfile && (
                <Link to="/artist-settings" className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border border-border/40 bg-card/30 hover:bg-card/50 transition-colors">
                  Edit Profile
                </Link>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border/40 pb-0">
            {([
              { id: "about", label: "About" },
              { id: "gigs", label: `Gigs${upcomingGigs.length > 0 ? ` (${upcomingGigs.length})` : ""}` },
              { id: "book", label: "Book", hidden: !artist.booking_available || isOwnProfile },
            ] as Array<{ id: string; label: string; hidden?: boolean }>)
              .filter(t => !t.hidden)
              .map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 -mb-px ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ABOUT TAB */}
          {tab === "about" && (
            <div className="space-y-5">
              {/* Bio */}
              {artist.artist_bio && (
                <div className="glass rounded-2xl p-5">
                  <h3 className="font-bold mb-2">About</h3>
                  <p className="text-muted-foreground leading-relaxed">{artist.artist_bio}</p>
                </div>
              )}

              {/* Genres */}
              {artist.genres && artist.genres.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><Music className="w-4 h-4 text-primary" />Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {artist.genres.map(g => (
                      <span key={g} className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-sm font-semibold rounded-full">{g}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking info card */}
              {artist.booking_available && (
                <div className="glass rounded-2xl p-5 border-2 border-yellow-500/20">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Available for Booking
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    {artist.is_dj && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">🎧</span>
                        <span className="text-muted-foreground">Available as DJ</span>
                      </div>
                    )}
                    {(artist.booking_fee_zar || artist.booking_fee_coins) && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500 flex-shrink-0">💰</span>
                        <div>
                          <p className="text-muted-foreground">Rate ({artist.booking_rate_type?.replace("_", " ")})</p>
                          <p className="font-semibold">
                            {artist.booking_fee_zar && `R${artist.booking_fee_zar}`}
                            {artist.booking_fee_zar && artist.booking_fee_coins && " · "}
                            {artist.booking_fee_coins && `${artist.booking_fee_coins} coins`}
                          </p>
                        </div>
                      </div>
                    )}
                    {!artist.booking_fee_zar && !artist.booking_fee_coins && (
                      <div className="flex items-center gap-2 text-sm">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Fee negotiable — send a request</span>
                      </div>
                    )}
                  </div>
                  {artist.booking_note && (
                    <p className="text-sm text-muted-foreground italic mb-4">"{artist.booking_note}"</p>
                  )}
                  {!isOwnProfile && (
                    <button onClick={() => setTab("book")} className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl hover:opacity-90 transition-opacity">
                      Send Booking Request
                    </button>
                  )}
                </div>
              )}

              {/* Socials */}
              {(artist.social_instagram || artist.social_twitter || artist.social_soundcloud) && (
                <div className="glass rounded-2xl p-5">
                  <h3 className="font-bold mb-3">Links</h3>
                  <div className="flex flex-wrap gap-3">
                    {artist.social_instagram && (
                      <a href={`https://instagram.com/${artist.social_instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl text-sm font-semibold hover:bg-pink-500/20 transition-colors">
                        <Instagram className="w-4 h-4" />@{artist.social_instagram}
                      </a>
                    )}
                    {artist.social_twitter && (
                      <a href={`https://x.com/${artist.social_twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-500/20 transition-colors">
                        <Twitter className="w-4 h-4" />@{artist.social_twitter}
                      </a>
                    )}
                    {artist.social_soundcloud && (
                      <a href={`https://soundcloud.com/${artist.social_soundcloud}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl text-sm font-semibold hover:bg-orange-500/20 transition-colors">
                        <Music className="w-4 h-4" />SoundCloud
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Content rating */}
              <div className="flex items-center gap-3 p-4 glass rounded-xl text-sm">
                {artist.explicit_content ? (
                  <><AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" /><span className="text-muted-foreground">This artist creates <strong className="text-red-400">explicit content</strong>. Listener discretion advised.</span></>
                ) : (
                  <><Check className="w-5 h-5 text-green-500 flex-shrink-0" /><span className="text-muted-foreground">This artist's content is <strong className="text-green-500">clean / non-explicit</strong>.</span></>
                )}
              </div>
            </div>
          )}

          {/* GIGS TAB */}
          {tab === "gigs" && (
            <div className="space-y-5">
              {isOwnProfile && (
                <Link to="/gigs/new" className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border/50 rounded-2xl text-muted-foreground hover:border-primary/40 hover:text-primary transition-all text-sm font-semibold">
                  + Post a New Gig
                </Link>
              )}

              {upcomingGigs.length > 0 && (
                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />Upcoming</h3>
                  <div className="space-y-3">
                    {upcomingGigs.map(gig => (
                      <div key={gig.id} className="glass rounded-2xl p-5 border border-border/30 hover:border-primary/30 transition-colors">
                        <div className="flex items-start gap-4 flex-wrap">
                          {gig.cover_url && (
                            <img src={gig.cover_url} alt={gig.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-lg">{gig.title}</h4>
                            <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{gig.venue}, {gig.city}</span>
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmt(gig.event_date)}</span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{gig.rsvp_count} interested</span>
                            </div>
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                              <span className={`text-sm font-bold ${gig.is_free ? "text-green-500" : "text-primary"}`}>
                                {gig.is_free ? "Free Entry" : `R${gig.ticket_price_zar}`}
                              </span>
                              {gig.ticket_url && (
                                <a href={gig.ticket_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                  <Ticket className="w-3 h-3" />Get Tickets
                                </a>
                              )}
                              {!isOwnProfile && (
                                <button
                                  onClick={() => rsvpGig(gig.id, !!gig.user_rsvpd)}
                                  disabled={rsvping === gig.id}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${gig.user_rsvpd ? "bg-primary/10 border border-primary/30 text-primary" : "border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
                                >
                                  {gig.user_rsvpd ? <><Check className="w-3 h-3" />Interested</> : "Mark Interested"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pastGigs.length > 0 && (
                <div>
                  <h3 className="font-bold mb-3 text-muted-foreground">Past Gigs</h3>
                  <div className="space-y-2 opacity-60">
                    {pastGigs.map(gig => (
                      <div key={gig.id} className="flex items-center justify-between p-4 glass rounded-xl border border-border/20">
                        <div>
                          <p className="font-semibold text-sm">{gig.title}</p>
                          <p className="text-xs text-muted-foreground">{gig.venue}, {gig.city} · {fmt(gig.event_date)}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{gig.rsvp_count} attended</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {gigs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No gigs posted yet</p>
                </div>
              )}
            </div>
          )}

          {/* BOOK TAB */}
          {tab === "book" && !isOwnProfile && (
            <div className="space-y-5">
              {bookingSuccess ? (
                <div className="glass rounded-2xl p-8 text-center border border-green-500/30">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-green-500 mb-2">Request Sent!</h3>
                  <p className="text-muted-foreground">@{artist.username} will review your booking request and respond soon.</p>
                  <button onClick={() => setBookingSuccess(false)} className="mt-4 text-sm text-primary hover:underline">Send another request</button>
                </div>
              ) : (
                <div className="glass rounded-2xl p-6 space-y-5">
                  <div>
                    <h3 className="font-bold text-lg mb-1">Book @{artist.username}</h3>
                    {artist.booking_fee_zar ? (
                      <p className="text-sm text-muted-foreground">Declared rate: <strong className="text-foreground">R{artist.booking_fee_zar}</strong> {artist.booking_rate_type?.replace("_", " ")}
                        {artist.booking_fee_coins && <span> or <strong className="text-yellow-500">{artist.booking_fee_coins} coins</strong></span>}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">This artist hasn't declared a rate. Send your offer and they'll respond.</p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Event Type *</label>
                      <select value={bookingForm.event_type} onChange={e => setBookingForm(f => ({ ...f, event_type: e.target.value }))} className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
                        {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Event Date</label>
                      <input type="datetime-local" value={bookingForm.event_date} onChange={e => setBookingForm(f => ({ ...f, event_date: e.target.value }))} className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Location / Venue</label>
                      <input value={bookingForm.event_location} onChange={e => setBookingForm(f => ({ ...f, event_location: e.target.value }))} placeholder="Venue name, City" className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Expected Duration (hours)</label>
                      <input type="number" value={bookingForm.expected_duration_hours} onChange={e => setBookingForm(f => ({ ...f, expected_duration_hours: e.target.value }))} min="0.5" step="0.5" className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                    </div>
                  </div>

                  {/* Fee offer */}
                  <div className="p-4 bg-card/30 rounded-xl border border-border/20 space-y-3">
                    <p className="text-sm font-semibold">Your Offer (optional — leave blank to negotiate)</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Offer (ZAR)</label>
                        <input type="number" value={bookingForm.offered_fee_zar} onChange={e => setBookingForm(f => ({ ...f, offered_fee_zar: e.target.value }))} placeholder="0.00" className="w-full bg-input text-foreground rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Offer (coins)</label>
                        <input type="number" value={bookingForm.offered_fee_coins} onChange={e => setBookingForm(f => ({ ...f, offered_fee_coins: e.target.value }))} placeholder="0" className="w-full bg-input text-foreground rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Payment via</label>
                        <select value={bookingForm.payment_method} onChange={e => setBookingForm(f => ({ ...f, payment_method: e.target.value as any }))} className="w-full bg-input text-foreground rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
                          <option value="negotiable">Negotiable</option>
                          <option value="cash_zar">Cash ZAR</option>
                          <option value="cash_usd">Cash USD</option>
                          <option value="coins">CheckinPurple Coins</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Event Description</label>
                    <textarea value={bookingForm.event_description} onChange={e => setBookingForm(f => ({ ...f, event_description: e.target.value }))} placeholder="Tell the artist about the event..." rows={2} className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none" />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Message to Artist *</label>
                    <textarea value={bookingForm.message} onChange={e => setBookingForm(f => ({ ...f, message: e.target.value }))} placeholder={`Hi @${artist.username}, I'd like to book you for...`} rows={3} className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none" />
                  </div>

                  {bookingError && (
                    <p className="text-destructive text-sm">{bookingError}</p>
                  )}

                  <button onClick={submitBooking} disabled={submittingBooking || !bookingForm.message.trim()} className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />{submittingBooking ? "Sending..." : "Send Booking Request"}
                  </button>

                  <p className="text-xs text-muted-foreground text-center">
                    The artist will accept, decline, or make a counter offer. All terms are between you and the artist.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
