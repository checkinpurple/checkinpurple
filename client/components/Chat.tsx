import { useState, useEffect, useRef } from "react";
import { Coins, Send, Smile } from "lucide-react";

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  coinTip?: number;
  isHighlighted?: boolean;
  isArtist?: boolean;
  createdAt: string;
}

interface ChatProps {
  streamId: string;
  userId?: string;
  username?: string;
  userRole?: string;
  userCoins?: number;
  onTip?: (amount: number) => void;
}

const TIP_AMOUNTS = [10, 25, 50, 100, 250];

const EMOJI_LIST = ["🔥", "❤️", "🎵", "👏", "💯", "🙌", "🎶", "⭐", "🎤", "💪"];

export default function Chat({ streamId, userId, username, userRole, userCoins = 0, onTip }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [tipAmount, setTipAmount] = useState<number | null>(null);
  const [showTipPanel, setShowTipPanel] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchMessages();
    // Poll every 3 seconds for new messages
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [streamId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/social/comments?streamId=${streamId}`);
      const data = await response.json();
      if (data.success && data.comments) {
        const mapped: ChatMessage[] = data.comments.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          username: c.username || "User",
          message: c.content,
          coinTip: c.coin_tip,
          isHighlighted: c.coin_tip > 0,
          isArtist: c.is_artist,
          createdAt: c.created_at,
        }));
        setMessages(mapped);
      }
    } catch {
      // silently fail — show cached messages
    }
  };

  const sendMessage = async (withTip = false) => {
    if (!input.trim() && !withTip) return;
    if (!userId) { setError("Sign in to chat"); return; }
    if (withTip && tipAmount && userCoins < tipAmount) {
      setError("Not enough coins");
      return;
    }

    setSending(true);
    setError("");

    const finalMessage = input.trim() || (tipAmount ? `Sent ${tipAmount} coins! 🎵` : "");

    try {
      const response = await fetch("/api/social/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userId}`,
        },
        body: JSON.stringify({
          streamId,
          content: finalMessage,
          coinTip: withTip ? tipAmount : 0,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send");

      // Optimistic update
      const newMsg: ChatMessage = {
        id: data.comment?.id || Date.now().toString(),
        userId: userId,
        username: username || "You",
        message: finalMessage,
        coinTip: withTip ? tipAmount ?? 0 : 0,
        isHighlighted: withTip && !!tipAmount,
        isArtist: userRole === "artist" || userRole === "artist_fan",
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, newMsg]);
      setInput("");

      if (withTip && tipAmount && onTip) {
        onTip(tipAmount);
      }

      setShowTipPanel(false);
      setTipAmount(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-ZA", {
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border/40 bg-card/20 overflow-hidden" style={{ height: 480 }}>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-10">
            No messages yet. Be the first to say something!
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 ${
              msg.isHighlighted
                ? "p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
                : ""
            }`}
          >
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              msg.isArtist ? "bg-primary text-primary-foreground" : "bg-card/60 text-foreground"
            }`}>
              {msg.username.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold ${msg.isArtist ? "text-primary" : "text-foreground"}`}>
                  {msg.username}
                  {msg.isArtist && (
                    <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">🎤 Artist</span>
                  )}
                </span>
                {msg.coinTip && msg.coinTip > 0 && (
                  <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-semibold">
                    <Coins className="w-3 h-3" /> {msg.coinTip} coins
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">{formatTime(msg.createdAt)}</span>
              </div>
              <p className="text-sm text-muted-foreground break-words mt-0.5">{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Tip panel */}
      {showTipPanel && (
        <div className="px-4 py-3 border-t border-border/40 bg-card/30">
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Coins className="w-3 h-3 text-yellow-500" />
            Select tip amount — you have {userCoins} coins
          </p>
          <div className="flex gap-2 flex-wrap">
            {TIP_AMOUNTS.map(amount => (
              <button
                key={amount}
                onClick={() => setTipAmount(amount === tipAmount ? null : amount)}
                disabled={userCoins < amount}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-30 ${
                  tipAmount === amount
                    ? "border-yellow-500 bg-yellow-500/20 text-yellow-500"
                    : "border-border/40 text-muted-foreground hover:border-yellow-500/40 hover:text-yellow-500"
                }`}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji panel */}
      {showEmoji && (
        <div className="px-4 py-2 border-t border-border/40 bg-card/30 flex gap-2 flex-wrap">
          {EMOJI_LIST.map(emoji => (
            <button
              key={emoji}
              onClick={() => { setInput(prev => prev + emoji); setShowEmoji(false); }}
              className="text-lg hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/30 text-destructive text-xs">
          {error}
        </div>
      )}

      {/* Input bar */}
      <div className="p-3 border-t border-border/40 bg-card/30">
        <div className="flex items-center gap-2">
          {/* Emoji button */}
          <button
            onClick={() => { setShowEmoji(p => !p); setShowTipPanel(false); }}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Input */}
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={userId ? "Say something..." : "Sign in to chat"}
            disabled={!userId || sending}
            maxLength={200}
            className="flex-1 bg-input text-foreground rounded-lg px-3 py-2 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />

          {/* Coin tip button */}
          {userId && (userRole === "fan" || userRole === "artist_fan") && (
            <button
              onClick={() => { setShowTipPanel(p => !p); setShowEmoji(false); }}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                showTipPanel
                  ? "bg-yellow-500/20 text-yellow-500"
                  : "text-muted-foreground hover:text-yellow-500"
              }`}
              title="Send coins"
            >
              <Coins className="w-5 h-5" />
            </button>
          )}

          {/* Send button */}
          <button
            onClick={() => showTipPanel && tipAmount ? sendMessage(true) : sendMessage(false)}
            disabled={sending || (!input.trim() && !(showTipPanel && tipAmount))}
            className={`p-2 rounded-lg transition-all flex-shrink-0 disabled:opacity-40 ${
              showTipPanel && tipAmount
                ? "bg-yellow-500 text-black hover:opacity-90"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Tip summary under input */}
        {showTipPanel && tipAmount && (
          <p className="text-xs text-yellow-500 mt-1 ml-10">
            Will send {tipAmount} coins with your message
          </p>
        )}
      </div>
    </div>
  );
}
