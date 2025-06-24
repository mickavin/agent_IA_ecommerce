# 🤖 Nouvelle Architecture IA - Younzee

## 📋 Vue d'ensemble

La nouvelle architecture IA de Younzee est basée sur un système de **4 IAs spécialisées** orchestrées par une **IA Master** qui gère le routage intelligent et la personnalisation du chatbot.

### 🏗️ Architecture

```
📱 Frontend Chatbot
       ↓
🔗 /api/chat ou /api/chat-stream (APIs de compatibilité)
       ↓  
🧠 /api/ai/master (IA Master - Orchestrateur)
       ↓
🎯 Routage intelligent vers:
   ├─ 📚 /api/ai/faq (Questions fréquentes)
   ├─ 👕 /api/ai/articles (Recommandations d'articles)
   └─ 👗 /api/ai/outfits (Suggestions d'outfits)
```

## 🎭 IA Master - L'orchestrateur intelligent

### Fonctionnalités clés

1. **🎯 Routage intelligent** : Détermine automatiquement quelle IA spécialisée est la plus appropriée
2. **🎨 Personnalisation complète** : Applique la personnalité du chatbot configurée
3. **🔄 Fallback intelligent** : Gestion des cas non traités par les IAs spécialisées
4. **📊 Monitoring** : Logs détaillés et métriques de performance

### Paramètres de personnalisation

#### 🗣️ Ton de voix
- `"Professionnel"` : Langage formel et précis
- `"Décontracté"` : Langage familier et relaxé  
- `"Amical"` : Chaleureux et bienveillant
- `"Expert"` : Technique et informatif
- `"Humoristique"` : Avec touches d'humour

#### 🎩 Formalité
- `"Tutoiement"` : Utilise "tu", "ton", "ta"
- `"Vouvoiement"` : Utilise "vous", "votre", "vos"

#### 📝 Verbosité
- `"Concis"` : Réponses courtes et directes
- `"Détaillé"` : Réponses équilibrées (défaut)
- `"Très détaillé"` : Réponses longues et exhaustives

#### 💙 Empathie
- `"Faible"` : Réponses factuelles
- `"Moyenne"` : Quelques touches d'empathie
- `"Élevée"` : Très empathique et compréhensif

#### 🚀 Proactivité
- `"Réactif"` : Répond uniquement à la question
- `"Proactif"` : Suggestions supplémentaires occasionnelles
- `"Très proactif"` : Nombreuses suggestions et recommandations

## 🔧 IAs Spécialisées

### 📚 IA FAQ (`/api/ai/faq`)

**Spécialisation** : Questions fréquentes et support client

**Traite** :
- Salutations et politesses
- Questions sur la livraison, retours, paiements
- Informations générales sur le service
- Demandes d'aide

**Exemple** :
```javascript
{
  "message": "Quels sont vos délais de livraison ?",
  "context": {}
}
```

### 👕 IA Articles (`/api/ai/articles`)  

**Spécialisation** : Recommandations d'articles individuels

**Traite** :
- Recherche de vêtements spécifiques
- Filtres par prix, couleur, taille, style
- Recommandations personnalisées
- Comparaison de produits

**Exemple** :
```javascript
{
  "message": "Je cherche un t-shirt noir pour moins de 50€",
  "context": {
    "userPreferences": {
      "budget": { "max": 50 },
      "colors": ["noir"],
      "categories": ["Hauts"]
    }
  }
}
```

### 👗 IA Outfits (`/api/ai/outfits`)

**Spécialisation** : Création d'outfits complets

**Traite** :
- Suggestions de tenues complètes
- Coordination d'articles
- Styles par occasion (travail, soirée, casual)
- Harmonie des couleurs et des styles

**Exemple** :
```javascript
{
  "message": "Je veux une tenue élégante pour le travail",
  "context": {
    "occasion": "travail",
    "style": "chic"
  }
}
```

## 🚀 Utilisation

### 1. API Master (Recommandée)

```javascript
const response = await fetch('/api/ai/master', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Je cherche une robe pour une soirée",
    context: {
      conversationHistory: [],
      userPreferences: {},
      userId: "user123"
    },
    chatbotConfig: {
      personality: {
        tone: "Amical",
        formality: "Tutoiement", 
        verbosity: "Détaillé",
        empathy: "Élevée",
        proactivity: "Proactif"
      }
    }
  })
})
```

