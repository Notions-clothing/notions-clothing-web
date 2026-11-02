-- ==============================================================================
-- MIGRATION: Brand Showcase Section (TANAY by notions)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.brand_showcase (
  id TEXT PRIMARY KEY DEFAULT 'brand-showcase-tanay',
  is_enabled BOOLEAN DEFAULT true,
  section_label TEXT DEFAULT 'OUR OWN BRAND',
  heading TEXT DEFAULT 'A Signature of Our Own',
  description TEXT DEFAULT 'Premium everyday wear crafted for modern men. Timeless style, trusted quality.',
  brand_logo_url TEXT,
  brand_logo_public_id TEXT,
  background_image_url TEXT DEFAULT '/tanay-showcase-bg.jpg',
  background_image_public_id TEXT,
  button_text TEXT DEFAULT 'Explore TANAY',
  category_id TEXT,
  category_slug TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe RLS
ALTER TABLE public.brand_showcase ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'brand_showcase' AND policyname = 'Public read brand_showcase'
  ) THEN
    CREATE POLICY "Public read brand_showcase" ON public.brand_showcase FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'brand_showcase' AND policyname = 'Admin write brand_showcase'
  ) THEN
    CREATE POLICY "Admin write brand_showcase" ON public.brand_showcase FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

