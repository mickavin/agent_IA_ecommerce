-- Migration: Création de la table user_preferences
-- Description: Table pour stocker les préférences utilisateurs

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preference_key)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_preference_key ON public.user_preferences(preference_key);
CREATE INDEX IF NOT EXISTS idx_user_preferences_created_at ON public.user_preferences(created_at DESC);

-- Index GIN pour JSONB
CREATE INDEX IF NOT EXISTS idx_user_preferences_preference_value_gin ON public.user_preferences USING GIN(preference_value);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Commentaires
COMMENT ON TABLE public.user_preferences IS 'Préférences utilisateurs';
COMMENT ON COLUMN public.user_preferences.user_id IS 'Identifiant de l\'utilisateur';
COMMENT ON COLUMN public.user_preferences.preference_key IS 'Clé de la préférence';
COMMENT ON COLUMN public.user_preferences.preference_value IS 'Valeur de la préférence au format JSON';


