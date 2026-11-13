-- Migration: Création de la table api_keys
-- Description: Table pour gérer les clés API pour la personnalisation

CREATE TABLE IF NOT EXISTS public.api_keys (
  id TEXT PRIMARY KEY,
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  api_secret TEXT,
  service_type TEXT NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  rate_limit INTEGER DEFAULT 1000,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON public.api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_service_type ON public.api_keys(service_type);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON public.api_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON public.api_keys(created_at DESC);

-- Index GIN pour JSONB
CREATE INDEX IF NOT EXISTS idx_api_keys_permissions_gin ON public.api_keys USING GIN(permissions);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- Commentaires
COMMENT ON TABLE public.api_keys IS 'Clés API pour services externes';
COMMENT ON COLUMN public.api_keys.api_key IS 'Clé API unique';
COMMENT ON COLUMN public.api_keys.service_type IS 'Type de service (openai, anthropic, etc.)';
COMMENT ON COLUMN public.api_keys.permissions IS 'Permissions au format JSON';


