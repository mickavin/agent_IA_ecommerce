-- Migration: Création de la table products
-- Description: Table pour stocker les produits du catalogue

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  product_title TEXT,
  description TEXT,
  handle TEXT,
  thumbnail_url TEXT,
  stock INTEGER DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  gender TEXT,
  size TEXT,
  color TEXT,
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  images TEXT[] DEFAULT '{}',
  variant_title TEXT,
  url TEXT,
  available_for_sale BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_available_for_sale ON public.products(available_for_sale);

-- Index GIN pour les tableaux
CREATE INDEX IF NOT EXISTS idx_products_sizes_gin ON public.products USING GIN(sizes);
CREATE INDEX IF NOT EXISTS idx_products_colors_gin ON public.products USING GIN(colors);
CREATE INDEX IF NOT EXISTS idx_products_images_gin ON public.products USING GIN(images);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Commentaires
COMMENT ON TABLE public.products IS 'Catalogue des produits';
COMMENT ON COLUMN public.products.id IS 'Identifiant unique du produit';
COMMENT ON COLUMN public.products.name IS 'Nom du produit';
COMMENT ON COLUMN public.products.product_title IS 'Titre complet du produit';
COMMENT ON COLUMN public.products.stock IS 'Quantité en stock';
COMMENT ON COLUMN public.products.price IS 'Prix du produit';
COMMENT ON COLUMN public.products.sizes IS 'Tableau des tailles disponibles';
COMMENT ON COLUMN public.products.colors IS 'Tableau des couleurs disponibles';
COMMENT ON COLUMN public.products.images IS 'Tableau des URLs des images';


