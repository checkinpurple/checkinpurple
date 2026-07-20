import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mic, Users, Coins, Crown, Wallet, Radio,
  ShieldAlert, Music, Star, ShoppingBag, Calendar,
  ArrowLeftRight, Zap, Send, MapPin, Settings,
  Store, MessageCircle, UserRound
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { ProfileType } from "@shared/api";
import ProfileCard from "@/components/ProfileCard";
import TransferCoins from "@/components/TransferCoins";
import Notifications from "@/components/Notifications";
import AppSidebar from "@/components/AppSidebar";
import FanStatus from "@/components/FanStatus";

type DashboardAction = {
  title: string;
  description: string;
  to?: string;
  onClick?: () => void;
  icon: JSX.Element;
  className: string;
  badge?: number;
};

type DashboardSection = {
  title: string;
  description: string;
  actions: DashboardAction[];
};

const ActionCard = ({ action }: { action: DashboardAction }) => {
  const content = (
    <>
      {action.badge ? (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
          {action.badge}
        </span>
      ) : null}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
        {action.icon}
      </div>
      <p className="font-bold text-sm mb-0.5">{action.title}</p>
      <p className="text-xs text-muted-foreground">{action.description}</p>
    </>
  );

  const classes = `group relative p-4 rounded-2xl border border-border/40 bg-card/30 transition-all text-left ${action.className}`;

  if (action.to) {
    return <Link to={action.to} className={classes}>{content}</Link>;
  }

  return <button onClick={action.onClick} className={classes}>{content}</button>;
};

