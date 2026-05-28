import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Radio, Mic, Music, Calendar, MapPin, Users,
  Star, ExternalLink, Instagram, Twitter, Coins,
  Zap, Check, UserPlus, UserCheck, AlertTriangle,
  Clock, Ticket, ArrowLeft, Send, Info, Camera,
  ShoppingBag, TrendingUp, Image, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ArtistCollabs from "@/components/ArtistCollabs";
import OGMeta from "@/components/OGMeta";

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
  streaming_spotify?: string;
  streaming_apple?: string;
  streaming_audiomack?: string;
  skills?: string[];
  is_verified?: boolean;
  follower_count?: number;
  role: string;
  gallery_images?: string[];
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
  const [showDressingRequest, setShowDressingRequest] = useState(false);
  const [showInfluencerDeal, setShowInfluencerDeal] = useState(false);
  const [rsvping, setRsvping] = useState<string | null>(null);
  const [tab, setTab] = useState<"about" | "gigs" | "gallery" | "collabs" | "book">("about");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Booking state
  const [bookingDate, setBookingDate] = useState("");
  const [bookingMsg, setBookingMsg] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Dressing request state
  const [dressingNote, setDressingNote] = useState("");
  const [dressingLoading, setDressingLoading] = useState(false);
  const [dressingSuccess, setDressingSuccess] = useState(false);

  // Influencer deal state
  const [dealOffer, setDealOffer] = useState("");
  const [dealNote, setDealNote] = useState("");
  const [dealLoading, setDealLoading] = useState(false);
  const [dealSuccess, setDealSuccess] = useState(false);

  // Mock gallery images (replace with API call)
  const galleryImages = artist?.gallery_images || [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400",
    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
  ];

  useEffect(() => {
    if (!username) return;
    fetchArtist();
  }, [username]);

  const fetchArtist = async () => {
    try {
      const res = await fetch(`/api/artist/profile/${username}`);
      const data = await res.json();
      if (data.success) {
        setArtist(data.artist);
        setFollowerCount(data.artist.follower_count || 0);
        if (user && data.followedByMe !== undefined) setIsFollowing(data.followedByMe);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const handleFollow = async () => {
    if (!user) { navigate("/signin"); return; }
    try {
      const method = isFollowing ? "DELETE" : "POST";
      await fetch(`/api/social/follow/${artist?.id}`, { method, headers: { Authorization: `Bearer ${user.id}` } });
      setIsFollowing(!isFollowing);
      setFollowerCount(c => isFollowing ? c - 1 : c + 1);
    } catch {}
  };

  const handleRSVP = async (gigId: string, rsvpd: boolean) => {
    if (!user) { navigate("/signin"); return; }
    setRsvping(gigId);
    try {
      const method = rsvpd ? "DELETE" : "POST";
      await fetch(`/api/gigs/${gigId}/rsvp`, { method, headers: { Authorization: `Bearer ${user.id}` } });
      setGigs(gs => gs.map(g => g.id === gigId ? { ...g, user_rsvpd: !rsvpd, rsvp_count: rsvpd ? g.rsvp_count - 1 : g.rsvp_count + 1 } : g));
    } catch {}
    finally { setRsvping(null); }
  };

  const handleBooking = async () => {
    if (!user) { navigate("/signin"); return; }
    setBookingLoading(true);
    try {
      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ artist_id: artist?.id, requested_date: bookingDate, message: bookingMsg }),
      });
      setBookingSuccess(true);
    } catch {}
    finally { setBookingLoading(false); }
  };

  const handleDressingRequest = async () => {
    if (!user) { navigate("/signin"); return; }
    setDressingLoading(true);
    try {
      await fetch("/api/bookings/dressing", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ artist_id: artist?.id, note: dressingNote }),
      });
      setDressingSuccess(true);
    } catch {}
    finally { setDressingLoading(false); }
  };

  const handleInfluencerDeal = async () => {
    if (!user) { navigate("/signin"); return; }
    setDealLoading(true);
    try {
      await fetch("/api/influencer/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ artist_id: artist?.id, commission_offer: dealOffer, note: dealNote }),
      });
      setDealSuccess(true);
    } catch {}
    finally { setDealLoading(false); }
  };

  const isMerchant = user?.profiles?.includes("merchant") || user?.role === "merchant";
  const isInfluencer = user?.profiles?.includes("influencer") || user?.role === "influencer";
  const isAdmin = user?.role === "admin";

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );

  if (!artist) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <AlertTriangle className="w-10 h-10 text-muted-foreground" />
      <p className="text-muted-foreground">Artist not found.</p>
      <Link to="/" className="text-primary underline text-sm">Go Home</Link>
    </div>
  );

  const tabs = [
    { id: "about", label: "About" },
    { id: "gigs", label: `Gigs (${gigs.length})` },
    { id: "gallery", label: "Gallery" },
    { id: "collabs", label: "Collabs" },
    ...(artist.booking_available ? [{ id: "book", label: "Book" }] : []),
  ] as { id: typeof tab; label: string }[];

  return (
    <div className="min-h-screen bg-background">
      <OGMeta
        title={`${artist.username} · Artist on CheckinPurple`}
        description={artist.artist_bio || `${artist.username} is an artist on CheckinPurple. ${artist.genres?.join(", ") || ""}`}
        image={artist.avatar_url}
        url={`${window.location.origin}/artist/${artist.username}`}
        type="profile"
      />
      {/* Back */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Profile Header */}
      <div className="max-w-3xl mx-auto px-4 pb-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 text-2xl font-bold text-primary-foreground">
            {artist.avatar_url ? (
              <img src={artist.avatar_url} alt={artist.username} className="w-full h-full rounded-2xl object-cover" />
            ) : artist.username[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{artist.username}</h1>
              {artist.is_verified && <Check className="w-5 h-5 text-primary" />}
              {artist.is_dj && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">DJ</span>}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {artist.genres?.map(g => (
                <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-card border border-border/40 text-muted-foreground">{g}</span>
              ))}
            </div>
            {artist.skills && artist.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {artist.skills.map((skill) => (
                  <span key={skill} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {skill.split("_").join(" ")}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              {artist.streaming_spotify && (
                <a href={artist.streaming_spotify.startsWith("http") ? artist.streaming_spotify : `https://${artist.streaming_spotify}`} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-full border border-border/40 hover:bg-card/50">Spotify</a>
              )}
              {artist.streaming_apple && (
                <a href={artist.streaming_apple.startsWith("http") ? artist.streaming_apple : `https://${artist.streaming_apple}`} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-full border border-border/40 hover:bg-card/50">Apple Music</a>
              )}
              {artist.streaming_audiomack && (
                <a href={artist.streaming_audiomack.startsWith("http") ? artist.streaming_audiomack : `https://${artist.streaming_audiomack}`} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-full border border-border/40 hover:bg-card/50">Audiomack</a>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span><b className="text-foreground">{followerCount}</b> followers</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleFollow}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isFollowing ? "bg-card border border-border/40 text-muted-foreground hover:text-foreground" : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {isFollowing ? <><UserCheck className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
              </button>

              {/* Merchant: Request to dress artist */}
              {isMerchant && (
                <button
                  onClick={() => setShowDressingRequest(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" /> Offer to Dress
                </button>
              )}

              {/* Influencer: Negotiate promotion deal */}
              {isInfluencer && (
                <button
                  onClick={() => setShowInfluencerDeal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" /> Propose Deal
                </button>
              )}

              {artist.social_instagram && (
                <a href={`https://instagram.com/${artist.social_instagram}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg border border-border/40 hover:bg-card/50 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {artist.social_twitter && (
                <a href={`https://twitter.com/${artist.social_twitter}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg border border-border/40 hover:bg-card/50 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/40 px-4 max-w-3xl mx-auto">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {tab === "about" && (
          <div className="space-y-5">
            {artist.artist_bio && (
              <div className="p-4 rounded-xl border border-border/40 bg-card/30">
                <p className="text-sm leading-relaxed text-muted-foreground">{artist.artist_bio}</p>
              </div>
            )}

            {/* Skills */}
            {artist.skills && artist.skills.length > 0 && (
              <div className="p-4 rounded-xl border border-border/40 bg-card/30">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Skills & Services</p>
                <div className="flex flex-wrap gap-2">
                  {artist.skills.map((s: string) => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent capitalize">
                      {s.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Streaming links */}
            {(artist.streaming_spotify || artist.streaming_apple || artist.streaming_audiomack || artist.streaming_youtube_music || artist.streaming_deezer) && (
              <div className="p-4 rounded-xl border border-border/40 bg-card/30">
                <p className="text-xs font-semibold text-muted-foreground mb-3">Listen On</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { url: artist.streaming_spotify, label: "Spotify", icon: "🟢" },
                    { url: artist.streaming_apple, label: "Apple Music", icon: "🍎" },
                    { url: artist.streaming_audiomack, label: "Audiomack", icon: "🎶" },
                    { url: artist.streaming_youtube_music, label: "YouTube Music", icon: "▶️" },
                    { url: artist.streaming_deezer, label: "Deezer", icon: "🎧" },
                  ].filter(p => p.url).map(p => (
                    <a key={p.label} href={p.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-card/50 text-xs font-medium hover:border-primary/40 hover:bg-primary/5 transition-colors">
                      <span>{p.icon}</span> {p.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {artist.booking_available && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <p className="font-semibold text-sm">Available for Booking</p>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{artist.booking_note || "Contact for rates and availability."}</p>
                {artist.booking_fee_zar && <p className="text-sm font-medium">From R{artist.booking_fee_zar}</p>}
                <button onClick={() => setTab("book")} className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">Book Now</button>
              </div>
            )}
          </div>
        )}

        {tab === "collabs" && (
          <div className="p-4 rounded-xl border border-border/40 bg-card/30">
            <ArtistCollabs viewUserId={artist.id} />
          </div>
        )}

        {tab === "gigs" && (
          <div className="space-y-3">
            {gigs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No upcoming gigs.</div>
            ) : gigs.map(gig => (
              <div key={gig.id} className="p-4 rounded-xl border border-border/40 bg-card/30 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{gig.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />{gig.venue}, {gig.city}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />{new Date(gig.event_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{gig.rsvp_count} RSVPs</span>
                  <button
                    onClick={() => handleRSVP(gig.id, !!gig.user_rsvpd)}
                    disabled={rsvping === gig.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      gig.user_rsvpd ? "bg-card border border-border/40 text-muted-foreground" : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {gig.user_rsvpd ? "Cancel RSVP" : "RSVP"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "gallery" && (
          <div>
            {(!isFollowing && !isAdmin && user?.id !== artist.id) ? (
              <div className="text-center py-12 text-muted-foreground text-sm rounded-xl border border-border/40 bg-card/30">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Follow to view gallery.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {galleryImages.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIdx(i)}
                      className="aspect-square rounded-xl overflow-hidden bg-card border border-border/40 hover:opacity-90 transition-opacity"
                    >
                      <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                {galleryImages.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <Camera className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No gallery images yet.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "book" && (
          <div className="max-w-md">
            {bookingSuccess ? (
              <div className="p-5 rounded-xl border border-green-500/20 bg-green-500/5 text-center">
                <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="font-semibold">Booking request sent!</p>
                <p className="text-sm text-muted-foreground mt-1">The artist will get back to you.</p>
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-border/40 bg-card/30 space-y-4">
                <h3 className="font-bold">Request a Booking</h3>
                {artist.booking_fee_zar && (
                  <p className="text-sm text-muted-foreground">Starting from <b className="text-foreground">R{artist.booking_fee_zar}</b></p>
                )}
                <div>
                  <label className="block text-xs font-medium mb-1.5">Preferred Date</label>
                  <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                    className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Message</label>
                  <textarea value={bookingMsg} onChange={e => setBookingMsg(e.target.value)} rows={3} placeholder="Describe the event, venue, requirements..."
                    className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none" />
                </div>
                <button onClick={handleBooking} disabled={bookingLoading || !bookingDate}
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {bookingLoading ? "Sending..." : "Send Booking Request"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightboxIdx(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20" onClick={() => setLightboxIdx(null)}>
            <X className="w-5 h-5" />
          </button>
          <button className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20" onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null && i > 0 ? i - 1 : galleryImages.length - 1); }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <img src={galleryImages[lightboxIdx]} alt="Gallery" className="max-w-full max-h-[80vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20" onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null && i < galleryImages.length - 1 ? i + 1 : 0); }}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Merchant Dressing Request Modal */}
      {showDressingRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDressingRequest(false)}>
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border/40" onClick={e => e.stopPropagation()}>
            {dressingSuccess ? (
              <div className="text-center">
                <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="font-semibold">Request sent!</p>
                <p className="text-sm text-muted-foreground mt-1">The artist will review your offer.</p>
                <button onClick={() => setShowDressingRequest(false)} className="mt-4 px-4 py-2 rounded-lg bg-card border border-border/40 text-sm">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-5 h-5 text-orange-400" />
                  <h3 className="font-bold">Offer to Dress {artist.username}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Send a styling offer to this artist. They can accept, negotiate, or decline.</p>
                <textarea value={dressingNote} onChange={e => setDressingNote(e.target.value)} rows={3}
                  placeholder="Describe your styling offer, styles you work with, availability..."
                  className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none mb-3" />
                <div className="flex gap-2">
                  <button onClick={() => setShowDressingRequest(false)} className="flex-1 px-4 py-2 rounded-lg border border-border/40 text-sm">Cancel</button>
                  <button onClick={handleDressingRequest} disabled={dressingLoading || !dressingNote}
                    className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                    {dressingLoading ? "Sending..." : "Send Offer"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Influencer Deal Modal */}
      {showInfluencerDeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInfluencerDeal(false)}>
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border/40" onClick={e => e.stopPropagation()}>
            {dealSuccess ? (
              <div className="text-center">
                <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="font-semibold">Deal proposal sent!</p>
                <p className="text-sm text-muted-foreground mt-1">The artist will review your proposal.</p>
                <button onClick={() => setShowInfluencerDeal(false)} className="mt-4 px-4 py-2 rounded-lg bg-card border border-border/40 text-sm">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-pink-400" />
                  <h3 className="font-bold">Propose Promotion Deal</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Negotiate a commission directly with {artist.username}. Your commission comes from the artist's earnings — not a CheckinPurple cut.
                </p>
                <div className="mb-3">
                  <label className="block text-xs font-medium mb-1.5">Your Commission Rate</label>
                  <input value={dealOffer} onChange={e => setDealOffer(e.target.value)} placeholder="e.g. 10% of tips generated, R500 flat fee..."
                    className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium mb-1.5">Message to Artist</label>
                  <textarea value={dealNote} onChange={e => setDealNote(e.target.value)} rows={3}
                    placeholder="Describe your platform, reach, and what you'll do to promote their music..."
                    className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowInfluencerDeal(false)} className="flex-1 px-4 py-2 rounded-lg border border-border/40 text-sm">Cancel</button>
                  <button onClick={handleInfluencerDeal} disabled={dealLoading || !dealOffer || !dealNote}
                    className="flex-1 px-4 py-2 rounded-lg bg-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                    {dealLoading ? "Sending..." : "Send Proposal"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
