import { useState } from "react";

const FEATURES = [
  {
    id: 1,
    category: "Artist Settings",
    emoji: "🎤",
    color: "purple",
    items: [
      { id: "a1", label: "Social media links (Instagram, Twitter, TikTok, Facebook, YouTube)", effort: "quick", done: false },
      { id: "a2", label: "Music streaming links (Spotify, Apple Music, SoundCloud, YouTube Music, Audiomack)", effort: "quick", done: false },
      { id: "a3", label: "Skills for sale: Sound Engineer, Podcast Host, Graphic Design, Producer, Session Musician", effort: "quick", done: false },
      { id: "a4", label: "Photo gallery visible to followers (profile images, press shots)", effort: "medium", done: false },
      { id: "a5", label: "Personalised playlists tailored to a specific person or group", effort: "medium", done: false },
      { id: "a6", label: "Online booking availability calendar with schedule & time slots", effort: "hard", done: false },
    ]
  },
  {
    id: 2,
    category: "Merchant",
    emoji: "🛍️",
    color: "orange",
    items: [
      { id: "m1", label: "Photo gallery for physical merch/fashion catalogue", effort: "quick", done: false },
      { id: "m2", label: "Sample packs, sound packs, plugins, and software in store", effort: "quick", done: false },
      { id: "m3", label: "Current availability and pricing shown on homepage/wall", effort: "quick", done: false },
    ]
  },
  {
    id: 3,
    category: "Store",
    emoji: "🏪",
    color: "yellow",
    items: [
      { id: "s1", label: "Sample packs, sound packs, plugins & software category", effort: "quick", done: false },
      { id: "s2", label: "Graphic design services listing", effort: "quick", done: false },
    ]
  },
  {
    id: 4,
    category: "Fan Profile",
    emoji: "🎧",
    color: "teal",
    items: [
      { id: "f1", label: "\"Currently listening to\" status shown on fan homepage to followers", effort: "quick", done: false },
      { id: "f2", label: "Fan profile info visible to other users", effort: "medium", done: false },
      { id: "f3", label: "Fan schedule / availability shown to artists for booking", effort: "medium", done: false },
    ]
  },
  {
    id: 5,
    category: "Influencer",
    emoji: "📢",
    color: "pink",
    items: [
      { id: "i1", label: "Currently running promotions shown on homepage/wall to other users", effort: "quick", done: false },
      { id: "i2", label: "Influencer profile info (reach, platforms, rates) visible to other users", effort: "medium", done: false },
    ]
  },
  {
    id: 6,
    category: "Wall / Feed",
    emoji: "📰",
    color: "blue",
    items: [
      { id: "w1", label: "Artist currently streaming shown on wall", effort: "quick", done: true },
      { id: "w2", label: "Merchant currently available items shown on wall", effort: "quick", done: true },
      { id: "w3", label: "Influencer active promotions shown on wall", effort: "quick", done: true },
    ]
  },
];

const EFFORT_STYLES = {
  quick: { label: "Quick", bg: "bg-green-500/15 text-green-400 border-green-500/30" },
  medium: { label: "Medium", bg: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  hard: { label: "Hard", bg: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const COLOR_MAP = {
  purple: { header: "bg-purple-500/10 border-purple-500/25 text-purple-300", dot: "bg-purple-400" },
  orange: { header: "bg-orange-500/10 border-orange-500/25 text-orange-300", dot: "bg-orange-400" },
  yellow: { header: "bg-yellow-500/10 border-yellow-500/25 text-yellow-300", dot: "bg-yellow-400" },
  teal: { header: "bg-teal-500/10 border-teal-500/25 text-teal-300", dot: "bg-teal-400" },
  pink: { header: "bg-pink-500/10 border-pink-500/25 text-pink-300", dot: "bg-pink-400" },
  blue: { header: "bg-blue-500/10 border-blue-500/25 text-blue-300", dot: "bg-blue-400" },
};

export default function TodoList() {
  const [items, setItems] = useState(
    FEATURES.flatMap(f => f.items).reduce((acc, item) => ({ ...acc, [item.id]: item.done }), {} as Record<string, boolean>)
  );
  const [filter, setFilter] = useState("all");

  const toggle = (id) => setItems(prev => ({ ...prev, [id]: !prev[id] }));

  const allItems = FEATURES.flatMap(f => f.items);
  const doneCount = Object.values(items).filter(Boolean).length;
  const totalCount = allItems.length;
  const pct = Math.round((doneCount / totalCount) * 100);

  const quickItems = allItems.filter(i => i.effort === "quick" && !items[i.id]);

  return (
    <div style={{ fontFamily: "'system-ui', sans-serif" }} className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-lg">📋</div>
          <div>
            <h1 className="text-xl font-bold text-white">CheckinPurple · Feature Backlog</h1>
            <p className="text-xs text-gray-400">{doneCount}/{totalCount} complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{pct}% done</p>
      </div>

      {/* Quick wins callout */}
      {quickItems.length > 0 && (
        <div className="max-w-2xl mx-auto mb-5 p-4 rounded-2xl bg-green-500/8 border border-green-500/20">
          <p className="text-green-400 font-semibold text-sm mb-2">⚡ {quickItems.length} Quick Wins Remaining</p>
          <div className="flex flex-wrap gap-1.5">
            {quickItems.map(i => (
              <button
                key={i.id}
                onClick={() => toggle(i.id)}
                className="text-xs px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20 transition-colors text-left"
              >
                {i.label.split(":")[0].split("(")[0].trim()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="max-w-2xl mx-auto mb-4 flex gap-2 flex-wrap">
        {["all", "quick", "medium", "hard", "done"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize ${
              filter === f
                ? "bg-purple-600 border-purple-600 text-white"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
            }`}
          >
            {f === "all" ? `All (${totalCount})` : f === "done" ? `Done (${doneCount})` : f}
          </button>
        ))}
      </div>

      {/* Feature groups */}
      <div className="max-w-2xl mx-auto space-y-4">
        {FEATURES.map(group => {
          const colors = COLOR_MAP[group.color];
          const visibleItems = group.items.filter(item => {
            if (filter === "done") return items[item.id];
            if (filter === "all") return true;
            if (filter === item.effort) return !items[item.id];
            return false;
          });
          if (visibleItems.length === 0) return null;

          const groupDone = group.items.filter(i => items[i.id]).length;

          return (
            <div key={group.id} className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              <div className={`flex items-center gap-2 px-4 py-3 border-b border-gray-800 ${colors.header.split(" ").slice(0,2).join(" ")}`}>
                <span className="text-lg">{group.emoji}</span>
                <span className={`font-bold text-sm ${colors.header.split(" ")[2]}`}>{group.category}</span>
                <span className="ml-auto text-xs text-gray-500">{groupDone}/{group.items.length}</span>
              </div>
              <div className="divide-y divide-gray-800/60">
                {visibleItems.map(item => {
                  const done = items[item.id];
                  const effort = EFFORT_STYLES[item.effort];
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/40 transition-colors ${done ? "opacity-50" : ""}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        done ? `${colors.dot} border-transparent` : "border-gray-600"
                      }`}>
                        {done && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <p className={`text-sm flex-1 leading-relaxed ${done ? "line-through text-gray-500" : "text-gray-200"}`}>
                        {item.label}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${effort.bg}`}>
                        {effort.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-600 mt-8">Tap any item to mark it done</p>
    </div>
  );
}