export default function Dashboard({ viewAs }: { viewAs?: ProfileType } = {}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [coinBalance, setCoinBalance] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showTransfer, setShowTransfer] = useState(false);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [profileData, setProfileData] = useState({
    avatar_url: user?.avatar_url || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
  });

  const availableProfiles: ProfileType[] = user?.profiles?.length
    ? user.profiles
    : ([user?.role as ProfileType]).filter(Boolean);

  const activeProfile: ProfileType = availableProfiles.includes(user?.role as ProfileType)
    ? (user?.role as ProfileType)
    : availableProfiles[0];

  const displayProfile: ProfileType = viewAs ?? activeProfile;

  const hasProfile = (role: ProfileType) => {
    if (availableProfiles.includes(role)) return true;
    if (availableProfiles.includes("artist_fan") && (role === "artist" || role === "fan")) return true;
    return false;
  };

  const isAdmin = user.role === "admin";
  const isArtist = displayProfile === "artist" || displayProfile === "artist_fan";
  const isFan = displayProfile === "fan" || displayProfile === "artist_fan";
  const isInfluencer = displayProfile === "influencer";
  const isMerchant = displayProfile === "merchant";

  const publicProfilePath = isArtist
    ? `/artist/${user.username}`
    : isFan
      ? `/fan/${user.username}`
      : isInfluencer
        ? `/influencer/${user.username}`
        : isMerchant
          ? `/merchant/${user.username}`
          : undefined;

  useEffect(() => {
    if (!user) return;
    fetchCoins();
    fetchFollowCounts();
    fetchPendingBookings();
  }, [user]);

  const fetchCoins = async () => {
    try {
      const r = await fetch("/api/coins/balance", { headers: { Authorization: `Bearer ${user?.id}` } });
      const d = await r.json();
      if (d.success) setCoinBalance(d.coins?.balance ?? 0);
    } catch {}
  };

  const fetchFollowCounts = async () => {
    try {
      const r = await fetch(`/api/social/follows?userId=${user?.id}`, { headers: { Authorization: `Bearer ${user?.id}` } });
      const d = await r.json();
      if (d.success) {
        setFollowerCount(d.followerCount ?? 0);
        setFollowingCount(d.followingCount ?? 0);
      }
    } catch {}
  };

  const fetchPendingBookings = async () => {
    try {
      const r = await fetch("/api/bookings?type=incoming", { headers: { Authorization: `Bearer ${user?.id}` } });
      const d = await r.json();
      if (d.success) {
        const pending = (d.bookings || []).filter((b: any) => b.status === "pending" && b.artist_id === user?.id).length;
        setPendingBookings(pending);
      }
    } catch {}
  };

  if (!user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar pendingBookings={pendingBookings} />

      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0">
        {/* Top bar (desktop) */}
        <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div>
            <h1 className="font-bold text-lg">Dashboard</h1>
            <p className="text-xs text-muted-foreground capitalize">{isAdmin ? "admin" : displayProfile} profile</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-bold text-yellow-500">{coinBalance}</span>
            </div>
            <Notifications />
          </div>
        </div>

        <div className="px-4 py-5 max-w-4xl mx-auto space-y-5">

          {/* Profile Card */}
          <ProfileCard
            editable
            userId={user.id}
            username={user.username}
            avatarUrl={profileData.avatar_url}
            bio={profileData.bio}
            location={profileData.location}
            website={profileData.website}
            role={user.role}
            isVerified={user.is_verified}
            followerCount={followerCount}
            followingCount={followingCount}
            onUpdate={(data) => setProfileData(p => ({ ...p, ...data }))}
          />

          {(isFan || isAdmin) && (
            <FanStatus editable />
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-border/40 bg-card/30 text-center">
              <p className="text-xl font-bold text-yellow-500">{coinBalance}</p>
              <p className="text-xs text-muted-foreground">Coins</p>
            </div>
            <div className="p-3 rounded-xl border border-border/40 bg-card/30 text-center">
              <p className="text-xl font-bold">{followerCount}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="p-3 rounded-xl border border-border/40 bg-card/30 text-center">
              <p className="text-xl font-bold">{followingCount}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
          </div>

          {/* Transfer coins panel */}
          {showTransfer && (
            <div className="rounded-2xl border border-yellow-500/20 bg-card/30 p-5">
              <TransferCoins
                currentBalance={coinBalance}
                onSuccess={(newBalance) => {
                  setCoinBalance(newBalance);
                  setTimeout(() => setShowTransfer(false), 3500);
                }}
              />
              <button onClick={() => setShowTransfer(false)} className="mt-3 text-xs text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          )}

          {/* Role-specific feature groups */}
          {(() => {
            const artistActions: DashboardAction[] = [
              {
                title: "Go Live",
                description: "Stream your music",
                to: "/broadcast",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center"><Mic className="w-5 h-5 text-white" /></div>,
                className: "hover:border-purple-500/40 hover:bg-purple-500/5",
              },
              {
                title: "Artist Profile",
                description: "Edit your page",
                to: "/artist-settings",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center"><Settings className="w-5 h-5 text-primary" /></div>,
                className: "hover:border-primary/40 hover:bg-primary/5",
              },
              {
                title: "Bookings",
                description: pendingBookings > 0 ? `${pendingBookings} pending` : "Manage requests",
                to: "/bookings",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center"><Zap className="w-5 h-5 text-yellow-500" /></div>,
                className: "hover:border-yellow-500/40 hover:bg-yellow-500/5",
                badge: pendingBookings,
              },
              {
                title: "Past Streams",
                description: "Saved recordings",
                to: "/past-streams",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center"><Radio className="w-5 h-5 text-red-400" /></div>,
                className: "hover:border-red-400/40 hover:bg-red-400/5",
              },
              {
                title: "Releases",
                description: "Schedule drops",
                to: "/releases",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"><Calendar className="w-5 h-5 text-primary" /></div>,
                className: "hover:border-primary/40 hover:bg-primary/5",
              },
              {
                title: "Post a Gig",
                description: "Share events",
                to: "/gigs/new",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-secondary/30 flex items-center justify-center"><MapPin className="w-5 h-5 text-accent" /></div>,
                className: "hover:border-accent/40 hover:bg-accent/5",
              },
              {
                title: "Submit Music",
                description: "200 coins · Playlist",
                to: "/submit-music",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center"><Send className="w-5 h-5 text-green-500" /></div>,
                className: "hover:border-green-500/40 hover:bg-green-500/5",
              },
              {
                title: "Playlists",
                description: "Personalise for bookings",
                to: "/playlists",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 flex items-center justify-center"><Music className="w-5 h-5 text-indigo-400" /></div>,
                className: "hover:border-indigo-500/40 hover:bg-indigo-500/5",
              },
              {
                title: "Wallet",
                description: "Coins & payouts",
                to: "/wallet",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center"><Wallet className="w-5 h-5 text-green-500" /></div>,
                className: "hover:border-green-500/40 hover:bg-green-500/5",
              },
            ];

            const fanActions: DashboardAction[] = [
              {
                title: "Discover Music",
                description: "Browse live streams",
                to: "/listen",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>,
                className: "hover:border-accent/40 hover:bg-accent/5",
              },
              {
                title: "Listening Parties",
                description: "RSVP to events",
                to: "/parties",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center"><Music className="w-5 h-5 text-primary" /></div>,
                className: "hover:border-primary/40 hover:bg-primary/5",
              },
              {
                title: "My Requests",
                description: "Track artist bookings",
                to: "/bookings",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center"><Zap className="w-5 h-5 text-yellow-500" /></div>,
                className: "hover:border-yellow-500/40 hover:bg-yellow-500/5",
              },
              {
                title: "Buy Coins",
                description: "Tip artists",
                to: "/buy-coins",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center"><Coins className="w-5 h-5 text-yellow-500" /></div>,
                className: "hover:border-yellow-500/40 hover:bg-yellow-500/5",
              },
            ];

            const influencerActions: DashboardAction[] = [
              {
                title: "Influencer Hub",
                description: "Promote · Earn",
                to: "/influencer",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center"><Star className="w-5 h-5 text-pink-400" /></div>,
                className: "hover:border-pink-500/40 hover:bg-pink-500/5",
              },
              {
                title: "Discover Music",
                description: "Find artists to promote",
                to: "/listen",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>,
                className: "hover:border-accent/40 hover:bg-accent/5",
              },
              {
                title: "My Requests",
                description: "Track artist bookings",
                to: "/bookings",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center"><Zap className="w-5 h-5 text-yellow-500" /></div>,
                className: "hover:border-yellow-500/40 hover:bg-yellow-500/5",
              },
            ];

            const merchantActions: DashboardAction[] = [
              {
                title: "My Store",
                description: "Products & orders",
                to: "/merchant",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/30 to-yellow-500/30 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-orange-400" /></div>,
                className: "hover:border-orange-500/40 hover:bg-orange-500/5",
              },
              {
                title: "Storefront",
                description: "Browse merch & fashion",
                to: "/store",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400/20 to-yellow-400/20 flex items-center justify-center"><Store className="w-5 h-5 text-orange-400" /></div>,
                className: "hover:border-orange-400/40 hover:bg-orange-400/5",
              },
              {
                title: "Discover Music",
                description: "Find artists to collaborate with",
                to: "/listen",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>,
                className: "hover:border-accent/40 hover:bg-accent/5",
              },
            ];

            const accountActions: DashboardAction[] = [
              ...(publicProfilePath ? [{
                title: "View Public Profile",
                description: "See what visitors see",
                to: publicProfilePath,
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"><UserRound className="w-5 h-5 text-primary" /></div>,
                className: "hover:border-primary/40 hover:bg-primary/5",
              }] : []),
              {
                title: "Messages",
                description: "Inbox & admin support",
                to: "/messages",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-blue-400" /></div>,
                className: "hover:border-blue-400/40 hover:bg-blue-400/5",
              },
              {
                title: "Transfer Coins",
                description: "Send to anyone",
                onClick: () => setShowTransfer(s => !s),
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400/20 to-green-400/20 flex items-center justify-center"><ArrowLeftRight className="w-5 h-5 text-yellow-400" /></div>,
                className: "hover:border-yellow-400/40 hover:bg-yellow-400/5",
              },
              {
                title: "Plans",
                description: "Upgrade tier",
                to: "/tiers",
                icon: <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"><Crown className="w-5 h-5 text-primary" /></div>,
                className: "border-dashed border-border/50 bg-card/10 hover:border-primary/40 hover:bg-primary/5",
              },
            ];

            const adminActions: DashboardAction[] = [
              {
                title: "Admin",
                description: "Manage platform",
                to: "/admin",
                icon: <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center"><ShieldAlert className="w-5 h-5 text-red-500" /></div>,
                className: "border-red-500/30 bg-red-500/5 hover:border-red-500/50 hover:bg-red-500/10",
              },
            ];

            const sections: DashboardSection[] = [
              ...(isAdmin ? [{ title: "Admin tools", description: "Platform moderation and operations", actions: adminActions }] : []),
              ...(isArtist ? [{ title: "Artist studio", description: "Broadcast, release, bookings, and payout tools", actions: artistActions }] : []),
              ...(isFan ? [{ title: "Fan hub", description: "Listen, RSVP, book artists, and support creators", actions: fanActions }] : []),
              ...(isInfluencer ? [{ title: "Influencer tools", description: "Discover artists and manage promotions", actions: influencerActions }] : []),
              ...(isMerchant ? [{ title: "Merchant tools", description: "Manage commerce and artist collaborations", actions: merchantActions }] : []),
              { title: "Account", description: "Coins and subscription settings", actions: accountActions },
            ];

            return (
              <div className="space-y-5">
                {sections.map(section => (
                  <section key={section.title} className="space-y-3">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{section.title}</h2>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {section.actions.map(action => <ActionCard key={`${section.title}-${action.title}`} action={action} />)}
                    </div>
                  </section>
                ))}
              </div>
            );
          })()}

          <div className="pt-2">
            <button
              onClick={async () => {
                if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
                await fetch("/api/account", { method: "DELETE", headers: { Authorization: `Bearer ${user.id}` } });
                await signOut();
                navigate("/");
              }}
              className="text-xs text-red-400 hover:underline"
            >
              Delete Account
            </button>
          </div>

          {/* Upgrade banner */}
          {availableProfiles.length === 1 && !isAdmin && user.tier !== "Premium" && (
            <div className="p-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Zap className="w-7 h-7 text-primary flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm">Unlock more profiles</p>
                  <p className="text-xs text-muted-foreground">Upgrade to Standard for Artist + Fan, or Premium for all four.</p>
                </div>
              </div>
              <Link to="/tiers" className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity text-sm whitespace-nowrap">
                Upgrade Now
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
