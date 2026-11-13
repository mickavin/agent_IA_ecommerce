-- Migration: Création de la table clients
-- Description: Table pour stocker les informations des clients

CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  birth_date DATE,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_order_date TIMESTAMPTZ,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  segment TEXT DEFAULT 'new',
  status TEXT DEFAULT 'active',
  preferences JSONB DEFAULT '{}'::jsonb,
  loyalty_points INTEGER DEFAULT 0,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_segment ON public.clients(segment);
CREATE INDEX IF NOT EXISTS idx_clients_registration_date ON public.clients(registration_date DESC);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_updated_at ON public.clients(updated_at DESC);

-- Index GIN pour les tableaux et JSONB
CREATE INDEX IF NOT EXISTS idx_clients_tags_gin ON public.clients USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_clients_preferences_gin ON public.clients USING GIN(preferences);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- Commentaires
COMMENT ON TABLE public.clients IS 'Base de données des clients';
COMMENT ON COLUMN public.clients.email IS 'Email unique du client';
COMMENT ON COLUMN public.clients.segment IS 'Segment client (new, regular, vip, etc.)';
COMMENT ON COLUMN public.clients.preferences IS 'Préférences client au format JSON';
COMMENT ON COLUMN public.clients.tags IS 'Tags pour catégoriser le client';


