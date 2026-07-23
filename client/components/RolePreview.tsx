import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye, Mic, ShoppingBag, TrendingUp, Users,
  Headphones, Radio, Music, Star, Calendar,
  Coins, Zap, ChevronRight, X, Crown
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type PreviewRole = "artist" | "fan" | "influencer" | "merchant";

const ROLE_PREVIEWS: Record<PreviewRole, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  tagline: string;
  features: string[];
  dashboard: { icon: React.ReactNode; label: string; desc: string }[];
  upgradeRequired: "Basic" | "Standard" | "Premium";
}> = {
  fan: {
    label: "Fan",
    color: "text-accent",
    bgColor: "bg-accent/10 border-accent/20",
    icon: <Headphones className="w-5 h-5" />,
    tagline: "Discover, listen, and support artists you love",
    features: [
      "Listen to live streams from artists",
      "Tip artists with coins during streams",
      "RSVP to gigs and listening parties",
      "Follow artists and get notified when live",
      "Set 'currently listening to' status",
      "Attend listening parties",
    ],
    dashboard: [
      { icon: <Radio className="w-4 h-4 text-accent" />, label: "Discover Music", desc: "Browse live streams" },
      { icon: <Coins className="w-4 h-4 text-yellow-500" />, label: "Buy Coins", desc: "Tip your favourite artists" },
      { icon: <Users className="w-4 h-4 text-accent" />, label: "Listening Parties", desc: "Join group listening events" },
      { icon: <Calendar className="w-4 h-4 text-accent" />, label: "Gigs", desc: "RSVP to live shows" },
    ],
    upgradeRequired: "Basic",
  },
  artist: {
    label: "Artist",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/20",
    icon: <Mic className="w-5 h-5" />,
    tagline: "Stream live, grow your audience, earn from your music",
    features: [
      "Go live with full audio streaming via Mux",
      "Save and replay streams (public / followers / private)",
      "Earn coins from fan tips — 70% goes to you",
      "Withdraw earnings via PayPal or bank transfer",
      "Photo gallery visible to followers",
      "Book and manage gigs",
      "Collab with other artists",
      "List skills for hire (Sound Engineer, Producer, etc.)",
      "Streaming links (Spotify, Apple Music, Audiomack etc.)",
    ],
    dashboard: [
      { icon: <Mic className="w-4 h-4 text-purple-400" />, label: "Go Live", desc: "Stream to your audience" },
      { icon: <Coins className="w-4 h-4 text-yellow-500" />, label: "Wallet", desc: "ZAR + USD earnings" },
      { icon: <Radio className="w-4 h-4 text-red-400" />, label: "Past Streams", desc: "Saved recordings" },
      { icon: <Calendar className="w-4 h-4 text-purple-400" />, label: "Bookings", desc: "Manage requests" },
      { icon: <Music className="w-4 h-4 text-purple-400" />, label: "Releases", desc: "Schedule drops" },
      { icon: <Star className="w-4 h-4 text-yellow-500" />, label: "Collabs", desc: "Link other artists" },
    ],
    upgradeRequired: "Standard",
  },
  influencer: {
    label: "Influencer",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10 border-pink-500/20",
    icon: <TrendingUp className="w-5 h-5" />,
    tagline: "Promote artists, earn commissions directly from them",
    features: [
      "Promote artists and earn commission (from artist, not CheckinPurple)",
      "Referral link to track your reach",
      "Negotiate deals directly with artists",
      "Discover music to promote",
      "Public profile showing your reach and platforms",
      "Active promotions visible on the Wall",
    ],
    dashboard: [
      { icon: <TrendingUp className="w-4 h-4 text-pink-400" />, label: "Influencer Hub", desc: "Manage promotions" },
      { icon: <Coins className="w-4 h-4 text-pink-400" />, label: "Earnings", desc: "Commission tracker" },
      { icon: <Headphones className="w-4 h-4 text-pink-400" />, label: "Discover Music", desc: "Find artists to promote" },
      { icon: <Star className="w-4 h-4 text-pink-400" />, label: "Active Deals", desc: "Your running promotions" },
    ],
    upgradeRequired: "Standard",
  },
  merchant: {
    label: "Merchant",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/20",
    icon: <ShoppingBag className="w-5 h-5" />,
    tagline: "Sell merch, fashion, sample packs and more to the music community",
    features: [
      "List physical merch, fashion, digital downloads, tickets",
      "List sample packs, plugins, software, graphic design services",
      "Photo gallery for your catalogue",
      "Send styling offers to artists (Offer to Dress)",
      "Accept dressing requests from artists",
      "Show availability on the Wall",
      "Discover music — find artists to collaborate with",
    ],
    dashboard: [
      { icon: <ShoppingBag className="w-4 h-4 text-orange-400" />, label: "My Store", desc: "Products and orders" },
      { icon: <Star className="w-4 h-4 text-orange-400" />, label: "Dressing Requests", desc: "Style artists" },
      { icon: <Headphones className="w-4 h-4 text-orange-400" />, label: "Discover Music", desc: "Find artists to dress" },
      { icon: <Zap className="w-4 h-4 text-orange-400" />, label: "Availability", desc: "Show you're open for business" },
    ],
    upgradeRequired: "Standard",
  },
};

