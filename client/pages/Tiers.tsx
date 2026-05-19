import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Radio, Check, ArrowLeft, Zap, Crown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SubscriptionTier } from "@shared/api";

export default function Tiers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedTier = searchParams.get("selected");
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [currentTierId, setCurrentTierId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, [user]);

  const load = async () => {
    setError("");
    try {
      const [tiersRes, subRes] = await Promise.all([
        fetch("/api/subscriptions/tiers"),
        user ? fetch("/api/subscriptions/user", { headers: { Authorization: `Bearer ${user.id}` } }) : Promise.resolve(null as any),
      ]);
      const tiersData = await tiersRes.json();
      if (Array.isArray(tiersData)) setTiers(tiersData);
      if (subRes) {
        const subData = await subRes.json();
        setCurrentTierId(subData?.tier_id || null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tiers");
    }
  };

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!user) { navigate("/signin"); return; }

    setLoading(tier.id);
    setError("");

    try {
      const response = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          tier_id: tier.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Subscription failed");

      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subscription failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const isCurrentPlan = (tier: SubscriptionTier) => Boolean(currentTierId && tier.id === currentTierId);

  const getFeatures = (tier: SubscriptionTier) => {
    const profileLimit = (tier as any).profile_limit ?? tier.profile_limit ?? 1;
    const trackLimit = tier.track_limit;
    const list: string[] = [];
    list.push(`${profileLimit} profile${profileLimit === 1 ? "" : "s"} per account`);
    if (typeof trackLimit === "number") list.push(`Up to ${trackLimit} uploaded tracks`);
    if (tier.features?.live_streaming) list.push("Live streaming");
    if (tier.features?.scheduled_releases) list.push("Scheduled releases");
    if (tier.features?.bookings) list.push("Bookings");
    if (tier.features?.advanced_analytics) list.push("Advanced analytics");
    if (tier.features?.unlimited_tracks) list.push("Unlimited tracks");
    if (tier.name === "Basic") list.push("Limited features (upgrade to unlock more profiles)");
    return list;
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-40 border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Radio className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CheckinPurple
            </span>
          </Link>
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Unlock more profiles & features</span>
            </div>
            <h1 className="text-4xl font-bold mb-3">Choose Your Plan</h1>
            <p className="text-muted-foreground text-lg">Basic is limited. Upgrade to Standard or Premium to unlock more profiles.</p>
            {selectedTier && (
              <div className="mt-6 inline-flex items-center rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                Your selected plan is <span className="font-semibold ml-1">{selectedTier}</span>. Complete payment now to activate your multi-profile account.
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm mb-6 text-center">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map(tier => {
              const highlight = tier.name === "Standard" || tier.name === selectedTier;
              const badge = tier.name === "Standard" ? "Most Popular" : tier.name === "Premium" ? "All Profiles" : undefined;
              const features = getFeatures(tier);
              return (
                <div
                  key={tier.id}
                  className={`p-6 rounded-2xl border-2 bg-card/30 ${highlight ? "border-primary/60" : "border-border/40"}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-muted-foreground">{tier.name}</p>
                      <p className="text-3xl font-bold mt-1">${Number(tier.price_monthly).toFixed(2)}<span className="text-sm text-muted-foreground">/mo</span></p>
                    </div>
                    {badge && (
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary whitespace-nowrap">
                        {badge}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6">
                    {features.map((f, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(tier)}
                    disabled={loading === tier.id || isCurrentPlan(tier)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-opacity ${
                      isCurrentPlan(tier)
                        ? "bg-primary/10 border border-primary/30 text-primary"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    } disabled:opacity-60`}
                  >
                    {isCurrentPlan(tier) ? "Current Plan" : loading === tier.id ? "Processing..." : "Upgrade"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Artist payout note */}
          <div className="mt-10 p-6 glass rounded-2xl text-center">
            <p className="text-muted-foreground text-sm">
              💰 Artists keep <span className="text-foreground font-bold">70%</span> of every coin tip received.
              The remaining 30% supports the CheckinPurple platform.
              Payouts available via <span className="text-foreground font-semibold">PayPal</span> or <span className="text-foreground font-semibold">bank transfer</span> — minimum R200 / $11.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
