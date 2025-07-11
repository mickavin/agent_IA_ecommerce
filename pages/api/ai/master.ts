import { NextApiRequest, NextApiResponse } from 'next'
import { ChatbotConfig, ChatbotConfigService } from '../../../lib/services/chatbot-config.service'
import { OpenAIService } from '../../../lib/services/openai.service' // Migré vers le AI SDK de Vercel

const filterUniqueBy = (arr: any[], fn: (v: any, x: any, i: number, j: number) => boolean) =>
  arr.filter((v, i) => arr.some((x, j) => (i !== j) === fn(v, x, i, j)));

function parse_json(json_string: string)
{
    let json_object = null;
    
    try
    {
        json_object = JSON.parse(json_string);
    }
    
    catch (e)
    {
        return null;
    }
    
    return json_object;
}

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

- Dans ce cas, retourne une réponse polie **dans le champ \`message\`** précisant que tu ne peux pas aider.

---

🧑‍💼 **Assistants disponibles** :

1. **ITEM Finder** – Recherche d’un article spécifique  
   **Infos obligatoires** :
   - \`size\` : XS–XXL ou 36–50  
   - \`color\` : noir, blanc, rouge, etc.  
   - \`productType\` : ex. t-shirt, bottines, sac…

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
- Quel que soit le type de requête (\`ITEM\`, \`FAQ\`, \`FALLBACK\`, \`DEMANDE_INAPPROPRIEE\`, etc.), **le champ \`message\` doit toujours contenir un message clair pour le client** (accueil, explication ou relance).
- Les suggestions doivent être cohérentes avec la demande initiale.

---

🧾 **Réponse attendue (JSON strictement valide)** :

\`\`\`json
{
  "message": "Réponse courte et claire pour le client (explication, demande de précision, refus, ou recommandation)",
  "request": "Requête reformulée pour l’assistant ciblé (si applicable)",
  "primaryType": "ITEM|OUTFIT|FAQ|RECOMMENDATION|PRECISION|FALLBACK|DEMANDE_INAPPROPRIEE",
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
\`\`\`

🎯 **Important** : \`message\` est **obligatoire et toujours rédigé**, peu importe le \`primaryType\`.
`

const PROMPT_RAG = (query: string, response: string, personality: string) => `
Tu es un expert en mode et recommandation produit pour **Younzee**.

## Contexte :
- Requête utilisateur : **${query}**
- Résultats de l'IA ITEM (0 à 5 articles, au format JSON) :  
**${response}**

## Mission :
Analyse la requête et les résultats, puis génère une réponse en adoptant le **ton et style de la personnalité suivante** : **${personality}**.

## Règles à suivre strictement :

1. Si des articles sont proposés, rédige une réponse personnalisée basée sur ces articles uniquement. N’ajoute rien d’autre.
2. Si aucun article n’est proposé, indique-le clairement dans le champ \`content\`, tout en conservant le style de la personnalité.
3. Ne modifie pas l’ordre des articles : ils sont classés par pertinence.
4. Ne fais **aucune salutation** en début ou fin de message.
5. Ne fais **aucune recommandation** si la requête demande une **clarification**.
6. Utilise ce format pour chaque article :

---

## 🧥 Nom de l’article

- **Prix :** XX,XX €  
- **Tailles :** XS à XL / 36 à 44 / autres formats  
- **Couleurs :** Noir | Rouge | Autres  
- **Matière :** Ex : Coton bio  
- **Coupe :** Ex : Taille haute, coupe droite (si applicable)  
- **Écoresponsable :** ♻️ 60% recyclé (si applicable)  
- **Stock :** ✅ Disponible

> ✨ _Phrase d’accroche stylée et adaptée à la personnalité._

**🛒 [Ajouter au panier](#)**

---

7. Structure finale : **markdown épuré, professionnel, élégant et clair**, sans saut de ligne superflu.
8. Ta réponse doit être un **objet JSON valide**, strictement formaté ainsi :

{
  "content": "Réponse en markdown formatée avec les articles et la personnalité",
  "request": "${query}",
  "timestamp": "ISO_TIMESTAMP",
  "suggestions": [
    "Suggestion 1 adaptée à la demande",
    "Suggestion 2 contextualisée",
    "Suggestion 3 liée aux produits",
    "Suggestion 4 inspirée par la personnalité",
    "Suggestion 5 engageante"
  ]
}

9. Les suggestions doivent être **pertinentes, dynamiques et utiles**, en lien direct avec la requête et les articles proposés.

NE RETOURNE RIEN D’AUTRE QUE CE JSON VALIDE.
`;


