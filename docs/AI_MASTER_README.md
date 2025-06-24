# 🤖 Système IA Master - Architecture Modulaire

## Vue d'ensemble

Le système IA Master est une architecture modulaire et évolutive qui route intelligemment les requêtes utilisateurs vers des IA spécialisées. Il utilise une logique de classification automatique pour déterminer quelle IA enfant est la plus appropriée pour traiter chaque demande.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Route (/api/ia)                     │
│                  Point d'entrée REST                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  IA Master Service                         │
│              • Routage intelligent                         │
│              • Gestion des erreurs                         │
│              • Logging & Analytics                         │
│              • Configuration                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼────────┐
│   IA FAQ     │ │ IA Outfit│ │ IA Vêtements │
│              │ │          │ │ Individuels  │
│ • Questions  │ │ • Tenues │ │ • Produits   │
│ • Support    │ │ • Styles │ │ • Conseils   │
│ • Guides     │ │ • Looks  │ │ • Tendances  │
└──────────────┘ └──────────┘ └──────────────┘
```

## 🎯 IA Spécialisées

### 1. IA FAQ (`faq-ai.service.ts`)
**Spécialisation** : Questions fréquentes et support client
- **Déclencheurs** : Mots-clés de questions (comment, pourquoi, aide...)
- **Fonctionnalités** :
  - Base de données FAQ intégrée
  - Recherche sémantique
  - Gestion de la popularité
  - Support multilingue

### 2. IA Recommandation Outfit (`outfit-recommendation-ai.service.ts`)
**Spécialisation** : Tenues complètes et looks coordonnés
- **Déclencheurs** : "outfit", "tenue", "look", occasions spécifiques
- **Fonctionnalités** :
  - Génération de tenues complètes
  - Harmonie des couleurs
  - Adaptation aux occasions
  - Règles de style intégrées

### 3. IA Vêtements Individuels (`individual-clothing-ai.service.ts`)
**Spécialisation** : Recommandations de produits spécifiques
- **Déclencheurs** : "recommande", noms de produits, critères spécifiques
- **Fonctionnalités** :
  - Scoring avancé des produits
  - Filtrage multi-critères
  - Personnalisation utilisateur
  - Gestion des stocks

## 🚀 Installation et Configuration

### 1. Dépendances
Le système utilise les dépendances existantes de votre projet Next.js.

### 2. Variables d'environnement

Créez un fichier `.env.local` avec les variables suivantes :

```bash
# Configuration IA Master
AI_MASTER_CONFIDENCE_THRESHOLD=0.4
AI_MASTER_MAX_PROCESSING_TIME=30000
AI_MASTER_ENABLE_LOGGING=true
AI_MASTER_DEFAULT_AI=individual_clothing_recommendation

# Configuration IA externe (optionnel)
AI_PROVIDER=openai
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Configuration spécifique aux IA
FAQ_AI_CONFIDENCE_THRESHOLD=0.3
OUTFIT_AI_MAX_OUTFITS=3
INDIVIDUAL_AI_MAX_RECOMMENDATIONS=5
```

### 3. Initialisation

Le système s'initialise automatiquement au premier appel API. Aucune configuration supplémentaire n'est requise.

## 📡 Utilisation de l'API

### Point d'entrée principal

```typescript
POST /api/ia
Content-Type: application/json

