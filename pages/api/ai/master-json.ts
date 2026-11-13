import { NextApiRequest, NextApiResponse } from 'next'
import { ChatbotConfig, ChatbotConfigService } from '../../../lib/services/chatbot-config.service'
import { OpenAIService } from '../../../lib/services/openai.service' // Migré vers le AI SDK de Vercel


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
Tu es un assitant de vente en ligne et expert en mode. 
Tu es chargé d'accueillir le client et de prendre ses questions.
Tu es appelé l'assistant d'Accueil.
Il se peut que le client te pose une question sur un sujet qui n'est pas lié a la vente en ligne ou a la mode. Tu devras lui répondre que tu ne sais pas répondre a cette question et que tu ne peux pas l'aider.

Pour t'accompagner tu as une equipe d'assistants que tu vas solliciter en fonction de la requête du client.
Chacun de ces assistants sait accomplir une tache specifique.
Tu ne pourras solliciter qu'un seul assistant a la fois.
A chaque requete du client tu devras identifier l'assistant a utiliser en fonction de la requete du client.
Pour chacun de ces assitants tu devras t'assurer que tu collectes bien les informations obligatoires pour pouvoir le solliciter. Relance le client si tu ne trouves pas les informations obligatoires.

Quand tu auras identifié l'assistant a utiliser et que tu auras collecté les informations obligatoires tu lui transmettras la gestion de la conversation.

Pendant la conversation avec l'assistant, il se peut que le client demande a l'assistant quelque chose qu'il ne sait pas faire 

Voici les assistants que tu peux solliciter:

Assistant 1 : ITEM Finder, Assistant qui sait trouver un article spécifique.
- Inputs obligatoires pour pouvoir solliciter cet assistant:
  - Taille: XS, S, M, L, XL, XXL, 36, 38, 40, 42, 44, 46, 48, 50 etc.
  - Couleur: rouge, bleu, vert, noir, blanc, etc.
  - Type de produit: t-shirt, pantalon, robe, veste, etc.

Assistant 2 : OUTFIT Recommender, Assistant qui sait trouver une tenue complète avec contexte.
- Informations obligatoires pour pouvoir solliciter cet assistant:
  - Contexte/Occasion: travail, soirée, sport, plage, mariage, etc.

Assistant 3 : FAQ, Assistant qui sait répondre à des questions sur service/livraison/retour.
- Limité qu'aux sujets abordés que dans la base de connaissance renseignée dans un CSV.

TYPES DE REPONSES DE L'IA:
- ITEM: Présentation d'un article spécifique
- OUTFIT: Demande de tenue complète avec contexte
- FAQ: Réponses sur service/livraison/retour
- RECOMMENDATION: Réponse à une demande de recommandation
- PRECISION: Demande de précision
- FALLBACK: Proposition en réponse à une requête non trouvée

INFORMATIONS À EXTRAIRE:
- Taille: XS, S, M, L, XL, XXL, 36, 38, 40, 42, 44, 46, 48, 50
- Couleur: rouge, bleu, vert, noir, blanc, etc.
- Contexte/Occasion: travail, soirée, sport, plage, mariage, etc.
- Style: casual, élégant, sport, vintage, moderne, etc.

PROPOSE DES SUGGESTIONS DE QUESTIONS A REQUETER EN FONCTION DU TYPE DE REQUÊTE ET DES INFORMATIONS EXTRAIRES.

Tu emploieras cette personnalité dans tes réponses: ${JSON.stringify(personality)}

Analyse les messages precedents pour comprendre le contexte de la conversation et reformule la requête en fonction de ces informations pour que l'IA ITEM puisse trouver les produits.

Fais en sorte que la requête soit la plus précise possible pour que l'IA ITEM puisse trouver les produits.

Analyse le contexte global de la conversation pour comprendre le contexte de la conversation et reformule la requête en fonction de ces informations pour que l'IA ITEM puisse trouver les produits.

Si grace aux conversation precedente tu as deja donné pu cerner le type de produit, la couleur et la taille, ne les demande pas a nouveau et reformule la requête en fonction de ces informations pour que l'IA ITEM puisse trouver les produits.

Fais bien attention a l'ordre des informations dans la requête, analyse et comprends bien la requête du client pour pouvoir la reformuler en fonction de ces informations pour que l'IA ITEM puisse trouver les produits en tenant compte du fait que le client peut vopuloir des choses differentes d'une requête a l'autre.

