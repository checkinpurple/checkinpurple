import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Mic, Radio, Users, Lock, Zap, Shield, ShoppingBag,
  Star, Music, ArrowRight, Play, TrendingUp, Camera
} from "lucide-react";
import Logo from "@/components/Logo";

export default function Index() {
  const [activeRole, setActiveRole] = useState<"broadcaster" | "listener" | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/public/stats")
      .then(r => r.json())
      .then(d => setUserCount(d.userCount ?? null))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 glass backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Logo compact />
            </div>
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/store" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
              Store
            </Link>
            <Link to="/signin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link to="/signup" className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 gradient-dark pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6 text-sm font-medium text-primary">
            <Zap className="w-3.5 h-3.5" />
            Live streaming · Music commerce · Artist growth
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-5 leading-tight">
            One account.<br />
            <span className="gradient-primary bg-clip-text text-transparent">
              Every creator mode.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Fan, Artist, Merchant, Influencer — all in one place. Stream live, sell music and fashion, grow your audience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              Create Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/tiers" className="w-full sm:w-auto px-6 py-3 rounded-lg border border-border/60 font-semibold hover:bg-card/40 transition-colors text-center">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* User count social proof */}
      {userCount !== null && userCount > 0 && (
        <div className="flex items-center justify-center gap-2 pb-6 px-4">
          <div className="flex -space-x-1.5">
            {["A","B","C","D"].map((l, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background flex items-center justify-center text-xs font-bold text-white">{l}</div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{userCount.toLocaleString()}</span> creators already on CheckinPurple
          </p>
        </div>
      )}

      {/* Go Live / Listen Cards */}
      <section className="px-4 sm:px-6 pb-16 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveRole("broadcaster")}
            className={`group p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
              activeRole === "broadcaster" ? "border-primary bg-primary/5" : "border-border/40 bg-card/30 hover:border-primary/40"
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Mic className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-1">Go Live</h3>
            <p className="text-sm text-muted-foreground mb-4">Share your music in real-time with ultra-low latency streaming.</p>
            <div className="flex flex-wrap gap-2">
              {["Live streaming", "Listener protection", "Real-time tips"].map(f => (
                <span key={f} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{f}</span>
              ))}
            </div>
          </button>

          <button
            onClick={() => setActiveRole("listener")}
            className={`group p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
              activeRole === "listener" ? "border-accent bg-accent/5" : "border-border/40 bg-card/30 hover:border-accent/40"
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Radio className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-1">Listen Live</h3>
            <p className="text-sm text-muted-foreground mb-4">Discover artists, join live audiences and tip your favourites.</p>
            <div className="flex flex-wrap gap-2">
              {["Cannot be recorded", "Real-time connection", "Live chat"].map(f => (
                <span key={f} className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">{f}</span>
              ))}
            </div>
          </button>
        </div>
      </section>

      {/* Profiles Section */}
      <section className="px-4 sm:px-6 pb-16 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Four profiles, one account</h2>
          <p className="text-muted-foreground text-sm">Choose what fits your journey. Upgrade anytime to unlock more.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: <Users className="w-5 h-5" />, label: "Fan", desc: "Discover, listen and support artists", color: "text-accent border-accent/30 bg-accent/5" },
            { icon: <Mic className="w-5 h-5" />, label: "Artist", desc: "Stream live, upload tracks, get booked", color: "text-purple-400 border-purple-500/30 bg-purple-500/5" },
            { icon: <ShoppingBag className="w-5 h-5" />, label: "Merchant", desc: "Sell merch, fashion and tickets", color: "text-orange-400 border-orange-500/30 bg-orange-500/5" },
            { icon: <Star className="w-5 h-5" />, label: "Influencer", desc: "Promote artists and earn commission", color: "text-pink-400 border-pink-500/30 bg-pink-500/5" },
          ].map(p => (
            <div key={p.label} className={`p-4 rounded-2xl border ${p.color}`}>
              <div className="mb-3">{p.icon}</div>
              <p className="font-bold text-sm mb-1">{p.label}</p>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section className="px-4 sm:px-6 pb-16 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Simple, flexible pricing</h2>
          <p className="text-muted-foreground text-sm">Start free, scale as you grow.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { name: "Basic", sub: "1 profile · Free", desc: "Perfect for fans or solo artists starting out.", features: ["1 profile", "Access live streams", "Basic discovery"] },
            { name: "Standard", sub: "2 profiles", desc: "Unlock any two profiles and tap into streaming plus commerce.", features: ["Choose 2 profiles", "Live streaming + store", "Artist tools"], popular: true },
            { name: "Premium", sub: "All 4 profiles", desc: "Full access to every creator workflow.", features: ["All 4 profiles", "Advanced analytics", "Full monetization"] },
          ].map(t => (
            <div key={t.name} className={`p-5 rounded-2xl border ${t.popular ? "border-primary/50 bg-primary/5" : "border-border/40 bg-card/30"}`}>
              {t.popular && <div className="text-xs font-semibold text-primary mb-2">Most Popular</div>}
              <p className="font-bold text-lg">{t.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{t.sub}</p>
              <p className="text-sm text-muted-foreground mb-4">{t.desc}</p>
              <ul className="space-y-1.5">
                {t.features.map(f => (
                  <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-primary flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 sm:px-6 pb-16 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-border/40 bg-card/30 p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Everything you need to build</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <Play className="w-5 h-5 text-primary" />, title: "Live Performance", desc: "Stream shows with real-time audience interaction." },
              { icon: <ShoppingBag className="w-5 h-5 text-orange-400" />, title: "Music & Fashion Store", desc: "Sell merch, digital downloads, and tickets." },
              { icon: <Camera className="w-5 h-5 text-purple-400" />, title: "Artist Gallery", desc: "Showcase your look with a photo gallery on your profile." },
              { icon: <TrendingUp className="w-5 h-5 text-pink-400" />, title: "Influencer Deals", desc: "Artists negotiate directly with influencers to promote their music." },
              { icon: <Music className="w-5 h-5 text-accent" />, title: "Discover Music", desc: "Explore tracks across all profiles — fan, influencer and merchant." },
              { icon: <Shield className="w-5 h-5 text-green-400" />, title: "Secure Payments", desc: "Protected payments with coin tipping and fiat withdrawals." },
            ].map(f => (
              <div key={f.title} className="flex gap-3 p-4 rounded-xl border border-border/30 bg-background/40">
                <div className="mt-0.5 flex-shrink-0">{f.icon}</div>
                <div>
                  <p className="font-semibold text-sm mb-1">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-muted-foreground text-xs">
          <div>© 2025 CheckinPurple. All rights reserved.</div>
          <div className="flex gap-5">
            <button className="hover:text-foreground transition-colors">Privacy</button>
            <button className="hover:text-foreground transition-colors">Terms</button>
            <button className="hover:text-foreground transition-colors">Contact</button>
          </div>
        </div>
      </footer>

      {/* Role Modal */}
      {activeRole && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setActiveRole(null)}>
          <div className="bg-card rounded-2xl p-7 max-w-sm w-full border border-border/40" onClick={e => e.stopPropagation()}>
            {activeRole === "broadcaster" ? (
              <>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-7 h-7 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold text-center mb-1">Ready to Go Live?</h2>
                <p className="text-muted-foreground text-sm text-center mb-5">Create or sign in to start streaming.</p>
                <div className="space-y-2">
                  <Link to="/signup?role=artist" className="block w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg text-center hover:opacity-90 transition-opacity text-sm">Create Artist Account</Link>
                  <Link to="/signin" className="block w-full border border-border/40 font-semibold py-2.5 rounded-lg text-center hover:bg-card/60 transition-colors text-sm">Sign In</Link>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center mx-auto mb-4">
                  <Radio className="w-7 h-7 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold text-center mb-1">Join the Community</h2>
                <p className="text-muted-foreground text-sm text-center mb-5">Discover and listen to live streams worldwide.</p>
                <div className="space-y-2">
                  <Link to="/signup?role=fan" className="block w-full bg-accent text-accent-foreground font-semibold py-2.5 rounded-lg text-center hover:opacity-90 transition-opacity text-sm">Create Listener Account</Link>
                  <Link to="/signin" className="block w-full border border-border/40 font-semibold py-2.5 rounded-lg text-center hover:bg-card/60 transition-colors text-sm">Sign In</Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
