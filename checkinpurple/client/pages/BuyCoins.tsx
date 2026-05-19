import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radio, Coins, Check, ArrowLeft, CreditCard, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handlePurchase = async () => {
    if (!selected || !user) return;
    const pack = COIN_PACKS.find(p => p.id === selected);
    if (!pack) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/coins/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          packageId: pack.id,
          amount: currency === "ZAR" ? pack.zar : pack.usd,
          currency,
          coins: pack.coins + (pack.bonus || 0),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Purchase failed");

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPack = COIN_PACKS.find(p => p.id === selected);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">

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
                <span className="text-yellow-500 mt-0.5">🎵</span>
                <span>Tip artists during live streams to show support</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">💬</span>
                <span>Send highlighted messages in live chat</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">⭐</span>
                <span>70% of every coin goes directly to the artist</span>
              </div>
            </div>
          </div>

          {/* Purchase button */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm mb-4">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
              <Check className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="font-bold text-green-500 text-lg">Purchase successful!</p>
              <p className="text-muted-foreground text-sm">Coins added to your account. Redirecting...</p>
            </div>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={!selected || loading}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-3"
            >
              <CreditCard className="w-5 h-5" />
              {loading
                ? "Processing..."
                : selectedPack
                ? `Buy ${(selectedPack.coins + (selectedPack.bonus || 0)).toLocaleString()} coins for ${currency === "ZAR" ? `R${selectedPack.zar}` : `$${selectedPack.usd}`}`
                : "Select a pack to continue"}
            </button>
          )}

          <p className="text-center text-xs text-muted-foreground mt-4">
            Payments are processed securely. Coins are non-refundable once purchased.
          </p>
        </div>
      </div>
    </div>
  );
}
