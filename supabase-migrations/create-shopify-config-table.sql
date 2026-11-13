-- Migration: Création de la table shopify_config
-- Description: Table pour stocker les configurations Shopify

CREATE TABLE IF NOT EXISTS public.shopify_config (
  id BIGSERIAL PRIMARY KEY,
  shop_name TEXT NOT NULL,
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  metadata JSONB
);

-- Index pour améliorer les performances
CREATE UNIQUE INDEX IF NOT EXISTS idx_shopify_config_shop_name ON public.shopify_config(shop_name);
CREATE INDEX IF NOT EXISTS idx_shopify_config_enabled ON public.shopify_config(enabled);

-- Commentaires pour la documentation
COMMENT ON TABLE public.shopify_config IS 'Configuration des API Shopify';
COMMENT ON COLUMN public.shopify_config.shop_name IS 'Nom de la boutique Shopify (sans .myshopify.com)';
COMMENT ON COLUMN public.shopify_config.api_key IS 'Clé API Shopify';
COMMENT ON COLUMN public.shopify_config.api_secret IS 'Secret API Shopify';
COMMENT ON COLUMN public.shopify_config.access_token IS 'Token d''accès Shopify';
COMMENT ON COLUMN public.shopify_config.enabled IS 'Indique si la configuration est active';
COMMENT ON COLUMN public.shopify_config.metadata IS 'Métadonnées supplémentaires au format JSON';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_shopify_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shopify_config_updated_at
  BEFORE UPDATE ON public.shopify_config
  FOR EACH ROW
  EXECUTE FUNCTION update_shopify_config_updated_at();


