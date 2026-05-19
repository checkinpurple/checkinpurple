import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Radio, Mic, Users, Coins, LogOut, Crown, Wallet,
  ShieldAlert, Music, Star, ShoppingBag, Calendar,
  ArrowLeftRight, Zap, Send, MapPin, Settings,
  BookOpen, Bell
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { ProfileType } from "@shared/api";
import Logo from "@/components/Logo";
import ProfileCard from "@/components/ProfileCard";
import TransferCoins from "@/components/TransferCoins";
import Notifications from "@/components/Notifications";

export default function Dashboard() {
  const { user, signOut, switchProfile } = useAuth();
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
  const [switchLoading, setSwitchLoading] = useState<string | null>(null);

  const availableProfiles: ProfileType[] = user?.profiles?.length
    ? user.profiles
    : (["fan", "artist", "merchant", "influencer"] as ProfileType[]).includes(user?.role as ProfileType)
      ? [(user.role as ProfileType)]
      : ["fan"];

  const activeProfile: ProfileType = (["fan", "artist", "merchant", "influencer"] as ProfileType[]).includes(user?.role as ProfileType)
    ? (user.role as ProfileType)
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

  const handleLogout = async () => { await signOut(); navigate("/"); };

  const handleProfileSwitch = async (profileType: ProfileType) => {
    if (!user || profileType === activeProfile) return;
    setSwitchLoading(profileType);
    try {
      await switchProfile(profileType);
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchLoading(null);
    }
  };

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const isArtist = isAdmin || hasProfile("artist");
  const isFan = isAdmin || hasProfile("fan");
  const isInfluencer = isAdmin || hasProfile("influencer");
  const isMerchant = isAdmin || hasProfile("merchant");

  const ROLE_COLORS: Record<string, string> = {
    fan: "bg-accent/10 text-accent border-accent/20",
    artist: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    influencer: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    merchant: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    artist_fan: "bg-primary/10 text-primary border-primary/20",
    admin: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  const ROLE_LABELS: Record<string, string> = {
    fan: "Listener", artist: "Artist", influencer: "Influencer",
    merchant: "Merchant", artist_fan: "Artist + Fan", admin: "Admin",
  };
  const badgeColor = ROLE_COLORS[user.role] || ROLE_COLORS.fan;
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="fixed top-0 w-full z-40 border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Logo compact />
            </div>
            <Logo className="text-sm sm:text-base" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Coins */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-bold text-yellow-500">{coinBalance}</span>
            </div>
            {/* Role badge */}
            <span className={`hidden sm:block text-xs px-2.5 py-1 rounded-full border font-semibold ${badgeColor}`}>
              {roleLabel}
            </span>
            {/* Notifications */}
            <Notifications />
            {/* Admin link */}
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:block">Admin</span>
              </Link>
            )}
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">

          <div className="glass rounded-2xl p-5 border border-border/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground mb-2">Active profile</p>
                <h2 className="text-2xl font-bold">{activeProfile.charAt(0).toUpperCase() + activeProfile.slice(1)}</h2>
                <p className="text-sm text-muted-foreground">Switch between your connected Fan, Artist, Merchant, and Influencer profiles.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableProfiles.map(profile => (
                  <button
                    key={profile}
                    onClick={() => handleProfileSwitch(profile)}
                    disabled={profile === activeProfile || switchLoading === profile}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${profile === activeProfile ? "bg-primary text-primary-foreground" : "bg-card border border-border/60 text-muted-foreground hover:bg-primary/5"} ${switchLoading === profile ? "opacity-60" : ""}`}
                  >
                    {profile === activeProfile ? `Active: ${profile}` : `Switch to ${profile}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

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

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Coins</p>
              <p className="text-2xl font-bold text-yellow-500">{coinBalance}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Followers</p>
              <p className="text-2xl font-bold">{followerCount}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Following</p>
              <p className="text-2xl font-bold">{followingCount}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Role</p>
              <p className="text-lg font-bold truncate">{roleLabel}</p>
            </div>
          </div>

          {/* Transfer coins panel */}
          {showTransfer && (
            <div className="glass rounded-2xl p-6 border-2 border-yellow-500/20">
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

          {/* Main cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Artist Studio */}
            {isArtist && (
              <Link to="/broadcast" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-bold mb-1">Artist Studio</h2>
                <p className="text-muted-foreground text-sm mb-3">Go live, upload and play your music.</p>
                <span className="text-sm font-semibold text-purple-400">Open Studio →</span>
              </Link>
            )}

            {/* Artist Settings */}
            {isArtist && (
              <Link to="/artist-settings" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-bold mb-1">Artist Profile</h2>
                <p className="text-muted-foreground text-sm mb-3">Set genres, DJ status, booking rates and socials.</p>
                <span className="text-sm font-semibold text-primary">Edit Profile →</span>
              </Link>
            )}

            {/* Bookings */}
            {isArtist && (
              <Link to="/bookings" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all duration-300 relative">
                {pendingBookings > 0 && (
                  <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {pendingBookings}
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-yellow-500" />
                </div>
                <h2 className="text-lg font-bold mb-1">Bookings</h2>
                <p className="text-muted-foreground text-sm mb-3">
                  {pendingBookings > 0 ? `${pendingBookings} pending request${pendingBookings > 1 ? "s" : ""}` : "Manage fan booking requests."}
                </p>
                <span className="text-sm font-semibold text-yellow-500">View Bookings →</span>
              </Link>
            )}

            {/* Post a Gig */}
            {isArtist && (
              <Link to="/gigs/new" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-accent/50 hover:bg-accent/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/30 to-secondary/30 border border-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-lg font-bold mb-1">Post a Gig</h2>
                <p className="text-muted-foreground text-sm mb-3">Share upcoming concerts and events with your followers.</p>
                <span className="text-sm font-semibold text-accent">Post Gig →</span>
              </Link>
            )}

            {/* Releases */}
            {isArtist && (
              <Link to="/releases" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-bold mb-1">Releases</h2>
                <p className="text-muted-foreground text-sm mb-3">Schedule drops and invite collaborators.</p>
                <span className="text-sm font-semibold text-primary">Manage →</span>
              </Link>
            )}

            {/* Submit Music */}
            {isArtist && (
              <Link to="/submit-music" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Send className="w-6 h-6 text-green-500" />
                </div>
                <h2 className="text-lg font-bold mb-1">Submit Music</h2>
                <p className="text-muted-foreground text-sm mb-3">Send tracks to admin playlist for 200 coins.</p>
                <span className="text-sm font-semibold text-green-500">Submit →</span>
              </Link>
            )}

            {/* Artist Wallet */}
            {isArtist && (
              <Link to="/wallet" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Wallet className="w-6 h-6 text-green-500" />
                </div>
                <h2 className="text-lg font-bold mb-1">Artist Wallet</h2>
                <p className="text-muted-foreground text-sm mb-3">Coin earnings and payout requests.</p>
                <span className="text-sm font-semibold text-green-500">View Wallet →</span>
              </Link>
            )}

            {/* Discover Music */}
            {isFan && (
              <Link to="/listen" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-accent/50 hover:bg-accent/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-bold mb-1">Discover Music</h2>
                <p className="text-muted-foreground text-sm mb-3">Browse live streams, follow artists, tip coins.</p>
                <span className="text-sm font-semibold text-accent">Listen →</span>
              </Link>
            )}

            {/* Fan Bookings */}
            {isFan && (
              <Link to="/bookings" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-yellow-500" />
                </div>
                <h2 className="text-lg font-bold mb-1">My Bookings</h2>
                <p className="text-muted-foreground text-sm mb-3">Track booking requests you've sent to artists.</p>
                <span className="text-sm font-semibold text-yellow-500">View →</span>
              </Link>
            )}

            {/* Listening Parties */}
            <Link to="/parties" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-bold mb-1">Listening Parties</h2>
              <p className="text-muted-foreground text-sm mb-3">RSVP to scheduled listening events.</p>
              <span className="text-sm font-semibold text-primary">Browse →</span>
            </Link>

            {/* Influencer Hub */}
            {isInfluencer && (
              <Link to="/influencer" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 border border-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6 text-pink-400" />
                </div>
                <h2 className="text-lg font-bold mb-1">Influencer Hub</h2>
                <p className="text-muted-foreground text-sm mb-3">Promote artists and earn commissions.</p>
                <span className="text-sm font-semibold text-pink-400">Open Hub →</span>
              </Link>
            )}

            {/* Merchant Store */}
            {isMerchant && (
              <Link to="/merchant" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/30 to-yellow-500/30 border border-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6 text-orange-400" />
                </div>
                <h2 className="text-lg font-bold mb-1">My Store</h2>
                <p className="text-muted-foreground text-sm mb-3">Products, orders and analytics.</p>
                <span className="text-sm font-semibold text-orange-400">Manage →</span>
              </Link>
            )}

            {/* Browse Store */}
            <Link to="/store" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-orange-400/50 hover:bg-orange-400/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400/20 to-yellow-400/20 border border-orange-400/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-lg font-bold mb-1">Browse Store</h2>
              <p className="text-muted-foreground text-sm mb-3">Merch, downloads and event tickets.</p>
              <span className="text-sm font-semibold text-orange-400">Visit →</span>
            </Link>

            {/* Buy Coins */}
            <Link to="/buy-coins" className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Coins className="w-6 h-6 text-yellow-500" />
              </div>
              <h2 className="text-lg font-bold mb-1">Buy Coins</h2>
              <p className="text-muted-foreground text-sm mb-3">Top up to tip artists during live streams.</p>
              <span className="text-sm font-semibold text-yellow-500">Buy →</span>
            </Link>

            {/* Transfer Coins */}
            <button onClick={() => setShowTransfer(s => !s)} className="group p-6 rounded-2xl border-2 border-border/40 bg-card/30 hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all duration-300 text-left">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/20 to-green-400/20 border border-yellow-400/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-6 h-6 text-yellow-400" />
              </div>
              <h2 className="text-lg font-bold mb-1">Transfer Coins</h2>
              <p className="text-muted-foreground text-sm mb-3">Send coins to any CheckinPurple user.</p>
              <span className="text-sm font-semibold text-yellow-400">Transfer →</span>
            </button>

            {/* Plans */}
            <Link to="/tiers" className="group p-6 rounded-2xl border-2 border-dashed border-border/50 bg-card/10 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-bold mb-1">Plans & Pricing</h2>
              <p className="text-muted-foreground text-sm mb-3">Upgrade or boost your profile for 3 months.</p>
              <span className="text-sm font-semibold text-primary">See Plans →</span>
            </Link>

            {/* Admin Panel */}
            {isAdmin && (
              <Link to="/admin" className="group p-6 rounded-2xl border-2 border-red-500/30 bg-red-500/5 hover:border-red-500/60 hover:bg-red-500/10 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-lg font-bold mb-1">Admin Panel</h2>
                <p className="text-muted-foreground text-sm mb-3">Users, streams, payouts, moderation.</p>
                <span className="text-sm font-semibold text-red-500">Open →</span>
              </Link>
            )}
          </div>

          {/* Upgrade banner */}
          {(user.role === "fan" || user.role === "artist") && (
            <div className="p-6 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-bold">
                    {user.role === "fan" ? "Want to go live and book gigs?" : "Want to listen and follow artists too?"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Upgrade to Artist + Fan for just <strong className="text-foreground">R40/month</strong>.
                  </p>
                </div>
              </div>
              <Link to="/tiers" className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap text-sm">
                Upgrade Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
