-- Migration: Création de la table faq
-- Description: Table pour stocker les questions fréquemment posées (FAQ)

CREATE TABLE IF NOT EXISTS public.faq (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Commandes', 'Livraison', 'Retours', 'Paiements', 'Produits', 'Compte', 'Technique')),
  status TEXT NOT NULL DEFAULT 'Brouillon' CHECK (status IN ('Publié', 'Brouillon', 'Archivé')),
  tags TEXT[] DEFAULT '{}',
  popularity INTEGER DEFAULT 0,
  is_highlighted BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_faq_category ON public.faq(category);
CREATE INDEX IF NOT EXISTS idx_faq_status ON public.faq(status);
CREATE INDEX IF NOT EXISTS idx_faq_is_highlighted ON public.faq(is_highlighted);
CREATE INDEX IF NOT EXISTS idx_faq_popularity ON public.faq(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_faq_created_at ON public.faq(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faq_updated_at ON public.faq(updated_at DESC);

-- Index GIN pour les tableaux
CREATE INDEX IF NOT EXISTS idx_faq_tags_gin ON public.faq USING GIN(tags);

-- Index de recherche full-text (optionnel, pour recherche avancée)
CREATE INDEX IF NOT EXISTS idx_faq_search ON public.faq USING gin(to_tsvector('french', question || ' ' || answer));

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_faq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_faq_updated_at
  BEFORE UPDATE ON public.faq
  FOR EACH ROW
  EXECUTE FUNCTION update_faq_updated_at();

-- Commentaires
COMMENT ON TABLE public.faq IS 'Questions fréquemment posées (FAQ)';
COMMENT ON COLUMN public.faq.question IS 'Question posée par l''utilisateur';
COMMENT ON COLUMN public.faq.answer IS 'Réponse détaillée à la question';
COMMENT ON COLUMN public.faq.category IS 'Catégorie de la FAQ';
COMMENT ON COLUMN public.faq.status IS 'Statut de publication (Publié, Brouillon, Archivé)';
COMMENT ON COLUMN public.faq.tags IS 'Tags pour catégoriser et rechercher';
COMMENT ON COLUMN public.faq.popularity IS 'Nombre de fois que la FAQ a été consultée';
COMMENT ON COLUMN public.faq.is_highlighted IS 'Indique si la FAQ est mise en avant';


