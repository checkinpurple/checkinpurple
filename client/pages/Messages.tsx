import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LifeBuoy, MessageCircle, Send, ShieldAlert, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AppSidebar from "@/components/AppSidebar";

interface MessageItem {
  id: string;
  sender: "me" | "them" | "admin";
  text: string;
  createdAt: string;
}

interface ThreadItem {
  id: string;
  title: string;
  subtitle: string;
  kind: "admin" | "direct";
  messages: MessageItem[];
}

const seedThreads = (username: string): ThreadItem[] => [
  {
    id: "admin-support",
    title: "CheckinPurple Admin",
    subtitle: "Get help with your account, payments, bookings, or safety issues.",
    kind: "admin",
    messages: [
      {
        id: "welcome-admin",
        sender: "admin",
        text: `Hi ${username}, message admin here when you need help.`,
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const storageKey = user ? `checkinpurple_messages_${user.id}` : "checkinpurple_messages_guest";
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [activeId, setActiveId] = useState("admin-support");
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!user) return;
    const saved = window.localStorage.getItem(storageKey);
    setThreads(saved ? JSON.parse(saved) : seedThreads(user.username || "there"));
  }, [storageKey, user]);

  useEffect(() => {
    if (!user || threads.length === 0) return;
    window.localStorage.setItem(storageKey, JSON.stringify(threads));
  }, [storageKey, threads, user]);

  const activeThread = useMemo(
    () => threads.find(thread => thread.id === activeId) || threads[0],
    [activeId, threads],
  );

  const sendMessage = () => {
    if (!input.trim() || !activeThread) return;
    const message: MessageItem = {
      id: `${Date.now()}`,
      sender: "me",
      text: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setThreads(prev => prev.map(thread => thread.id === activeThread.id ? { ...thread, messages: [...thread.messages, message] } : thread));
    setInput("");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-card/30 to-accent/10 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Messages</h1>
                <p className="text-sm text-muted-foreground">Inbox for support and direct profile conversations.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">This creates the user-facing inbox experience now; messages are saved locally until a production messaging table is connected.</p>
          </div>

          <div className="grid lg:grid-cols-[320px_1fr] gap-4">
            <aside className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
              <div className="p-3 border-b border-border/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Threads</p>
              </div>
              <div className="divide-y divide-border/30">
                {threads.map(thread => (
                  <button
                    key={thread.id}
                    onClick={() => setActiveId(thread.id)}
                    className={`w-full text-left p-4 transition-colors ${activeThread?.id === thread.id ? "bg-primary/10" : "hover:bg-card/50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${thread.kind === "admin" ? "bg-red-500/10 text-red-400" : "bg-primary/10 text-primary"}`}>
                        {thread.kind === "admin" ? <ShieldAlert className="w-4 h-4" /> : <UserRound className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{thread.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{thread.subtitle}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <section className="rounded-2xl border border-border/40 bg-card/20 overflow-hidden min-h-[560px] flex flex-col">
              {activeThread ? (
                <>
                  <div className="p-4 border-b border-border/40 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-bold">{activeThread.title}</h2>
                      <p className="text-xs text-muted-foreground">{activeThread.subtitle}</p>
                    </div>
                    {activeThread.kind === "admin" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 text-xs font-semibold">
                        <LifeBuoy className="w-3.5 h-3.5" /> Support
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeThread.messages.map(message => (
                      <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${message.sender === "me" ? "bg-primary text-primary-foreground" : "bg-card border border-border/40"}`}>
                          <p>{message.text}</p>
                          <p className={`text-[10px] mt-1 ${message.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {new Date(message.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-border/40 flex gap-2">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                      placeholder={activeThread.kind === "admin" ? "Message admin..." : "Write a message..."}
                      className="flex-1 bg-input border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button onClick={sendMessage} className="px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 flex items-center gap-2">
                      <Send className="w-4 h-4" /> Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No thread selected.</div>
              )}
            </section>
          </div>

          <div className="text-xs text-muted-foreground">
            Want to message a creator? Visit their public profile from the <Link to="/wall" className="text-primary underline">Wall</Link> and use the profile actions.
          </div>
        </div>
      </main>
    </div>
  );
}