### 2. APIs de compatibilité

Les anciennes APIs (`/api/chat` et `/api/chat-stream`) restent disponibles et utilisent automatiquement la nouvelle architecture.

```javascript
// Fonctionne exactement comme avant
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Bonjour, je cherche des conseils mode",
    chatbotConfig: {
      personality: {
        tone: "Humoristique",
        formality: "Tutoiement"
      }
    }
  })
})
```

### 3. IAs spécialisées directement

```javascript
// Appel direct à une IA spécialisée (usage avancé)
const response = await fetch('/api/ai/faq', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Comment retourner un article ?"
  })
})
```

## 🔍 Format de réponse

```javascript
{
  "success": true,
  "response": {
    "id": "master-1703123456789",
    "content": "👋 Bonjour ! Je serais ravi de t'aider...",
    "type": "bot",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "metadata": {
      "intent": "greeting",
      "confidence": 0.9,
      "aiType": "master",
      "routedTo": "faq", 
      "personalityApplied": {
        "tone": "Amical",
        "formality": "Tutoiement",
        "verbosity": "Détaillé",
        "empathy": "Élevée", 
        "proactivity": "Proactif"
      },
      "processingTime": 156
    }
  }
}
```

## 🧪 Tests

### Script de test automatisé

```bash
cd /c/Users/j-phi/Downloads/Younz
node scripts/test-new-ai-architecture.js
```

### Tests manuels dans le navigateur

1. Démarrer le serveur : `pnpm dev`
2. Aller sur la page des chatbots
3. Tester différents messages avec diverses personnalités
4. Vérifier les logs dans la console du serveur

## 📊 Monitoring et logs

L'IA Master génère des logs détaillés :

```
🤖 IA Master - Message reçu: "Je veux un jean"
🎭 Personnalité appliquée: {"tone":"Amical","formality":"Tutoiement"...}
🎯 Routage: {"selectedAI":"articles","confidence":0.8,"reason":"..."}
✨ Personnalisation appliquée
```

## 🔧 Configuration avancée

### Variables d'environnement

```env
# URL de base pour les appels internes
NEXTAUTH_URL=http://localhost:3000

# Logs de debug (optionnel)
DEBUG_AI_MASTER=true
```

### Personnalisation par chatbot

Chaque chatbot peut avoir sa propre configuration dans la base de données :

```javascript
const chatbotConfig = {
  personality: {
    tone: "Expert",
    formality: "Vouvoiement", 
    verbosity: "Très détaillé",
    empathy: "Moyenne",
    proactivity: "Très proactif"
  },
  visualConfig: {
    primaryColor: "#3B82F6",
    welcomeMessage: "Bonjour ! Comment puis-je vous accompagner ?"
  }
}
```

## 🚨 Gestion d'erreurs

L'architecture inclut plusieurs niveaux de fallback :

1. **IA spécialisée échoue** → Routage vers IA FAQ
2. **Toutes les IAs échouent** → Message de fallback personnalisé
3. **Erreur système** → Message d'erreur générique

## 📈 Améliorations futures

- [ ] **Cache intelligent** : Mise en cache des réponses fréquentes
- [ ] **Apprentissage automatique** : Amélioration du routage basé sur l'historique
- [ ] **Analytics avancées** : Métriques détaillées de performance
- [ ] **A/B Testing** : Tests de différentes personnalités
- [ ] **Intégration ML** : IA de recommandation plus avancée

## 🆘 Dépannage

### Problèmes courants

1. **IA ne répond pas** : Vérifier que le serveur Next.js est démarré
2. **Routage incorrect** : Augmenter le niveau de logs pour debug
3. **Personnalisation non appliquée** : Vérifier le format de `chatbotConfig`
4. **Erreur de fetch** : Vérifier l'URL de base dans `NEXTAUTH_URL`

### Logs de debug

Activer les logs détaillés :

```javascript
// Dans pages/api/ai/master.ts
console.log(`🤖 IA Master - Message reçu: "${userMessage}"`)
console.log(`🎭 Personnalité appliquée:`, personality)
console.log(`🎯 Routage:`, routingResult)
```

---

**🎉 L'architecture IA de Younzee est maintenant prête à offrir une expérience conversationnelle personnalisée et intelligente !** 