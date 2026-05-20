import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radio, Coins, Check, ArrowLeft, Zap, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AppSidebar from "@/components/AppSidebar";
import { ADMIN_EMAIL } from "@/lib/config";

type Currency = "ZAR" | "USD";

interface CoinPack {
  id: string;
  coins: number;
  zar: number;
  usd: number;
  bonus?: number;
  popular?: boolean;
  label?: string;
}

const COIN_PACKS: CoinPack[] = [
  { id: "starter",   coins: 100,  zar: 15,   usd: 0.80  },
  { id: "basic",     coins: 300,  zar: 40,   usd: 2.20  },
  { id: "popular",   coins: 600,  zar: 75,   usd: 4.00,  bonus: 50,  popular: true, label: "Best Value" },
  { id: "pro",       coins: 1200, zar: 140,  usd: 7.50,  bonus: 150 },
  { id: "super",     coins: 2500, zar: 270,  usd: 14.50, bonus: 400, label: "Most Coins" },
  { id: "ultimate",  coins: 5000, zar: 500,  usd: 27.00, bonus: 1000 },
];

export default function BuyCoins() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState<Currency>("ZAR");
  const [selected, setSelected] = useState<string | null>(null);
  const [manualAmount, setManualAmount] = useState<string>("");
  const [manualTx, setManualTx] = useState<string>("");
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const selectedPack = COIN_PACKS.find(p => p.id === selected);
  
  // Generate PayPal.me link with selected amount
  const getPayPalLink = () => {
    if (!selectedPack) return "https://paypal.me/csign";
    const amount = currency === "ZAR" ? selectedPack.zar : selectedPack.usd;
    return `https://paypal.me/csign/${amount}`;
  };

  const handlePayPalPurchase = () => {
    if (!selectedPack) return;
    window.open(getPayPalLink(), "_blank", "noopener,noreferrer");
  };

  const handleClaimSubmit = async () => {
    if (!manualAmount || !manualTx || !user) { 
      setClaimError('Please enter amount and transaction ID'); 
      return; 
    }
    setClaimError(null);
    setClaiming(true);
    try {
      const res = await fetch('/api/payments/manual-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({ amount: manualAmount, txId: manualTx, packageId: selected })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit claim');
      setClaimSuccess('Claim submitted! Admin will credit your coins within 24 hours.');
      setManualAmount(''); 
      setManualTx('');
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Failed to submit claim');
    } finally { 
      setClaiming(false); 
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />

      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0">
        <div className="px-4 py-6 max-w-3xl mx-auto">

          {/* Hero */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Buy Coins</h1>
            <p className="text-muted-foreground">Support your favourite artists by sending coins during live streams</p>
          </div>

          {/* Currency toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-1 p-1 bg-card/40 border border-border/40 rounded-xl">
              {(["ZAR", "USD"] as Currency[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
                    currency === c
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c === "ZAR" ? "🇿🇦 ZAR" : "🇺🇸 USD"}
                </button>
              ))}
            </div>
          </div>

          {/* Coin packs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {COIN_PACKS.map(pack => (
              <button
                key={pack.id}
                onClick={() => setSelected(pack.id)}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                  selected === pack.id
                    ? "border-yellow-500 bg-yellow-500/10"
                    : pack.popular
                    ? "border-primary/60 bg-primary/5 hover:border-primary"
                    : "border-border/40 bg-card/30 hover:border-border/80"
                }`}
              >
                {/* Badge */}
                {pack.label && (
                  <span className={`absolute -top-3 left-4 px-3 py-0.5 rounded-full text-xs font-bold ${
                    pack.popular ? "bg-primary text-primary-foreground" : "bg-yellow-500 text-black"
                  }`}>
                    {pack.label}
                  </span>
                )}

                {/* Selected check */}
                {selected === pack.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold">{pack.coins.toLocaleString()}</span>
                  {pack.bonus && (
                    <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                      +{pack.bonus} bonus
                    </span>
                  )}
                </div>

                {pack.bonus && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Total: {(pack.coins + pack.bonus).toLocaleString()} coins
                  </p>
                )}

                <p className="text-xl font-bold text-foreground">
                  {currency === "ZAR" ? `R${pack.zar}` : `$${pack.usd}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currency === "ZAR"
                    ? `≈ $${pack.usd} USD`
                    : `≈ R${pack.zar} ZAR`}
                </p>
              </button>
            ))}
          </div>

          {/* What are coins */}
          <div className="glass rounded-2xl p-6 mb-8">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              What can you do with coins?
            </h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">*</span>
                <span>Tip artists during live streams to show support</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">*</span>
                <span>Send highlighted messages in live chat</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">*</span>
                <span>70% of every coin goes directly to the artist</span>
              </div>
            </div>
          </div>

          {/* PayPal Purchase Section */}
          <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-500">P</span>
              </div>
              <div>
                <h3 className="font-bold">Pay with PayPal</h3>
                <p className="text-xs text-muted-foreground">Secure payment via PayPal.me</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Step 1: Pay */}
              <div className="p-4 bg-card/30 rounded-xl border border-border/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <span className="font-semibold text-sm">Click to pay via PayPal</span>
                </div>
                <button
                  onClick={handlePayPalPurchase}
                  disabled={!selected}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {selectedPack
                    ? `Pay ${currency === "ZAR" ? `R${selectedPack.zar}` : `$${selectedPack.usd}`} via PayPal`
                    : "Select a pack first"}
                </button>
              </div>

              {/* Step 2: Submit claim */}
              <div className="p-4 bg-card/30 rounded-xl border border-border/40">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <span className="font-semibold text-sm">Submit your transaction details</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input 
                    value={manualAmount} 
                    onChange={e => setManualAmount(e.target.value)} 
                    placeholder="Amount paid (e.g. 50)" 
                    className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50" 
                  />
                  <input 
                    value={manualTx} 
                    onChange={e => setManualTx(e.target.value)} 
                    placeholder="PayPal transaction ID" 
                    className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50" 
                  />
                </div>
                
                {claimError && <p className="text-destructive text-sm mb-2">{claimError}</p>}
                {claimSuccess && <p className="text-green-500 text-sm mb-2">{claimSuccess}</p>}
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleClaimSubmit} 
                    disabled={claiming || !manualAmount || !manualTx} 
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {claiming ? "Submitting..." : "Submit Claim"}
                  </button>
                  <button 
                    onClick={() => { setManualAmount(''); setManualTx(''); setClaimError(null); setClaimSuccess(null); }} 
                    className="px-4 py-2.5 border border-border/40 rounded-xl text-sm hover:bg-card/50 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Admin will credit your coins within 24 hours of payment verification. Need help? Email <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">{ADMIN_EMAIL}</a>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Payments are processed securely via PayPal. Coins are non-refundable once purchased.
          </p>
        </div>
      </main>
    </div>
  );
}
