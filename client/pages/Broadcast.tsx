import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Radio, Mic, MicOff, Users, Volume2, Settings, LogOut,
  Share2, Eye, Upload, Music, X, Play, Pause,
  LayoutDashboard, Send, Zap, Calendar
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Chat from "@/components/Chat";

interface Track {
  name: string;
  file: File;
  url: string;
  duration?: number;
}

export default function Broadcast() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  const [isLive, setIsLive] = useState(false);
  const [listenerCount, setListenerCount] = useState(0);
  const [streamTitle, setStreamTitle] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [livepeerStreamKey, setLivepeerStreamKey] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveStream, setSaveStream] = useState(false);
  const [streamPrivacy, setStreamPrivacy] = useState<"public" | "followers" | "private">("public");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Track state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [genre, setGenre] = useState("Various");

  const GENRES = ["Afrobeats", "Amapiano", "Gqom", "Hip Hop", "Jazz", "Electronic", "R&B", "Soul", "Rock", "Classical", "Various"];

  useEffect(() => {
    if (!user) navigate("/signin");
  }, [user, navigate]);

  const ensureAudioSetup = () => {
    const audio = audioRef.current;
    if (!audio || audioContextRef.current) return;

    const ctx = new AudioContext();
    try {
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioContextRef.current = ctx;
      sourceNodeRef.current = source;
      analyserNodeRef.current = analyser;
    } catch (error) {
      console.warn("Audio setup failed:", error);
      void ctx.close();
    }
  };

  useEffect(() => {
    ensureAudioSetup();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    ensureAudioSetup();
    audio.src = currentTrack.url;
    audio.volume = volume;
    audio.load();

    if (isPlaying) audio.play().catch(console.error);

    const onTime = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      // Auto-advance to next track
      const idx = tracks.findIndex(t => t.url === currentTrack.url);
      if (idx >= 0 && idx < tracks.length - 1) {
        setCurrentTrack(tracks[idx + 1]);
        setIsPlaying(true);
      }
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audioContextRef.current?.resume().catch(() => {});
      audio.play().catch(console.error);
    }
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const audioFiles = files.filter(f => f.type.startsWith("audio/"));
    if (audioFiles.length === 0) { setError("Please select valid audio files"); return; }

    const newTracks: Track[] = audioFiles.map(file => ({
      name: file.name.replace(/\.[^/.]+$/, ""),
      file,
      url: URL.createObjectURL(file),
    }));

    setTracks(prev => [...prev, ...newTracks]);
    if (!currentTrack) setCurrentTrack(newTracks[0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError("");
  };

  const removeTrack = (url: string) => {
    setTracks(prev => prev.filter(t => t.url !== url));
    if (currentTrack?.url === url) {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
    URL.revokeObjectURL(url);
  };

  const playTrack = (track: Track) => {
    ensureAudioSetup();
    audioContextRef.current?.resume().catch(() => {});

    if (currentTrack?.url === track.url) {
      setIsPlaying(p => !p);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  // Get or create Livepeer stream key
  const getLivepeerStreamKey = async () => {
    try {
      const res = await fetch("/api/stream/livepeer-key", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({ name: streamTitle || undefined, record: saveStream }),
      });
      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        if (!res.ok) {
          setError(text || "Failed to create Livepeer stream");
          return null;
        }
        setError("Livepeer response was not valid JSON");
        return null;
      }

      if (!res.ok) {
        setError((data && (data.error || data.message)) || "Failed to create Livepeer stream");
        return null;
      }

      const streamKey = typeof data?.streamKey === "object" ? data.streamKey.value || data.streamKey : data?.streamKey;
      const playbackId = typeof data?.playbackId === "object" ? data.playbackId.value || data.playbackId : data?.playbackId;

      if (streamKey) {
        setLivepeerStreamKey(streamKey);
        setPlaybackId(playbackId);
        return data;
      }

      setError("Livepeer returned an invalid stream key");
    } catch (err) {
      console.error("Livepeer key error:", err);
      setError("Unable to create Livepeer stream key");
    }
    return null;
  };

  const handleGoLive = async () => {
    if (!streamTitle.trim()) { setError("Please enter a stream title"); return; }
    if (tracks.length === 0) { setError("Upload at least one track before going live"); return; }

    setLoading(true); setError("");

    try {
      ensureAudioSetup();
      audioContextRef.current?.resume().catch(() => {});

      // 1. Get Livepeer stream key for broadcasting
      const livepeerData = await getLivepeerStreamKey();
      if (!livepeerData) throw new Error("Could not generate Livepeer stream key");

      // 2. Create stream record in DB with Livepeer metadata
      const res = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          title: streamTitle,
          genre,
          livepeerStreamId: livepeerData?.livepeerStreamId,
          playbackId: livepeerData?.playbackId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start stream");

      setStreamId(data.stream.id);
      setIsLive(true);
      // Generate share link
      const link = `${window.location.origin}/listen?stream=${data.stream.id}`;
      setShareLink(link);
      setListenerCount(0);

      // 3. Start playing music
      if (currentTrack && !isPlaying) {
        setIsPlaying(true);
        await audioRef.current?.play().catch(err => {
          console.warn("Playback blocked:", err);
        });
      }

      // Mock listener count growth
      const interval = setInterval(() => {
        setListenerCount(prev => Math.min(prev + Math.floor(Math.random() * 2), 999));
      }, 3000);
      return () => clearInterval(interval);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to go live");
    } finally {
      setLoading(false);
    }
  };

  const handleStopStream = async () => {
    if (!streamId) return;
    setLoading(true);
    try {
      await fetch(`/api/streams/${streamId}`, { method: "DELETE" });
      setIsLive(false);
      setStreamId(null);
      setListenerCount(0);
      setIsPlaying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end stream");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await signOut(); navigate("/"); };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const copyStreamPageLink = () => {
    navigator.clipboard?.writeText(shareLink ?? `${window.location.origin}/listen`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <audio ref={audioRef} preload="metadata" autoPlay playsInline />

      {/* Header */}
      <nav className="fixed top-0 w-full z-40 border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Radio className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">CheckinPurple</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/releases" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Calendar className="w-4 h-4" />Releases
            </Link>
            <Link to="/submit-music" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Send className="w-4 h-4" />Submit
            </Link>
            <Link to="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <LayoutDashboard className="w-4 h-4" />
            </Link>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Live visual */}
          <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-card/30">
            <div className="aspect-video bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 relative flex items-center justify-center">
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${isLive ? "bg-red-500/20 border-2 border-red-500 animate-pulse" : "bg-primary/20 border-2 border-primary"}`}>
                  <Mic className={`w-10 h-10 ${isLive ? "text-red-500" : "text-primary"}`} />
                </div>
                {isLive ? (
                  <>
                    <p className="text-red-500 font-bold text-xl mb-1">● LIVE</p>
                    <p className="text-muted-foreground">{listenerCount} {listenerCount === 1 ? "listener" : "listeners"}</p>
                    {currentTrack && <p className="text-primary text-sm mt-2 font-medium">♪ {currentTrack.name}</p>}
                  </>
                ) : (
                  <p className="text-muted-foreground">Ready to broadcast</p>
                )}
              </div>

              {isLive && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-500/20 border border-red-500 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-500 font-bold text-sm">LIVE</span>
                </div>
              )}
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/30 backdrop-blur rounded-full">
                <Eye className="w-4 h-4 text-white" />
                <span className="text-white font-semibold text-sm">{listenerCount}</span>
              </div>
            </div>
          </div>

          {/* Livepeer setup notice */}
          {isLive && livepeerStreamKey && (
            <div className="glass rounded-xl p-4 border border-primary/20">
              <p className="text-sm font-semibold text-primary mb-1 flex items-center gap-2">
                <Zap className="w-4 h-4" />Livepeer Stream Active
              </p>
              <p className="text-xs text-muted-foreground mb-2">Use OBS or similar software to broadcast your audio. Use these settings:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-card/40 rounded-lg p-2">
                  <p className="text-muted-foreground">RTMP URL</p>
                  <p className="font-mono text-foreground">rtmp://rtmp.livepeer.com/live</p>
                </div>
                <div className="bg-card/40 rounded-lg p-2">
                  <p className="text-muted-foreground">Stream Key</p>
                  <p className="font-mono text-foreground truncate">{livepeerStreamKey}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Or just upload tracks below — they'll play directly through the browser for your listeners.
              </p>
            </div>
          )}

          {/* Now playing bar */}
          {currentTrack && (
            <div className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{currentTrack.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground w-8">{formatTime(currentTime)}</span>
                  <div
                    className="flex-1 h-1.5 bg-border/40 rounded-full overflow-hidden cursor-pointer"
                    onClick={e => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      const ratio = (e.clientX - rect.left) / rect.width;
                      if (audioRef.current && duration) audioRef.current.currentTime = ratio * duration;
                    }}
                  >
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume */}
              <div className="hidden sm:flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-16 accent-primary" />
              </div>

              <button
                onClick={() => setIsPlaying(p => !p)}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:opacity-90 flex-shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-primary-foreground" /> : <Play className="w-4 h-4 text-primary-foreground ml-0.5" />}
              </button>
            </div>
          )}

          {/* Upload tracks */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Tracks ({tracks.length})
              </h3>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg text-sm font-semibold transition-colors">
                <Upload className="w-4 h-4" />Add Tracks
              </button>
              <input ref={fileInputRef} type="file" accept="audio/*" multiple onChange={handleFileUpload} className="hidden" />
            </div>

            {tracks.length === 0 ? (
              <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
                <p className="font-semibold text-muted-foreground group-hover:text-foreground">Tap to add music from your device</p>
                <p className="text-xs text-muted-foreground mt-1">MP3, WAV, AAC, FLAC — plays directly in browser</p>
              </button>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {tracks.map(track => (
                  <div
                    key={track.url}
                    onClick={() => playTrack(track)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      currentTrack?.url === track.url ? "border-primary/40 bg-primary/5" : "border-border/20 bg-card/20 hover:bg-card/40"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${currentTrack?.url === track.url && isPlaying ? "bg-primary" : "bg-primary/20"}`}>
                      {currentTrack?.url === track.url && isPlaying
                        ? <Pause className="w-3.5 h-3.5 text-primary-foreground" />
                        : <Play className="w-3.5 h-3.5 text-primary ml-0.5" />
                      }
                    </div>
                    <span className="flex-1 text-sm font-medium truncate">{track.name}</span>
                    <button onClick={e => { e.stopPropagation(); removeTrack(track.url); }} className="p-1 hover:text-destructive transition-colors text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stream controls */}
          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-4">
              <div className="glass rounded-xl p-5 space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Stream Title</label>
                  <input
                    value={streamTitle}
                    onChange={e => setStreamTitle(e.target.value)}
                    disabled={isLive}
                    placeholder="What are you streaming today?"
                    className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Genre</label>
                  <select
                    value={genre}
                    onChange={e => setGenre(e.target.value)}
                    disabled={isLive}
                    className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  >
                    {GENRES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Save stream + privacy */}
              {!isLive && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setSaveStream(s => !s)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      saveStream ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:border-border"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${saveStream ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                      {saveStream && <span className="text-white text-xs">✓</span>}
                    </span>
                    Save this stream
                  </button>
                  {saveStream && (
                    <select
                      value={streamPrivacy}
                      onChange={e => setStreamPrivacy(e.target.value as any)}
                      className="flex-1 bg-input border border-border/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="public">Public — anyone can replay</option>
                      <option value="followers">Followers only</option>
                      <option value="private">Private — only me</option>
                    </select>
                  )}
                </div>
              )}

              {/* Share link when live */}
              {isLive && shareLink && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <span className="text-xs text-muted-foreground flex-1 truncate">{shareLink}</span>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(shareLink); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 flex-shrink-0"
                  >
                    {shareCopied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-xl p-5">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className={`text-2xl font-bold ${isLive ? "text-red-500" : "text-muted-foreground"}`}>{isLive ? "LIVE" : "OFFLINE"}</p>
                </div>
                <div className="glass rounded-xl p-5">
                  <p className="text-sm text-muted-foreground mb-1">Listeners</p>
                  <p className="text-2xl font-bold text-primary">{listenerCount}</p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">{error}</div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={isLive ? handleStopStream : handleGoLive}
                disabled={loading}
                className={`py-4 px-5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                  isLive
                    ? "bg-red-500/10 border-2 border-red-500 text-red-500 hover:bg-red-500/20"
                    : "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                }`}
              >
                {isLive
                  ? <><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />{loading ? "Stopping..." : "Stop Stream"}</>
                  : <><Mic className="w-5 h-5" />{loading ? "Starting..." : "Go Live"}</>
                }
              </button>

              <button onClick={() => setIsMuted(!isMuted)} className="py-3 px-5 rounded-xl font-semibold border border-border/40 bg-card/30 hover:bg-card/50 transition-colors flex items-center justify-center gap-2">
                {isMuted ? <><MicOff className="w-5 h-5" />Unmute</> : <><Volume2 className="w-5 h-5" />Mute</>}
              </button>

              <button disabled={!isLive} onClick={copyStreamPageLink} className="py-3 px-5 rounded-xl font-semibold border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <Share2 className="w-5 h-5" />Share Link
              </button>

              <button onClick={() => setShowSettings(!showSettings)} className="py-3 px-5 rounded-xl font-semibold border border-border/40 bg-card/30 hover:bg-card/50 transition-colors flex items-center justify-center gap-2">
                <Settings className="w-5 h-5" />{showSettings ? "Hide" : "Settings"}
              </button>
            </div>
          </div>

          {/* Settings */}
          {showSettings && (
            <div className="glass rounded-xl p-5 space-y-3">
              <h3 className="font-bold">Stream Settings</h3>
              <div>
                <label className="text-sm font-medium mb-2 block">Audio Quality</label>
                <select className="w-full bg-input text-foreground rounded-lg px-4 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option>High (320kbps)</option>
                  <option>Medium (192kbps)</option>
                  <option>Standard (128kbps)</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="no-record" defaultChecked className="w-4 h-4" />
                <label htmlFor="no-record" className="text-sm">Prevent listener recording</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="clear-cache" defaultChecked className="w-4 h-4" />
                <label htmlFor="clear-cache" className="text-sm">Clear audio cache when stream ends</label>
              </div>
            </div>
          )}

          {/* Live chat */}
          {isLive && streamId && (
            <div>
              <h3 className="text-lg font-bold mb-3">Live Chat</h3>
              <Chat streamId={streamId} userId={user?.id} username={user?.username} userRole={user?.role} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
