-- Migration: Création de la table personalization_events
-- Description: Table pour stocker les événements de personnalisation

CREATE TABLE IF NOT EXISTS public.personalization_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_personalization_events_user_id ON public.personalization_events(user_id);
CREATE INDEX IF NOT EXISTS idx_personalization_events_event_type ON public.personalization_events(event_type);
CREATE INDEX IF NOT EXISTS idx_personalization_events_session_id ON public.personalization_events(session_id);
CREATE INDEX IF NOT EXISTS idx_personalization_events_created_at ON public.personalization_events(created_at DESC);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_personalization_events_user_type_date ON public.personalization_events(user_id, event_type, created_at DESC);

-- Index GIN pour JSONB
CREATE INDEX IF NOT EXISTS idx_personalization_events_event_data_gin ON public.personalization_events USING GIN(event_data);
CREATE INDEX IF NOT EXISTS idx_personalization_events_context_gin ON public.personalization_events USING GIN(context);

-- Commentaires
COMMENT ON TABLE public.personalization_events IS 'Événements de personnalisation utilisateur';
COMMENT ON COLUMN public.personalization_events.user_id IS 'Identifiant de l\'utilisateur';
COMMENT ON COLUMN public.personalization_events.event_type IS 'Type d\'événement (view, click, purchase, etc.)';
COMMENT ON COLUMN public.personalization_events.event_data IS 'Données de l\'événement au format JSON';
COMMENT ON COLUMN public.personalization_events.context IS 'Contexte de l\'événement au format JSON';


