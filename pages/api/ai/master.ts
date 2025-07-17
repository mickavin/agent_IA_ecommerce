import { NextApiRequest, NextApiResponse } from 'next'
import { ChatbotConfig, ChatbotConfigService } from '../../../lib/services/chatbot-config.service'
import { ProvidersService } from '../../../lib/services/providers.service' // Migré vers le AI SDK de Vercel
import { z } from 'zod';

//- Output possible un seul a la fois:
//- Article trouvé
//- Article non trouvé
//- Article non trouvé avec une proposition de remplacement

const PROMPT_MASTER = (personality: string) => `
Tu es **l’Assistant d’Accueil** d’une boutique de mode en ligne spécialisée dans :  
👗 Vêtements – 👠 Chaussures – 👜 Accessoires – 📦 Services client.

🎯 **Ta mission** :
1. Accueillir chaque client
2. Identifier le besoin réel
3. Transmettre la requête à un assistant spécialisé si tu disposes des infos nécessaires
4. Sinon, demander les infos manquantes
5. Toujours générer une réponse adaptée et claire à chaque message client

---

✅ **Tu peux gérer uniquement** :
- Articles de mode (t-shirt, robe, jean, veste, bottines, baskets, lunettes, sac à main, etc.)
- Questions sur les services de la boutique (livraison, retours, paiement…)

❌ **Tu ne dois PAS répondre** :
- À des questions sans lien avec la mode ou les services de la boutique
- Aux demandes médicales, techniques, juridiques, personnelles, historiques, etc.
- Tu ne dois jamais faire mention a des sites, boutiques ou enseignes dans ta réponse.
- Chercher a effectuer la recommandation par toi meme.
- Creer des articles fictifs ou inventés
- Faire des recommandations de produits sans les infos obligatoires

- Dans ce cas, retourne une réponse polie **dans le champ \`message\`** précisant que tu ne peux pas aider.

---

🧑‍💼 **Assistants disponibles** :

1. **ITEM Finder** – Recherche d’un article spécifique  
   **Infos obligatoires** :
   - \`size\` : XS–XXL ou 36–50  
   - \`color\` : noir, blanc, rouge, etc.  
   - \`productType\` : ex. t-shirt, bottines, sac… (sans chercher a etre trop précis)

2. **OUTFIT Recommender** – Propose une tenue complète  
   **Info obligatoire** : \`context\` (travail, soirée, mariage…)

3. **FAQ** – Répond à une question sur nos services  
   (limité à la base de données fournie en CSV)

---

🔍 **Infos à extraire** :
- \`size\`: XS, S, M, L, XL, XXL ou pointures 36–50  
- \`color\`: noir, blanc, rouge, etc.  
- \`context\`: mariage, soirée, sport, travail, etc.  
- \`style\`: chic, sport, casual, vintage, etc.  
- \`productType\`: type d’article clair

---

⚠️ **Règles obligatoires** :

- Si tu ne peux pas répondre directement, tu dois proposer une relance ou reformulation.
- **Ne transfère jamais à un assistant** sans les informations obligatoires.
- Quel que soit le type de requête (\`ITEM\`, \`FAQ\`,  \`DEMANDE_INAPPROPRIEE\`, etc.), **le champ \`message\` doit toujours contenir un message clair pour le client** (accueil, explication ou relance).
- Les suggestions doivent être cohérentes avec la demande initiale.
- Si le type de requete est \`ITEM\` ton interlocuteur sera l'IA \`ITEM\`.
- Si le type de requete est \`PRECISION\`, \`DEMANDE_INAPPROPRIEE\` ton interlocuteur sera l'utilisateur.
---

🧾 **Réponse attendue (JSON strictement valide)** :

{
  "message": "Réponse courte et claire pour le client (explication, demande de précision, refus, ou recommandation)",
  "request": "Requête reformulée pour l’assistant ciblé (si applicable)",
  "primaryType": "ITEM|OUTFIT|FAQ|RECOMMENDATION|PRECISION|DEMANDE_INAPPROPRIEE",
  "confidence": 0.9,
  "reasoning": "Pourquoi cette classification",
  "extractedInfo": {
    "size": "M",
    "color": "noir",
    "context": "soirée",
    "style": "élégant",
    "productType": "robe"
  },
  "missingInfo": ["size", "color"],
  "missingInfoSuggestions": [
    "Quelle taille cherchez-vous ?",
    "Avez-vous une couleur préférée ?"
  ],
  "suggestions": [
    "Je cherche des bottines noires en 39",
    "Je veux un sac à main rouge",
    "Je veux une tenue pour un mariage"
  ]
}
`

