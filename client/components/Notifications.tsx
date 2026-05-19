import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Check, X, Calendar, Coins, Music,
  Users, Zap, ShoppingBag, CheckCircle, XCircle,
  Star, MessageSquare
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  booking_request: <Zap className="w-4 h-4 text-yellow-500" />,
  booking_accepted: <CheckCircle className="w-4 h-4 text-green-500" />,
  booking_declined: <XCircle className="w-4 h-4 text-red-500" />,
  booking_counter: <MessageSquare className="w-4 h-4 text-blue-400" />,
  booking_confirmed: <Check className="w-4 h-4 text-primary" />,
  new_gig: <Calendar className="w-4 h-4 text-primary" />,
  gig_reminder: <Calendar className="w-4 h-4 text-orange-500" />,
  gig_cancelled: <XCircle className="w-4 h-4 text-red-500" />,
  new_follower: <Users className="w-4 h-4 text-accent" />,
  coin_tip: <Coins className="w-4 h-4 text-yellow-500" />,
  submission_approved: <CheckCircle className="w-4 h-4 text-green-500" />,
  submission_rejected: <XCircle className="w-4 h-4 text-red-500" />,
  collab_invite: <Music className="w-4 h-4 text-purple-400" />,
  rsvp_confirmed: <CheckCircle className="w-4 h-4 text-primary" />,
  system: <Bell className="w-4 h-4 text-muted-foreground" />,
};

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications || []);
    } catch {} finally { setLoading(false); }
  };

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user?.id}` },
      });
      setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user?.id}` },
      });
      setNotifications(n => n.map(x => ({ ...x, read: true })));
    } catch {}
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.read) await markRead(notif.id);
    if (notif.action_url) {
      navigate(notif.action_url);
      setOpen(false);
    }
  };

  const fmt = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-background border border-border/40 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <h3 className="font-bold text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-card/40 transition-colors border-b border-border/20 last:border-0 ${!notif.read ? "bg-primary/5" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${!notif.read ? "bg-primary/10" : "bg-card/40"}`}>
                    {NOTIF_ICONS[notif.type] || <Bell className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${!notif.read ? "font-semibold" : "font-medium"}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{fmt(notif.created_at)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
