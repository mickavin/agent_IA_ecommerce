-- Migration: Ajout des configurations avancées et générateur pour les chatbots
-- Description: Ajoute les colonnes advanced_config et generator_config pour stocker toutes les personnalisations

-- Ajouter la colonne advanced_config (comportement, animations, heures d'ouverture, etc.)
ALTER TABLE public.chatbots 
ADD COLUMN IF NOT EXISTS advanced_config JSONB DEFAULT '{
  "animation": "fade",
  "soundEffect": "soft-notification",
  "enableTypingIndicator": true,
  "enableReadReceipts": false,
  "enableQuickReplies": true,
  "maxConversationLength": 50,
  "responseDelay": 1000,
  "customCSS": "",
  "customAvatar": "",
  "brandLogo": "",
  "headerGradient": false,
  "shadowIntensity": 3,
  "borderWidth": 1,
  "fontFamily": "Inter",
  "fontSize": 14,
  "lineHeight": 1.5,
  "messageSpacing": 12,
  "enableEmojis": true,
  "enableFileUpload": false,
  "enableVoiceMessages": false,
  "customGreetings": [],
  "workingHours": {
    "enabled": false,
    "start": "09:00",
    "end": "18:00",
    "timezone": "Europe/Paris",
    "offlineMessage": "Nous sommes actuellement fermés. Laissez-nous un message !"
  }
}'::jsonb;

-- Ajouter la colonne generator_config (configuration complète du chatbot-generator.js)
ALTER TABLE public.chatbots 
ADD COLUMN IF NOT EXISTS generator_config JSONB DEFAULT '{
  "chatbotId": "",
  "title": "",
  "subtitle": "",
  "apiEndpoint": "http://localhost:3000/api/ai/master",
  "position": "bottom-right",
  "primaryColor": "#ff6f61",
  "secondaryColor": "#EFF6FF",
  "accentColor": "#ff6f61",
  "textColor": "#1F2937",
  "backgroundColor": "#FFFFFF",
  "borderRadius": "12px",
  "size": "standard",
  "showTypingIndicator": true,
  "enableSound": true,
  "autoOpen": false,
  "autoOpenDelay": 2000,
  "welcomeMessage": "",
  "placeholder": "",
  "personality": {
    "tone": "Amical",
    "formality": "Tutoiement",
    "verbosity": "Détaillé",
    "empathy": "Élevée",
    "proactivity": "Proactif"
  },
  "fontFamily": "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
  "buttonSize": 72,
  "shadowEffect": "neumorphic",
  "animationStyle": "gradient-pulse",
  "customIcon": null,
  "attentionText": {
    "enabled": false,
    "messages": ["Trouvez votre style !", "Besoin d'\''aide ? 💬"],
    "color": "#FFFFFF",
    "backgroundColor": "linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)",
    "animation": "bounce",
    "duration": 3000,
    "delay": 3000,
    "repeatInterval": 8000,
    "particleEffect": false,
    "trailEffect": false,
    "orbitRadius": 60,
    "orbitSpeed": 5,
    "orbitDirection": "clockwise",
    "curveIntensity": 0
  },
  "theme": "dark",
  "quickReplies": [],
  "enableQuickReplies": true,
  "enableEmojis": true,
  "enableFileUpload": false,
  "maxConversationLength": 50,
  "responseDelay": 1000,
  "enableReadReceipts": false,
  "workingHours": {
    "enabled": false,
    "start": "09:00",
    "end": "18:00",
    "timezone": "Europe/Paris",
    "offlineMessage": "Nous sommes actuellement fermés. Laissez-nous un message !"
  },
  "customCSS": "",
  "enableMarkdown": true,
  "showTimestamps": true,
  "showAvatars": true,
  "enableFeedback": true,
  "gdprCompliant": true
}'::jsonb;

-- Commentaires pour la documentation
COMMENT ON COLUMN public.chatbots.advanced_config IS 'Configuration avancée du chatbot (comportement, animations, heures d''ouverture, etc.)';
COMMENT ON COLUMN public.chatbots.generator_config IS 'Configuration complète pour chatbot-generator.js (toutes les options du widget)';

-- Index pour améliorer les performances des requêtes sur les configurations
CREATE INDEX IF NOT EXISTS idx_chatbots_advanced_config ON public.chatbots USING GIN (advanced_config);
CREATE INDEX IF NOT EXISTS idx_chatbots_generator_config ON public.chatbots USING GIN (generator_config);