const PROMPT_TEMP_MASTER = (personality: string) => `
Tu es **l’Assistant d’Accueil** d’une boutique de mode en ligne spécialisée dans :  
👗 Vêtements – 👠 Chaussures – 👜 Accessoires – 📦 Services client.

🎯 **Ta mission** :
1. Accueillir chaque client
2. Identifier le besoin réel
3. Transmettre la requête à un assistant spécialisé si tu disposes des infos nécessaires
4. Sinon, demander les infos manquantes
5. Toujours générer une réponse adaptée et claire à chaque message client

---

✅ **Tu peux gérer uniquement** :
- Articles de mode (t-shirt, robe, jean, veste, bottines, baskets, lunettes, sac à main, etc.)

❌ **Tu ne dois PAS répondre** :
- À des questions sans lien avec la mode ou les services de la boutique
- Aux demandes médicales, techniques, juridiques, personnelles, historiques, etc.
- Tu ne dois jamais faire mention a des sites, boutiques ou enseignes dans ta réponse.
- Chercher a effectuer la recommandation par toi meme.
- Creer des articles fictifs ou inventés
- Faire des recommandations de produits sans les infos obligatoires

- Dans ce cas, retourne une réponse polie **dans le champ \`message\`** précisant que tu ne peux pas aider.

---

🧑‍💼 **Assistants disponibles** :

1. **ITEM Finder** – Recherche d’un article spécifique  
   **Infos obligatoires** :
   - \`size\` : XS–XXL ou 36–50  
   - \`color\` : noir, blanc, rouge, etc.  
   - \`productType\` : ex. t-shirt, bottines, trench, sac… (identifie le type de produit sans chercher a etre trop précis ou a demander trop de details)


---

🔍 **Infos à extraire** :
- \`size\`: XS, S, M, L, XL, XXL ou pointures 36–50  
- \`color\`: noir, blanc, rouge, etc.  
- \`context\`: mariage, soirée, sport, travail, etc.  
- \`style\`: chic, sport, casual, vintage, etc.  
- \`productType\`: type d’article (ex: t-shirt, bottines, sac, trench, veste, etc.)

---

⚠️ **Règles obligatoires** :

- les accessoires n'ont pas de taille on attend qu'une couleur et qu'un type de produit soit fourni pour les trouver (ex: sac, lunettes, bonnet, etc.)
- Si tu ne peux pas répondre directement, tu dois proposer une relance ou reformulation.
- **Ne transfère jamais à un assistant** sans les informations obligatoires.
- Quel que soit le type de requête (\`ITEM\`, \`FAQ\`,  \`DEMANDE_INAPPROPRIEE\`, etc.), **le champ \`message\` doit toujours contenir un message clair pour le client** (accueil, explication ou relance).
- Les suggestions doivent être cohérentes avec la demande initiale.
- Si le type de requete est \`ITEM\` ton interlocuteur sera l'IA \`ITEM\`.
- Si le type de requete est \`PRECISION\`, \`DEMANDE_INAPPROPRIEE\` ton interlocuteur sera l'utilisateur.
---

🧾 **Réponse attendue (JSON strictement valide)** :

{
  "message": "Réponse courte et claire pour le client (explication, demande de précision, refus, ou recommandation)",
  "request": "Requête reformulée pour l’assistant ciblé (si applicable)",
  "primaryType": "ITEM|FAQ|RECOMMENDATION|PRECISION|DEMANDE_INAPPROPRIEE",
  "confidence": 0.9,
  "reasoning": "Pourquoi cette classification",
  "extractedInfo": {
    "size": "M",
    "color": "noir",
    "context": "soirée",
    "style": "élégant",
    "productType": "robe"
  },
  "missingInfo": ["size", "color"],
  "missingInfoSuggestions": [
    "Quelle taille cherchez-vous ?",
    "Avez-vous une couleur préférée ?"
  ],
  "suggestions": [
    "Je cherche des bottines noires en 39",
    "Je veux un sac à main rouge",
  ]
}
`

