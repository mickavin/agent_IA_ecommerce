# 🦜 Architecture Langchain - Infrastructure IA Younzee

## Vue d'ensemble

Cette architecture Langchain remplace l'ancien système d'IA basé sur des appels directs à OpenAI par une infrastructure plus robuste, modulaire et évolutive utilisant le framework Langchain.

## 🏗️ Architecture Générale

```
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LANGCHAIN                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌───────────────────────────────┐   │
│  │   API Endpoints │    │        Agent Master           │   │
│  │                 │    │                               │   │
│  │ /langchain/     │───▶│  - Routage intelligent       │   │
│  │ ├── chat.ts     │    │  - Personnalisation          │   │
│  │ └── chat-stream │    │  - Orchestration              │   │
│  └─────────────────┘    └───────────────────────────────┘   │
│                                      │                      │
│                      ┌───────────────┼───────────────┐     │
│                      ▼               ▼               ▼     │
│              ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│              │ FAQ Agent   │ │Articles Agent│ │Outfits Agent││
│              │             │ │             │ │             ││
│              │ - Salutations│ │ - Produits  │ │ - Tenues    ││
│              │ - Support   │ │ - Conseils  │ │ - Styling   ││
│              │ - FAQ       │ │ - Filtrage  │ │ - Occasions ││
│              └─────────────┘ └─────────────┘ └─────────────┘│
│                                                             │
│              ┌─────────────────────────────────────────────┐│
│              │          Service Base Langchain            ││
│              │                                             ││
│              │  - Chains Management                        ││
│              │  - Prompt Templates                         ││
│              │  - Error Handling                           ││
│              │  - Metrics & Logging                        ││
│              └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Composants Principaux

### 1. Service Base Langchain (`BaseLangchainService`)

**Fichier:** `lib/langchain/base.langchain.service.ts`

Service fondateur qui fournit l'infrastructure commune à tous les agents :

- **Gestion des LLM** : Configuration OpenAI via Langchain
- **Chains Factory** : Création et gestion des chains
- **Parsing de réponses** : Traitement des sorties LLM
- **Gestion d'erreurs** : Robustesse et fallbacks
- **Métriques** : Logging et monitoring

```typescript
// Exemple d'utilisation
const agent = new BaseLangchainService({
  agentType: 'faq',
  temperature: 0.3,
  maxTokens: 500
})

const chain = agent.createSimpleChain(promptTemplate)
const result = await agent.executeChain(chain, input)
```

### 2. Agents Spécialisés

#### FAQ Agent (`FAQLangchainAgent`)
- **Responsabilité** : Questions fréquentes et support client
- **Chains** :
  - `greetingChain` : Gestion des salutations
  - `searchChain` : Recherche dans la FAQ
  - `faqChain` : Chain principale avec routage
- **Base de connaissances** : Informations Younzee intégrées

#### Articles Agent (`ArticlesLangchainAgent`)
- **Responsabilité** : Recommandations produits individuels
- **Chains** :
  - `analysisChain` : Analyse des critères client
  - `recommendationChain` : Génération de recommandations
- **Base de produits** : Catalogue intégré avec filtrage

#### Outfits Agent (`OutfitsLangchainAgent`)
- **Responsabilité** : Création d'outfits complets
- **Chains** :
  - `analysisChain` : Analyse des besoins outfit
  - `creationChain` : Création d'ensembles harmonieux
- **Base d'articles** : Articles catégorisés pour outfits

### 3. Agent Master (`MasterLangchainAgent`)

**Fichier:** `lib/langchain/agents/master.langchain.agent.ts`

Orchestrateur principal avec fonctionnalités avancées :

- **Routage intelligent** : Analyse et direction vers l'agent approprié
- **Personnalisation** : Application des configurations chatbot
- **Fallback** : Gestion des cas non traités
- **Intégration Supabase** : Récupération des configurations

```typescript
// Workflow Master Agent
1. Analyse de la demande (routingChain)
2. Sélection de l'agent spécialisé
3. Exécution par l'agent choisi
4. Personnalisation de la réponse (personalizationChain)
5. Enrichissement des métadonnées
```

## 🚀 Endpoints API

### Chat Standard (`/api/langchain/chat`)

Endpoint principal pour les interactions synchrones :

```json
POST /api/langchain/chat
{
  "message": "Je cherche un t-shirt bleu",
  "chatbotId": "chatbot-123",
  "context": {},
  "conversationHistory": []
}
```

**Réponse:**
```json
{
  "success": true,
  "response": {
    "id": "langchain-1234567890-abc123",
    "content": "🎯 **Mes Recommandations pour vous**...",
    "type": "bot",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "metadata": {
      "framework": "Langchain",
      "version": "1.0",
      "routedTo": "articles",
      "confidence": 0.8,
      "personalityApplied": { "tone": "Amical" },
      "processingTime": 1500
    }
  }
}
```

### Chat Streaming (`/api/langchain/chat-stream`)

Endpoint pour les réponses en temps réel :

```javascript
// Utilisation côté client
const response = await fetch('/api/langchain/chat-stream', {
  method: 'POST',
  body: JSON.stringify({ message: 'Bonjour' })
})

