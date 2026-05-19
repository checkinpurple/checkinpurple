import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Radio, Users, Coins, Wifi, CreditCard, Shield,
  Search, Ban, CheckCircle, XCircle, LogOut,
  RefreshCw, TrendingUp, AlertTriangle, ArrowLeft,
  Music, Calendar, Play, UserCheck, BarChart2,
  Activity, DollarSign, Headphones
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Logo from "@/components/Logo";

const ADMIN_EMAIL = "wnmnyayi@gmail.com";
type Tab = "overview" | "users" | "submissions" | "parties" | "streams" | "transactions" | "payouts" | "moderation";

export default function Admin() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [playlist, setPlaylist] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalUsers: 0, activeStreams: 0, totalCoins: 0,
    pendingPayouts: 0, openReports: 0, revenue: 0,
    pendingSubmissions: 0, upcomingParties: 0,
    totalRSVPs: 0, approvedTracks: 0,
  });

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    if (user.email !== ADMIN_EMAIL && user.role !== "admin") { navigate("/dashboard"); return; }
    loadAll();
  }, [user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([loadUsers(), loadStreams(), loadTransactions(), loadPayouts(), loadSubmissions(), loadParties()]);
    setLoading(false);
  }, [user]);

  const refresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const fetchJSON = async (url: string) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${user?.id}` } });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: text || "Invalid JSON response" };
    }
  };

  const loadUsers = async () => {
    try {
      const d = await fetchJSON("/api/admin/users");
      setUsers(d.users || []);
      setStats(s => ({ ...s, totalUsers: d.users?.length || 0 }));
    } catch { setUsers([{ id: user?.id, email: user?.email, username: user?.username, role: "admin", created_at: new Date().toISOString() }]); }
  };

  const loadStreams = async () => {
    try {
      const d = await fetchJSON("/api/streams");
      setStreams(d.streams || []);
      setStats(s => ({ ...s, activeStreams: d.streams?.length || 0 }));
    } catch { setStreams([]); }
  };

  const loadTransactions = async () => {
    try {
      const d = await fetchJSON("/api/coins/tips");
      const list = d.tips || [];
      setTransactions(list);
      const total = list.reduce((s: number, t: any) => s + (t.amount || 0), 0);
      setStats(s => ({ ...s, totalCoins: total, revenue: Math.ceil(total * 0.3) }));
    } catch { setTransactions([]); }
  };

  const loadPayouts = async () => {
    try {
      const d = await fetchJSON("/api/payments/methods");
      const list = d.methods || [];
      setPayouts(list);
      setStats(s => ({ ...s, pendingPayouts: list.filter((p: any) => p.status === "pending").length }));
    } catch { setPayouts([]); }
  };

  const loadSubmissions = async () => {
    try {
      const d = await fetchJSON("/api/admin/submissions");
      const list = d.submissions || [];
      setSubmissions(list);
      setPlaylist(list.filter((s: any) => s.status === "approved"));
      setStats(s => ({
        ...s,
        pendingSubmissions: list.filter((x: any) => x.status === "pending").length,
        approvedTracks: list.filter((x: any) => x.status === "approved").length,
      }));
    } catch { setSubmissions([]); }
  };

  const loadParties = async () => {
    try {
      const d = await fetchJSON("/api/parties");
      const list = d.parties || [];
      setParties(list);
      const totalRSVPs = list.reduce((s: number, p: any) => s + (p.rsvp_count || 0), 0);
      setStats(s => ({
        ...s,
        upcomingParties: list.filter((p: any) => p.status === "upcoming").length,
        totalRSVPs,
      }));
    } catch { setParties([]); }
  };

  const reviewSubmission = async (id: string, approved: boolean, note = "") => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({ status: approved ? "approved" : "rejected", adminNote: note }),
      });
      setSubmissions(p => p.map(s => s.id === id ? { ...s, status: approved ? "approved" : "rejected" } : s));
      if (approved) {
        setStats(s => ({ ...s, pendingSubmissions: Math.max(0, s.pendingSubmissions - 1), approvedTracks: s.approvedTracks + 1 }));
      }
    } finally { setActionLoading(null); }
  };

  const updateRole = async (userId: string, role: string) => {
    setActionLoading(userId);
    try {
      await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({ role }),
      });
      setUsers(p => p.map(u => u.id === userId ? { ...u, role } : u));
    } finally { setActionLoading(null); }
  };

  const toggleBan = async (u: any) => {
    setActionLoading(u.id);
    try {
      await fetch(`/api/admin/users/${u.id}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({ banned: !u.is_banned }),
      });
      setUsers(p => p.map(x => x.id === u.id ? { ...x, is_banned: !u.is_banned } : x));
    } finally { setActionLoading(null); }
  };

  const killStream = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/streams/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${user?.id}` } });
      setStreams(p => p.filter(s => s.id !== id));
    } finally { setActionLoading(null); }
  };

  const processPayout = async (id: string, approved: boolean) => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/payouts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({ approved }),
      });
      setPayouts(p => p.map(x => x.id === id ? { ...x, status: approved ? "approved" : "rejected" } : x));
    } finally { setActionLoading(null); }
  };

  const cancelParty = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/parties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({ status: "cancelled" }),
      });
      setParties(p => p.map(x => x.id === id ? { ...x, status: "cancelled" } : x));
    } finally { setActionLoading(null); }
  };

  const handleLogout = async () => { await signOut(); navigate("/"); };
  const fmt = (d: string) => d ? new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "submissions", label: "Submissions", badge: stats.pendingSubmissions },
    { id: "parties", label: "Parties", badge: stats.upcomingParties },
    { id: "users", label: "Users", badge: stats.totalUsers },
    { id: "streams", label: "Live Streams", badge: stats.activeStreams },
    { id: "transactions", label: "Transactions" },
    { id: "payouts", label: "Payouts", badge: stats.pendingPayouts },
    { id: "moderation", label: "Moderation" },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="fixed top-0 w-full z-40 border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Logo compact />
            </div>
            <Logo className="text-sm sm:text-base" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold tracking-wider">ADMIN</span>
            <button onClick={refresh} disabled={refreshing} className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />Dashboard
            </Link>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          <div className="mb-6 grid gap-4 sm:grid-cols-[auto_1fr] items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Logo compact />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">Admin Control Panel</h1>
                <p className="text-muted-foreground text-sm">{user.email} · CheckinPurple Platform</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 justify-start sm:justify-end">
              <span className="px-3 py-2 rounded-2xl bg-primary/10 text-primary text-xs font-semibold">Admin Mode</span>
              <span className="px-3 py-2 rounded-2xl bg-emerald-500/10 text-emerald-500 text-xs font-semibold">{stats.totalUsers} users</span>
              <span className="px-3 py-2 rounded-2xl bg-yellow-500/10 text-yellow-500 text-xs font-semibold">{stats.pendingSubmissions} pending songs</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all border ${tab === t.id ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground bg-card/20"}`}>
                {t.label}
                {!!t.badge && t.badge > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-red-500/20 text-red-400"}`}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading platform data...</p>
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {tab === "overview" && (
                <div className="space-y-6">
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[
                      { label: "Total Users", value: stats.totalUsers, icon: <Users className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10" },
                      { label: "Live Streams", value: stats.activeStreams, icon: <Activity className="w-5 h-5" />, color: "text-red-500", bg: "bg-red-500/10" },
                      { label: "Coins Circulating", value: stats.totalCoins.toLocaleString(), icon: <Coins className="w-5 h-5" />, color: "text-yellow-500", bg: "bg-yellow-500/10" },
                      { label: "Platform Revenue", value: `${stats.revenue.toLocaleString()} coins`, icon: <DollarSign className="w-5 h-5" />, color: "text-green-500", bg: "bg-green-500/10" },
                      { label: "Pending Payouts", value: stats.pendingPayouts, icon: <CreditCard className="w-5 h-5" />, color: "text-orange-500", bg: "bg-orange-500/10" },
                    ].map(s => (
                      <div key={s.label} className="glass rounded-2xl p-5">
                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
                        <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Music stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Pending Submissions", value: stats.pendingSubmissions, color: "text-yellow-500" },
                      { label: "Approved Tracks", value: stats.approvedTracks, color: "text-green-500" },
                      { label: "Upcoming Parties", value: stats.upcomingParties, color: "text-primary" },
                      { label: "Total RSVPs", value: stats.totalRSVPs, color: "text-accent" },
                    ].map(s => (
                      <div key={s.label} className="glass rounded-xl p-4">
                        <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent activity */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="glass rounded-2xl p-5">
                      <h3 className="font-bold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Recent Users</h3>
                      {users.slice(0, 5).map(u => (
                        <div key={u.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{u.username?.charAt(0).toUpperCase()}</div>
                            <div>
                              <p className="text-sm font-semibold">@{u.username}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                          <span className="text-xs bg-card/60 px-2 py-0.5 rounded-full capitalize">{u.role}</span>
                        </div>
                      ))}
                    </div>

                    <div className="glass rounded-2xl p-5">
                      <h3 className="font-bold mb-4 flex items-center gap-2"><Music className="w-4 h-4 text-primary" />Pending Submissions</h3>
                      {submissions.filter(s => s.status === "pending").slice(0, 5).map(s => (
                        <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                          <div>
                            <p className="text-sm font-semibold">{s.title}</p>
                            <p className="text-xs text-muted-foreground">@{s.artist_username} · {s.genre}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => reviewSubmission(s.id, true)} disabled={actionLoading === s.id} className="px-2 py-1 text-xs bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 font-semibold">✓</button>
                            <button onClick={() => reviewSubmission(s.id, false)} disabled={actionLoading === s.id} className="px-2 py-1 text-xs bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 font-semibold">✕</button>
                          </div>
                        </div>
                      ))}
                      {submissions.filter(s => s.status === "pending").length === 0 && (
                        <p className="text-muted-foreground text-sm py-4 text-center">No pending submissions</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBMISSIONS TAB */}
              {tab === "submissions" && (
                <div className="space-y-4">
                  {/* Approved playlist */}
                  {playlist.length > 0 && (
                    <div className="glass rounded-2xl p-5">
                      <h3 className="font-bold mb-3 flex items-center gap-2"><Headphones className="w-5 h-5 text-primary" />Admin Playlist ({playlist.length} tracks)</h3>
                      <div className="space-y-2">
                        {playlist.map((t, i) => (
                          <div key={t.id} className="flex items-center gap-3 p-2 bg-card/30 rounded-lg">
                            <span className="text-xs text-muted-foreground w-5 text-center">{i + 1}</span>
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <Music className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{t.title}</p>
                              <p className="text-xs text-muted-foreground">@{t.artist_username} · {t.genre}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{t.play_count || 0} plays</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All submissions table */}
                  <div className="glass rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-border/40 flex items-center justify-between">
                      <h3 className="font-bold">All Submissions</h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="bg-input text-foreground rounded-lg pl-8 pr-3 py-1.5 border border-border/40 focus:outline-none text-xs w-40" />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-card/40">
                          <tr>{["Artist", "Title", "Genre", "Fee", "Status", "Submitted", "Actions"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {submissions
                            .filter(s => !search || s.artist_username?.toLowerCase().includes(search.toLowerCase()) || s.title?.toLowerCase().includes(search.toLowerCase()))
                            .map(s => (
                              <tr key={s.id} className="border-t border-border/20 hover:bg-card/20">
                                <td className="px-4 py-3 font-semibold">@{s.artist_username}</td>
                                <td className="px-4 py-3">{s.title}</td>
                                <td className="px-4 py-3 text-muted-foreground">{s.genre}</td>
                                <td className="px-4 py-3 text-yellow-500 font-semibold">{s.fee_paid} coins</td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                    s.status === "pending" ? "bg-yellow-500/10 text-yellow-500"
                                    : s.status === "approved" ? "bg-green-500/10 text-green-500"
                                    : s.status === "playing" ? "bg-primary/10 text-primary"
                                    : "bg-red-500/10 text-red-500"
                                  }`}>{s.status}</span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground text-xs">{fmt(s.submitted_at)}</td>
                                <td className="px-4 py-3">
                                  {s.status === "pending" && (
                                    <div className="flex gap-1">
                                      <button onClick={() => reviewSubmission(s.id, true)} disabled={actionLoading === s.id} className="flex items-center gap-1 px-2 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-xs font-semibold hover:bg-green-500/20">
                                        <CheckCircle className="w-3 h-3" />Approve
                                      </button>
                                      <button onClick={() => reviewSubmission(s.id, false)} disabled={actionLoading === s.id} className="flex items-center gap-1 px-2 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-500/20">
                                        <XCircle className="w-3 h-3" />Reject
                                      </button>
                                    </div>
                                  )}
                                  {s.track_url && (
                                    <a href={s.track_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1.5 text-xs text-primary hover:underline mt-1">
                                      <Play className="w-3 h-3" />Preview
                                    </a>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {submissions.length === 0 && <div className="text-center py-12 text-muted-foreground">No submissions yet</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* PARTIES TAB */}
              {tab === "parties" && (
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-card/40">
                        <tr>{["Title", "Host", "Scheduled", "RSVPs", "Status", "Exclusive", "Actions"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {parties.map(p => (
                          <tr key={p.id} className="border-t border-border/20 hover:bg-card/20">
                            <td className="px-4 py-3 font-semibold">{p.title}</td>
                            <td className="px-4 py-3 text-muted-foreground">@{p.host_username}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(p.scheduled_for)}</td>
                            <td className="px-4 py-3 font-semibold">{p.rsvp_count}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                p.status === "live" ? "bg-red-500/10 text-red-500"
                                : p.status === "upcoming" ? "bg-primary/10 text-primary"
                                : p.status === "ended" ? "bg-green-500/10 text-green-500"
                                : "bg-border/40 text-muted-foreground"
                              }`}>{p.status}</span>
                            </td>
                            <td className="px-4 py-3 text-xs">{p.is_exclusive ? "🔒 Yes" : "Public"}</td>
                            <td className="px-4 py-3">
                              {p.status !== "cancelled" && p.status !== "ended" && (
                                <button onClick={() => cancelParty(p.id)} disabled={actionLoading === p.id} className="flex items-center gap-1 px-2 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-500/20">
                                  <XCircle className="w-3 h-3" />Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parties.length === 0 && <div className="text-center py-12 text-muted-foreground">No listening parties yet</div>}
                  </div>
                </div>
              )}

              {/* USERS TAB */}
              {tab === "users" && (
                <div>
                  <div className="relative mb-4 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-full bg-input text-foreground rounded-lg pl-9 pr-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                  </div>
                  <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-card/40">
                          <tr>{["User", "Email", "Role", "Status", "Joined", "Actions"].map(h => (
                            <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {users.filter(u => !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())).map(u => (
                            <tr key={u.id} className={`border-t border-border/20 hover:bg-card/20 ${u.is_banned ? "opacity-50" : ""}`}>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{u.username?.charAt(0).toUpperCase()}</div>
                                  <span className="font-semibold">@{u.username}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-muted-foreground text-xs">{u.email}</td>
                              <td className="px-5 py-3">
                                <select value={u.role || "fan"} onChange={e => updateRole(u.id, e.target.value)} disabled={actionLoading === u.id || u.email === ADMIN_EMAIL} className="bg-input border border-border/40 rounded-lg px-2 py-1 text-xs focus:outline-none capitalize disabled:opacity-50">
                                  {["fan", "artist", "influencer", "merchant", "artist_fan", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                              </td>
                              <td className="px-5 py-3">
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${u.is_banned ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                                  {u.is_banned ? "Banned" : "Active"}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-muted-foreground text-xs">{fmt(u.created_at)}</td>
                              <td className="px-5 py-3">
                                {u.email !== ADMIN_EMAIL && (
                                  <button onClick={() => toggleBan(u)} disabled={actionLoading === u.id} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${u.is_banned ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-red-500/10 text-red-500 hover:bg-red-500/20"}`}>
                                    {u.is_banned ? <><UserCheck className="w-3 h-3" />Unban</> : <><Ban className="w-3 h-3" />Ban</>}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {users.length === 0 && <div className="text-center py-12 text-muted-foreground">No users found</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* STREAMS TAB */}
              {tab === "streams" && (
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-card/40">
                        <tr>{["Title", "Artist", "Genre", "Listeners", "Started", "Actions"].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {streams.map(s => (
                          <tr key={s.id} className="border-t border-border/20 hover:bg-card/20">
                            <td className="px-5 py-3 font-semibold">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />{s.title}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">@{s.username || "—"}</td>
                            <td className="px-5 py-3 text-muted-foreground">{s.genre || "—"}</td>
                            <td className="px-5 py-3">{s.listener_count || 0}</td>
                            <td className="px-5 py-3 text-xs text-muted-foreground">{fmt(s.started_at)}</td>
                            <td className="px-5 py-3">
                              <button onClick={() => killStream(s.id)} disabled={actionLoading === s.id} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-500/20">
                                <XCircle className="w-3 h-3" />End
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {streams.length === 0 && <div className="text-center py-12 text-muted-foreground">No active streams</div>}
                  </div>
                </div>
              )}

              {/* TRANSACTIONS */}
              {tab === "transactions" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Total Coins Sent", value: stats.totalCoins.toLocaleString(), color: "text-yellow-500" },
                      { label: "Artists Earned (70%)", value: Math.floor(stats.totalCoins * 0.7).toLocaleString(), color: "text-green-500" },
                      { label: "Platform Revenue (30%)", value: stats.revenue.toLocaleString(), color: "text-primary" },
                    ].map(s => (
                      <div key={s.label} className="glass rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-card/40">
                          <tr>{["From", "To", "Coins", "Artist (70%)", "Platform (30%)", "Date"].map(h => (
                            <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {transactions.map((t, i) => (
                            <tr key={t.id || i} className="border-t border-border/20 hover:bg-card/20">
                              <td className="px-5 py-3 font-semibold">@{t.from_username || "fan"}</td>
                              <td className="px-5 py-3">@{t.to_username || "artist"}</td>
                              <td className="px-5 py-3"><span className="flex items-center gap-1 text-yellow-500 font-bold"><Coins className="w-3 h-3" />{t.amount}</span></td>
                              <td className="px-5 py-3 text-green-500 font-semibold">{Math.floor(t.amount * 0.7)}</td>
                              <td className="px-5 py-3 text-primary font-semibold">{Math.ceil(t.amount * 0.3)}</td>
                              <td className="px-5 py-3 text-xs text-muted-foreground">{fmt(t.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {transactions.length === 0 && <div className="text-center py-12 text-muted-foreground">No transactions yet</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* PAYOUTS */}
              {tab === "payouts" && (
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-card/40">
                        <tr>{["Artist", "Amount", "Method", "Details", "Status", "Date", "Actions"].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {payouts.map(p => (
                          <tr key={p.id} className="border-t border-border/20 hover:bg-card/20">
                            <td className="px-5 py-3 font-semibold">@{p.username || "artist"}</td>
                            <td className="px-5 py-3 text-green-500 font-bold">R{p.amount_zar}</td>
                            <td className="px-5 py-3 capitalize text-muted-foreground">{p.method}</td>
                            <td className="px-5 py-3 text-xs text-muted-foreground">{p.method === "paypal" ? p.paypal_email : `${p.bank_name} · ${p.account_number}`}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${p.status === "pending" ? "bg-yellow-500/10 text-yellow-500" : p.status === "approved" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>{p.status}</span>
                            </td>
                            <td className="px-5 py-3 text-xs text-muted-foreground">{fmt(p.created_at)}</td>
                            <td className="px-5 py-3">
                              {(!p.status || p.status === "pending") && (
                                <div className="flex gap-1">
                                  <button onClick={() => processPayout(p.id, true)} disabled={actionLoading === p.id} className="flex items-center gap-1 px-2 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-xs font-semibold hover:bg-green-500/20">
                                    <CheckCircle className="w-3 h-3" />Pay
                                  </button>
                                  <button onClick={() => processPayout(p.id, false)} disabled={actionLoading === p.id} className="flex items-center gap-1 px-2 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-500/20">
                                    <XCircle className="w-3 h-3" />Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {payouts.length === 0 && <div className="text-center py-12 text-muted-foreground">No payout requests</div>}
                  </div>
                </div>
              )}

              {/* MODERATION */}
              {tab === "moderation" && (
                <div className="glass rounded-2xl p-10 text-center">
                  <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">No Reports</h3>
                  <p className="text-muted-foreground text-sm">User reports will appear here. The platform is clean.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
