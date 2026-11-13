-- Migration: Création de la table conversations
-- Description: Table pour stocker les conversations entre les utilisateurs et les chatbots
-- POLITIQUE DE CONFIDENTIALITÉ: Identification UNIQUEMENT par adresse IP + ID anonyme

CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chatbot_id TEXT NOT NULL,
  user_id TEXT, -- ID anonyme de l'utilisateur (format: [PREFIX]_[SHOP_ID]_[12_DIGITS_RANDOM])
  session_id TEXT NOT NULL,
  
  -- Dates
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Statut et métriques
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Fermée', 'Abandonnée')),
  satisfaction INTEGER CHECK (satisfaction >= 1 AND satisfaction <= 5),
  sentiment TEXT NOT NULL DEFAULT 'Neutre' CHECK (sentiment IN ('Positive', 'Neutre', 'Négative')),
  resolved_issue BOOLEAN DEFAULT false,
  
  -- Tags et catégorisation
  tags TEXT[] DEFAULT '{}',
  
  -- Informations client anonymisées (JSONB pour flexibilité)
  client_info JSONB DEFAULT '{}'::jsonb,
  -- Structure attendue:
  -- {
  --   "anonymousId": "EC_001_847293651084",
  --   "ipAddress": "192.168.1.45",
  --   "device": "Desktop",
  --   "browser": "Chrome"
  -- }
  
  -- Messages de la conversation (JSONB pour stocker le tableau de messages)
  messages JSONB DEFAULT '[]'::jsonb,
  -- Structure attendue:
  -- [
  --   {
  --     "id": "msg1",
  --     "content": "Bonjour ! Comment puis-je vous aider ?",
  --     "type": "bot",
  --     "timestamp": "2024-01-20T10:30:00Z",
  --     "metadata": { ... }
  --   }
  -- ]
  
  -- Métadonnées supplémentaires
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_id ON public.conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_sentiment ON public.conversations(sentiment);
CREATE INDEX IF NOT EXISTS idx_conversations_started_at ON public.conversations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_ended_at ON public.conversations(ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_resolved_issue ON public.conversations(resolved_issue);

-- Index GIN pour les tableaux et JSONB
CREATE INDEX IF NOT EXISTS idx_conversations_tags_gin ON public.conversations USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_conversations_messages_gin ON public.conversations USING GIN(messages);
CREATE INDEX IF NOT EXISTS idx_conversations_client_info_gin ON public.conversations USING GIN(client_info);

-- Index btree pour recherche dans client_info (anonymousId, ipAddress)
-- Utilisation de btree car GIN ne supporte pas TEXT directement extrait de JSONB
CREATE INDEX IF NOT EXISTS idx_conversations_client_anonymous_id ON public.conversations 
  USING btree ((client_info->>'anonymousId'));
CREATE INDEX IF NOT EXISTS idx_conversations_client_ip ON public.conversations 
  USING btree ((client_info->>'ipAddress'));

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- Commentaires
COMMENT ON TABLE public.conversations IS 'Conversations entre utilisateurs et chatbots';
COMMENT ON COLUMN public.conversations.user_id IS 'ID anonyme de l''utilisateur (format: [PREFIX]_[SHOP_ID]_[12_DIGITS_RANDOM])';
COMMENT ON COLUMN public.conversations.client_info IS 'Informations client anonymisées (IP, device, browser) - AUCUNE donnée personnelle';
COMMENT ON COLUMN public.conversations.messages IS 'Tableau JSONB des messages de la conversation';
COMMENT ON COLUMN public.conversations.satisfaction IS 'Note de satisfaction de 1 à 5';
COMMENT ON COLUMN public.conversations.sentiment IS 'Sentiment global de la conversation (Positive, Neutre, Négative)';


