-- Migration: Création de la table importations
-- Description: Table pour stocker l'historique des imports CSV

CREATE TABLE IF NOT EXISTS public.importations (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  doc_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  access_token TEXT,
  type TEXT,
  status TEXT,
  created_by TEXT,
  metadata JSONB
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_importations_created_at ON public.importations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_importations_type ON public.importations(type);
CREATE INDEX IF NOT EXISTS idx_importations_status ON public.importations(status);

-- Commentaires pour la documentation
COMMENT ON TABLE public.importations IS 'Historique des fichiers CSV importés dans le système';
COMMENT ON COLUMN public.importations.filename IS 'Nom du fichier CSV importé';
COMMENT ON COLUMN public.importations.doc_url IS 'URL du document/fichier importé';
COMMENT ON COLUMN public.importations.type IS 'Type d''import (enriched, products, orders, clients, etc.)';
COMMENT ON COLUMN public.importations.status IS 'Statut de l''import (completed, failed, pending, etc.)';
COMMENT ON COLUMN public.importations.metadata IS 'Métadonnées supplémentaires au format JSON';

-- Permissions (ajustez selon vos besoins)
-- ALTER TABLE public.importations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow read access to authenticated users" ON public.importations FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow insert access to authenticated users" ON public.importations FOR INSERT WITH CHECK (auth.role() = 'authenticated');








