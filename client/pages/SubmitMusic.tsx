import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Radio, Upload, Music, Coins, Check, X, Clock,
  ArrowLeft, Play, Pause, FileAudio, AlertCircle,
  CheckCircle, XCircle, Loader
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

type SubmissionStatus = "pending" | "approved" | "rejected" | "playing";

interface Submission {
  id: string;
  title: string;
  genre: string;
  status: SubmissionStatus;
  fee_paid: number;
  admin_note?: string;
  play_count: number;
  submitted_at: string;
  track_url: string;
  cover_url?: string;
}

const SUBMISSION_FEE = 200;
const GENRES = ["Afrobeats", "Hip Hop", "Jazz", "Electronic", "R&B", "Soul", "Amapiano", "Gqom", "Rock", "Classical", "Other"];

const STATUS_META: Record<SubmissionStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: "Under Review", icon: <Clock className="w-4 h-4" />, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
  approved: { label: "Approved", icon: <CheckCircle className="w-4 h-4" />, color: "text-green-500 bg-green-500/10 border-green-500/20" },
  rejected: { label: "Rejected", icon: <XCircle className="w-4 h-4" />, color: "text-red-500 bg-red-500/10 border-red-500/20" },
  playing: { label: "Now Playing", icon: <Play className="w-4 h-4" />, color: "text-primary bg-primary/10 border-primary/20" },
};

