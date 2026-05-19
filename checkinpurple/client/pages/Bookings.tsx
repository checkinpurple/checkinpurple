import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Radio, Calendar, MapPin, Clock, Coins, Check,
  X, MessageSquare, ArrowLeft, ChevronDown, ChevronUp,
  Zap, Send, DollarSign, AlertCircle, CheckCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type BookingStatus = "pending" | "accepted" | "declined" | "negotiating" | "confirmed" | "cancelled";

interface Booking {
  id: string;
  fan_id: string;
  fan_username: string;
  artist_id: string;
  artist_username: string;
  event_type: string;
  event_date?: string;
  event_location?: string;
  event_description?: string;
  expected_duration_hours?: number;
  offered_fee_zar?: number;
  offered_fee_coins?: number;
  payment_method: string;
  message: string;
  status: BookingStatus;
  artist_response?: string;
  counter_fee_zar?: number;
  counter_fee_coins?: number;
  created_at: string;
  messages?: BookingMessage[];
}

interface BookingMessage {
  id: string;
  sender_username: string;
  message: string;
  created_at: string;
}

const STATUS_META: Record<BookingStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
  accepted: { label: "Accepted", color: "text-green-500 bg-green-500/10 border-green-500/20" },
  declined: { label: "Declined", color: "text-red-500 bg-red-500/10 border-red-500/20" },
  negotiating: { label: "Negotiating", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  confirmed: { label: "Confirmed ✓", color: "text-primary bg-primary/10 border-primary/20" },
  cancelled: { label: "Cancelled", color: "text-muted-foreground bg-card/30 border-border/30" },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  dj_set: "DJ Set", live_performance: "Live Performance",
  feature: "Feature / Verse", collab: "Collaboration",
  private_event: "Private Event", corporate: "Corporate Event", other: "Other",
};

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"incoming" | "sent">("incoming");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [counterFeeZar, setCounterFeeZar] = useState("");
  const [counterFeeCoins, setCounterFeeCoins] = useState("");
  const [responding, setResponding] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const isArtist = user?.role === "artist" || user?.role === "artist_fan" || user?.role === "admin";

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    fetchBookings();
  }, [user, tab]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?type=${tab}`, {
        headers: { Authorization: `Bearer ${user?.id}` },
      });
      const data = await res.json();
      if (data.success) setBookings(data.bookings || []);
    } catch {} finally { setLoading(false); }
  };

  const respond = async (bookingId: string, status: BookingStatus) => {
    setResponding(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({
          status,
          artistResponse: responseText || undefined,
          counterFeeZar: counterFeeZar ? parseFloat(counterFeeZar) : undefined,
          counterFeeCoins: counterFeeCoins ? parseInt(counterFeeCoins) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setBookings(b => b.map(x => x.id === bookingId ? { ...x, status, artist_response: responseText, counter_fee_zar: parseFloat(counterFeeZar) || undefined, counter_fee_coins: parseInt(counterFeeCoins) || undefined } : x));
      setResponseText(""); setCounterFeeZar(""); setCounterFeeCoins("");
    } catch {} finally { setResponding(null); }
  };

  const sendChat = async (bookingId: string) => {
    if (!chatMessage.trim()) return;
    setSendingChat(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({ message: chatMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookings(b => b.map(x => x.id === bookingId ? {
          ...x,
          messages: [...(x.messages || []), {
            id: data.message?.id || Date.now().toString(),
            sender_username: user?.username || "",
            message: chatMessage,
            created_at: new Date().toISOString(),
          }],
        } : x));
        setChatMessage("");
      }
    } catch {} finally { setSendingChat(false); }
  };

  const cancelBooking = async (bookingId: string) => {
    await respond(bookingId, "cancelled");
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  const fmtFull = (d: string) => new Date(d).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const incomingBookings = bookings.filter(b => b.artist_id === user?.id);
  const sentBookings = bookings.filter(b => b.fan_id === user?.id);
  const displayed = tab === "incoming" ? incomingBookings : sentBookings;

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
        <div className="max-w-3xl mx-auto space-y-5">

          <div>
            <h1 className="text-3xl font-bold mb-1">Bookings</h1>
            <p className="text-muted-foreground">Manage booking requests between fans and artists</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {isArtist && (
              <button onClick={() => setTab("incoming")} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${tab === "incoming" ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
                Incoming
                {incomingBookings.filter(b => b.status === "pending").length > 0 && (
                  <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                    {incomingBookings.filter(b => b.status === "pending").length}
                  </span>
                )}
              </button>
            )}
            <button onClick={() => setTab("sent")} className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${tab === "sent" ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
              Sent Requests
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" /></div>
          ) : displayed.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">
                {tab === "incoming" ? "No booking requests yet" : "You haven't sent any booking requests"}
              </p>
              {tab === "sent" && (
                <p className="text-sm mt-1">Browse artist profiles to send a booking request</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayed.map(booking => {
                const meta = STATUS_META[booking.status];
                const isExpanded = expanded === booking.id;
                const isIncoming = booking.artist_id === user?.id;
                const isPending = booking.status === "pending";
                const canRespond = isIncoming && isPending;

                return (
                  <div key={booking.id} className="glass rounded-2xl border border-border/30 overflow-hidden">
                    {/* Header */}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : booking.id)}
                      className="w-full p-5 text-left hover:bg-card/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold">
                            {(isIncoming ? booking.fan_username : booking.artist_username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold">
                                {isIncoming
                                  ? `@${booking.fan_username} wants to book you`
                                  : `Booking @${booking.artist_username}`
                                }
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${meta.color}`}>
                                {meta.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {EVENT_TYPE_LABELS[booking.event_type] || booking.event_type}
                              </span>
                              {booking.event_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />{fmt(booking.event_date)}
                                </span>
                              )}
                              {booking.event_location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />{booking.event_location}
                                </span>
                              )}
                              {booking.offered_fee_zar && (
                                <span className="flex items-center gap-1 text-green-500 font-semibold">
                                  <DollarSign className="w-3 h-3" />R{booking.offered_fee_zar}
                                </span>
                              )}
                              {booking.offered_fee_coins && (
                                <span className="flex items-center gap-1 text-yellow-500 font-semibold">
                                  <Coins className="w-3 h-3" />{booking.offered_fee_coins} coins
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{fmt(booking.created_at)}</p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-border/30 p-5 space-y-5">

                        {/* Message */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Message</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{booking.message}</p>
                        </div>

                        {/* Event details */}
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          {booking.event_date && (
                            <div className="p-3 bg-card/30 rounded-xl border border-border/20">
                              <p className="text-xs text-muted-foreground mb-0.5">Date & Time</p>
                              <p className="font-semibold">{fmtFull(booking.event_date)}</p>
                            </div>
                          )}
                          {booking.event_location && (
                            <div className="p-3 bg-card/30 rounded-xl border border-border/20">
                              <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                              <p className="font-semibold">{booking.event_location}</p>
                            </div>
                          )}
                          {booking.expected_duration_hours && (
                            <div className="p-3 bg-card/30 rounded-xl border border-border/20">
                              <p className="text-xs text-muted-foreground mb-0.5">Duration</p>
                              <p className="font-semibold">{booking.expected_duration_hours} hour{booking.expected_duration_hours !== 1 ? "s" : ""}</p>
                            </div>
                          )}
                          <div className="p-3 bg-card/30 rounded-xl border border-border/20">
                            <p className="text-xs text-muted-foreground mb-0.5">Payment Method</p>
                            <p className="font-semibold capitalize">{booking.payment_method.replace(/_/g, " ")}</p>
                          </div>
                        </div>

                        {/* Offer */}
                        {(booking.offered_fee_zar || booking.offered_fee_coins) && (
                          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Offered Fee</p>
                            <div className="flex items-center gap-3">
                              {booking.offered_fee_zar && <span className="text-lg font-bold text-green-500">R{booking.offered_fee_zar}</span>}
                              {booking.offered_fee_zar && booking.offered_fee_coins && <span className="text-muted-foreground">or</span>}
                              {booking.offered_fee_coins && <span className="text-lg font-bold text-yellow-500">{booking.offered_fee_coins} coins</span>}
                            </div>
                          </div>
                        )}

                        {/* Counter offer from artist */}
                        {booking.counter_fee_zar && (
                          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Artist Counter Offer</p>
                            <span className="text-lg font-bold text-blue-400">R{booking.counter_fee_zar}</span>
                            {booking.counter_fee_coins && <span className="text-lg font-bold text-yellow-500 ml-3">{booking.counter_fee_coins} coins</span>}
                          </div>
                        )}

                        {/* Artist response */}
                        {booking.artist_response && (
                          <div className="p-4 bg-card/30 rounded-xl border border-border/20">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Artist Response</p>
                            <p className="text-sm text-muted-foreground">{booking.artist_response}</p>
                          </div>
                        )}

                        {/* Event description */}
                        {booking.event_description && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Event Description</p>
                            <p className="text-sm text-muted-foreground">{booking.event_description}</p>
                          </div>
                        )}

                        {/* Artist response panel */}
                        {canRespond && (
                          <div className="space-y-3 p-4 bg-card/20 rounded-xl border border-border/20">
                            <p className="font-semibold text-sm">Respond to this request</p>

                            <textarea
                              value={responseText}
                              onChange={e => setResponseText(e.target.value)}
                              placeholder="Write a response (optional)..."
                              rows={2}
                              className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                            />

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Counter Offer (ZAR)</label>
                                <input type="number" value={counterFeeZar} onChange={e => setCounterFeeZar(e.target.value)} placeholder="Optional" className="w-full bg-input text-foreground rounded-lg px-3 py-2 border border-border/40 focus:outline-none text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Counter Offer (coins)</label>
                                <input type="number" value={counterFeeCoins} onChange={e => setCounterFeeCoins(e.target.value)} placeholder="Optional" className="w-full bg-input text-foreground rounded-lg px-3 py-2 border border-border/40 focus:outline-none text-sm" />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button onClick={() => respond(booking.id, "accepted")} disabled={!!responding} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500/10 border border-green-500/30 text-green-500 rounded-xl font-semibold text-sm hover:bg-green-500/20 transition-colors disabled:opacity-50">
                                <CheckCircle className="w-4 h-4" />Accept
                              </button>
                              <button onClick={() => respond(booking.id, "negotiating")} disabled={!!responding} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl font-semibold text-sm hover:bg-blue-500/20 transition-colors disabled:opacity-50">
                                <MessageSquare className="w-4 h-4" />Counter
                              </button>
                              <button onClick={() => respond(booking.id, "declined")} disabled={!!responding} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl font-semibold text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50">
                                <X className="w-4 h-4" />Decline
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Fan can confirm after artist accepts */}
                        {!isIncoming && booking.status === "accepted" && (
                          <div className="flex gap-2">
                            <button onClick={() => respond(booking.id, "confirmed")} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity">
                              <Check className="w-4 h-4" />Confirm Booking
                            </button>
                            <button onClick={() => cancelBooking(booking.id)} className="px-4 py-3 border border-border/40 text-muted-foreground rounded-xl hover:bg-card/40 text-sm">
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* In-booking chat */}
                        {(booking.status === "negotiating" || booking.status === "accepted" || booking.status === "confirmed") && (
                          <div>
                            <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-primary" />Messages
                            </p>
                            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                              {(booking.messages || []).map(m => (
                                <div key={m.id} className={`flex gap-2 ${m.sender_username === user?.username ? "flex-row-reverse" : ""}`}>
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                    {m.sender_username.charAt(0).toUpperCase()}
                                  </div>
                                  <div className={`flex-1 max-w-xs ${m.sender_username === user?.username ? "items-end" : "items-start"} flex flex-col`}>
                                    <div className={`px-3 py-2 rounded-xl text-sm ${m.sender_username === user?.username ? "bg-primary text-primary-foreground" : "bg-card/40 text-foreground border border-border/20"}`}>
                                      {m.message}
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-0.5 px-1">{fmt(m.created_at)}</span>
                                  </div>
                                </div>
                              ))}
                              {(!booking.messages || booking.messages.length === 0) && (
                                <p className="text-xs text-muted-foreground text-center py-3">No messages yet</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input
                                value={chatMessage}
                                onChange={e => setChatMessage(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && sendChat(booking.id)}
                                placeholder="Send a message..."
                                className="flex-1 bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                              />
                              <button onClick={() => sendChat(booking.id)} disabled={sendingChat || !chatMessage.trim()} className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Cancel for fan on pending */}
                        {!isIncoming && booking.status === "pending" && (
                          <button onClick={() => cancelBooking(booking.id)} className="w-full py-2 border border-border/40 text-muted-foreground rounded-xl hover:bg-card/40 text-sm">
                            Cancel Request
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
