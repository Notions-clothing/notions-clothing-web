-- ==============================================================================
-- MIGRATION: Dynamic Product Specifications (Key-Value)
-- ==============================================================================

-- Add specifications JSONB column to products table for storing direct key-value specifications
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '[]'::jsonb;