const PROMPT_RAG_NO_PRODUCTS = (query: string, response: string, personality: string) => `
Tu es un expert spécialisé en mode et recommandation de produits e-commerce pour **Younzee**.

## Contexte :
- L'utilisateur a formulé la requête suivante : **${query}**
- L'IA de recommandation nommée **IA ITEM** n'a pas trouvé d'article correspondant à la requête.

## Ta mission :
Analyse la requête de le client et rédige une réponse dans le style de la personnalité suivante : **${personality}**.

### Instructions obligatoires :

1. **Réponds à la requête** en respectant la personnalité indiquée.
2. Si **aucun article** n'est trouvé, **indique-le clairement** dans le champ \`content\` en gardant la personnalité que je t'ai donnée et en gardant le format JSON ci-dessous.
3. Respecte cette mise en forme **exclusivement** pour chaque article en les listant tous et tiens compte de l'introduction:
4. Pas besoin d'effectuer de formulations de salutations

## **Formulation pour indiquer qu'aucun article n'a été trouvé**

> ✨ _Phrase d'accroche ou usage recommandé, adaptée à la personnalité._

---

5. Ne laisse **aucun saut de ligne ou espace inutile** dans \`content\`. La réponse doit être **esthétique, moderne, professionnelle, élégante, claire et épurée**.
6. Retourne uniquement un **objet JSON valide** (parsable via \`JSON.parse()\`) au format suivant :

RETOURNE UNIQUEMENT DU JSON VALIDE et Parseable par JSON.parse():
{
  "content": "Réponse complète en markdown générée dynamiquement à partir des articles et de la personnalité",
  "request": "Contenu exact de la requête utilisateur",
  "timestamp": "timestamp ISO de la requête",
  "suggestions": [
    "Suggestion 1 pertinente et dynamique",
    "Suggestion 2 adaptée à la demande",
    "Suggestion 3 contextuelle",
    "Suggestion 4 personnalisée",
    "Suggestion 5 basée sur les articles"
  ]
}


7. Les suggestions doivent être **cohérentes avec la requête et le contenu retourné** par l'IA ITEM.

---
`;

const PROMPT_RAG_CLARIFICATION = (query: string, response: string, personality: string) => `
Tu es un expert spécialisé en mode et recommandation de produits e-commerce pour **Younzee**.

## Contexte :
- L'utilisateur a formulé la requête suivante : **${query}**
- L'IA de recommandation nommée **IA ITEM** a généré une clarification : **${response}**

## Ta mission :
Analyse la requête de le client et rédige une réponse dans le style de la personnalité suivante : **${personality}**.

### Instructions obligatoires :

1. **Réponds à la requête** en respectant la personnalité indiquée.
2. Si **aucun article** n'est trouvé, **indique-le clairement** dans le champ \`content\` en gardant la personnalité que je t'ai donnée et en gardant le format JSON ci-dessous.
3. Respecte cette mise en forme **exclusivement** pour chaque article en les listant tous et tiens compte de l'introduction:
4. Pas besoin d'effectuer de formulations de salutations

## **Formulation pour indiquer qu'aucun article n'a été trouvé et reformulation de la clarification**

`

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
  const openaiService = new OpenAIService()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const config = await getChatbotConfig(chatbotId)
  const response = await openaiService.generateResponse({
    systemPrompt: PROMPT_MASTER(JSON.stringify(config?.personality)),
    userMessage: message,
    context: {
      conversationHistory: history.filter((item: any) => item.content) || [],
      userPreferences: {},
      userId: `test-${chatbotId}-${id}`
    }
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
  if (response.includes('FALLBACK')) {
    return {
      success: true,
      aiType: 'master',
      confidence: 1,
      response: response
    }
  }
  console.log('response', response)
  const data = parse_json(response)
  if (!data) {
    return {
      success: true,
      aiType: 'master',
      confidence: 1,
      response: data,
      content: response
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

  const openaiService = new OpenAIService()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const config = await getChatbotConfig(chatbotId)
  const responseRAG = await openaiService.generateResponse({
    systemPrompt: response.data.results.length > 0 ?  response.data.results[0].document.metadata.category === 'Clarification' ? PROMPT_RAG_CLARIFICATION(message, JSON.stringify(response.data.results), JSON.stringify(config?.personality)) : PROMPT_RAG(message, JSON.stringify(response.data.results.filter((prod: any, idx: number, arr: any[]) =>
      prod.document.metadata.title && arr.findIndex(p => p.document.metadata.title && p.document.metadata.title.toLowerCase() === prod.document.metadata.title.toLowerCase()) === idx
    )), JSON.stringify(config?.personality)) : PROMPT_RAG_NO_PRODUCTS(message, JSON.stringify(response.data.results), JSON.stringify(config?.personality)),
    userMessage: message,
    context: {
      conversationHistory: [],
      userPreferences: {},
      userId: `test-${chatbotId}-${id}`
    }
  })
  if (!responseRAG) {
    return {
      success: false,
      aiType: 'error',
      confidence: 0,
      error: `Erreur HTTP: ${responseRAG}`
    }
  }
  console.log('responseRAG', responseRAG)
  console.log('responseRAG.content', typeof responseRAG)
  const data = parse_json(responseRAG)
  
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
      rating: metadata.rating || null
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
        const ragResult = await callMasterAIToRAG(response.request, chatbotId, history)
        console.log('ragResult', ragResult)
        console.log('ragResult.response', ragResult.response)
        return res.status(200).json(ragResult)
      }
      routingResult = {
        ...routingResult,
        response: routingResult
      }
      console.log('routingResult', routingResult)
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