const PROMPT_RAG = (query: string, response: string, personality: string) => `
Tu es un expert spécialisé en mode et recommandation de produits e-commerce pour **Younzee**.

## Contexte :
- L'utilisateur a formulé la requête suivante : **${query}**
- L'IA de recommandation nommée **IA ITEM** a généré les articles suivants (au format JSON, de 0 à 3 articles) :  
**${response}**

## Ta mission :
Analyse la requête de le client et les résultats générés par l'IA ITEM, puis rédige une réponse dans le style de la personnalité suivante : **${personality}**.

### Instructions obligatoires :

1. **Réponds à la requête** en respectant la personnalité indiquée, en t'appuyant sur les articles fournis dans le JSON.
2. Si **aucun article** n'est trouvé, **indique-le clairement** dans le champ \`content\` en gardant la personnalité que je t'ai donnée et en gardant le format JSON ci-dessous.
3. Ne trie **pas** les articles : ils sont déjà classés par pertinence par l'IA ITEM.
4. Pas besoin d'effectuer de salutations
5. Dans le cas d'une clarification n'emet aucune recommandation
6. Si des articles sont trouvés, tu dois les mettre en avant dans ton message. Tu n'as donc pas besoin de faire de demande de clarification et de details.
7. Ne liste pas de doublons ayant EXACTEMENT le meme nom seulement si le prix est EXACTEMENT le meme
8. N'affiche que les articles disponibles
8. Respecte cette mise en forme **exclusivement** pour chaque article en les listant tous et tiens compte de l'introduction:
---

## emoji representant le type de produit **Nom de l'article**


![Image du produit](url de l'image ou https://younzeeadmin.vercel.app/no-image.jpg si indisponible)

- **Prix :** XX,XX €  
- **Tailles :** XS à XL // ou tailles spécifiques  
- **Couleurs :** Noir | Beige | Autres couleurs  
- **Matière :** Ex: Coton bio  
- **Coupe :** Ex: Taille haute, jambe droite (si applicable)  
- **Écoresponsable :** ♻️ % matière recyclée (si applicable)  
- **Stock :** ✅ Disponible (si disponible)

> ✨ _Phrase d'accroche ou usage recommandé, adaptée à la personnalité._

9. Ne laisse **aucun saut de ligne ou espace inutile** dans \`content\`. La réponse doit être **esthétique, moderne, professionnelle, élégante, claire et épurée**.
10. Retourne uniquement un **objet JSON valide** (parsable via \`JSON.parse()\`) au format suivant :

RETOURNE UNIQUEMENT DU JSON VALIDE et Parseable par JSON.parse():
{
  "content": "Réponse complète en markdown (correctement formatée pour eviter les erreurs de parsing modifie les \` quand tu en trouves) générée dynamiquement à partir des articles et de la personnalité",
  "request": "Contenu exact de la requête utilisateur",
}


9. Les suggestions doivent être **cohérentes avec la requête et le contenu retourné** par l'IA ITEM.

---
`;

/**
 * IA Master - Orchestrateur intelligent avec personnalisation du chatbot depuis Supabase
 * Récupère automatiquement les configurations depuis la base de données
 */

type AIRoutingResult = {
  success: boolean
  aiType: string
  confidence: number
  response?: any
  content?: string
  error?: string
  metadata?: any
}


/**
 * Récupère la configuration du chatbot
 */
async function getChatbotConfig(chatbotId?: string): Promise<ChatbotConfig | null> {
  const configResult = await ChatbotConfigService.resolveConfig(chatbotId)
  if (!configResult.success || !configResult.config) {
    return null
  }
  return configResult.config
}

/**
 * Appel de l'IA Master et callback du RAG-OpenAI
 */
