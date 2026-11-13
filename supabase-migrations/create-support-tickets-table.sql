-- Migration: Création de la table support_tickets
-- Description: Table pour gérer les tickets de support client

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  creation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_to TEXT,
  description TEXT,
  attachments TEXT[] DEFAULT '{}',
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_email ON public.support_tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_order_id ON public.support_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_creation_date ON public.support_tickets(creation_date DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- Index GIN pour les tableaux
CREATE INDEX IF NOT EXISTS idx_support_tickets_attachments_gin ON public.support_tickets USING GIN(attachments);

-- Trigger pour mettre à jour updated_at et last_update
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_update = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- Commentaires
COMMENT ON TABLE public.support_tickets IS 'Tickets de support client';
COMMENT ON COLUMN public.support_tickets.status IS 'Statut du ticket (open, in_progress, resolved, closed)';
COMMENT ON COLUMN public.support_tickets.priority IS 'Priorité du ticket (low, medium, high, urgent)';
COMMENT ON COLUMN public.support_tickets.attachments IS 'Tableau des URLs des pièces jointes';


