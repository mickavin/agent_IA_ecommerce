-- Migration: Création de la table stock_items
-- Description: Table pour gérer les stocks des produits

CREATE TABLE IF NOT EXISTS public.stock_items (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  thumbnail_url TEXT,
  location TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reorder_threshold INTEGER DEFAULT 10,
  last_movement_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_stock_items_product_id ON public.stock_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_location ON public.stock_items(location);
CREATE INDEX IF NOT EXISTS idx_stock_items_quantity ON public.stock_items(quantity);
CREATE INDEX IF NOT EXISTS idx_stock_items_reorder_threshold ON public.stock_items(reorder_threshold);
CREATE INDEX IF NOT EXISTS idx_stock_items_created_at ON public.stock_items(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_stock_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_items_updated_at
  BEFORE UPDATE ON public.stock_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_items_updated_at();

-- Commentaires
COMMENT ON TABLE public.stock_items IS 'Gestion des stocks par produit et localisation';
COMMENT ON COLUMN public.stock_items.product_id IS 'Référence au produit';
COMMENT ON COLUMN public.stock_items.location IS 'Emplacement du stock (entrepôt, magasin, etc.)';
COMMENT ON COLUMN public.stock_items.reorder_threshold IS 'Seuil de réapprovisionnement';


