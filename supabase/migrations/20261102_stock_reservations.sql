-- Migration: Stock Reservations for Concurrency-Safe Inventory Locking
-- Prevents race conditions and overselling during checkout

CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id TEXT PRIMARY KEY,
  reservation_token TEXT UNIQUE NOT NULL,
  order_number TEXT NOT NULL,
  razorpay_order_id TEXT,
  customer_email TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'released', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning-fast lock queries
CREATE INDEX IF NOT EXISTS idx_stock_reservations_token ON public.stock_reservations (reservation_token);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_status_expires ON public.stock_reservations (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_order_number ON public.stock_reservations (order_number);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_rzp_order ON public.stock_reservations (razorpay_order_id);

-- Enable RLS
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on stock_reservations"
  ON public.stock_reservations
  FOR ALL
  USING (true)
  WITH CHECK (true);