async function callMasterAI(message: string, chatbotId?: string, history?: any): Promise<AIRoutingResult> {
  if (typeof window !== 'undefined') {
    if (!window.localStorage.getItem(`${chatbotId}-chatbot-config-younzee`)) {
      window.localStorage.setItem(`${chatbotId}-chatbot-config-younzee`, JSON.stringify(`${Date.now()}`))
    }
  }

  const id = typeof window !== 'undefined' ? window.localStorage.getItem(`${chatbotId}-chatbot-config-younzee`) : null
  console.log('history', history)
  const providersService = new ProvidersService()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const config = await getChatbotConfig(chatbotId)
  const response = await providersService.generateObjectResponse({
    model: "gemini-2.0-flash",
    provider: "gemini",
    systemPrompt: PROMPT_TEMP_MASTER(JSON.stringify(config?.personality)),
    userMessage: message,
    context: {
      conversationHistory: history.filter((item: any) => item.content) || [],
      userPreferences: {},
      userId: `test-${chatbotId}-${id}`
    }
  }, {
    message: z.string().describe('Message de la réponse'),
    primaryType: z.string().describe('Type de produit classifié'),
    confidence: z.number().describe('Confiance de la réponse'),
    reasoning: z.string().describe('Raison pour laquelle cette classification'),
    extractedInfo: z.object({
      size: z.string().describe('Taille extraite'),
      color: z.string().describe('Couleur extraite'),
    }),
    missingInfo: z.array(z.string()).describe('Informations manquantes'),
    missingInfoSuggestions: z.array(z.string()).describe('Suggestions pour les informations manquantes'),
    suggestions: z.array(z.string()).describe('Suggestions'),
    request: z.string().describe('Requête utilisateur'),
  })
  console.log('response', response)
  if (!response) {
    return {
      success: false,
      aiType: 'error',
      confidence: 0,
      content: '',
      error: `Erreur HTTP: ${response}`
    }
  }

  console.log('response', response)
  const data = response
  if (!data) {
    return {
      success: true,
      aiType: 'master',
      confidence: 1,
      response: data,
      content: data.message
    }
  }
  return {
    success: true,
    aiType: 'master',
    confidence: 1,
    response: data,
    content: data.message
  }
}


async function callMasterAIToRAG(message: string, chatbotId?: string, history?: any): Promise<AIRoutingResult> {
  const response = await callRAG(message, chatbotId)
  console.log('responseRAG1', response)
  if (!response.success) {
    return response
  }
  if (typeof window !== 'undefined') {
    if (!window.localStorage.getItem(`${chatbotId}-chatbot-config-younzee`)) {
      window.localStorage.setItem(`${chatbotId}-chatbot-config-younzee`, JSON.stringify(`${Date.now()}`))
    }
  }

  const id = typeof window !== 'undefined' ? window.localStorage.getItem(`${chatbotId}-chatbot-config-younzee`) : null

  const providersService = new ProvidersService()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const config = await getChatbotConfig(chatbotId)
  const responseRAG = await providersService.generateObjectResponse({
    model: "gemini-2.0-flash",
    provider: "gemini",
    //systemPrompt: response.data.results.length > 0 ?  response.data.results[0].document.metadata.category === 'Clarification' ? PROMPT_RAG_CLARIFICATION(message, JSON.stringify(response.data.results), JSON.stringify(config?.personality)) : PROMPT_RAG(message, JSON.stringify(response.data.results.filter((prod: any, idx: number, arr: any[]) =>
    //  prod.document.metadata.title && arr.findIndex(p => p.document.metadata.title && p.document.metadata.title.toLowerCase() === prod.document.metadata.title.toLowerCase()) === idx
    //)), JSON.stringify(config?.personality)) : PROMPT_RAG_NO_PRODUCTS(message, JSON.stringify(response.data.results), JSON.stringify(config?.personality)),
    systemPrompt: PROMPT_RAG(message, JSON.stringify(response.data.results), JSON.stringify(config?.personality)),
    userMessage: message,
    context: {
      conversationHistory: history.filter((item: any) => item.content) || [],
      userPreferences: {},
      userId: `test-${chatbotId}-${id}`
    }
  }, {
    content: z.string().describe('Contenu de la réponse'),
    request: z.string().describe('Requête utilisateur')
  })
  if (!responseRAG) {
    return {
      success: false,
      aiType: 'error',
      confidence: 0,
      error: `Erreur HTTP: ${responseRAG}`
    }
  }
  //console.log('responseRAG', responseRAG)
  //console.log('responseRAG.content', typeof responseRAG)
  const data = responseRAG
  
  // Ajouter les produits formatés pour le carousel
  let products = formatProductsFromRAG(response.data.results || [])
  // Filtrer les doublons par nom (title)
  products = products.filter((prod: any, idx: number, arr: any[]) =>
    prod.category !== 'Clarification' && prod.title && arr.findIndex(p => p.title && p.title.toLowerCase() === prod.title.toLowerCase()) === idx
  )
  
  return {
    success: true,
    aiType: 'master',
    confidence: 1,
    response: {
      ...response,
      ...data,
      products: products,
      showCarousel: products.length > 0
    }
  }
}

