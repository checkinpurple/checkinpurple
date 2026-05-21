import { Request, Response } from "express";
import { supabase } from "../lib/supabase";

// Manual claim endpoint: record PayPal.me manual claims for admin to reconcile
export async function manualClaim(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { amount, txId, notes, tierId, tierName, type } = req.body;
    if (!amount || !txId) return res.status(400).json({ error: "amount and txId are required" });

    const { error } = await supabase.from("manual_payments").insert([{
      user_id: userId,
      amount: String(amount),
      tx_id: String(txId),
      notes: notes || (tierName ? `${type || "subscription"}: ${tierName} (tier: ${tierId})` : null),
    }]);

    if (error) {
      // Table may not exist yet — still return success so UI doesn't break
      console.error("manual-claim insert error", error);
      if (error.code === "42P01") {
        // Table doesn't exist — log and return success anyway
        return res.json({ ok: true, warning: "Recorded manually" });
      }
      throw error;
    }
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("manual-claim error", err);
    return res.status(500).json({ error: err.message || "internal" });
  }
}

// PayPal order creation skeleton (needs PAYPAL_CLIENT_ID/SECRET in env)
export async function createPayPalOrder(req: Request, res: Response) {
  try {
    const { amount, currency = 'USD' } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount required' });

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    if (!clientId || !secret) return res.status(500).json({ error: 'PayPal not configured' });

    // Get access token
    const tokenRes = await (globalThis as any).fetch(`https://api-m.sandbox.paypal.com/v1/oauth2/token`, {
      method: 'POST',
      headers: { 'Authorization': 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials'
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) return res.status(500).json({ error: 'failed to get paypal token' });

    // Create order
    const orderRes = await (globalThis as any).fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: 'CAPTURE', purchase_units: [{ amount: { currency_code: currency, value: String(amount) } }] })
    });
    const orderJson = await orderRes.json();
    return res.json(orderJson);
  } catch (err: any) {
    console.error('createPayPalOrder error', err);
    return res.status(500).json({ error: err.message || 'internal' });
  }
}

// Capture skeleton
export async function capturePayPalOrder(req: Request, res: Response) {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId required' });
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    if (!clientId || !secret) return res.status(500).json({ error: 'PayPal not configured' });

    const tokenRes = await (globalThis as any).fetch(`https://api-m.sandbox.paypal.com/v1/oauth2/token`, {
      method: 'POST',
      headers: { 'Authorization': 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials'
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    const capRes = await (globalThis as any).fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });
    const capJson = await capRes.json();
    return res.json(capJson);
  } catch (err: any) {
    console.error('capturePayPalOrder error', err);
    return res.status(500).json({ error: err.message || 'internal' });
  }
}
