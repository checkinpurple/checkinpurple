import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mic, Users, Coins, Crown, Wallet,
  ShieldAlert, Music, Star, ShoppingBag, Calendar,
  ArrowLeftRight, Zap, Send, MapPin, Settings,
  BookOpen, Camera, Store
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { ProfileType } from "@shared/api";
import ProfileCard from "@/components/ProfileCard";
import TransferCoins from "@/components/TransferCoins";
import Notifications from "@/components/Notifications";
import AppSidebar from "@/components/AppSidebar";
import FanStatus from "@/components/FanStatus";

export default function Dashboard() {
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

  const hasProfile = (role: ProfileType) => availableProfiles.includes(role);

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

  const isAdmin = user.role === "admin";
  const isArtist = isAdmin || hasProfile("artist");
  const isFan = isAdmin || hasProfile("fan");
  const isInfluencer = isAdmin || hasProfile("influencer");
  const isMerchant = isAdmin || hasProfile("merchant");

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar pendingBookings={pendingBookings} />

      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0">
        {/* Top bar (desktop) */}
        <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div>
            <h1 className="font-bold text-lg">Dashboard</h1>
            <p className="text-xs text-muted-foreground capitalize">{activeProfile} profile</p>
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

          {/* Quick Action Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

            {isArtist && (
              <Link to="/broadcast" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-sm mb-0.5">Go Live</p>
                <p className="text-xs text-muted-foreground">Stream your music</p>
              </Link>
            )}

            {isArtist && (
              <Link to="/artist-settings" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-primary/40 hover:bg-primary/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <p className="font-bold text-sm mb-0.5">Artist Profile</p>
                <p className="text-xs text-muted-foreground">Edit your page</p>
              </Link>
            )}

            {isArtist && (
              <Link to="/bookings" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all relative">
                {pendingBookings > 0 && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {pendingBookings}
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="font-bold text-sm mb-0.5">Bookings</p>
                <p className="text-xs text-muted-foreground">{pendingBookings > 0 ? `${pendingBookings} pending` : "Manage requests"}</p>
              </Link>
            )}

            {isArtist && (
              <Link to="/past-streams" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-red-400/40 hover:bg-red-400/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Radio className="w-5 h-5 text-red-400" />
                </div>
                <p className="font-bold text-sm mb-0.5">Past Streams</p>
                <p className="text-xs text-muted-foreground">Saved recordings</p>
              </Link>
            )}

            {isArtist && (
              <Link to="/releases" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-primary/40 hover:bg-primary/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <p className="font-bold text-sm mb-0.5">Releases</p>
                <p className="text-xs text-muted-foreground">Schedule drops</p>
              </Link>
            )}

            {isArtist && (
              <Link to="/gigs/new" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-accent/40 hover:bg-accent/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-secondary/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <p className="font-bold text-sm mb-0.5">Post a Gig</p>
                <p className="text-xs text-muted-foreground">Share events</p>
              </Link>
            )}

            {isArtist && (
              <Link to="/submit-music" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-green-500/40 hover:bg-green-500/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Send className="w-5 h-5 text-green-500" />
                </div>
                <p className="font-bold text-sm mb-0.5">Submit Music</p>
                <p className="text-xs text-muted-foreground">200 coins · Playlist</p>
              </Link>
            )}

            {isArtist && (
              <Link to="/playlists" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Music className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="font-bold text-sm mb-0.5">Playlists</p>
                <p className="text-xs text-muted-foreground">Personalise for bookings</p>
              </Link>
            )}

            {isArtist && (
              <Link to="/wallet" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-green-500/40 hover:bg-green-500/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Wallet className="w-5 h-5 text-green-500" />
                </div>
                <p className="font-bold text-sm mb-0.5">Wallet</p>
                <p className="text-xs text-muted-foreground">Coins & payouts</p>
              </Link>
            )}

            {(isFan || isInfluencer || isMerchant) && (
              <Link to="/listen" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-accent/40 hover:bg-accent/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-sm mb-0.5">Discover Music</p>
                <p className="text-xs text-muted-foreground">Browse live streams</p>
              </Link>
            )}

            {/* Non-artists can view their sent booking requests */}
            {!isArtist && (
              <Link to="/bookings" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="font-bold text-sm mb-0.5">My Requests</p>
                <p className="text-xs text-muted-foreground">Track artist bookings</p>
              </Link>
            )}

            {isInfluencer && (
              <Link to="/influencer" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-pink-500/40 hover:bg-pink-500/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Star className="w-5 h-5 text-pink-400" />
                </div>
                <p className="font-bold text-sm mb-0.5">Influencer Hub</p>
                <p className="text-xs text-muted-foreground">Promote · Earn</p>
              </Link>
            )}

            {isMerchant && (
              <Link to="/merchant" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/30 to-yellow-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5 text-orange-400" />
                </div>
                <p className="font-bold text-sm mb-0.5">My Store</p>
                <p className="text-xs text-muted-foreground">Products & orders</p>
              </Link>
            )}

            {/* Available to all */}
            <Link to="/store" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-orange-400/40 hover:bg-orange-400/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400/20 to-yellow-400/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5 text-orange-400" />
              </div>
              <p className="font-bold text-sm mb-0.5">Store</p>
              <p className="text-xs text-muted-foreground">Merch & fashion</p>
            </Link>

            <Link to="/parties" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-primary/40 hover:bg-primary/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <p className="font-bold text-sm mb-0.5">Listening Parties</p>
              <p className="text-xs text-muted-foreground">RSVP to events</p>
            </Link>

            <Link to="/buy-coins" className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Coins className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="font-bold text-sm mb-0.5">Buy Coins</p>
              <p className="text-xs text-muted-foreground">Tip artists</p>
            </Link>

            <button onClick={() => setShowTransfer(s => !s)} className="group p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-yellow-400/40 hover:bg-yellow-400/5 transition-all text-left">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400/20 to-green-400/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ArrowLeftRight className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="font-bold text-sm mb-0.5">Transfer Coins</p>
              <p className="text-xs text-muted-foreground">Send to anyone</p>
            </button>

            <Link to="/tiers" className="group p-4 rounded-2xl border border-dashed border-border/50 bg-card/10 hover:border-primary/40 hover:bg-primary/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <p className="font-bold text-sm mb-0.5">Plans</p>
              <p className="text-xs text-muted-foreground">Upgrade tier</p>
            </Link>

            {isAdmin && (
              <Link to="/admin" className="group p-4 rounded-2xl border border-red-500/30 bg-red-500/5 hover:border-red-500/50 hover:bg-red-500/10 transition-all">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                </div>
                <p className="font-bold text-sm mb-0.5">Admin</p>
                <p className="text-xs text-muted-foreground">Manage platform</p>
              </Link>
            )}
          </div>

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
