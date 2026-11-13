-- Migration: Ajout des colonnes manquantes à la table conversations
-- Description: Ajoute toutes les colonnes nécessaires si elles n'existent pas déjà
-- Cette migration est idempotente et peut être exécutée plusieurs fois sans erreur

DO $$
BEGIN
  -- Ajouter la colonne messages si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'messages'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN messages JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Colonne "messages" ajoutée à la table conversations';
  END IF;

  -- Ajouter la colonne client_info si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'client_info'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN client_info JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Colonne "client_info" ajoutée à la table conversations';
  END IF;

  -- Ajouter la colonne metadata si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Colonne "metadata" ajoutée à la table conversations';
  END IF;

  -- Ajouter la colonne tags si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN tags TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Colonne "tags" ajoutée à la table conversations';
  END IF;

  -- Ajouter la colonne resolved_issue si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'resolved_issue'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN resolved_issue BOOLEAN DEFAULT false;
    RAISE NOTICE 'Colonne "resolved_issue" ajoutée à la table conversations';
  END IF;

  -- Ajouter la colonne satisfaction si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'satisfaction'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN satisfaction INTEGER CHECK (satisfaction >= 1 AND satisfaction <= 5);
    RAISE NOTICE 'Colonne "satisfaction" ajoutée à la table conversations';
  END IF;

  -- Ajouter la colonne ended_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN ended_at TIMESTAMPTZ;
    RAISE NOTICE 'Colonne "ended_at" ajoutée à la table conversations';
  END IF;
END $$;

-- Créer les index manquants
DO $$
BEGIN
  -- Index GIN pour messages
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'conversations'
    AND indexname = 'idx_conversations_messages_gin'
  ) THEN
    CREATE INDEX idx_conversations_messages_gin ON public.conversations USING GIN(messages);
    RAISE NOTICE 'Index "idx_conversations_messages_gin" créé';
  END IF;

  -- Index GIN pour client_info
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'conversations'
    AND indexname = 'idx_conversations_client_info_gin'
  ) THEN
    CREATE INDEX idx_conversations_client_info_gin ON public.conversations USING GIN(client_info);
    RAISE NOTICE 'Index "idx_conversations_client_info_gin" créé';
  END IF;

  -- Index GIN pour tags
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'conversations'
    AND indexname = 'idx_conversations_tags_gin'
  ) THEN
    CREATE INDEX idx_conversations_tags_gin ON public.conversations USING GIN(tags);
    RAISE NOTICE 'Index "idx_conversations_tags_gin" créé';
  END IF;

  -- Index btree pour recherche dans client_info (anonymousId)
  -- Utilisation de btree car GIN ne supporte pas TEXT directement
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'conversations'
    AND indexname = 'idx_conversations_client_anonymous_id'
  ) THEN
    CREATE INDEX idx_conversations_client_anonymous_id ON public.conversations 
      USING btree ((client_info->>'anonymousId'));
    RAISE NOTICE 'Index "idx_conversations_client_anonymous_id" créé';
  END IF;

  -- Index btree pour recherche dans client_info (ipAddress)
  -- Utilisation de btree car GIN ne supporte pas TEXT directement
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'conversations'
    AND indexname = 'idx_conversations_client_ip'
  ) THEN
    CREATE INDEX idx_conversations_client_ip ON public.conversations 
      USING btree ((client_info->>'ipAddress'));
    RAISE NOTICE 'Index "idx_conversations_client_ip" créé';
  END IF;
END $$;

-- Commentaires sur les colonnes
COMMENT ON COLUMN public.conversations.messages IS 'Tableau JSONB des messages de la conversation';
COMMENT ON COLUMN public.conversations.client_info IS 'Informations client anonymisées (IP, device, browser) - AUCUNE donnée personnelle';
COMMENT ON COLUMN public.conversations.tags IS 'Tags pour catégoriser la conversation';
COMMENT ON COLUMN public.conversations.resolved_issue IS 'Indique si le problème a été résolu';
COMMENT ON COLUMN public.conversations.satisfaction IS 'Note de satisfaction de 1 à 5';


