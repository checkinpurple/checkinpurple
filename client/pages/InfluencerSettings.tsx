import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, TrendingUp, Users, DollarSign, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import AppSidebar from "@/components/AppSidebar";

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Twitter/X", "Facebook", "Twitch", "Snapchat", "Threads"] as const;

export default function InfluencerSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [reach, setReach] = useState<number>(0);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [rateZar, setRateZar] = useState<number>(0);
  const [bio, setBio] = useState("");
  const [niches, setNiches] = useState("");

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    if (!user.profiles?.includes("influencer") && user.role !== "influencer" && user.role !== "admin") {
      navigate("/dashboard"); return;
    }
    (async () => {
      const { data } = await supabase
        .from("users")
        .select("influencer_reach, influencer_platforms, influencer_rate_zar, influencer_bio, influencer_niches")
        .eq("id", user.id)
        .single();
      if (data) {
        setReach(data.influencer_reach || 0);
        setPlatforms(data.influencer_platforms || []);
        setRateZar(data.influencer_rate_zar || 0);
        setBio(data.influencer_bio || "");
        setNiches((data.influencer_niches || []).join(", "));
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setMsg(null);
    const nicheList = niches.split(",").map(s => s.trim()).filter(Boolean);
    const { error } = await supabase
      .from("users")
      .update({
        influencer_reach: Number(reach) || 0,
        influencer_platforms: platforms,
        influencer_rate_zar: Number(rateZar) || 0,
        influencer_bio: bio || null,
        influencer_niches: nicheList,
      })
      .eq("id", user.id);
    setSaving(false);
    setMsg(error ? `Error: ${error.message}` : "Saved ✓");
    setTimeout(() => setMsg(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0 p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Influencer Settings</h1>
          <p className="text-sm text-muted-foreground">These details appear on your public profile and to artists proposing deals.</p>
        </div>

        <section className="rounded-xl border border-border/40 p-5 space-y-4 bg-card/30">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Total reach</h2>
          <p className="text-xs text-muted-foreground">Combined followers across all your platforms.</p>
          <input
            type="number" min={0} value={reach}
            onChange={e => setReach(Number(e.target.value))}
            placeholder="e.g. 25000"
            className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </section>

        <section className="rounded-xl border border-border/40 p-5 space-y-3 bg-card/30">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Platforms</h2>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  platforms.includes(p)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border/40 p-5 space-y-3 bg-card/30">
          <h2 className="text-sm font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Promotion rate (ZAR)</h2>
          <p className="text-xs text-muted-foreground">Your standard fee per promotion. Artists see this when proposing deals.</p>
          <input
            type="number" min={0} value={rateZar}
            onChange={e => setRateZar(Number(e.target.value))}
            placeholder="e.g. 1500"
            className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </section>

        <section className="rounded-xl border border-border/40 p-5 space-y-3 bg-card/30">
          <h2 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Niches</h2>
          <p className="text-xs text-muted-foreground">Comma-separated (e.g. Hip-hop, Afrobeats, Fashion).</p>
          <input
            value={niches}
            onChange={e => setNiches(e.target.value)}
            placeholder="Hip-hop, Fashion, Lifestyle"
            className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </section>

        <section className="rounded-xl border border-border/40 p-5 space-y-3 bg-card/30">
          <h2 className="text-sm font-semibold">Bio</h2>
          <textarea
            rows={4} value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="What kind of promotions you do, audience demographics, etc."
            className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </section>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save settings"}
          </button>
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
        </div>
      </main>
    </div>
  );
}
