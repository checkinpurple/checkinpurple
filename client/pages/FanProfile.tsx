import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import FanStatus from "@/components/FanStatus";

interface FanUser {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
}

interface FollowRow {
  followed_id: string;
}

interface ArtistMini {
  id: string;
  username: string;
}

export default function FanProfile() {
  const { username } = useParams<{ username: string }>();
  const [fan, setFan] = useState<FanUser | null>(null);
  const [artists, setArtists] = useState<ArtistMini[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!username) return;
      try {
        const { data: fanData } = await supabase
          .from("users")
          .select("id, username, avatar_url, bio")
          .eq("username", username)
          .single();

        if (!fanData) {
          setFan(null);
          return;
        }

        setFan(fanData as FanUser);

        const { data: followRows } = await supabase
          .from("follows")
          .select("followed_id")
          .eq("follower_id", fanData.id);

        const artistIds = (followRows as FollowRow[] | null)?.map((f) => f.followed_id) || [];
        if (artistIds.length === 0) {
          setArtists([]);
          return;
        }

        const { data: artistRows } = await supabase
          .from("users")
          .select("id, username")
          .in("id", artistIds)
          .in("role", ["artist", "artist_fan"]);

        setArtists((artistRows as ArtistMini[] | null) || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [username]);

  if (loading) return <div className="min-h-screen bg-background p-6">Loading...</div>;
  if (!fan) return <div className="min-h-screen bg-background p-6">Fan profile not found.</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center font-bold">
            {fan.avatar_url ? <img src={fan.avatar_url} alt={fan.username} className="w-full h-full object-cover" /> : fan.username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">@{fan.username}</h1>
            {fan.bio && <p className="text-sm text-muted-foreground">{fan.bio}</p>}
          </div>
        </div>

        <FanStatus userId={fan.id} />

        <div className="rounded-xl border border-border/40 p-4">
          <h2 className="font-semibold mb-2">Artists followed</h2>
          {artists.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not following any artists yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {artists.map((artist) => (
                <Link key={artist.id} to={`/artist/${artist.username}`} className="text-sm px-3 py-1 rounded-full border border-border/40 hover:bg-card">
                  @{artist.username}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
