import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Radio, LayoutDashboard, Mic, Music, ShoppingBag, Star,
  Users, Wallet, Settings, LogOut, Menu, X, Bell,
  Coins, BookOpen, Calendar, TrendingUp, Camera, Store,
  Headphones, Crown, Send, MapPin, ShieldAlert
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { ProfileType } from "@shared/api";
import Logo from "@/components/Logo";

interface SidebarLink {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  section?: string;
}

const ADMIN_EMAIL = "checkinpurple@gmail.com";

function getNavLinks(
  profiles: ProfileType[], 
  activeProfile: ProfileType, 
  isAdmin: boolean,
  pendingBookings: number
): SidebarLink[] {
  const links: SidebarLink[] = [];
  const profileContext = activeProfile;
  const hasArtist = isAdmin || profileContext === "artist" || profileContext === "artist_fan";
  const hasFan = isAdmin || profileContext === "fan" || profileContext === "artist_fan";
  const hasInfluencer = isAdmin || profileContext === "influencer";
  const hasMerchant = isAdmin || profileContext === "merchant";

  // Admin gets Admin Panel as home
  if (isAdmin) {
    links.push({ 
      to: "/admin", 
      icon: <ShieldAlert className="w-4 h-4" />, 
      label: "Admin Panel",
      section: "Admin"
    });
    links.push({ 
      to: "/dashboard", 
      icon: <LayoutDashboard className="w-4 h-4" />, 
      label: "Dashboard",
      section: "Admin"
    });
    links.push({
      to: "/fan",
      icon: <Users className="w-4 h-4" />,
      label: "Fan Dashboard",
      section: "Admin"
    });
    links.push({
      to: "/influencer",
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Influencer Hub",
      section: "Admin"
    });
    links.push({
      to: "/merchant",
      icon: <ShoppingBag className="w-4 h-4" />,
      label: "Merchant Store",
      section: "Admin"
    });
  } else {
    // Non-admin users get Dashboard as home
    links.push({ 
      to: "/dashboard", 
      icon: <LayoutDashboard className="w-4 h-4" />, 
      label: "Dashboard",
      section: "Home"
    });
    links.push({
      to: "/wall",
      icon: <Users className="w-4 h-4" />,
      label: "Wall",
      section: "Home"
    });
  }

  // Artist-only features (also available to artist_fan)
  if (hasArtist) {
    links.push(
      { to: "/broadcast", icon: <Mic className="w-4 h-4" />, label: "Go Live", section: "Artist Tools" },
      { to: "/past-streams", icon: <Radio className="w-4 h-4" />, label: "Past Streams", section: "Artist Tools" },
      { to: "/releases", icon: <Music className="w-4 h-4" />, label: "Releases", section: "Artist Tools" },
      { to: "/submit-music", icon: <Send className="w-4 h-4" />, label: "Submit Music", section: "Artist Tools" },
      { to: "/gigs/new", icon: <MapPin className="w-4 h-4" />, label: "Post Gig", section: "Artist Tools" },
      { to: "/artist-settings", icon: <Settings className="w-4 h-4" />, label: "Artist Profile", section: "Artist Tools" },
      { to: "/wallet", icon: <Wallet className="w-4 h-4" />, label: "Wallet", section: "Artist Tools" },
      { to: "/bookings", icon: <BookOpen className="w-4 h-4" />, label: "Bookings", badge: pendingBookings > 0 ? pendingBookings : undefined, section: "Artist Tools" },
    );
  }

  // Influencer-specific hub
  if (hasInfluencer) {
    links.push(
      { to: "/influencer", icon: <TrendingUp className="w-4 h-4" />, label: "Influencer Hub", section: isAdmin ? "Admin" : "Influencer" },
      { to: "/influencer-settings", icon: <Settings className="w-4 h-4" />, label: "Settings", section: isAdmin ? "Admin" : "Influencer" },
    );
  }

  // Merchant-specific store management
  if (hasMerchant) {
    links.push(
      { to: "/merchant", icon: <ShoppingBag className="w-4 h-4" />, label: "My Store", section: isAdmin ? "Admin" : "Merchant" },
    );
  }

  // Discovery features are grouped by the active profile so the sidebar does not mix unrelated tools.
  if (hasFan || hasInfluencer || hasMerchant || isAdmin) {
    links.push({ to: "/listen", icon: <Headphones className="w-4 h-4" />, label: "Discover Music", section: "Discover" });
  }
  if (hasFan || isAdmin) {
    links.push({ to: "/parties", icon: <Users className="w-4 h-4" />, label: "Listening Parties", section: "Discover" });
  }
  if (hasMerchant || hasFan || isAdmin) {
    links.push({ to: "/store", icon: <Store className="w-4 h-4" />, label: "Store", section: "Discover" });
  }

  if (!hasArtist) {
    links.push({ to: "/bookings", icon: <BookOpen className="w-4 h-4" />, label: "My Requests", section: "Discover" });
  }

  // Coins & account - available to all
  links.push(
    { to: "/buy-coins", icon: <Coins className="w-4 h-4" />, label: "Buy Coins", section: "Account" },
  );
  if (!isAdmin) links.push({ to: "/tiers", icon: <Crown className="w-4 h-4" />, label: "Plans", section: "Account" });

  // Deduplicate by path
  return links.filter((l, i, arr) => arr.findIndex(x => x.to === l.to) === i);
}

