import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag, Plus, Package, Ticket, Download,
  Edit3, Trash2, Check, X, TrendingUp, Coins,
  Music, Play, Pause, Headphones, ExternalLink,
  Search, Star, Settings, MapPin
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AppSidebar from "@/components/AppSidebar";

type ProductCategory = "merch" | "digital" | "ticket" | "sample_pack" | "plugin" | "software" | "graphic_design";
type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

interface Product {
  id: string;
  title: string;
  description: string;
  price_zar: number;
  category: ProductCategory;
  image_url?: string;
  stock: number;
  is_active: boolean;
  created_at: string;
}

interface Order {
  id: string;
  buyer_username: string;
  product_title: string;
  quantity: number;
  total_zar: number;
  status: OrderStatus;
  created_at: string;
}

interface DressingRequest {
  id: string;
  artist_username: string;
  note: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  genre?: string;
}

const CATEGORY_META: Record<ProductCategory, { label: string; icon: React.ReactNode; color: string }> = {
  merch: { label: "Merch / Fashion", icon: <Package className="w-4 h-4" />, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  digital: { label: "Digital", icon: <Download className="w-4 h-4" />, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  ticket: { label: "Ticket", icon: <Ticket className="w-4 h-4" />, color: "text-green-500 bg-green-500/10 border-green-500/20" },
  sample_pack: { label: "Sample Pack", icon: <span className="text-xs font-bold">SP</span>, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  plugin: { label: "Plugin / VST", icon: <span className="text-xs font-bold">VST</span>, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
  software: { label: "Software", icon: <span className="text-xs font-bold">SW</span>, color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20" },
  graphic_design: { label: "Graphic Design", icon: <span className="text-xs">🎨</span>, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "text-yellow-500 bg-yellow-500/10",
  paid: "text-blue-500 bg-blue-500/10",
  shipped: "text-purple-500 bg-purple-500/10",
  delivered: "text-green-500 bg-green-500/10",
  cancelled: "text-red-500 bg-red-500/10",
};

export default function MerchantPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dressingRequests, setDressingRequests] = useState<DressingRequest[]>([]);
  const [tab, setTab] = useState<"products" | "orders" | "dressing" | "discover" | "gallery" | "settings">("products");
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  // Store settings
  const [storeSettings, setStoreSettings] = useState({
    brandName: "",
    deliveryRadius: "",
    deliveryNote: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", price_zar: "",
    category: "merch" as ProductCategory, stock: "-1",
  });

  const discoverTracks: Track[] = [
    { id: "1", title: "Purple Nights", artist: "Nova Shade", duration: "3:22", genre: "Amapiano" },
    { id: "2", title: "City Glow", artist: "Mira Lane", duration: "2:58", genre: "Afrobeats" },
    { id: "3", title: "Midnight Vibes", artist: "Reel Beats", duration: "4:10", genre: "Hip Hop" },
    { id: "4", title: "Golden Hour", artist: "Zara Sol", duration: "3:45", genre: "R&B" },
  ];

  const stats = {
    totalRevenue: orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total_zar, 0),
    totalOrders: orders.length,
    activeProducts: products.filter(p => p.is_active).length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
  };

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    if (!user.profiles?.includes("merchant") && user.role !== "merchant" && user.role !== "admin") {
      navigate("/dashboard"); return;
    }
    fetchData();
    fetchStoreSettings();
  }, [user]);

  const fetchData = async () => {
    try {
      const [pRes, oRes] = await Promise.all([
        fetch("/api/store/products", { headers: { Authorization: `Bearer ${user?.id}` } }),
        fetch("/api/store/orders", { headers: { Authorization: `Bearer ${user?.id}` } }),
      ]);
      const [pData, oData] = await Promise.all([pRes.json(), oRes.json()]);
      if (pData.success) setProducts(pData.products || []);
      if (oData.success) setOrders(oData.orders || []);
    } catch {}
    finally { setLoading(false); }
  };

  const fetchStoreSettings = async () => {
    try {
      const res = await fetch("/api/store/settings", { 
        headers: { Authorization: `Bearer ${user?.id}` } 
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setStoreSettings({
          brandName: data.settings.brand_name || "",
          deliveryRadius: data.settings.delivery_radius || "",
          deliveryNote: data.settings.delivery_note || "",
        });
      }
    } catch {}
  };

  const saveStoreSettings = async () => {
    setSavingSettings(true);
    setSettingsError(null);
    setSettingsSuccess(null);
    
    try {
      const res = await fetch("/api/store/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${user?.id}` 
        },
        body: JSON.stringify({
          brand_name: storeSettings.brandName,
          delivery_radius: storeSettings.deliveryRadius,
          delivery_note: storeSettings.deliveryNote,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      
      setSettingsSuccess("Store settings saved successfully!");
      setTimeout(() => setSettingsSuccess(null), 3000);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddProduct = async () => {
    if (!form.title || !form.price_zar) return;
    setSaving(true);
    try {
      const res = await fetch("/api/store/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({ ...form, price_zar: parseFloat(form.price_zar), stock: parseInt(form.stock) }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => [data.product, ...prev]);
        setShowAddProduct(false);
        setForm({ title: "", description: "", price_zar: "", category: "merch", stock: "-1" });
      }
    } catch {}
    finally { setSaving(false); }
  };

  const handleDressingRequest = async (id: string, action: "accepted" | "declined") => {
    try {
      await fetch(`/api/bookings/dressing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({ status: action }),
      });
      setDressingRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    } catch {}
  };

  const TABS = [
    { id: "products", label: "Products" },
    { id: "orders", label: `Orders${stats.pendingOrders > 0 ? ` (${stats.pendingOrders})` : ""}` },
    { id: "gallery", label: "Gallery" },
    { id: "dressing", label: `Dressing${dressingRequests.filter(r => r.status === "pending").length > 0 ? ` (${dressingRequests.filter(r => r.status === "pending").length})` : ""}` },
    { id: "discover", label: "Discover Music" },
    { id: "settings", label: "Settings" },
  ] as { id: typeof tab; label: string }[];

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />

      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Merchant Store</h1>
                <p className="text-xs text-muted-foreground">Merch · Fashion · Tickets</p>
              </div>
            </div>
            <button onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Revenue", value: `R${stats.totalRevenue.toFixed(0)}`, color: "text-orange-400" },
              { label: "Orders", value: stats.totalOrders, color: "text-blue-400" },
              { label: "Products", value: stats.activeProducts, color: "text-green-400" },
              { label: "Pending", value: stats.pendingOrders, color: "text-yellow-400" },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl border border-border/40 bg-card/30">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/40 mb-5 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id ? "border-orange-400 text-orange-400" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Products */}
          {tab === "products" && (
            <div className="space-y-3">
              {products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No products yet. Add your first product.
                </div>
              ) : products.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card/30">
                  <div className={`flex-shrink-0 p-2 rounded-lg border ${CATEGORY_META[p.category].color}`}>
                    {CATEGORY_META[p.category].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">R{p.price_zar} · Stock: {p.stock === -1 ? "∞" : p.stock}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {p.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Orders */}
          {tab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No orders yet.</div>
              ) : orders.map(o => (
                <div key={o.id} className="p-4 rounded-xl border border-border/40 bg-card/30 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{o.product_title}</p>
                    <p className="text-xs text-muted-foreground">by {o.buyer_username} · R{o.total_zar}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Gallery Tab */}
          {tab === "gallery" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border/40 bg-card/30">
                <p className="text-sm font-semibold mb-1">Photo Gallery</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Upload photos of your physical merch, fashion pieces, and styling work. Visible to all users browsing your store.
                </p>
                <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/40 hover:border-primary/40 cursor-pointer transition-colors">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">Tap to upload photos</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB each</p>
                  <input type="file" multiple accept="image/*" className="hidden" />
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* Gallery images would be fetched from API */}
                <div className="aspect-square rounded-xl bg-card border border-border/40 flex items-center justify-center text-muted-foreground text-xs">
                  No photos yet
                </div>
              </div>
            </div>
          )}

          {/* Availability Status */}
          {tab === "settings" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border/40 bg-card/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">Currently Available</p>
                    <p className="text-xs text-muted-foreground">Show your availability status on the Wall and your store</p>
                  </div>
                  <button
                    onClick={() => setIsAvailable(a => !a)}
                    className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${isAvailable ? "bg-green-500" : "bg-border/60"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isAvailable ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {isAvailable && (
                  <input
                    value={availabilityNote}
                    onChange={e => setAvailabilityNote(e.target.value)}
                    placeholder="e.g. Taking orders this week · Styling artists for shows"
                    className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                )}
              </div>
            </div>
          )}

          {/* Dressing Requests */}
          {tab === "dressing" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Artists can request you to dress them. You can also browse artist profiles and send styling offers. Accept requests to start collaborating.
              </p>
              {dressingRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No dressing requests yet. Browse artist profiles to send styling offers.
                  <div className="mt-4">
                    <Link to="/listen" className="px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-colors">
                      Browse Artists
                    </Link>
                  </div>
                </div>
              ) : dressingRequests.map(r => (
                <div key={r.id} className="p-4 rounded-xl border border-border/40 bg-card/30">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-sm">{r.artist_username}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === "accepted" ? "bg-green-500/10 text-green-400" :
                      r.status === "declined" ? "bg-red-500/10 text-red-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>{r.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{r.note}</p>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleDressingRequest(r.id, "accepted")}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20">
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button onClick={() => handleDressingRequest(r.id, "declined")}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20">
                        <X className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Discover Music */}
          {tab === "discover" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">Discover music, find artists to collaborate with, and build your network.</p>
              {discoverTracks.map(track => (
                <div key={track.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/30 hover:bg-card/50 transition-colors">
                  <button
                    onClick={() => setPlaying(playing === track.id ? null : track.id)}
                    className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 hover:bg-orange-500/20 flex-shrink-0"
                  >
                    {playing === track.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground">{track.artist} - {track.genre}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{track.duration}</span>
                    <Link to={`/artist/${track.artist.toLowerCase().replace(/\s/g, "")}`}
                      className="p-1.5 rounded-lg border border-border/40 hover:bg-card/50 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Store Settings */}
          {tab === "settings" && (
            <div className="max-w-lg">
              <div className="glass rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Store Settings</h3>
                    <p className="text-xs text-muted-foreground">Configure your brand and delivery options</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Brand Name</label>
                    <input
                      value={storeSettings.brandName}
                      onChange={e => setStoreSettings(s => ({ ...s, brandName: e.target.value }))}
                      placeholder="Your store/brand name"
                      className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">This will be displayed on your store page and product listings</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-400" />
                      Delivery Radius
                    </label>
                    <input
                      value={storeSettings.deliveryRadius}
                      onChange={e => setStoreSettings(s => ({ ...s, deliveryRadius: e.target.value }))}
                      placeholder="e.g. Johannesburg, Pretoria, Nationwide"
                      className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Specify the areas where you can deliver physical products</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Note (optional)</label>
                    <textarea
                      value={storeSettings.deliveryNote}
                      onChange={e => setStoreSettings(s => ({ ...s, deliveryNote: e.target.value }))}
                      placeholder="Additional delivery information, estimated times, or special instructions..."
                      rows={3}
                      className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>
                </div>

                {settingsError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                    {settingsError}
                  </div>
                )}

                {settingsSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {settingsSuccess}
                  </div>
                )}

                <button
                  onClick={saveStoreSettings}
                  disabled={savingSettings}
                  className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {savingSettings ? "Saving..." : "Save Settings"}
                </button>
              </div>

              <div className="mt-6 p-4 border border-border/40 rounded-xl bg-card/20">
                <h4 className="font-semibold text-sm mb-2">Merchant-Only Features</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" /> Manage your product listings</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" /> Track orders and deliveries</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" /> Set brand name and delivery radius</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" /> Receive dressing requests from artists</li>
                </ul>
              </div>
            </div>
          )}

          {/* Add Product Modal */}
          {showAddProduct && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddProduct(false)}>
              <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border/40" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold mb-4">Add New Product</h3>
                <div className="space-y-3">
                  <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Product name"
                    className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description" rows={2}
                    className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none" />
                  <input value={form.price_zar} onChange={e => setForm(f => ({...f, price_zar: e.target.value}))} placeholder="Price (ZAR)" type="number"
                    className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value as ProductCategory}))}
                    className="w-full bg-input border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="merch">Merch / Fashion</option>
                    <option value="digital">Digital Download</option>
                    <option value="ticket">Event Ticket</option>
                    <option value="sample_pack">Sample Pack</option>
                    <option value="plugin">Plugin / VST</option>
                    <option value="software">Software</option>
                    <option value="graphic_design">Graphic Design Service</option>
                  </select>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setShowAddProduct(false)} className="flex-1 px-4 py-2 rounded-lg border border-border/40 text-sm">Cancel</button>
                    <button onClick={handleAddProduct} disabled={saving || !form.title || !form.price_zar}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                      {saving ? "Saving..." : "Add Product"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
