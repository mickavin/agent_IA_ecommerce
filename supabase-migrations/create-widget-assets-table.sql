-- Migration: Création de la table widget_assets
-- Description: Table pour stocker les assets (images, fichiers) des widgets

CREATE TABLE IF NOT EXISTS public.widget_assets (
  id TEXT PRIMARY KEY,
  widget_config_id TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  alt_text TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_widget_assets_widget_config_id ON public.widget_assets(widget_config_id);
CREATE INDEX IF NOT EXISTS idx_widget_assets_asset_type ON public.widget_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_widget_assets_is_default ON public.widget_assets(is_default);
CREATE INDEX IF NOT EXISTS idx_widget_assets_created_at ON public.widget_assets(created_at DESC);

-- Commentaires
COMMENT ON TABLE public.widget_assets IS 'Assets (images, fichiers) des widgets';
COMMENT ON COLUMN public.widget_assets.widget_config_id IS 'Référence à la configuration du widget';
COMMENT ON COLUMN public.widget_assets.asset_type IS 'Type d\'asset (logo, icon, background, etc.)';
COMMENT ON COLUMN public.widget_assets.file_url IS 'URL du fichier asset';


