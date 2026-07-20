import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radio, ShoppingBag, Package, Download, Ticket, Search, Filter, ShoppingCart, X, Check, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AppSidebar from "@/components/AppSidebar";
import { ADMIN_EMAIL } from "@/lib/config";

type Category = "all" | "merch" | "digital" | "ticket" | "sample_pack" | "plugin" | "software" | "graphic_design";

interface Product {
  id: string;
  title: string;
  description: string;
  price_zar: number;
  price_usd?: number;
  category: "merch" | "digital" | "ticket";
  image_url?: string;
  merchant_username: string;
  merchant_avatar?: string;
  stock: number;
  event_date?: string;
  event_location?: string;
  merchant_id?: string;
}

const AMAZON_ASSOCIATE_TAG = import.meta.env.VITE_AMAZON_ASSOCIATE_TAG as string | undefined;

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Store() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [merchantGalleries, setMerchantGalleries] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showPayPalCheckout, setShowPayPalCheckout] = useState(false);
  const [orderTx, setOrderTx] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/store/products/public");
      const data = await res.json();
      if (data.success) {
        const prods = data.products || [];
        setProducts(prods);
        const merchantIds = [...new Set(prods.map((p: any) => p.merchant_id).filter(Boolean))];
        if (merchantIds.length > 0) {
          const { supabase } = await import("@/lib/supabase");
          const { data: mData } = await supabase
            .from("users").select("id, gallery_images").in("id", merchantIds);
          if (mData) setMerchantGalleries(
            Object.fromEntries(mData.map((m: any) => [m.id, m.gallery_images || []]))
          );
        }
      }
    } catch { } finally { setLoading(false); }
  };

  const addToCart = (product: Product) => {
    setCart(c => {
      const existing = c.find(i => i.product.id === product.id);
      if (existing) return c.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(c => c.filter(i => i.product.id !== productId));
  };

  const cartTotal = cart.reduce((s, i) => s + i.product.price_zar * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const getPayPalLink = () => {
    return `https://paypal.me/csign/${cartTotal.toFixed(0)}`;
  };

  const handlePayPalCheckout = () => {
    window.open(getPayPalLink(), "_blank", "noopener,noreferrer");
  };

  const handleClaimOrder = async () => {
    if (!user) { navigate("/signin"); return; }
    if (!orderTx) { setClaimError("Please enter the PayPal transaction ID"); return; }
    if (cart.some(i => i.product.category === "merch") && !shippingAddress.trim()) {
      setClaimError("Please enter a shipping address for physical items");
      return;
    }

    setClaiming(true);
    setClaimError(null);

    try {
      const res = await fetch("/api/payments/manual-claim", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${user.id}` 
        },
        body: JSON.stringify({
          type: "store_order",
          items: cart.map(i => ({
            productId: i.product.id,
            productTitle: i.product.title,
            quantity: i.quantity,
            price: i.product.price_zar,
          })),
          total: cartTotal,
          txId: orderTx,
          shippingAddress: cart.some(i => i.product.category === "merch") ? shippingAddress : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit order claim");

      setCart([]);
      setOrderSuccess(true);
      setShowPayPalCheckout(false);
      setShowCart(false);
      setOrderTx("");
      setShippingAddress("");
      setTimeout(() => setOrderSuccess(false), 5000);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Failed to submit order claim");
    } finally {
      setClaiming(false);
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.merchant_username.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const getAmazonAffiliateLink = (product: Product) => {
    if (!AMAZON_ASSOCIATE_TAG) return null;
    const params = new URLSearchParams({
      k: product.title,
      tag: AMAZON_ASSOCIATE_TAG,
      linkCode: "ll2",
    });
    return `https://www.amazon.com/s?${params.toString()}`;
  };

  const getCategoryIcon = (cat: string) => {
    if (cat === "merch") return <Package className="w-4 h-4" />;
    if (cat === "digital") return <Download className="w-4 h-4" />;
    return <Ticket className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />

      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0">
        <div className="px-4 py-6 max-w-7xl mx-auto">

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">CheckinPurple Store</h1>
            <p className="text-muted-foreground">Merch, digital downloads and event tickets from your favourite artists</p>
          </div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or merchants..." className="w-full bg-input text-foreground rounded-lg pl-11 pr-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {([
                { id: "all", label: "All" },
                { id: "merch", label: "Fashion" },
                { id: "digital", label: "Digital" },
                { id: "ticket", label: "Tickets" },
                { id: "sample_pack", label: "Sample Packs" },
                { id: "plugin", label: "Plugins" },
                { id: "software", label: "Software" },
                { id: "graphic_design", label: "Design Services" },
              ] as { id: Category; label: string }[]).map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${category === c.id ? "bg-primary text-primary-foreground border-transparent" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-semibold">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(p => (
                <div key={p.id} className="group glass rounded-2xl overflow-hidden border-2 border-border/30 hover:border-primary/40 transition-all">
                  <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="text-primary/30">{getCategoryIcon(p.category)}</div>
                    )}
                    <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-black/50 text-white font-semibold capitalize flex items-center gap-1">
                      {getCategoryIcon(p.category)}{p.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-bold truncate mb-0.5">{p.title}</p>
                    <p className="text-xs text-muted-foreground mb-1">by @{p.merchant_username}</p>
                    {p.category === "ticket" && p.event_date && (
                      <p className="text-xs text-accent mb-1">📅 {new Date(p.event_date).toLocaleDateString("en-ZA")} · {p.event_location}</p>
                    )}
                    {p.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>}
                    {getAmazonAffiliateLink(p) && (
                      <a
                        href={getAmazonAffiliateLink(p) as string}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-3"
                      >
                        Buy on Amazon <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {merchantGalleries[p.merchant_id]?.length > 0 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
                        {merchantGalleries[p.merchant_id].slice(0, 4).map((img, idx) => (
                          <img key={idx} src={img} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-border/30" />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-primary">R{p.price_zar}</p>
                        {p.price_usd && <p className="text-xs text-muted-foreground">≈ ${p.price_usd}</p>}
                      </div>
                      <button
                        onClick={() => addToCart(p)}
                        disabled={p.stock === 0}
                        className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                      >
                        <ShoppingCart className="w-3 h-3" />Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart Button - Fixed Position */}
          <button
            onClick={() => setShowCart(true)}
            className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-full text-sm font-semibold shadow-lg hover:opacity-90 transition-all z-30"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart
            {cartCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-white text-primary text-xs flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </main>

      {/* Cart sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="w-full max-w-sm bg-background border-l border-border/40 flex flex-col">
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <h2 className="font-bold text-lg">Cart ({cartCount})</h2>
              <button onClick={() => setShowCart(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3 p-3 bg-card/30 rounded-xl border border-border/20">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(item.product.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.product.title}</p>
                      <p className="text-xs text-muted-foreground">@{item.product.merchant_username}</p>
                      <p className="text-sm font-bold text-primary">R{(item.product.price_zar * item.quantity).toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-border/40 space-y-3">
                <div className="flex items-center justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">R{cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => { setShowPayPalCheckout(true); setShowCart(false); }}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Checkout via PayPal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PayPal Checkout Modal */}
      {showPayPalCheckout && cart.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPayPalCheckout(false)}>
          <div className="bg-card rounded-2xl p-6 max-w-md w-full border border-border/40" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-500">P</span>
              </div>
              <div>
                <h3 className="font-bold">Pay with PayPal</h3>
                <p className="text-xs text-muted-foreground">Complete your order</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-4 bg-card/50 rounded-xl border border-border/40 mb-4 max-h-40 overflow-y-auto">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between text-sm py-1">
                  <span className="truncate mr-2">{item.product.title} x{item.quantity}</span>
                  <span className="font-semibold">R{(item.product.price_zar * item.quantity).toFixed(0)}</span>
                </div>
              ))}
              <div className="border-t border-border/40 mt-2 pt-2 flex items-center justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">R{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Shipping Address if needed */}
            {cart.some(i => i.product.category === "merch") && (
              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1 block">Shipping Address (required for physical items)</label>
                <textarea
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  placeholder="Street, City, Province, Postal Code"
                  rows={2}
                  className="w-full bg-input text-foreground rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                />
              </div>
            )}

            <div className="space-y-4">
              {/* Step 1: Pay */}
              <div className="p-4 bg-card/30 rounded-xl border border-border/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <span className="font-semibold text-sm">Click to pay via PayPal</span>
                </div>
                <button
                  onClick={handlePayPalCheckout}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Pay R{cartTotal.toFixed(0)} via PayPal
                </button>
              </div>

              {/* Step 2: Submit claim */}
              <div className="p-4 bg-card/30 rounded-xl border border-border/40">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <span className="font-semibold text-sm">Submit transaction ID</span>
                </div>
                
                <input 
                  value={orderTx} 
                  onChange={e => setOrderTx(e.target.value)} 
                  placeholder="PayPal transaction ID" 
                  className="w-full bg-input text-foreground rounded-lg px-3 py-2.5 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3" 
                />
                
                {claimError && <p className="text-destructive text-sm mb-2">{claimError}</p>}
                {claimSuccess && <p className="text-green-500 text-sm mb-2">{claimSuccess}</p>}
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleClaimOrder} 
                    disabled={claiming || !orderTx} 
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {claiming ? "Submitting..." : "Submit Order"}
                  </button>
                  <button 
                    onClick={() => setShowPayPalCheckout(false)} 
                    className="px-4 py-2.5 border border-border/40 rounded-xl text-sm hover:bg-card/50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Orders processed within 24 hours. Need help? Email <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">{ADMIN_EMAIL}</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success banner */}
      {orderSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 bg-green-500/90 text-white rounded-full font-semibold shadow-lg">
          <Check className="w-5 h-5" />Order submitted successfully!
        </div>
      )}
    </div>
  );
}
