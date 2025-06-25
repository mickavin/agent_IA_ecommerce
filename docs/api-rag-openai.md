# API RAG OpenAI - Documentation

## 🎯 Description

L'API RAG (Retrieval-Augmented Generation) OpenAI permet de faire des recherches sémantiques intelligentes dans vos données produits en utilisant les embeddings OpenAI.

## 🚀 Endpoints

### GET /api/rag-openai

Recherche simple par paramètres URL.

**Paramètres:**
- `q` ou `query`: Terme de recherche (string)
- `k`: Nombre de résultats souhaités (number, max 20)
- `type`: Type de recherche ('semantic', 'keyword', 'hybrid')

**Exemple:**
```bash
curl "http://localhost:3000/api/rag-openai?q=t-shirt%20bleu&k=5&type=semantic"
```

### POST /api/rag-openai

Recherche avancée avec filtres.

**Body JSON:**
```json
{
  "query": "sweat confortable",
  "k": 5,
  "searchType": "hybrid",
  "filters": {
    "maxPrice": 100,
    "minPrice": 20,
    "category": "Sweatshirts",
    "colors": ["bleu", "noir"],
    "availableOnly": true
  }
}
```

## 📊 Format de Réponse

```json
{
  "success": true,
  "data": {
    "query": "t-shirt bleu",
    "results": [
      {
        "document": {
          "id": "product_123",
          "content": "T-shirt bleu en coton...",
          "metadata": {
            "title": "T-shirt Bleu Coton Bio",
            "description": "T-shirt confortable en coton bio",
            "price": 29.99,
            "category": "T-shirts",
            "colors": ["bleu"],
            "sizes": ["S", "M", "L"],
            "availableForSale": true
          }
        },
        "score": 0.89,
        "relevance": "high",
        "searchType": "semantic"
      }
    ],
    "totalFound": 1,
    "searchTime": 245,
    "searchType": "semantic",
    "embeddingModel": "text-embedding-3-small"
  },
  "metadata": {
    "documentsLoaded": 150,
    "vectorStoreCreated": true,
    "openaiConfigured": true
  }
}
```

## 🔧 Configuration Requise

1. **Clé API OpenAI**: Ajoutez `OPENAI_API_KEY=sk-...` dans `.env.local`
2. **Fichiers CSV**: Placez vos données dans `data/` ou `files/`
3. **Dépendances**: `@langchain/openai`, `@langchain/community`, `papaparse`

## 🎯 Types de Recherche

- **semantic**: Recherche par similarité sémantique (embeddings OpenAI)
- **keyword**: Recherche par mots-clés classique
- **hybrid**: Combinaison des deux approches (recommandé)

## 📈 Performance

- Cache automatique des embeddings
- Traitement par batches pour éviter les timeouts
- Limite de 500 documents par défaut
- Temps de réponse typique: 200-800ms

## 🚨 Gestion des Erreurs

- `500`: Clé API OpenAI manquante ou invalide
- `405`: Méthode HTTP non autorisée
- `400`: Paramètres invalides
- `503`: Service OpenAI indisponible

## 💡 Conseils d'Utilisation

1. Utilisez `hybrid` pour de meilleurs résultats
2. Limitez `k` à 10-20 pour de bonnes performances
3. Précisez des filtres pour affiner les résultats
4. Les termes en français sont mieux supportés