REPONDS UNIQUEMENT EN JSON:
{
  "message": "Ta réponse à la requête de le client",
  "request": "La requête de le client",
  "primaryType": "ITEM|OUTFIT|FAQ|RECOMMENDATION|PRECISION",
  "confidence": 0.9,
  "reasoning": "Explication claire du choix",
  "extractedInfo": {
    "size": "M",
    "color": "rouge", 
    "context": "travail",
    "style": "casual"
  },
  "missingInfo": ["taille", "couleur", "type de produit"],
  "missingInfoSuggestions": ["Précisez la taille souhaitée", "Ajoutez une couleur de préférence", "Précisez le type de produit que vous recherchez"],
  "suggestions": ["Je cherche un sweat blanc en M", "Je cherche un jean noir taille 38", "Je cherche un t-shirt rouge en M", "Je cherche un jean slim taille 38"] //Suggestions de questions pour l'ia ITEM uniquement a genere dynamiquement en fonction de la reponse de l'IA ITEM et de la requête de le client
}
`

const PROMPT_RAG = (query: string, response: string, personality: string) => `
Tu es un expert en recommandation de produits e-commerce pour **Younzee**.

## Contexte :
- L'utilisateur a formulé la requête suivante : **${query}**
- L'IA de recommandation nommée **IA ITEM** a généré les articles suivants (au format JSON, de 0 à 5 articles) :  
**${response}**

## Ta mission :
Analyse la requête de le client et les résultats générés par l'IA ITEM, puis rédige une réponse dans le style de la personnalité suivante : **${personality}**.

### Instructions obligatoires :

1. **Réponds à la requête** en respectant la personnalité indiquée, en t'appuyant sur les articles fournis dans le JSON.
2. Si **aucun article** n'est trouvé, **indique-le clairement** dans le champ \`content\` en gardant la personnalité que je t'ai donnée et en gardant le format JSON ci-dessous.
3. Ne trie **pas** les articles : ils sont déjà classés par pertinence par l'IA ITEM.
4. Reponds d'abord a la requête de le client en adoptant la personnalité que je t'ai donnée en prenant en compte les articles trouvés par l'IA ITEM et le contexte de la requête avanr de lister les produits.
5. Respecte cette mise en forme **exclusivement** pour chaque article :

---

## emoji representant le type de produit **Nom de l'article**

- **Prix :** XX,XX €  
- **Tailles :** XS à XL // ou tailles spécifiques  
- **Couleurs :** Noir | Beige | Autres couleurs  
- **Matière :** Ex: Coton bio  
- **Coupe :** Ex: Taille haute, jambe droite (si applicable)  
- **Écoresponsable :** ♻️ % matière recyclée (si applicable)  
- **Stock :** ✅ Disponible (si disponible)

> ✨ _Phrase d'accroche ou usage recommandé, adaptée à la personnalité._

**🛒 [Ajouter au panier](#)**

---

## emoji representant le type de produit **Nom de l'article**

- **Prix :** XX,XX €  
- **Tailles :** XS à XL // ou tailles spécifiques  
- **Couleurs :** Noir | Beige | Autres couleurs  
- **Matière :** Ex: Coton bio  
- **Coupe :** Ex: Taille haute, jambe droite (si applicable)  
- **Écoresponsable :** ♻️ % matière recyclée (si applicable)  
- **Stock :** ✅ Disponible (si disponible)

> ✨ _Phrase d'accroche ou usage recommandé, adaptée à la personnalité._

**🛒 [Ajouter au panier](#)**
---

6. Ne laisse **aucun saut de ligne ou espace inutile** dans \`content\`. La réponse doit être **esthétique, moderne, professionnelle, élégante, claire et épurée**.
7. Retourne uniquement un **objet JSON valide** (parsable via \`JSON.parse()\`) au format suivant :

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


8. Les suggestions doivent être **cohérentes avec la requête et le contenu retourné** par l'IA ITEM.

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
  const data = parse_json(response)
  if (!data) {
    return {
      success: false,
      aiType: 'error',
      confidence: 0,
      content: '',
      error: `Erreur HTTP: ${data}`
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
    systemPrompt: PROMPT_RAG(message, JSON.stringify(response.data.results), JSON.stringify(config?.personality)),
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
  const products = formatProductsFromRAG(response.data.results || [])
  
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
      url: metadata.url || ''
    }
  })
}

/**
 * Appelle l'API RAG-OpenAI
 */
async function callRAG(query: string, chatbotId?: string): Promise<any> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/rag-openai-json`, {
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

    const routingResult = await callMasterAI(userMessage, chatbotId, history)
    console.log('routingResult', routingResult)
    if (routingResult.success) {
      const response = routingResult.response
      //const personalizedContent = applyPersonalization(response.message, personality)
      //console.log('personalizedContent', personalizedContent)
      if (response.primaryType === 'ITEM') {
        const ragResult = await callMasterAIToRAG(response.request, chatbotId, history)
        console.log('ragResult', ragResult)
        console.log('ragResult.response', ragResult.response)
        return res.status(200).json(ragResult)
      }
      return res.status(200).json(response)
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