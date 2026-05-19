import { useState, useRef } from "react";
import { Camera, Check, X, MapPin, Globe, Edit3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Logo from "@/components/Logo";

interface ProfileCardProps {
  editable?: boolean;
  userId?: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  role?: string;
  isVerified?: boolean;
  followerCount?: number;
  followingCount?: number;
  onUpdate?: (data: Partial<ProfileData>) => void;
}

interface ProfileData {
  avatar_url: string;
  bio: string;
  location: string;
  website: string;
}

const ROLE_COLORS: Record<string, string> = {
  fan: "bg-accent/10 text-accent border-accent/20",
  artist: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  influencer: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  merchant: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  artist_fan: "bg-primary/10 text-primary border-primary/20",
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
};

const ROLE_LABELS: Record<string, string> = {
  fan: "Listener",
  artist: "Artist",
  influencer: "Influencer",
  merchant: "Merchant",
  artist_fan: "Artist + Fan",
  admin: "Admin",
};

export default function ProfileCard({
  editable = false,
  userId,
  username,
  avatarUrl,
  bio,
  location,
  website,
  role = "fan",
  isVerified,
  followerCount = 0,
  followingCount = 0,
  onUpdate,
}: ProfileCardProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    bio: bio || "",
    location: location || "",
    website: website || "",
  });
  const [error, setError] = useState("");

  const displayAvatar = previewUrl || avatarUrl;
  const initials = (username || "U").slice(0, 2).toUpperCase();

  const handleAvatarClick = () => {
    if (editable) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Preview
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // Update user record
      await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", user.id);
      onUpdate?.({ avatar_url: publicUrl });
    } catch (err) {
      setError("Failed to upload image");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          bio: form.bio,
          location: form.location,
          website: form.website,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;
      onUpdate?.(form);
      setEditing(false);
    } catch (err) {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const badgeColor = ROLE_COLORS[role] || ROLE_COLORS.fan;
  const roleLabel = ROLE_LABELS[role] || role;

  return (
    <div className="glass rounded-2xl p-6">
      {/* Avatar + name row */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <button
            onClick={handleAvatarClick}
            disabled={!editable || uploading}
            className={`w-20 h-20 rounded-2xl overflow-hidden border-2 border-border/40 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 ${
              editable ? "cursor-pointer hover:opacity-80 transition-opacity" : "cursor-default"
            }`}
          >
            {displayAvatar ? (
              <img src={displayAvatar} alt={username} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <Logo compact className="w-full h-full" />
              </div>
            )}
          </button>
          {editable && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              {uploading
                ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-3 h-3 text-primary-foreground" />
              }
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold truncate">@{username}</h3>
            {isVerified && (
              <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0" title="Verified">
                <Check className="w-3 h-3 text-primary-foreground" />
              </span>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${badgeColor}`}>
            {roleLabel}
          </span>

          {/* Stats */}
          <div className="flex gap-4 mt-2 text-sm">
            <span><strong>{followerCount}</strong> <span className="text-muted-foreground">followers</span></span>
            <span><strong>{followingCount}</strong> <span className="text-muted-foreground">following</span></span>
          </div>
        </div>

        {/* Edit button */}
        {editable && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Bio / edit form */}
      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Tell people about yourself..."
              maxLength={160}
              rows={3}
              className="w-full bg-input text-foreground rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{form.bio.length}/160</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Location</label>
              <input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Soweto, ZA"
                className="w-full bg-input text-foreground rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Website</label>
              <input
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://yoursite.com"
                className="w-full bg-input text-foreground rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              <Check className="w-3 h-3" />{saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-4 py-2 border border-border/40 rounded-lg text-sm font-semibold hover:bg-card/40">
              <X className="w-3 h-3" />Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {(bio || form.bio) && (
            <p className="text-sm text-muted-foreground leading-relaxed">{bio || form.bio}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {(location || form.location) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{location || form.location}
              </span>
            )}
            {(website || form.website) && (
              <a href={website || form.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Globe className="w-3 h-3" />{(website || form.website).replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
