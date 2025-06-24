# Younzee - Assistant IA E-commerce Mode

Assistant intelligent basé sur l'IA pour recommandations de mode et support client, propulsé par **OpenAI** et une architecture d'IAs spécialisées.

## 🤖 Nouvelle Architecture IA

### IAs Spécialisées Powered by OpenAI

- **🧠 IA Master** : Orchestrateur intelligent qui route les demandes vers la bonne IA
- **📚 IA FAQ** : Spécialisée dans le support client et questions fréquentes  
- **👕 IA Articles** : Recommandations de vêtements individuels personnalisées
- **👗 IA Outfits** : Création de tenues complètes et coordination de styles

### 🎯 Fonctionnalités Clés

- **Routage Intelligent** : Sélection automatique de l'IA appropriée selon le contexte
- **Personnalisation Avancée** : Adaptation du ton, formalité, verbosité selon la configuration
- **Réponses OpenAI** : Génération dynamique de réponses intelligentes et contextuelles
- **Compatibilité Totale** : Support des anciennes APIs avec redirection automatique
- **Fallbacks Robustes** : Système de secours en cas d'indisponibilité d'OpenAI

## 🚀 Installation Rapide

### 1. Cloner et installer

```bash
git clone <votre-repo>
cd younzee
npm install
# ou
pnpm install
```

### 2. Configuration OpenAI

```bash
# Copier le fichier d'exemple
cp .env.example .env.local

# Éditer .env.local et ajouter votre clé OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

### 3. Lancer le serveur

```bash
npm run dev
# ou 
pnpm dev
```

L'application sera disponible sur `http://localhost:3000`

## 📋 APIs Disponibles

### Nouvelle Architecture

```
POST /api/ai/master     # Point d'entrée principal (IA Master)
POST /api/ai/faq        # IA spécialisée FAQ
POST /api/ai/articles   # IA spécialisée Articles  
POST /api/ai/outfits    # IA spécialisée Outfits
```

### APIs de Compatibilité

```
POST /api/chat          # Redirection vers IA Master
POST /api/chat-stream   # Support streaming vers IA Master
```

## 🎨 Personnalisation des Réponses

Chaque IA adapte ses réponses selon la configuration :

```json
{
  "personality": {
    "tone": "Amical|Professionnel|Décontracté|Expert|Humoristique",
    "formality": "Tutoiement|Vouvoiement", 
    "verbosity": "Concis|Détaillé|Très détaillé",
    "empathy": "Faible|Moyenne|Élevée",
    "proactivity": "Réactif|Proactif|Très proactif"
  }
}
```

## 🧪 Tests et Validation

### Tests Automatisés

```bash
# Test complet de l'architecture
node scripts/test-new-ai-architecture.js

# Test des réponses contextuelles  
node scripts/test-contextual-responses.js
```

### Interface de Test

Accédez à `/components/ia-test-client` pour tester les IAs en temps réel avec différentes personnalités.

## 🔧 Configuration Avancée

### Variables OpenAI

```env
OPENAI_API_KEY=sk-your-key           # Clé API OpenAI (requis)
OPENAI_MODEL=gpt-3.5-turbo          # Modèle à utiliser
OPENAI_MAX_TOKENS=1000              # Tokens max par réponse
OPENAI_TEMPERATURE=0.7              # Créativité (0-1)
OPENAI_TIMEOUT=10000                # Timeout en ms
```

### Configuration IA Master

```env
AI_MASTER_CONFIDENCE_THRESHOLD=0.4   # Seuil de confiance
AI_MASTER_DEFAULT_AI=faq            # IA par défaut
AI_MASTER_ENABLE_LOGGING=true       # Logs détaillés
```

### Seuils de Confiance par IA

```env
FAQ_AI_CONFIDENCE_THRESHOLD=0.3      # IA FAQ
INDIVIDUAL_AI_CONFIDENCE_THRESHOLD=0.5  # IA Articles  
OUTFIT_AI_CONFIDENCE_THRESHOLD=0.5   # IA Outfits
```

## 📊 Monitoring et Analytics

L'IA Master collecte automatiquement :

- Statistiques de routage par IA
- Temps de traitement et performance  
- Taux de confiance et précision
- Logs détaillés des interactions

## 🔄 Migration depuis l'Ancienne Version

✅ **Migration Automatique** : Les anciennes URLs sont automatiquement redirigées vers la nouvelle architecture.

Aucune modification côté client n'est requise :
- `/api/ia` → `/api/ai/master`
- Widgets JavaScript : Mise à jour automatique
- Composants React : Mise à jour transparente

## 🤝 Intégration Widget

Le widget JavaScript est automatiquement mis à jour pour utiliser OpenAI :

```html
<script src="/chatbot-generator.js"></script>
<script>
  new YounzeeChatbot({
    apiEndpoint: '/api/ai/master',
    personality: {
      tone: 'Amical',
      formality: 'Tutoiement'
    }
  });
</script>
```

## 🆘 Dépannage

### Erreurs Communes

**Pas de réponse OpenAI** : Vérifiez votre clé API et quota
**Timeouts** : Augmentez `OPENAI_TIMEOUT` dans `.env.local`  
**Erreur 429** : Vous dépassez les limites de rate OpenAI
**Fallbacks** : L'IA utilise des réponses de secours si OpenAI est indisponible

### Mode Debug

```env
DEBUG_MODE=true
TEST_MODE=true  # Utilise des réponses simulées sans OpenAI
```

## 📈 Performance

- **Réponses Dynamiques** : Génération intelligente via OpenAI
- **Cache Intelligent** : Réutilisation de réponses similaires
- **Fallbacks Rapides** : Réponses de secours instantanées
- **Routage Optimisé** : Sélection d'IA en <100ms

## 🔒 Sécurité

- Rate limiting configuré (60 req/min par défaut)
- Validation des inputs utilisateur
- Timeout de protection pour les requêtes OpenAI
- Gestion sécurisée des clés API

---

**🎉 Votre assistant IA mode est maintenant propulsé par OpenAI !**

Pour toute question : [Créer une issue](https://github.com/votre-repo/issues) 