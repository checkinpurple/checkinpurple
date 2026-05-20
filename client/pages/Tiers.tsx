import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Radio, Check, ArrowLeft, Zap, Crown, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AppSidebar from "@/components/AppSidebar";
import { SubscriptionTier } from "@shared/api";
import { ADMIN_EMAIL } from "@/lib/config";

export default function Tiers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedTier = searchParams.get("selected");
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [currentTierId, setCurrentTierId] = useState<string | null>(null);
  const [selectedForPayment, setSelectedForPayment] = useState<SubscriptionTier | null>(null);
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [manualTx, setManualTx] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
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

  const handleSubscribe = (tier: SubscriptionTier) => {
    if (!user) { navigate("/signin"); return; }
    if (isCurrentPlan(tier)) return;
    
    // Open PayPal modal for payment
    setSelectedForPayment(tier);
    setShowPayPalModal(true);
    setClaimError(null);
    setClaimSuccess(null);
    setManualTx("");
  };

  const getPayPalLink = (tier: SubscriptionTier) => {
    const amount = Number(tier.price_monthly).toFixed(2);
    return `https://paypal.me/csign/${amount}`;
  };

  const handlePayPalPayment = () => {
    if (!selectedForPayment) return;
    window.open(getPayPalLink(selectedForPayment), "_blank", "noopener,noreferrer");
  };

  const handleClaimSubscription = async () => {
    if (!manualTx || !user || !selectedForPayment) {
      setClaimError("Please enter the PayPal transaction ID");
      return;
    }
    
    setClaiming(true);
    setClaimError(null);
    
    try {
      const res = await fetch("/api/payments/manual-claim", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${user.id}` 
        },
        body: JSON.stringify({ 
          type: "subscription",
          tierId: selectedForPayment.id,
          tierName: selectedForPayment.name,
          amount: selectedForPayment.price_monthly, 
          txId: manualTx 
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit claim");
      
      setClaimSuccess("Subscription claim submitted! Your plan will be upgraded within 24 hours after payment verification.");
      setManualTx("");
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Failed to submit claim");
    } finally {
      setClaiming(false);
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
    <div className="min-h-screen bg-background flex">
      <AppSidebar />

      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0">
        <div className="px-4 py-6 max-w-5xl mx-auto">

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
                    disabled={isCurrentPlan(tier)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-opacity ${
                      isCurrentPlan(tier)
                        ? "bg-primary/10 border border-primary/30 text-primary"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    } disabled:opacity-60`}
                  >
                    {isCurrentPlan(tier) ? "Current Plan" : "Upgrade via PayPal"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Artist payout note */}
          <div className="mt-10 p-6 glass rounded-2xl text-center">
            <p className="text-muted-foreground text-sm">
              Artists keep <span className="text-foreground font-bold">70%</span> of every coin tip received.
              The remaining 30% supports the CheckinPurple platform.
              Payouts available via <span className="text-foreground font-semibold">PayPal</span> or <span className="text-foreground font-semibold">bank transfer</span> - minimum R200 / $11.
            </p>
          </div>
        </div>
      </main>

      {/* PayPal Payment Modal */}
      {showPayPalModal && selectedForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPayPalModal(false)}>
          <div className="bg-card rounded-2xl p-6 max-w-md w-full border border-border/40" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-500">P</span>
              </div>
              <div>
                <h3 className="font-bold">Pay with PayPal</h3>
                <p className="text-xs text-muted-foreground">Upgrade to {selectedForPayment.name} Plan</p>
              </div>
            </div>

            <div className="p-4 bg-card/50 rounded-xl border border-border/40 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{selectedForPayment.name} Plan (Monthly)</span>
                <span className="font-bold text-lg">${Number(selectedForPayment.price_monthly).toFixed(2)}</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {getFeatures(selectedForPayment).slice(0, 3).map((f, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              {/* Step 1: Pay */}
              <div className="p-4 bg-card/30 rounded-xl border border-border/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <span className="font-semibold text-sm">Click to pay via PayPal</span>
                </div>
                <button
                  onClick={handlePayPalPayment}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Pay ${Number(selectedForPayment.price_monthly).toFixed(2)} via PayPal
                </button>
              </div>

              {/* Step 2: Submit claim */}
              <div className="p-4 bg-card/30 rounded-xl border border-border/40">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <span className="font-semibold text-sm">Submit transaction ID</span>
                </div>
                
                <input 
                  value={manualTx} 
                  onChange={e => setManualTx(e.target.value)} 
                  placeholder="PayPal transaction ID" 
                  className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3" 
                />
                
                {claimError && <p className="text-destructive text-sm mb-2">{claimError}</p>}
                {claimSuccess && <p className="text-green-500 text-sm mb-2">{claimSuccess}</p>}
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleClaimSubscription} 
                    disabled={claiming || !manualTx} 
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {claiming ? "Submitting..." : "Submit Claim"}
                  </button>
                  <button 
                    onClick={() => setShowPayPalModal(false)} 
                    className="px-4 py-2.5 border border-border/40 rounded-xl text-sm hover:bg-card/50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Your plan will be upgraded within 24 hours. Need help? Email <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">{ADMIN_EMAIL}</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