const reader = response.body.getReader()
// Stream processing...
```

## 🧪 Tests et Validation

### Script de Test (`scripts/test-langchain-infrastructure.js`)

Test complet de l'infrastructure :

```bash
node scripts/test-langchain-infrastructure.js
```

**Tests inclus :**
- ✅ Connexion de chaque agent
- ✅ Traitement des cas d'usage
- ✅ Routage Master Agent
- ✅ Performance et latence
- ✅ Gestion d'erreurs

## 📊 Avantages de l'Architecture Langchain

### 1. **Modularité**
- Agents indépendants et réutilisables
- Séparation claire des responsabilités
- Extensibilité facile

### 2. **Robustesse**
- Gestion d'erreurs centralisée
- Fallbacks automatiques
- Logging et monitoring intégrés

### 3. **Performance**
- Instances partagées (singleton pattern)
- Optimisation des requêtes LLM
- Gestion de la latence

### 4. **Évolutivité**
- Framework Langchain standard
- Chains composables
- Agents pluggables

### 5. **Personnalisation**
- Configuration par chatbot
- Adaptation du ton et style
- Contexte conversationnel

## 🔄 Migration depuis l'Ancienne Architecture

### Comparaison

| Aspect | Ancienne Architecture | Nouvelle Architecture Langchain |
|--------|----------------------|----------------------------------|
| **Structure** | Endpoints individuels | Agents orchestrés |
| **LLM** | Appels OpenAI directs | Langchain abstractions |
| **Routage** | Logique dispersée | Agent Master centralisé |
| **Personalisation** | Post-processing | Chains spécialisées |
| **Tests** | Tests manuels | Suite automatisée |
| **Évolutivité** | Limitée | Hautement extensible |

### Points de Migration

1. **Endpoints API** : Nouveaux endpoints `/api/langchain/*`
2. **Configuration** : Même système Supabase, nouveaux types
3. **Personnalisation** : Intégration native dans les chains
4. **Performance** : Amélioration significative avec caching

## 🛠️ Configuration et Déploiement

### Variables d'Environnement

```env
# OpenAI (requis)
OPENAI_API_KEY=sk-...

# Configuration Langchain
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=...

# Supabase (pour configurations chatbot)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Installation

```bash
# Dépendances déjà installées
npm install @langchain/openai @langchain/community langsmith

# Test de l'infrastructure
node scripts/test-langchain-infrastructure.js
```

## 🎯 Utilisation en Production

### 1. **Intégration Frontend**

```typescript
// Utilisation dans les composants React
const response = await fetch('/api/langchain/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userMessage,
    chatbotId: currentChatbotId,
    context: conversationContext
  })
})
```

### 2. **Configuration Chatbot**

L'architecture s'intègre parfaitement avec le système existant de configuration des chatbots :

- **Personnalité** : Ton, formalité, verbosité, empathie, proactivité
- **Apparence** : Couleurs, position, messages d'accueil
- **Contexte** : Historique des conversations

### 3. **Monitoring**

```typescript
// Métriques automatiques dans les logs
console.log(`✅ Master: articles → 150 chars (1500ms)`)
console.log(`🎯 Routage: faq (confidence: 0.9)`)
console.log(`📋 Config: Default Chatbot (supabase)`)
```

## 🔮 Évolutions Futures

### 1. **Agents Supplémentaires**
- Agent de recommandations avancées
- Agent d'analyse de sentiment
- Agent de personnalisation comportementale

### 2. **Améliorations Techniques**
- Streaming natif Langchain
- Cache intelligent des réponses
- Optimisation des prompts avec LangSmith

### 3. **Intégrations**
- Base de données vectorielle
- Agents avec outils externes
- Workflows complexes avec LangGraph

## 📞 Support et Maintenance

- **Tests automatisés** : Suite complète de validation
- **Logging** : Traçabilité complète des interactions
- **Configuration** : Centralisée via Supabase
- **Monitoring** : Métriques de performance intégrées

Cette architecture Langchain fournit une base solide et évolutive pour l'IA de Younzee, avec une amélioration significative de la modularité, de la robustesse et des performances par rapport à l'ancienne architecture. 