export default function SubmitMusic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const trackInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [coinBalance, setCoinBalance] = useState(0);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [description, setDescription] = useState("");
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [trackPreviewUrl, setTrackPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Preview audio player state
  const [previewDuration, setPreviewDuration] = useState(0);
  const [previewTime, setPreviewTime] = useState(0);

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    if (user.role !== "artist" && user.role !== "artist_fan" && user.role !== "admin") {
      navigate("/dashboard"); return;
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !trackPreviewUrl) return;
    audio.src = trackPreviewUrl;
    const onTime = () => setPreviewTime(audio.currentTime);
    const onDuration = () => setPreviewDuration(audio.duration);
    const onEnded = () => setIsPreviewPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [trackPreviewUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPreviewPlaying) audio.play().catch(console.error);
    else audio.pause();
  }, [isPreviewPlaying]);

  const fetchData = async () => {
    try {
      const [balRes, subRes] = await Promise.all([
        fetch("/api/coins/balance", { headers: { Authorization: `Bearer ${user?.id}` } }),
        fetch("/api/submissions", { headers: { Authorization: `Bearer ${user?.id}` } }),
      ]);
      const [balData, subData] = await Promise.all([balRes.json(), subRes.json()]);
      if (balData.success) setCoinBalance(balData.coins?.balance ?? 0);
      if (subData.success) setSubmissions(subData.submissions || []);
    } catch {} finally { setLoading(false); }
  };

  const handleTrackSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) { setError("Please select an audio file (MP3, WAV, AAC, FLAC)"); return; }
    if (file.size > 50 * 1024 * 1024) { setError("Track must be under 50MB"); return; }
    setTrackFile(file);
    setTrackPreviewUrl(URL.createObjectURL(file));
    setError("");
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image for cover art"); return; }
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user || !trackFile || !title.trim()) {
      setError("Title and track file are required"); return;
    }
    if (coinBalance < SUBMISSION_FEE) {
      setError(`You need ${SUBMISSION_FEE} coins to submit. You have ${coinBalance}.`); return;
    }

    setSubmitting(true);
    setError("");
    setUploadProgress(10);

    try {
      // 1. Upload track to Supabase Storage
      const trackExt = trackFile.name.split(".").pop();
      const trackPath = `tracks/${user.id}/${Date.now()}.${trackExt}`;
      const { error: trackError } = await supabase.storage
        .from("tracks")
        .upload(trackPath, trackFile, { upsert: false });
      if (trackError) throw new Error("Failed to upload track: " + trackError.message);

      setUploadProgress(60);

      const { data: trackUrlData } = supabase.storage.from("tracks").getPublicUrl(trackPath);

      // 2. Upload cover if provided
      let coverPublicUrl = "";
      if (coverFile) {
        const coverExt = coverFile.name.split(".").pop();
        const coverPath = `covers/${user.id}/${Date.now()}.${coverExt}`;
        await supabase.storage.from("tracks").upload(coverPath, coverFile, { upsert: false });
        const { data: coverUrlData } = supabase.storage.from("tracks").getPublicUrl(coverPath);
        coverPublicUrl = coverUrlData.publicUrl;
      }

      setUploadProgress(80);

      // 3. Submit to API (deducts 200 coins, creates submission record)
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.id}` },
        body: JSON.stringify({
          title: title.trim(),
          genre,
          description: description.trim(),
          trackUrl: trackUrlData.publicUrl,
          coverUrl: coverPublicUrl || undefined,
          durationSeconds: Math.round(previewDuration) || undefined,
          feePaid: SUBMISSION_FEE,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setUploadProgress(100);
      setCoinBalance(p => p - SUBMISSION_FEE);
      setSubmissions(p => [data.submission, ...p]);
      setSuccess(true);

      // Reset form
      setTitle(""); setGenre(GENRES[0]); setDescription("");
      setTrackFile(null); setCoverFile(null);
      setTrackPreviewUrl(null); setCoverPreviewUrl(null);
      setIsPreviewPlaying(false);
      setTimeout(() => { setSuccess(false); setUploadProgress(0); }, 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setUploadProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <audio ref={audioRef} preload="metadata" />

      <nav className="fixed top-0 w-full z-40 border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Radio className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">CheckinPurple</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-bold text-yellow-500">{coinBalance}</span>
            </div>
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
              <ArrowLeft className="w-4 h-4" />Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">

          <div>
            <h1 className="text-3xl font-bold mb-1">Submit to Admin Playlist</h1>
            <p className="text-muted-foreground">Submit your track for review. Approved tracks get played on the CheckinPurple official stream.</p>
          </div>

          {/* Fee notice */}
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-500">Submission Fee: {SUBMISSION_FEE} coins</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {SUBMISSION_FEE} coins will be deducted from your balance when you submit.
                Your current balance: <span className="font-bold text-foreground">{coinBalance} coins</span>.
                {coinBalance < SUBMISSION_FEE && (
                  <span className="text-red-400 ml-1">You need {SUBMISSION_FEE - coinBalance} more coins. <Link to="/buy-coins" className="underline">Buy coins →</Link></span>
                )}
              </p>
            </div>
          </div>

          {/* Success message */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-bold text-green-500">Track submitted successfully!</p>
                <p className="text-sm text-muted-foreground">Your track is under review. You'll be notified when it's approved.</p>
              </div>
            </div>
          )}

          {/* Submission form */}
          <div className="glass rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-lg">Track Details</h2>

            {/* Track upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Audio File * (MP3, WAV, AAC, FLAC — max 50MB)</label>
              {trackFile ? (
                <div className="p-4 bg-card/40 rounded-xl border border-border/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <FileAudio className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{trackFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(trackFile.size / 1024 / 1024).toFixed(1)}MB</p>
                    </div>
                    <button onClick={() => { setTrackFile(null); setTrackPreviewUrl(null); setIsPreviewPlaying(false); }} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mini player */}
                  {trackPreviewUrl && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPreviewPlaying(p => !p)}
                        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:opacity-90 flex-shrink-0"
                      >
                        {isPreviewPlaying
                          ? <Pause className="w-3.5 h-3.5 text-primary-foreground" />
                          : <Play className="w-3.5 h-3.5 text-primary-foreground ml-0.5" />
                        }
                      </button>
                      <div className="flex-1 h-1.5 bg-border/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: previewDuration ? `${(previewTime / previewDuration) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(previewTime)} / {formatTime(previewDuration)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => trackInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
                  <p className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Tap to select your track</p>
                  <p className="text-xs text-muted-foreground mt-1">MP3, WAV, AAC, FLAC supported</p>
                </button>
              )}
              <input ref={trackInputRef} type="file" accept="audio/*" onChange={handleTrackSelect} className="hidden" />
            </div>

            {/* Cover art */}
            <div>
              <label className="text-sm font-medium mb-2 block">Cover Art (optional)</label>
              {coverPreviewUrl ? (
                <div className="flex items-center gap-3">
                  <img src={coverPreviewUrl} alt="Cover" className="w-16 h-16 rounded-xl object-cover border border-border/40" />
                  <button onClick={() => { setCoverFile(null); setCoverPreviewUrl(null); }} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                    <X className="w-3 h-3" />Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="flex items-center gap-3 px-4 py-3 border border-border/40 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all text-sm text-muted-foreground hover:text-foreground"
                >
                  <Upload className="w-4 h-4" />Upload cover image
                </button>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Track Title *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Track name"
                  className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Genre</label>
                <select
                  value={genre}
                  onChange={e => setGenre(e.target.value)}
                  className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description (optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tell us about this track..."
                rows={3}
                maxLength={300}
                className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            {/* Upload progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-border/40 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !trackFile || !title.trim() || coinBalance < SUBMISSION_FEE}
              className="w-full py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-lg rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-3"
            >
              {submitting ? (
                <><Loader className="w-5 h-5 animate-spin" />Uploading & Submitting...</>
              ) : (
                <><Music className="w-5 h-5" />Submit Track — {SUBMISSION_FEE} coins</>
              )}
            </button>
          </div>

          {/* Submission history */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border/40">
              <h2 className="font-bold">Your Submissions ({submissions.length})</h2>
            </div>

            {loading ? (
              <div className="p-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
            ) : submissions.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No submissions yet. Submit your first track above.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {submissions.map(s => {
                  const meta = STATUS_META[s.status];
                  return (
                    <div key={s.id} className="flex items-center gap-4 p-5 hover:bg-card/20 transition-colors flex-wrap">
                      {/* Cover */}
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex-shrink-0 overflow-hidden">
                        {s.cover_url
                          ? <img src={s.cover_url} alt={s.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Music className="w-5 h-5 text-primary" /></div>
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold truncate">{s.title}</p>
                          <span className="text-xs px-2 py-0.5 bg-card/60 text-muted-foreground rounded-full">{s.genre}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Submitted {new Date(s.submitted_at).toLocaleDateString("en-ZA")} · {s.fee_paid} coins paid
                        </p>
                        {s.admin_note && (
                          <p className="text-xs text-muted-foreground mt-1 italic">Admin: "{s.admin_note}"</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {s.status === "approved" && s.play_count > 0 && (
                          <span className="text-xs text-muted-foreground">{s.play_count} plays</span>
                        )}
                        <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-semibold ${meta.color}`}>
                          {meta.icon}{meta.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="p-5 glass rounded-2xl text-sm text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">How submissions work</p>
            <p>1. Upload your track and pay the 200-coin submission fee.</p>
            <p>2. Your track goes to the admin for review (usually within 48 hours).</p>
            <p>3. If approved, your track gets added to the CheckinPurple official playlist and played live.</p>
            <p>4. If rejected, you'll receive feedback. The fee is non-refundable.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
