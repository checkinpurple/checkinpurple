import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, MapPin, MessageCircle, ShoppingBag, Store, UserPlus, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import AppSidebar from "@/components/AppSidebar";
import OGMeta from "@/components/OGMeta";

interface MerchantUser {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  is_verified?: boolean;
}

export default function MerchantProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<MerchantUser | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isOwn = user?.username === username || user?.id === merchant?.id;

  useEffect(() => {
    const fetchMerchant = async () => {
      if (!username) return;
      try {
        const { data } = await supabase
          .from("users")
          .select("id, username, avatar_url, bio, location, website, is_verified")
          .eq("username", username)
          .single();
        setMerchant(data || null);
        if (data) {
          const stats = await fetch(`/api/social/stats?user_id=${data.id}`, {
            headers: user ? { Authorization: `Bearer ${user.id}` } : undefined,
          }).then(response => response.json());
          if (stats.success) {
            setFollowerCount(stats.followerCount ?? 0);
            setIsFollowing(Boolean(stats.isFollowing));
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMerchant();
  }, [username]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;

  const toggleFollow = async () => {
    if (!user) { navigate("/signin"); return; }
    if (!merchant) return;
    const method = isFollowing ? "DELETE" : "POST";
    const response = await fetch("/api/social/follow", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
      body: JSON.stringify({ followed_id: merchant.id }),
    });
    if (!response.ok) return;
    setIsFollowing(value => !value);
    setFollowerCount(count => Math.max(0, count + (isFollowing ? -1 : 1)));
  };

  if (!merchant) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <Store className="w-10 h-10 text-muted-foreground" />
      <p className="text-muted-foreground">Merchant profile not found.</p>
      <Link to="/store" className="text-primary underline text-sm">Browse Store</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {user && <AppSidebar />}
      <OGMeta
        title={`${merchant.username} · Merchant on CheckinPurple`}
        description={merchant.bio || `${merchant.username} sells merch, fashion, services and drops on CheckinPurple.`}
        image={merchant.avatar_url}
        url={`${window.location.origin}/merchant/${merchant.username}`}
        type="profile"
      />
      <main className={`flex-1 ${user ? "lg:ml-56" : ""} pt-${user ? "16 lg:pt-0" : "6"}`}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <section className="rounded-3xl border border-border/40 bg-gradient-to-br from-orange-500/10 via-card/30 to-yellow-500/10 p-5">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                {merchant.avatar_url ? <img src={merchant.avatar_url} alt={merchant.username} className="w-full h-full object-cover" /> : merchant.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{merchant.username}</h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">Merchant</span>
                </div>
                {merchant.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" /> {merchant.location}</p>}
                <p className="text-sm text-muted-foreground mb-4">{merchant.bio || "Merchant profile for merch, fashion, styling, services and creator collaborations."}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span><b className="text-foreground">{followerCount}</b> followers</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isOwn ? (
                    <>
                      <Link to="/merchant" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"><Edit className="w-4 h-4" /> Manage Store</Link>
                      <Link to="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/40 bg-card/40 text-sm font-semibold hover:bg-card/60">Dashboard</Link>
                    </>
                  ) : (
                    <>
                      <Link to="/store" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"><ShoppingBag className="w-4 h-4" /> Shop Drops</Link>
                      <Link to="/messages" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/40 bg-card/40 text-sm font-semibold hover:bg-card/60"><MessageCircle className="w-4 h-4" /> Message</Link>
                      <button onClick={toggleFollow} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/40 bg-card/40 text-sm font-semibold ${isFollowing ? "text-muted-foreground hover:text-foreground" : "text-foreground hover:bg-card/60"}`}>
                        {isFollowing ? <><UserCheck className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/40 bg-card/30 p-5">
            <h2 className="font-bold mb-2">Storefront</h2>
            <p className="text-sm text-muted-foreground mb-4">Public visitors can browse drops and contact this merchant. Owners get management shortcuts instead.</p>
            <Link to={isOwn ? "/merchant" : "/store"} className="inline-flex px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-semibold hover:bg-orange-500/20">
              {isOwn ? "Manage products" : "View products"}
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
