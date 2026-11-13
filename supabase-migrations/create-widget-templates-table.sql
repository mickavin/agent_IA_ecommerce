-- Migration: Création de la table widget_templates
-- Description: Table pour stocker les templates de widgets réutilisables

CREATE TABLE IF NOT EXISTS public.widget_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  preview_image TEXT,
  config_template JSONB NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_widget_templates_category ON public.widget_templates(category);
CREATE INDEX IF NOT EXISTS idx_widget_templates_is_premium ON public.widget_templates(is_premium);
CREATE INDEX IF NOT EXISTS idx_widget_templates_usage_count ON public.widget_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_widget_templates_created_at ON public.widget_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_widget_templates_updated_at ON public.widget_templates(updated_at DESC);

-- Index GIN pour JSONB
CREATE INDEX IF NOT EXISTS idx_widget_templates_config_template_gin ON public.widget_templates USING GIN(config_template);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_widget_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_widget_templates_updated_at
  BEFORE UPDATE ON public.widget_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_widget_templates_updated_at();

-- Commentaires
COMMENT ON TABLE public.widget_templates IS 'Templates de widgets réutilisables';
COMMENT ON COLUMN public.widget_templates.category IS 'Catégorie du template';
COMMENT ON COLUMN public.widget_templates.config_template IS 'Configuration du template au format JSON';
COMMENT ON COLUMN public.widget_templates.is_premium IS 'Indique si le template est premium';