/**
 * Formate les résultats RAG en produits pour le carousel
 */
function formatProductsFromRAG(ragResults: any[]): any[] {
  if (!ragResults || ragResults.length === 0) {
    return []
  }

  return ragResults.slice(0, 5).map((result, index) => {
    const metadata = result.document?.metadata || {}
    
    return {
      id: metadata.id || `product-${index}`,
      title: metadata.title || 'Produit sans nom',
      price: metadata.price || 0,
      colors: metadata.colors || [],
      sizes: metadata.sizes || [],
      images: metadata.images || [],
      category: metadata.type_produit_classifié || metadata.category || 'Non classifié',
      description: metadata.description || '',
      availability: metadata.availableForSale !== false,
      rating: metadata.rating || null,
      slug: metadata.slug || '',
      handle: metadata.handle || '',
    }
  })
}

/**
 * Appelle l'API RAG-OpenAI
 */
async function callRAG(query: string, chatbotId?: string): Promise<any> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/rag-openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query
      })
    })

    const ragData = await response.json()
    return ragData
  } catch (error: any) {
    console.error('❌ Erreur appel RAG:', error)
    return { success: false, error: error.message }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  
    // Gérer la requête preflight
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    // ...votre logique POST ici...

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { message, context = {}, chatbotId, chatbotConfig = {} } = req.body

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message requis' })
    }

    const userMessage = message.trim()
    const history = context.conversationHistory || []
    // Récupération de la configuration depuis Supabase (priorité sur chatbotId)
    const configResult = await ChatbotConfigService.resolveConfig(chatbotId, chatbotConfig)
    console.log('configResult', configResult, chatbotId, message)
    if (!configResult.success || !configResult.config) {
      return res.status(500).json({ 
        error: 'Configuration chatbot non disponible',
        details: configResult.error 
      })
    }

    const { config, source } = configResult
    console.log('config', config)
    const personality = config.personality
    ChatbotConfigService.logConfigSource(chatbotId, source, config.name)
    // Log de la configuration utilisée
    console.log(`🎯 IA Master: message "${userMessage.substring(0, 50)}..." avec config ${config.name} (${source})`)

    let routingResult = await callMasterAI(userMessage, chatbotId, history)
    console.log('routingResult', routingResult)
    if (routingResult.success) {
      const response = routingResult.response
      //const personalizedContent = applyPersonalization(response.message, personality)
      //console.log('personalizedContent', personalizedContent)
      if (response?.primaryType === 'ITEM') {
        const ragResult = await callMasterAIToRAG(response.request + ' : ' + response.message, chatbotId, history)
        console.log('ragResult', ragResult)
        console.log('ragResult.response', ragResult.response)
        return res.status(200).json(ragResult)
      }
      routingResult = {
        ...routingResult,
        response: routingResult
      }
      console.log('routingResult', routingResult)
      if (routingResult.response.response.primaryType === 'DEMANDE_INAPPROPRIEE') {
        return res.status(200).json({
          ...routingResult,
          response: {
            ...routingResult.response,
            response: {
              ...routingResult.response.response,
              message: routingResult.response.response.message + ' ' + routingResult.response.response.reasoning + ' Cependant, je peux vous aider pour toutes autres questions relatives à notre boutique.'
            },
          }
        })
      }
      return res.status(200).json(routingResult)
    }



  } catch (error: any) {
    console.error('❌ Erreur IA Master:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement par l\'IA Master',
      details: error.message
    })
  }
} 