-- Migration: Création de la table widget_configurations
-- Description: Table pour stocker les configurations des widgets chatbot

CREATE TABLE IF NOT EXISTS public.widget_configurations (
  id TEXT PRIMARY KEY,
  chatbot_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  theme JSONB DEFAULT '{}'::jsonb,
  layout JSONB DEFAULT '{}'::jsonb,
  behavior JSONB DEFAULT '{}'::jsonb,
  messages JSONB DEFAULT '{}'::jsonb,
  advanced_config JSONB DEFAULT '{}'::jsonb,
  integrations JSONB DEFAULT '{}'::jsonb,
  allowed_domains TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  installation_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_widget_configurations_chatbot_id ON public.widget_configurations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_widget_configurations_is_active ON public.widget_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_widget_configurations_is_public ON public.widget_configurations(is_public);
CREATE INDEX IF NOT EXISTS idx_widget_configurations_created_at ON public.widget_configurations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_widget_configurations_updated_at ON public.widget_configurations(updated_at DESC);

-- Index GIN pour les tableaux et JSONB
CREATE INDEX IF NOT EXISTS idx_widget_configurations_allowed_domains_gin ON public.widget_configurations USING GIN(allowed_domains);
CREATE INDEX IF NOT EXISTS idx_widget_configurations_theme_gin ON public.widget_configurations USING GIN(theme);
CREATE INDEX IF NOT EXISTS idx_widget_configurations_layout_gin ON public.widget_configurations USING GIN(layout);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_widget_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_widget_configurations_updated_at
  BEFORE UPDATE ON public.widget_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_widget_configurations_updated_at();

-- Commentaires
COMMENT ON TABLE public.widget_configurations IS 'Configurations des widgets chatbot';
COMMENT ON COLUMN public.widget_configurations.chatbot_id IS 'Référence au chatbot';
COMMENT ON COLUMN public.widget_configurations.theme IS 'Configuration du thème au format JSON';
COMMENT ON COLUMN public.widget_configurations.allowed_domains IS 'Domaines autorisés pour l\'installation';


