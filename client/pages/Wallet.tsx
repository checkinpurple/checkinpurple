import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radio, Coins, ArrowLeft, TrendingUp, CreditCard, Landmark, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type PayoutMethod = "paypal" | "bank";
type WithdrawStatus = "idle" | "loading" | "success" | "error";

interface Transaction {
  id: string;
  type: "tip" | "payout";
  amount: number;
  coins?: number;
  from?: string;
  status: "completed" | "pending" | "failed";
  createdAt: string;
}

interface WalletData {
  totalCoinsEarned: number;
  availableCoins: number;
  pendingCoins: number;
  zarValue: number;
  transactions: Transaction[];
}

const COIN_FACE_ZAR = 0.10;
const COIN_TO_ZAR = 0.07;
const COIN_TO_USD_FIXED = 0.004;
const MIN_PAYOUT_ZAR = 200;
const MIN_PAYOUT_USD = 11;

export default function Wallet() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PayoutMethod>("paypal");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [currency, setCurrency] = useState<"ZAR" | "USD">("ZAR");
  const [withdrawStatus, setWithdrawStatus] = useState<WithdrawStatus>("idle");
  const [withdrawError, setWithdrawError] = useState("");
  const [zarRate, setZarRate] = useState<number>(18.5); // fallback
  const [rateLoaded, setRateLoaded] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    fetchWallet();
    // Fetch live exchange rate
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then(r => r.json())
      .then(d => { if (d?.rates?.ZAR) { setZarRate(d.rates.ZAR); setRateLoaded(true); } })
      .catch(() => {}); // silently fall back to 18.5
  }, [user]);

  const fetchWallet = async () => {
    try {
      const response = await fetch("/api/coins/tips", {
        headers: { Authorization: `Bearer ${user?.id}` },
      });
      const data = await response.json();

      if (data.success) {
        const tips: Transaction[] = (data.tips || []).map((t: any) => ({
          id: t.id,
          type: "tip",
          amount: Math.floor(t.amount * 0.7), // artist keeps 70%
          coins: t.amount,
          from: t.from_username || "Anonymous",
          status: "completed",
          createdAt: t.created_at,
        }));

        const totalCoins = tips.reduce((sum, t) => sum + (t.coins || 0), 0);
        const artistCoins = Math.floor(totalCoins * 0.7);

        setWallet({
          totalCoinsEarned: artistCoins,
          availableCoins: artistCoins,
          pendingCoins: 0,
          zarValue: Math.round(artistCoins * COIN_TO_ZAR * 100) / 100,
          transactions: tips,
        });
      } else {
        // Empty wallet for new artists
        setWallet({
          totalCoinsEarned: 0,
          availableCoins: 0,
          pendingCoins: 0,
          zarValue: 0,
          transactions: [],
        });
      }
    } catch {
      setWallet({ totalCoinsEarned: 0, availableCoins: 0, pendingCoins: 0, zarValue: 0, transactions: [] });
    } finally {
      setLoading(false);
    }
  };

  // Live rate helpers
  const coinToZar = (coins: number) => (coins * COIN_TO_ZAR).toFixed(2);
  const coinToUsd = (coins: number) => (coins * COIN_TO_ZAR / zarRate).toFixed(2);
  const zarToUsd = (zar: number) => (zar / zarRate).toFixed(2);

  const canWithdraw = wallet
    ? currency === "ZAR"
      ? wallet.zarValue >= MIN_PAYOUT_ZAR
      : parseFloat(zarToUsd(wallet.zarValue)) >= MIN_PAYOUT_USD
    : false;

  const handleWithdraw = async () => {
    if (!canWithdraw || !user || !wallet) return;

    if (method === "paypal" && !paypalEmail) {
      setWithdrawError("Please enter your PayPal email address.");
      return;
    }
    if (method === "bank" && (!bankName || !accountNumber || !branchCode)) {
      setWithdrawError("Please fill in all bank details.");
      return;
    }

    setWithdrawStatus("loading");
    setWithdrawError("");

    try {
      const response = await fetch("/api/payments/methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          method,
          currency,
          amount: currency === "ZAR" ? wallet.zarValue : wallet.zarValue * (COIN_TO_USD / COIN_TO_ZAR),
          coins: wallet.availableCoins,
          paypalEmail: method === "paypal" ? paypalEmail : undefined,
          bankName: method === "bank" ? bankName : undefined,
          accountNumber: method === "bank" ? accountNumber : undefined,
          branchCode: method === "bank" ? branchCode : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Withdrawal failed");

      setWithdrawStatus("success");
      fetchWallet();
    } catch (err) {
      setWithdrawStatus("error");
      setWithdrawError(err instanceof Error ? err.message : "Withdrawal request failed.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-ZA", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

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
        <div className="max-w-3xl mx-auto space-y-6">

          <div>
            <h1 className="text-3xl font-bold mb-1">Artist Wallet</h1>
            <p className="text-muted-foreground">Your earnings from coin tips</p>
          </div>

          {/* Minimum withdrawal info */}
          <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-foreground mb-0.5">Payout info</p>
              <p className="text-muted-foreground">
                Minimum withdrawal: <span className="text-foreground font-semibold">R{MIN_PAYOUT_ZAR} ZAR</span> · <span className="text-foreground font-semibold">${MIN_PAYOUT_USD} USD</span>.
                Artists keep <span className="text-foreground font-semibold">70%</span> of every tip. 1 coin = R{COIN_TO_ZAR} to you.
                {rateLoaded && <span className="ml-1 text-xs opacity-70">(Live rate: 1 USD = R{zarRate.toFixed(2)})</span>}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Available</span>
              </div>
              <p className="text-3xl font-bold text-yellow-500">{wallet?.availableCoins.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">coins</p>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm text-muted-foreground">ZAR Value</span>
              </div>
              <p className="text-3xl font-bold text-green-500">R{wallet?.zarValue.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                ≈ ${zarToUsd(wallet?.zarValue || 0)} USD
                {rateLoaded && <span className="text-xs opacity-60 ml-1">· live rate</span>}
              </p>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Earned</span>
              </div>
              <p className="text-3xl font-bold">{wallet?.totalCoinsEarned.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                ≈ R{coinToZar(wallet?.totalCoinsEarned || 0)} · ${coinToUsd(wallet?.totalCoinsEarned || 0)}
              </p>
            </div>
          </div>

          {/* Payout section */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-1">Request Payout</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Minimum payout: <span className="text-foreground font-semibold">R{MIN_PAYOUT_ZAR} ZAR</span> or <span className="text-foreground font-semibold">${MIN_PAYOUT_USD} USD</span>
            </p>

            {!canWithdraw && (
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-5">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-500">
                  You need at least R{MIN_PAYOUT_ZAR} in your wallet to request a payout. Keep streaming to earn more coins!
                </p>
              </div>
            )}

            {/* Currency */}
            <div className="flex gap-2 mb-5">
              {(["ZAR", "USD"] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    currency === c ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:border-border/80"
                  }`}
                >
                  {c === "ZAR" ? "🇿🇦 ZAR" : "🇺🇸 USD"}
                </button>
              ))}
            </div>

            {/* Method tabs */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setMethod("paypal")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  method === "paypal" ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:border-border/80"
                }`}
              >
                <CreditCard className="w-4 h-4" /> PayPal
              </button>
              <button
                onClick={() => setMethod("bank")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  method === "bank" ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:border-border/80"
                }`}
              >
                <Landmark className="w-4 h-4" /> Bank Transfer
              </button>
            </div>

            {/* Method fields */}
            {method === "paypal" ? (
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2">PayPal Email Address</label>
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={e => setPaypalEmail(e.target.value)}
                  placeholder="your@paypal.com"
                  className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            ) : (
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. FNB, Capitec, Nedbank"
                    className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder="1234567890"
                      className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Branch Code</label>
                    <input
                      type="text"
                      value={branchCode}
                      onChange={e => setBranchCode(e.target.value)}
                      placeholder="250655"
                      className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {withdrawError && (
              <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm mb-4">
                {withdrawError}
              </div>
            )}

            {withdrawStatus === "success" ? (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-semibold text-green-500">Payout requested!</p>
                  <p className="text-sm text-muted-foreground">We'll process it within 3–5 business days.</p>
                </div>
              </div>
            ) : withdrawStatus === "error" ? (
              <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl mb-4">
                <XCircle className="w-5 h-5 text-destructive" />
                <p className="text-sm text-destructive">Request failed. Please try again.</p>
              </div>
            ) : null}

            {withdrawStatus !== "success" && (
              <button
                onClick={handleWithdraw}
                disabled={!canWithdraw || withdrawStatus === "loading"}
                className="w-full py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {withdrawStatus === "loading"
                  ? "Submitting..."
                  : `Request ${currency === "ZAR" ? `R${wallet?.zarValue.toFixed(2)}` : `$${(((wallet?.zarValue || 0) * COIN_TO_USD) / COIN_TO_ZAR).toFixed(2)}`} via ${method === "paypal" ? "PayPal" : "Bank Transfer"}`}
              </button>
            )}
          </div>

          {/* Transaction history */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Transaction History</h2>
            {wallet?.transactions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Coins className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No transactions yet. Go live to start earning coins!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wallet?.transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-card/30 border border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <Coins className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Tip from {tx.from}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-yellow-500">+{tx.coins} coins</p>
                      <p className="text-xs text-muted-foreground">R{coinToZar(tx.coins || 0)} · ${coinToUsd(tx.coins || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payout info */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Artists receive <strong className="text-foreground">70%</strong> of every coin tip. 1 coin ≈ R{COIN_TO_ZAR} to the artist.</p>
            <p>Payouts processed within 3–5 business days. R{MIN_PAYOUT_ZAR} minimum.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