interface SidebarProps {
  pendingBookings?: number;
}

export default function AppSidebar({ pendingBookings = 0 }: SidebarProps) {
  const { user, signOut, switchProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [switchLoading, setSwitchLoading] = useState<string | null>(null);

  if (!user) return null;

  const availableProfiles: ProfileType[] = user?.profiles?.length
    ? user.profiles
    : [user.role as ProfileType].filter(Boolean);

  const activeProfile = availableProfiles.includes(user.role as ProfileType)
    ? (user.role as ProfileType)
    : availableProfiles[0];

  const isAdmin = user.role === "admin" || user.email === ADMIN_EMAIL;
  const navLinks = getNavLinks(availableProfiles, activeProfile, isAdmin, pendingBookings);
  
  // Group links by section
  const groupedLinks = navLinks.reduce((acc, link) => {
    const section = link.section || "Other";
    if (!acc[section]) acc[section] = [];
    acc[section].push(link);
    return acc;
  }, {} as Record<string, SidebarLink[]>);

  const handleSwitch = async (p: ProfileType) => {
    if (p === activeProfile) return;
    setSwitchLoading(p);
    try { await switchProfile(p); } catch {}
    finally { setSwitchLoading(null); }
  };

  const handleLogout = async () => { await signOut(); navigate("/"); };

  const PROFILE_COLORS: Record<string, string> = {
    fan: "bg-accent/20 text-accent",
    artist: "bg-purple-500/20 text-purple-400",
    influencer: "bg-pink-500/20 text-pink-400",
    merchant: "bg-orange-500/20 text-orange-400",
    admin: "bg-red-500/20 text-red-400",
  };

  const PROFILE_LABELS: Record<string, string> = {
    fan: "Listener",
    artist: "Artist",
    influencer: "Influencer",
    merchant: "Merchant",
    artist_fan: "Artist + Fan",
    admin: "Admin",
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border/40">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <Radio className="w-4 h-4 text-primary-foreground" />
        </div>
        <Logo />
      </div>
      <div className="px-4 py-4 border-b border-border/40">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Account type</p>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${PROFILE_COLORS[activeProfile] || "bg-card text-muted-foreground"}`}>
          {PROFILE_LABELS[activeProfile] || activeProfile}
        </span>
      </div>

      {/* Profile Switcher */}
      {availableProfiles.length > 1 && (
        <div className="px-3 py-3 border-b border-border/40">
          <p className="text-xs text-muted-foreground px-1 mb-2 font-medium">Switch Profile</p>
          <div className="flex flex-wrap gap-1.5">
            {availableProfiles.map(p => (
              <button
                key={p}
                onClick={() => handleSwitch(p)}
                disabled={!!switchLoading}
                className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize transition-all ${
                  activeProfile === p
                    ? PROFILE_COLORS[p] || "bg-primary/20 text-primary"
                    : "bg-card/50 text-muted-foreground hover:bg-card"
                }`}
              >
                {switchLoading === p ? "..." : p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nav Links - Grouped by Section */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {Object.entries(groupedLinks).map(([section, links]) => (
          <div key={section}>
            <p className="text-[10px] text-muted-foreground/60 px-3 mb-1.5 font-semibold uppercase tracking-wider">{section}</p>
            <div className="space-y-0.5">
              {links.map(link => {
                const active = location.pathname === link.to;
                const isAdminLink = link.to === "/admin";
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? isAdminLink 
                          ? "bg-red-500/10 text-red-400"
                          : "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    {link.icon}
                    <span className="flex-1">{link.label}</span>
                    {link.badge && link.badge > 0 && (
                      <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="px-3 py-3 border-t border-border/40">
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
            {user.username?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{user.username}</p>
            <p className={`text-xs capitalize px-1.5 rounded-full inline-block ${PROFILE_COLORS[activeProfile] || ""}`}>{activeProfile}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-border/40 bg-background/80 backdrop-blur-sm fixed left-0 top-0 h-full z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Radio className="w-4 h-4 text-primary-foreground" />
          </div>
          <Logo />
        </Link>
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-card/50 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-background border-r border-border/40 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <Logo />
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-card/50">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
