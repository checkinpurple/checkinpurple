import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Radio, Mic, Users, Star, ShoppingBag, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ProfileType } from "@shared/api";
import Logo from "@/components/Logo";

type Tier = "Basic" | "Standard" | "Premium";

interface RoleOption {
  id: ProfileType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

const PROFILES: RoleOption[] = [
  {
    id: "fan",
    label: "Fan",
    description: "Discover and support music",
    icon: <Users className="w-6 h-6" />,
    color: "border-accent/60 bg-accent/5",
    features: ["Browse live streams", "Follow artists", "Tip with coins", "Live chat"],
  },
  {
    id: "artist",
    label: "Artist",
    description: "Stream your music live",
    icon: <Mic className="w-6 h-6" />,
    color: "border-purple-500/60 bg-purple-500/5",
    features: ["Go live anytime", "Upload tracks", "Receive coin tips", "Schedule releases"],
  },
  {
    id: "influencer",
    label: "Influencer",
    description: "Promote artists, earn commissions",
    icon: <Star className="w-6 h-6" />,
    color: "border-pink-500/60 bg-pink-500/5",
    features: ["Referral link earnings", "Artist tip revenue share", "Influencer dashboard", "Analytics"],
  },
  {
    id: "merchant",
    label: "Merchant",
    description: "Sell merch, downloads and tickets",
    icon: <ShoppingBag className="w-6 h-6" />,
    color: "border-orange-500/60 bg-orange-500/5",
    features: ["Physical merch store", "Digital downloads", "Event tickets", "Order management"],
  },
];

const TIER_LIMITS: Record<Tier, number> = { Basic: 1, Standard: 2, Premium: 4 };

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, user, error: authError } = useAuth();

  const initialProfile = (searchParams.get("role") as ProfileType) || "fan";
  const [tier, setTier] = useState<Tier>("Basic");
  const [profiles, setProfiles] = useState<ProfileType[]>(
    ["fan", "artist", "merchant", "influencer"].includes(initialProfile) ? [initialProfile] : ["fan"]
  );
  const [activeProfile, setActiveProfile] = useState<ProfileType>(profiles[0] || "fan");
  const [formData, setFormData] = useState({ email: "", phone: "", password: "", username: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  useEffect(() => {
    const limit = TIER_LIMITS[tier];
    if (tier === "Premium") {
      const all: ProfileType[] = ["fan", "artist", "merchant", "influencer"];
      setProfiles(all);
      setActiveProfile(p => (all.includes(p) ? p : "fan"));
      return;
    }
    setProfiles(prev => {
      const next = prev.slice(0, limit);
      setActiveProfile(p => (next.includes(p) ? p : next[0] || "fan"));
      return next.length > 0 ? next : ["fan"];
    });
  }, [tier]);

  useEffect(() => {
    if (!profiles.includes(activeProfile)) setActiveProfile(profiles[0] || "fan");
  }, [profiles, activeProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password || !formData.username || !formData.phone) {
      setError("Email, cell phone number, username and password are required"); return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters"); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address"); return;
    }
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters"); return;
    }
    if (!acceptedTerms) {
      setError("Please accept the Terms and Conditions"); return;
    }

    const limit = TIER_LIMITS[tier];
    if (profiles.length !== limit) {
      setError(`Please choose exactly ${limit} profile${limit === 1 ? "" : "s"} for the ${tier} tier`);
      return;
    }

    const paymentRequired = tier !== "Basic";
    try {
      setLoading(true);
      await signUp(formData.email, formData.phone, formData.password, formData.username, activeProfile, profiles, tier);
      if (paymentRequired) {
        // Premium and Standard tiers require payment before accessing dashboard
        navigate(`/tiers?selected=${tier}&pending=true`);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : authError || "Sign up failed";
      if (msg.includes("already registered") || msg.includes("identities")) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const limit = TIER_LIMITS[tier];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Radio className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">CheckinPurple</span>
          </Link>
        </div>
      </nav>

      <div className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Logo className="mb-4" />
            <h1 className="text-3xl font-bold mb-2">Join CheckinPurple</h1>
            <p className="text-muted-foreground">Choose your tier and profiles to get started with a single account.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {(["Basic", "Standard", "Premium"] as Tier[]).map(t => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 relative ${
                  tier === t ? "border-primary/60 bg-primary/5" : "border-border/30 bg-card/20 hover:border-border/60"
                }`}
              >
                {tier === t && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <p className="font-bold text-sm mb-0.5">{t}</p>
                <p className="text-xs text-muted-foreground">{t === "Basic" ? "Choose 1 profile" : t === "Standard" ? "Choose any 2 profiles" : "All 4 profiles"}</p>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center mb-6">
            Profiles are unique per account. Upgrade your tier anytime to unlock more profiles.
          </p>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Profiles ({profiles.length}/{limit})</p>
              <p className="text-xs text-muted-foreground">Active profile: {activeProfile}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROFILES.map(p => {
                const selected = profiles.includes(p.id);
                const disabled = tier === "Premium";
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (tier === "Premium") return;
                      setProfiles(prev => {
                        if (prev.includes(p.id)) {
                          // Allow deselect only if more than 1 selected
                          if (prev.length === 1) return prev;
                          const next = prev.filter(x => x !== p.id);
                          setActiveProfile(ap => next.includes(ap) ? ap : next[0]);
                          return next;
                        }
                        if (prev.length >= limit) {
                          // Swap: replace the first (non-active) profile
                          const swapOut = prev.find(x => x !== activeProfile) || prev[0];
                          const next = prev.filter(x => x !== swapOut).concat(p.id);
                          return next;
                        }
                        return [...prev, p.id];
                      });
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 relative ${
                      selected ? p.color : "border-border/30 bg-card/20 hover:border-border/60"
                    } ${disabled ? "opacity-60" : ""}`}
                    disabled={disabled}
                  >
                    {selected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-primary">{p.icon}</div>
                        <p className="font-bold text-sm mb-0.5">{p.label}</p>
                        <p className="text-xs text-muted-foreground mb-2">{p.description}</p>
                      </div>
                      <input
                        type="radio"
                        name="activeProfile"
                        checked={activeProfile === p.id}
                        onChange={() => setActiveProfile(p.id)}
                        disabled={!selected}
                      />
                    </div>
                    <ul className="space-y-0.5">
                      {p.features.map((f, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Check className="w-3 h-3 text-primary flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || authError) && (
              <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
                {error || authError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                placeholder="your_username"
                className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cell phone number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +27821234567"
                className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button 
                  type="button" 
                  onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                I agree to the <span className="text-primary underline cursor-pointer">Terms and Conditions</span>.
                {profiles.includes("artist") && " I will only stream music I own or have rights to."}
                {profiles.includes("merchant") && " I will only sell legitimate products through the store."}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Creating account..." : `Create ${tier} Account`}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <p className="text-muted-foreground text-sm mb-3">Already have an account?</p>
            <Link to="/signin" className="block w-full py-3 px-4 rounded-lg border-2 border-primary/40 text-primary font-semibold hover:bg-primary/5 transition-colors text-center">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