const TIER_ORDER = { Basic: 0, Standard: 1, Premium: 2 };

interface RolePreviewProps {
  /** If provided, shows only this role. Otherwise shows selector. */
  defaultRole?: PreviewRole;
  compact?: boolean;
}

export default function RolePreview({ defaultRole, compact = false }: RolePreviewProps) {
  const { user } = useAuth();
  const [activeRole, setActiveRole] = useState<PreviewRole>(defaultRole || "artist");
  const [showFull, setShowFull] = useState(false);

  const preview = ROLE_PREVIEWS[activeRole];
  const userTier = (user?.tier as "Basic" | "Standard" | "Premium") || "Basic";
  const userProfiles = user?.profiles || [user?.role as PreviewRole].filter(Boolean);
  const alreadyHas = userProfiles.includes(activeRole);
  const needsUpgrade = !alreadyHas && TIER_ORDER[preview.upgradeRequired] > TIER_ORDER[userTier];

  return (
    <div className={`rounded-2xl border ${preview.bgColor} overflow-hidden`}>
      {/* Role selector */}
      {!defaultRole && (
        <div className="flex border-b border-border/30 overflow-x-auto">
          {(Object.keys(ROLE_PREVIEWS) as PreviewRole[]).map(role => {
            const rp = ROLE_PREVIEWS[role];
            const has = userProfiles.includes(role);
            return (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeRole === role
                    ? `border-current ${rp.color}`
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {rp.icon}
                {rp.label}
                {has && <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Active</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${preview.bgColor}`}>
            <span className={preview.color}>{preview.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-bold text-lg ${preview.color}`}>{preview.label}</h3>
              {alreadyHas
                ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Your active profile</span>
                : needsUpgrade
                  ? <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1"><Crown className="w-3 h-3" /> Requires {preview.upgradeRequired}</span>
                  : null
              }
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{preview.tagline}</p>
          </div>
        </div>

        {/* Mock dashboard cards */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> Dashboard preview
          </p>
          <div className="grid grid-cols-2 gap-2">
            {preview.dashboard.map((item, i) => (
              <div key={i} className={`p-3 rounded-xl border border-border/30 bg-background/40 ${needsUpgrade ? "opacity-50 select-none" : ""}`}>
                <div className="mb-1.5">{item.icon}</div>
                <p className="font-semibold text-xs">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          {needsUpgrade && (
            <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400">
              <Crown className="w-3.5 h-3.5 flex-shrink-0" />
              Upgrade to {preview.upgradeRequired} to unlock this profile
            </div>
          )}
        </div>

        {/* Feature list */}
        {!compact && (
          <div>
            <button
              onClick={() => setShowFull(f => !f)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
            >
              {showFull ? <X className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {showFull ? "Hide" : "Show all"} features
            </button>
            {showFull && (
              <ul className="space-y-1.5">
                {preview.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className={`mt-0.5 flex-shrink-0 ${preview.color}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* CTA */}
        {!alreadyHas && (
          <div className="pt-1">
            {needsUpgrade ? (
              <Link
                to={`/tiers?highlight=${preview.upgradeRequired}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Crown className="w-4 h-4" /> Upgrade to {preview.upgradeRequired}
              </Link>
            ) : (
              <Link
                to="/tiers"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
              >
                <Zap className="w-4 h-4" /> Add {preview.label} profile
              </Link>
            )}
          </div>
        )}
        {alreadyHas && (
          <Link
            to={activeRole === "artist" ? "/broadcast" : activeRole === "merchant" ? "/merchant" : activeRole === "influencer" ? "/influencer" : "/listen"}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${preview.bgColor} ${preview.color}`}
          >
            Open {preview.label} Dashboard <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
