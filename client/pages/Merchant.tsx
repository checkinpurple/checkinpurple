import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radio, ShoppingBag, Plus, Package, Ticket, Download, ArrowLeft, Edit3, Trash2, Check, X, TrendingUp, Coins } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ProfileCard from "@/components/ProfileCard";

type ProductCategory = "merch" | "digital" | "ticket";
type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

interface Product {
  id: string;
  title: string;
  description: string;
  price_zar: number;
  price_usd?: number;
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
  shipping_address?: string;
}

const CATEGORY_META: Record<ProductCategory, { label: string; icon: React.ReactNode; color: string }> = {
  merch: { label: "Merch", icon: <Package className="w-4 h-4" />, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  digital: { label: "Digital", icon: <Download className="w-4 h-4" />, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  ticket: { label: "Ticket", icon: <Ticket className="w-4 h-4" />, color: "text-green-500 bg-green-500/10 border-green-500/20" },
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
  const [tab, setTab] = useState<"products" | "orders" | "analytics">("products");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const imageRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "", description: "", price_zar: "",
    price_usd: "", category: "merch" as ProductCategory,
    stock: "-1", event_date: "", event_location: "",
  });

  const stats = {
    totalRevenue: orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total_zar, 0),
    totalOrders: orders.length,
    activeProducts: products.filter(p => p.is_active).length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
  };

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    if (user.role !== "merchant" && user.role !== "admin") { navigate("/dashboard"); return; }
    fetchData();
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
    } catch { } finally { setLoading(false); }
  };

  const addProduct = async () => {
    if (!form.title || !form.price_zar) { setError("Title and price are required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/store/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
        body: JSON.stringify({
          ...form,
          price_zar: parseFloat(form.price_zar),
          price_usd: form.price_usd ? parseFloat(form.price_usd) : null,
          stock: parseInt(form.stock),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product");
      setProducts(p => [...p, data.product]);
      setShowAddProduct(false);
      setForm({ title: "", description: "", price_zar: "", price_usd: "", category: "merch", stock: "-1", event_date: "", event_location: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product");
    } finally { setSaving(false); }
  };

  const toggleProduct = async (id: string, active: boolean) => {
    await fetch(`/api/store/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
      body: JSON.stringify({ is_active: active }),
    });
    setProducts(p => p.map(x => x.id === id ? { ...x, is_active: active } : x));
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    await fetch(`/api/store/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.id}` },
      body: JSON.stringify({ status }),
    });
    setOrders(o => o.map(x => x.id === id ? { ...x, status } : x));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-40 border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">CheckinPurple</span>
          </Link>
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="w-4 h-4" />Dashboard
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">

          <ProfileCard editable userId={user.id} username={user.username} avatarUrl={user.avatar_url} role="merchant" />

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Revenue", value: `R${stats.totalRevenue.toFixed(2)}`, color: "text-green-500" },
              { label: "Total Orders", value: stats.totalOrders, color: "text-primary" },
              { label: "Active Products", value: stats.activeProducts, color: "text-orange-500" },
              { label: "Pending Orders", value: stats.pendingOrders, color: "text-yellow-500" },
            ].map(s => (
              <div key={s.label} className="glass rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {(["products", "orders", "analytics"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl font-semibold text-sm capitalize transition-all border ${tab === t ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>

          {/* PRODUCTS TAB */}
          {tab === "products" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Your Products</h3>
                <button onClick={() => setShowAddProduct(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                  <Plus className="w-4 h-4" />Add Product
                </button>
              </div>

              {/* Add product form */}
              {showAddProduct && (
                <div className="glass rounded-2xl p-6 border-2 border-primary/20">
                  <h3 className="font-bold mb-4">New Product</h3>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Product name" className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Category *</label>
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ProductCategory }))} className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
                        <option value="merch">Physical Merch</option>
                        <option value="digital">Digital Download</option>
                        <option value="ticket">Event Ticket</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Price (ZAR) *</label>
                      <input type="number" value={form.price_zar} onChange={e => setForm(f => ({ ...f, price_zar: e.target.value }))} placeholder="0.00" className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Price (USD)</label>
                      <input type="number" value={form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: e.target.value }))} placeholder="0.00" className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Stock (-1 = unlimited)</label>
                      <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                    </div>
                    {form.category === "ticket" && (
                      <>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Event Date</label>
                          <input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Event Location</label>
                          <input value={form.event_location} onChange={e => setForm(f => ({ ...f, event_location: e.target.value }))} placeholder="Venue, City" className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the product..." className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none" />
                  </div>
                  {error && <p className="text-destructive text-sm mb-3">{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={addProduct} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                      <Check className="w-4 h-4" />{saving ? "Saving..." : "Add Product"}
                    </button>
                    <button onClick={() => setShowAddProduct(false)} className="flex items-center gap-2 px-4 py-2 border border-border/40 rounded-lg text-sm font-semibold hover:bg-card/40">
                      <X className="w-4 h-4" />Cancel
                    </button>
                  </div>
                </div>
              )}

              {products.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-semibold text-muted-foreground">No products yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Add your first product above</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map(p => {
                    const cat = CATEGORY_META[p.category];
                    return (
                      <div key={p.id} className={`glass rounded-2xl overflow-hidden border-2 transition-all ${p.is_active ? "border-border/40" : "border-border/20 opacity-60"}`}>
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="w-full h-32 object-cover" />
                        ) : (
                          <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                            {cat.icon}
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-sm">{p.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${cat.color}`}>
                              {cat.icon}{cat.label}
                            </span>
                          </div>
                          <p className="text-lg font-bold mb-3">R{p.price_zar}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {p.stock === -1 ? "Unlimited stock" : `${p.stock} left`}
                            </span>
                            <button
                              onClick={() => toggleProduct(p.id, !p.is_active)}
                              className={`text-xs px-2 py-1 rounded-lg font-semibold transition-colors ${p.is_active ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-green-500/10 text-green-500 hover:bg-green-500/20"}`}
                            >
                              {p.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {tab === "orders" && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border/40">
                <h3 className="font-bold">Orders</h3>
              </div>
              {orders.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-card/40">
                      <tr>
                        {["Buyer", "Product", "Total", "Status", "Date", "Actions"].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id} className="border-t border-border/20 hover:bg-card/20">
                          <td className="px-5 py-3 font-semibold">@{o.buyer_username}</td>
                          <td className="px-5 py-3 text-muted-foreground">{o.product_title}</td>
                          <td className="px-5 py-3 text-green-500 font-bold">R{o.total_zar}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("en-ZA")}</td>
                          <td className="px-5 py-3">
                            {o.status === "paid" && (
                              <button onClick={() => updateOrderStatus(o.id, "shipped")} className="text-xs px-3 py-1.5 bg-purple-500/10 text-purple-500 rounded-lg font-semibold hover:bg-purple-500/20">
                                Mark Shipped
                              </button>
                            )}
                            {o.status === "shipped" && (
                              <button onClick={() => updateOrderStatus(o.id, "delivered")} className="text-xs px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg font-semibold hover:bg-green-500/20">
                                Mark Delivered
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS TAB */}
          {tab === "analytics" && (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Sales Breakdown</h3>
                {["merch", "digital", "ticket"].map(cat => {
                  const catOrders = orders.filter(o => {
                    const product = products.find(p => p.title === o.product_title);
                    return product?.category === cat;
                  });
                  const revenue = catOrders.reduce((s, o) => s + o.total_zar, 0);
                  const meta = CATEGORY_META[cat as ProductCategory];
                  return (
                    <div key={cat} className="flex items-center justify-between py-3 border-b border-border/20 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-sm font-semibold ${meta.color} px-2 py-1 rounded-lg border`}>
                          {meta.icon}{meta.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-500">R{revenue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{catOrders.length} orders</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
