import { useState } from "react";
import { Link } from "react-router-dom";
import { Mic, Radio, Users, Lock, Zap, Shield } from "lucide-react";
import Logo from "@/components/Logo";

export default function Index() {
  const [activeRole, setActiveRole] = useState<"broadcaster" | "listener" | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Logo compact />
            </div>
            <Logo />
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Create Account
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 gradient-dark pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Live streaming, zero recording</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              One account, all creator modes.
              <span className="block gradient-primary bg-clip-text text-transparent">
                Fan, Artist, Merchant, Influencer
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Sell your music, grow your audience, and build multiple profiles from one dashboard. Choose Basic for one profile, Standard for two, or Premium for all four.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/tiers"
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                View Tiers
              </Link>
              <Link
                to="/signup"
                className="px-6 py-3 rounded-lg border border-primary/40 text-primary font-semibold hover:bg-primary/5 transition-colors"
              >
                Create Account
              </Link>
              <Link
                to="/signin"
                className="px-6 py-3 rounded-lg text-primary font-semibold hover:bg-primary/5 transition-colors"
              >
                Sign In
              </Link>
            </div>

            <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto mt-3">
              Selecting two or more profiles will route your account straight into secure payment processing after signup.
            </p>
          </div>

          {/* Tier Preview */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            <div className="p-6 rounded-3xl border border-border/40 bg-card/60 shadow-sm">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Basic</p>
              <p className="text-2xl font-bold mb-3">Start with one profile</p>
              <p className="text-sm text-muted-foreground mb-6">Perfect for fans or solo artists who want a simple, single-profile starter account.</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>1 profile</li>
                <li>Access live streams</li>
                <li>Basic discovery tools</li>
              </ul>
            </div>
            <div className="p-6 rounded-3xl border border-primary/40 bg-primary/5 shadow-sm">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">Most Popular</div>
              <p className="text-2xl font-bold mb-3">Standard</p>
              <p className="text-sm text-muted-foreground mb-6">Unlock any two profile types and tap into streaming plus commerce.</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Choose 2 profiles</li>
                <li>Live streaming + store</li>
                <li>Artist tools + community</li>
              </ul>
            </div>
            <div className="p-6 rounded-3xl border border-border/40 bg-card/60 shadow-sm">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Premium</p>
              <p className="text-2xl font-bold mb-3">All four profiles</p>
              <p className="text-sm text-muted-foreground mb-6">For creators who want complete access to fan, artist, merchant and influencer workflows.</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>4 profiles</li>
                <li>Advanced analytics</li>
                <li>Full monetization suite</li>
              </ul>
            </div>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-20">
            {/* Broadcaster Card */}
            <button
              onClick={() => setActiveRole("broadcaster")}
              className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 text-left ${
                activeRole === "broadcaster"
                  ? "border-primary bg-primary/5"
                  : "border-border/40 bg-card/30 hover:border-primary/40"
              }`}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mic className="w-7 h-7 text-primary-foreground" />
                </div>

                <h3 className="text-2xl font-bold mb-2">Go Live</h3>
                <p className="text-muted-foreground mb-6">
                  Share your music with the world in real-time
                </p>

                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Ultra-low latency streaming
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Listener protection built-in
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Connect with thousands
                  </li>
                </ul>

                <div className="mt-6 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm font-medium text-primary inline-block">
                  Start Broadcasting
                </div>
              </div>
            </button>

            {/* Listener Card */}
            <button
              onClick={() => setActiveRole("listener")}
              className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 text-left ${
                activeRole === "listener"
                  ? "border-accent bg-accent/5"
                  : "border-border/40 bg-card/30 hover:border-accent/40"
              }`}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Radio className="w-7 h-7 text-primary-foreground" />
                </div>

                <h3 className="text-2xl font-bold mb-2">Listen Live</h3>
                <p className="text-muted-foreground mb-6">
                  Discover and enjoy live performances
                </p>

                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accent" />
                    Stream cannot be recorded
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    Real-time connection
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    Join live audiences
                  </li>
                </ul>

                <div className="mt-6 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20 text-sm font-medium text-accent inline-block">
                  Start Listening
                </div>
              </div>
            </button>
          </div>

          {/* Features Section */}
          <div className="bg-gradient-to-b from-card/40 to-transparent rounded-3xl p-12 border border-border/40">
            <h2 className="text-3xl font-bold text-center mb-4">What CheckinPurple Does</h2>
            <p className="text-center text-muted-foreground mb-12">
              One platform for live streaming, music commerce, influencer growth, and artist monetization.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Live Performance</h3>
                <p className="text-muted-foreground text-sm">
                  Broadcast live shows with modern streaming tools and real-time audience interaction.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Community & Commerce</h3>
                <p className="text-muted-foreground text-sm">
                  Grow followers, sell merch, offer tickets, and let fans tip creators instantly.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Secure Payments</h3>
                <p className="text-muted-foreground text-sm">
                  All accounts are protected, and premium access is processed automatically when selecting multiple profiles.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-background/80 border border-border/30 p-8">
              <h3 className="text-2xl font-bold mb-4 text-center">Artist Tools Included</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/40 bg-card/70 p-5">
                  <p className="font-semibold mb-2">Live streaming & recordings</p>
                  <p className="text-sm text-muted-foreground">Start shows, invite fans, and stream with live protection from downloads.</p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/70 p-5">
                  <p className="font-semibold mb-2">Scheduled releases</p>
                  <p className="text-sm text-muted-foreground">Plan new tracks and drops, then publish to your audience on your schedule.</p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/70 p-5">
                  <p className="font-semibold mb-2">Merch & ticket sales</p>
                  <p className="text-sm text-muted-foreground">Sell physical merch, digital downloads, and event tickets directly from your profile.</p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/70 p-5">
                  <p className="font-semibold mb-2">Bookings & payouts</p>
                  <p className="text-sm text-muted-foreground">Accept bookings, earn tips in coins, and withdraw payments through PayPal or bank transfer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Content based on selection */}
      {activeRole && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-8 max-w-md w-full border border-border/40 animate-in fade-in zoom-in">
            <button
              onClick={() => setActiveRole(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>

            {activeRole === "broadcaster" ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
                  <Mic className="w-8 h-8 text-primary-foreground" />
                </div>

                <h2 className="text-2xl font-bold mb-2">Ready to Go Live?</h2>
                <p className="text-muted-foreground mb-6">
                  Create or login to your account to start streaming
                </p>

                <div className="space-y-3">
                  <Link
                    to="/signup?role=artist"
                    className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                  >
                    Create Artist Account
                  </Link>
                  <Link
                    to="/signin"
                    className="block w-full border border-primary/40 text-primary font-semibold py-3 px-6 rounded-lg hover:bg-primary/5 transition-colors text-center"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center mx-auto mb-6">
                  <Radio className="w-8 h-8 text-primary-foreground" />
                </div>

                <h2 className="text-2xl font-bold mb-2">Join the Community</h2>
                <p className="text-muted-foreground mb-6">
                  Discover and listen to live streams from artists worldwide
                </p>

                <div className="space-y-3">
                  <Link
                    to="/signup?role=fan"
                    className="block w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                  >
                    Create Listener Account
                  </Link>
                  <Link
                    to="/signin"
                    className="block w-full border border-accent/40 text-accent font-semibold py-3 px-6 rounded-lg hover:bg-accent/5 transition-colors text-center"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
          <div>© 2024 CheckinPurple. All rights reserved.</div>
          <div className="flex gap-6">
            <button className="hover:text-foreground transition-colors">Privacy</button>
            <button className="hover:text-foreground transition-colors">Terms</button>
            <button className="hover:text-foreground transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
