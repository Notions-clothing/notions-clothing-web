-- ==============================================================================
-- MIGRATION: Brand Management & Product-Brand Relations
-- ==============================================================================

-- 1. Create Brands Table
CREATE TABLE IF NOT EXISTS public.brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  logo_public_id TEXT,
  banner_url TEXT,
  banner_public_id TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Brand Foreign Key & Cached Metadata to Products Table (Safe / Non-Breaking)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_slug TEXT;

-- 3. Add Brand Reference to Brand Showcase Table
ALTER TABLE public.brand_showcase ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.brand_showcase ADD COLUMN IF NOT EXISTS brand_slug TEXT;

-- 4. Enable Safe Row Level Security
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'brands' AND policyname = 'Public read brands'
  ) THEN
    CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'brands' AND policyname = 'Admin write brands'
  ) THEN
    CREATE POLICY "Admin write brands" ON public.brands FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

