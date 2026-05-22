import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TrendingUp, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface InfluencerUser {
  id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  social_instagram?: string;
  social_tiktok?: string;
  social_youtube?: string;
}

export default function InfluencerProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<InfluencerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!username) return;
      try {
        const { data } = await supabase
          .from("users")
          .select("id,username,bio,avatar_url,social_instagram,social_tiktok,social_youtube")
          .eq("username", username)
          .in("role", ["influencer", "admin"])
          .single();
        setProfile((data as InfluencerUser) || null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  if (loading) return <div className="min-h-screen bg-background p-6">Loading...</div>;
  if (!profile) return <div className="min-h-screen bg-background p-6">Influencer not found.</div>;

  const reach = [profile.social_instagram, profile.social_tiktok, profile.social_youtube].filter(Boolean).length * 1000;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-pink-500/20 overflow-hidden flex items-center justify-center font-bold">
            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" /> : profile.username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">@{profile.username}</h1>
            <p className="text-sm text-muted-foreground">Estimated reach: {reach.toLocaleString()} followers</p>
          </div>
        </div>

        {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}

        <div className="rounded-xl border border-border/40 p-4 bg-card/30">
          <p className="text-sm font-semibold mb-2">Platforms</p>
          <div className="flex flex-wrap gap-2">
            {profile.social_instagram && <a href={`https://instagram.com/${profile.social_instagram}`} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 border rounded-full">Instagram</a>}
            {profile.social_tiktok && <a href={`https://tiktok.com/@${profile.social_tiktok}`} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 border rounded-full">TikTok</a>}
            {profile.social_youtube && <a href={`https://youtube.com/${profile.social_youtube}`} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 border rounded-full">YouTube</a>}
          </div>
        </div>

        <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Active promotions</p>
            <p className="text-xs text-muted-foreground">Promotion deals managed on artist pages.</p>
          </div>
          <Link to="/influencer" className="text-xs px-3 py-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Propose Deal <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
