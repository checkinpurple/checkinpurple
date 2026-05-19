import { useState } from "react";
import { Coins, Send, Check, X, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface TransferCoinsProps {
  currentBalance: number;
  onSuccess?: (newBalance: number) => void;
}

export default function TransferCoins({ currentBalance, onSuccess }: TransferCoinsProps) {
  const { user } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [recipientUser, setRecipientUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const searchUser = async () => {
    if (!recipient.trim()) return;
    setSearching(true);
    setError("");
    setRecipientUser(null);

    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(recipient.replace("@", ""))}`, {
        headers: { Authorization: `Bearer ${user?.id}` },
      });
      const data = await res.json();
      const found = (data.users || []).find((u: any) =>
        u.username?.toLowerCase() === recipient.replace("@", "").toLowerCase()
      );
      if (found) {
        setRecipientUser(found);
      } else {
        setError("User not found. Check the username and try again.");
      }
    } catch {
      setError("Could not search for user.");
    } finally {
      setSearching(false);
    }
  };

  const handleTransfer = async () => {
    if (!recipientUser || !amount || !user) return;

    const coins = parseInt(amount);
    if (isNaN(coins) || coins <= 0) { setError("Enter a valid amount"); return; }
    if (coins > currentBalance) { setError("Not enough coins"); return; }
    if (recipientUser.id === user.id) { setError("You can't transfer to yourself"); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/coins/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          toUserId: recipientUser.id,
          toUsername: recipientUser.username,
          amount: coins,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");

      setSuccess(true);
      onSuccess?.(currentBalance - coins);
      setTimeout(() => {
        setSuccess(false);
        setRecipient("");
        setAmount("");
        setNote("");
        setRecipientUser(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-3">
          <Check className="w-7 h-7 text-green-500" />
        </div>
        <p className="font-bold text-green-500 text-lg">Transfer Sent!</p>
        <p className="text-sm text-muted-foreground mt-1">{amount} coins sent to @{recipientUser?.username}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-500" />
          Transfer Coins
        </h3>
        <span className="text-sm text-muted-foreground">Balance: <span className="text-yellow-500 font-bold">{currentBalance}</span></span>
      </div>

      {/* Recipient */}
      <div>
        <label className="text-sm font-medium mb-2 block">Recipient Username</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <input
              value={recipient}
              onChange={e => { setRecipient(e.target.value); setRecipientUser(null); }}
              onKeyDown={e => e.key === "Enter" && searchUser()}
              placeholder="username"
              className="w-full bg-input text-foreground rounded-lg pl-7 pr-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          <button
            onClick={searchUser}
            disabled={searching || !recipient.trim()}
            className="px-4 py-2.5 bg-card/60 border border-border/40 rounded-lg hover:bg-card/80 transition-colors disabled:opacity-50"
          >
            {searching ? <div className="w-4 h-4 border border-foreground border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {/* Found user preview */}
        {recipientUser && (
          <div className="mt-2 flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {recipientUser.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">@{recipientUser.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{recipientUser.role}</p>
            </div>
            <Check className="w-4 h-4 text-green-500 ml-auto" />
          </div>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="text-sm font-medium mb-2 block">Amount</label>
        <div className="relative">
          <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            min="1"
            max={currentBalance}
            className="w-full bg-input text-foreground rounded-lg pl-9 pr-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
        {/* Quick amounts */}
        <div className="flex gap-2 mt-2">
          {[10, 50, 100, 500].map(a => (
            <button
              key={a}
              onClick={() => setAmount(String(Math.min(a, currentBalance)))}
              disabled={currentBalance < a}
              className="px-3 py-1 text-xs font-semibold border border-border/40 rounded-lg hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
            >
              {a}
            </button>
          ))}
          <button
            onClick={() => setAmount(String(currentBalance))}
            className="px-3 py-1 text-xs font-semibold border border-border/40 rounded-lg hover:border-primary/40 hover:text-primary transition-colors"
          >
            Max
          </button>
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="text-sm font-medium mb-2 block">Note (optional)</label>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="What's this for?"
          maxLength={100}
          className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
        />
      </div>

      {error && (
        <p className="text-destructive text-sm flex items-center gap-2">
          <X className="w-4 h-4" />{error}
        </p>
      )}

      <button
        onClick={handleTransfer}
        disabled={loading || !recipientUser || !amount || parseInt(amount) <= 0}
        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        {loading ? "Sending..." : `Transfer ${amount || "0"} coins to @${recipientUser?.username || "..."}`}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Transfers are instant and cannot be reversed.
      </p>
    </div>
  );
}