{
  "message": "Je cherche une tenue pour le travail",
  "userId": "user-123", // optionnel
  "context": {
    "userPreferences": {
      "gender": "Femme",
      "budget": { "min": 0, "max": 200 },
      "colors": ["noir", "blanc"],
      "categories": ["Hauts", "Bas"]
    },
    "conversationHistory": [], // optionnel
    "previousIntent": "greeting" // optionnel
  }
}
```

### Réponse type

```typescript
{
  "success": true,
  "data": {
    "id": "outfit-response-1234567890",
    "content": "✨ **Voici mes recommandations d'outfits pour travail** ✨\n\n🏆 **Outfit 1** :\n   👔 Chemise blanche classique - 45€\n   👖 Pantalon noir ajusté - 65€\n   👟 Escarpins noirs - 85€\n   💰 Total: 195€",
    "aiType": "outfit_recommendation",
    "confidence": 0.8,
    "metadata": {
      "processingTime": 250,
      "intent": "outfit_recommendation",
      "entities": {
        "occasion": "travail",
        "style": "professionnel"
      },
      "recommendations": [...],
      "totalRecommendations": 3
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req-1234567890-abc123"
}
```

### Endpoints d'administration

```bash
# Statistiques de performance
GET /api/ia?action=stats&period=24h

# Configuration actuelle
GET /api/ia?action=config

# Logs récents
GET /api/ia?action=logs&limit=50

# Test de routage
GET /api/ia?action=test-routing&message=Je%20veux%20une%20robe

# Mise à jour de configuration
PUT /api/ia
{
  "config": {
    "confidenceThreshold": 0.5
  }
}

# Nettoyage des logs
DELETE /api/ia?action=cleanup-logs&days=30
```

## 🧠 Logique de Routage

Le système utilise une approche multi-critères pour router les requêtes :

### 1. Analyse des mots-clés
Chaque IA enfant définit ses mots-clés spécialisés
```typescript
keywords: [
  'outfit', 'tenue', 'look', 'style', 'ensemble'
]
```

### 2. Patterns regex
Détection de structures linguistiques spécifiques
```typescript
patterns: [
  /outfit/i,
  /tenue.*(complète|pour|occasion)/i,
  /que.*porter.*pour/i
]
```

### 3. Score de confiance
Calcul automatique basé sur :
- Correspondance des mots-clés (30%)
- Patterns regex (40%)
- Contexte utilisateur (20%)
- Historique de conversation (10%)

### 4. Seuil de confiance
- Seuil minimum : 0.4 (configurable)
- IA par défaut si aucune correspondance
- Logging automatique des décisions

## 📊 Monitoring et Analytics

### Métriques automatiques
- Temps de traitement par IA
- Taux de succès des réponses
- Distribution des requêtes
- Confiance moyenne du routage
- Intents les plus fréquents

### Logs structurés
```typescript
{
  "id": "log-1234567890-abc123",
  "requestId": "req-1234567890-def456",
  "selectedAI": "outfit_recommendation",
  "routingConfidence": 0.8,
  "processingTime": 250,
  "responseGenerated": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "metadata": {
    "requestMessage": "Je veux une tenue pour le travail",
    "routingReason": "IA Recommandation Outfit sélectionnée - Confiance: 80%",
    "alternativeAIs": ["individual_clothing_recommendation"]
  }
}
```

## 🔧 Extension du Système

### Ajouter une nouvelle IA

1. **Créer le service IA**
```typescript
// lib/services/nouvelle-ia.service.ts
export class NouvelleIAService implements IChildAI {
  public readonly type: AIType = 'nouvelle_ia'
  public readonly name = 'Nouvelle IA'
  
  async canHandle(request: AIRequest): Promise<{canHandle: boolean; confidence: number}> {
    // Logique de détection
  }
  
  async process(request: AIRequest): Promise<AIResponse> {
    // Logique de traitement
  }
  
  getConfig(): ChildAIConfig {
    // Configuration de l'IA
  }
}
```

2. **Mettre à jour les types**
```typescript
// lib/types.ts
export type AIType = 'faq' | 'outfit_recommendation' | 'individual_clothing_recommendation' | 'nouvelle_ia'
```

3. **Enregistrer dans le Master**
```typescript
// lib/services/ia-master.service.ts
private initializeChildAIs(): void {
  // ... existing AIs
  const nouvelleIA = new NouvelleIAService()
  this.childAIs.set(nouvelleIA.type, nouvelleIA)
}
```

### Personnaliser le routage

Modifiez la logique dans `routeRequest()` pour ajouter des critères personnalisés :

```typescript
// Exemple : bonus pour certains utilisateurs
if (request.userId === 'premium-user') {
  confidence += 0.1
}

// Exemple : routage basé sur l'historique
if (request.context?.previousIntent === 'outfit') {
  // Favoriser l'IA outfit
}
```

## 🔒 Sécurité et Performance

### Rate Limiting
- 60 requêtes par minute par IP (configurable)
- Identification par headers X-Forwarded-For
- Messages d'erreur personnalisés

### Validation des entrées
- Taille maximale des messages : 1000 caractères
- Sanitisation automatique
- Validation des types TypeScript

### Gestion des erreurs
- Timeout automatique (30s par défaut)
- Fallback intelligent
- Logging des erreurs
- Messages utilisateur personnalisés

### Cache et optimisation
- Instance unique du Master (singleton)
- Réutilisation des connexions
- Gestion mémoire des logs (1000 max)
- Nettoyage automatique

## 🧪 Tests et Débogage

### Mode debug
```bash
DEBUG_MODE=true
```
Active des logs détaillés pour le développement.

### Test de routage
```bash
curl "http://localhost:3000/api/ia?action=test-routing&message=Je%20veux%20une%20robe%20rouge"
```

### Exemple de requêtes de test

```javascript
// FAQ
await fetch('/api/ia', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Comment retourner un article ?"
  })
})

// Outfit
await fetch('/api/ia', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Je veux une tenue pour une soirée"
  })
})

// Produit individuel
await fetch('/api/ia', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Recommande-moi un t-shirt rouge"
  })
})
```

## 📈 Évolutions Futures

### Intégration IA externe
- Support OpenAI GPT
- Support Anthropic Claude
- Support Grok
- API configurables

### Fonctionnalités avancées
- Cache Redis pour les réponses
- Queue de traitement asynchrone
- Webhooks pour notifications
- Interface d'administration web
- A/B testing du routage
- Machine Learning pour améliorer le routage

### Analytics avancés
- Dashboard temps réel
- Métriques business
- Satisfaction utilisateur
- Optimisation continue

## 🆘 Dépannage

### Problèmes courants

**1. Aucune IA ne répond**
- Vérifiez les logs dans la console
- Testez avec `?action=test-routing`
- Vérifiez la configuration des seuils

**2. Mauvais routage**
- Ajustez `AI_MASTER_CONFIDENCE_THRESHOLD`
- Vérifiez les mots-clés des IA enfants
- Consultez les logs de routage

**3. Timeouts fréquents**
- Augmentez `AI_MASTER_MAX_PROCESSING_TIME`
- Vérifiez les performances de la base de données
- Optimisez les requêtes des IA enfants

**4. Erreurs de configuration**
- Utilisez `validateConfig()` pour diagnostiquer
- Consultez les messages de validation
- Vérifiez les variables d'environnement

### Support
Pour toute question ou problème, consultez :
- Les logs de l'application
- La documentation des types TypeScript
- Les exemples de test inclus 