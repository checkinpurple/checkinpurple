-- Create manual_payments table for admin reconciliation of PayPal.me/manual payments

CREATE TABLE manual_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount TEXT NOT NULL,
  tx_id TEXT NOT NULL,
  status VARCHAR CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE manual_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view manual payments for admin" ON manual_payments
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can insert their own manual payments" ON manual_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update manual payments" ON manual_payments
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
