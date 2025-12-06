-- Migration: Création de la table chatbots
-- Description: Table pour stocker la configuration et les métriques des assistants IA

CREATE TABLE IF NOT EXISTS public.chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Inactif' CHECK (status IN ('Actif', 'Inactif', 'En test', 'Maintenance')),
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Configuration de personnalité (JSONB pour flexibilité)
  personality JSONB NOT NULL DEFAULT '{
    "tone": "Amical",
    "formality": "Tutoiement",
    "verbosity": "Détaillé",
    "empathy": "Élevée",
    "proactivity": "Proactif"
  }'::jsonb,
  
  -- Configuration visuelle (JSONB pour flexibilité)
  visual_config JSONB NOT NULL DEFAULT '{
    "primaryColor": "#3B82F6",
    "secondaryColor": "#EFF6FF",
    "textColor": "#1F2937",
    "backgroundColor": "#FFFFFF",
    "borderRadius": "Arrondi",
    "position": "Bas droite",
    "size": "Standard",
    "welcomeMessage": "Bonjour ! Comment puis-je vous aider aujourd''hui ?",
    "placeholder": "Tapez votre message..."
  }'::jsonb,
  
  -- Sources de données (JSONB pour flexibilité)
  data_sources JSONB DEFAULT '[]'::jsonb,
  
  -- Métriques
  conversations_count INTEGER DEFAULT 0,
  avg_response_time INTEGER DEFAULT 0, -- en millisecondes
  satisfaction_rate INTEGER DEFAULT 0, -- en pourcentage (0-100)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Métadonnées supplémentaires
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_chatbots_status ON public.chatbots(status);
CREATE INDEX IF NOT EXISTS idx_chatbots_is_default ON public.chatbots(is_default);
CREATE INDEX IF NOT EXISTS idx_chatbots_created_at ON public.chatbots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbots_updated_at ON public.chatbots(updated_at DESC);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_chatbots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chatbots_updated_at
  BEFORE UPDATE ON public.chatbots
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbots_updated_at();

-- Contrainte pour s'assurer qu'un seul chatbot est par défaut
CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbots_single_default 
  ON public.chatbots(is_default) 
  WHERE is_default = TRUE;

-- Commentaires pour la documentation
COMMENT ON TABLE public.chatbots IS 'Configuration et métriques des assistants IA (chatbots)';
COMMENT ON COLUMN public.chatbots.name IS 'Nom de l''assistant IA';
COMMENT ON COLUMN public.chatbots.description IS 'Description de l''assistant IA';
COMMENT ON COLUMN public.chatbots.status IS 'Statut de l''assistant (Actif, Inactif, En test, Maintenance)';
COMMENT ON COLUMN public.chatbots.is_default IS 'Indique si c''est l''assistant par défaut';
COMMENT ON COLUMN public.chatbots.personality IS 'Configuration de la personnalité au format JSON';
COMMENT ON COLUMN public.chatbots.visual_config IS 'Configuration visuelle du widget au format JSON';
COMMENT ON COLUMN public.chatbots.data_sources IS 'Liste des sources de données configurées au format JSON';
COMMENT ON COLUMN public.chatbots.conversations_count IS 'Nombre total de conversations';
COMMENT ON COLUMN public.chatbots.avg_response_time IS 'Temps de réponse moyen en millisecondes';
COMMENT ON COLUMN public.chatbots.satisfaction_rate IS 'Taux de satisfaction en pourcentage (0-100)';

-- Permissions (ajustez selon vos besoins)
-- ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow read access to authenticated users" ON public.chatbots FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow insert access to authenticated users" ON public.chatbots FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Allow update access to authenticated users" ON public.chatbots FOR UPDATE USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow delete access to authenticated users" ON public.chatbots FOR DELETE USING (auth.role() = 'authenticated');

