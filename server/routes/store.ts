import type { Request, Response } from "express";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Get store settings for the authenticated merchant
export const getStoreSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching store settings:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch store settings" });
    }

    return res.json({ success: true, settings: data || null });
  } catch (err) {
    console.error("Store settings error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Update store settings for the authenticated merchant
export const updateStoreSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { brand_name, delivery_radius, delivery_note } = req.body;

    // Upsert the settings
    const { data, error } = await supabase
      .from('store_settings')
      .upsert({
        user_id: userId,
        brand_name: brand_name || null,
        delivery_radius: delivery_radius || null,
        delivery_note: delivery_note || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error("Error updating store settings:", error);
      return res.status(500).json({ success: false, error: "Failed to save store settings" });
    }

    return res.json({ success: true, settings: data });
  } catch (err) {
    console.error("Store settings update error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Get products for the authenticated merchant
export const getMerchantProducts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch products" });
    }

    return res.json({ success: true, products: data || [] });
  } catch (err) {
    console.error("Products error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Get public products for the store
export const getPublicProducts = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        users:merchant_id (username, avatar_url)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching public products:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch products" });
    }

    const products = (data || []).map(p => ({
      ...p,
      merchant_username: p.users?.username || 'Unknown',
      merchant_avatar: p.users?.avatar_url || null,
    }));

    return res.json({ success: true, products });
  } catch (err) {
    console.error("Public products error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Create a new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { title, description, price_zar, category, stock, image_url } = req.body;

    if (!title || price_zar === undefined) {
      return res.status(400).json({ success: false, error: "Title and price are required" });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        merchant_id: userId,
        title,
        description: description || null,
        price_zar: parseFloat(price_zar),
        category: category || 'merch',
        stock: stock ?? -1,
        image_url: image_url || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return res.status(500).json({ success: false, error: "Failed to create product" });
    }

    return res.json({ success: true, product: data });
  } catch (err) {
    console.error("Create product error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Get orders for the authenticated merchant
export const getMerchantOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products:product_id (title),
        buyers:buyer_id (username)
      `)
      .eq('merchant_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch orders" });
    }

    const orders = (data || []).map(o => ({
      ...o,
      product_title: o.products?.title || 'Unknown Product',
      buyer_username: o.buyers?.username || 'Unknown',
    }));

    return res.json({ success: true, orders });
  } catch (err) {
    console.error("Orders error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};
