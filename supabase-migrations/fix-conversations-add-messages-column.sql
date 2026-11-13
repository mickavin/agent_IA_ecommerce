-- Migration: Ajout de la colonne messages à la table conversations
-- Description: Ajoute la colonne messages (JSONB) si elle n'existe pas déjà

DO $$
BEGIN
  -- Vérifier si la colonne messages existe
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'messages'
  ) THEN
    -- Ajouter la colonne messages
    ALTER TABLE public.conversations 
    ADD COLUMN messages JSONB DEFAULT '[]'::jsonb;
    
    RAISE NOTICE 'Colonne "messages" ajoutée à la table conversations';
  ELSE
    RAISE NOTICE 'Colonne "messages" existe déjà';
  END IF;
END $$;

-- Vérifier et créer l'index GIN pour messages s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'conversations'
    AND indexname = 'idx_conversations_messages_gin'
  ) THEN
    CREATE INDEX idx_conversations_messages_gin ON public.conversations USING GIN(messages);
    RAISE NOTICE 'Index "idx_conversations_messages_gin" créé';
  ELSE
    RAISE NOTICE 'Index "idx_conversations_messages_gin" existe déjà';
  END IF;
END $$;

-- Commentaire sur la colonne
COMMENT ON COLUMN public.conversations.messages IS 'Tableau JSONB des messages de la conversation';


