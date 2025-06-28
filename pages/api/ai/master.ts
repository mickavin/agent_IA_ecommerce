import { NextApiRequest, NextApiResponse } from 'next'
import { ChatbotConfig, ChatbotConfigService } from '../../../lib/services/chatbot-config.service'
import { OpenAIService } from '../../../lib/services/openai.service'

const PROMPT_MASTER = (personality: string) => `
Tu es un expert en catégorisation de requêtes e-commerce pour Younzee.

Analyse cette requête et détermine:

TYPES DE REPONSES DE L'IA:
- ITEM: Présentation d'un article spécifique (ex: "t-shirt rouge", "jean slim taille 38")  
- OUTFIT: Demande de tenue complète avec contexte (ex: "tenue pour aller au travail", "outfit soirée")
- FAQ: Question sur service/livraison/retour (ex de requête: "comment retourner un article?", "délais de livraison") (ex de réponse: "Pour retourner un article, veuillez contacter notre service client au 01 23 45 67 89")
- RECOMMENDATION: Réponse à une demande de recommandation (ex de requête: "quels sont vos meilleurs articles?", "quels sont vos derniers arrivages?") (ex de réponse: "Voici nos derniers arrivages:...")
- PRECISION: Demande de précision (ex de requête: "Pourriez vous me preciser la taille que vous recherchez pour votre tenue?") (ex de réponse: "Pourriez vous me preciser la taille que vous recherchez pour votre tenue?")
- FALLBACK: Proposition d'un autre article non trouvée (ex de requête: "Je cherche un t-shirt rouge en M", "Je cherche un jean slim taille 38") (ex de réponse: "Je n'ai pas trouvé de t-shirt rouge en M, mais voici un t-shirt rouge que je vous propose en taille L:...", "Je n'ai pas trouvé de jean slim taille 38, mais voici un jean regular que je vous propose en taille 38:...")

INFORMATIONS À EXTRAIRE:
- Taille: XS, S, M, L, XL, XXL, 36, 38, 40, 42, 44, 46, 48, 50
- Couleur: rouge, bleu, vert, noir, blanc, etc.
- Contexte/Occasion: travail, soirée, sport, plage, mariage, etc.
- Style: casual, élégant, sport, vintage, moderne, etc.

PROPOSE DES SUGGESTIONS DE QUESTIONS A REQUETER EN FONCTION DU TYPE DE REQUÊTE ET DES INFORMATIONS EXTRAIRES.

Tu emploieras cette personnalité dans tes réponses: ${Object.entries(personality).map(([key, value]) => `${key}: ${value}`).join(', ')}

RETOURNE UNIQUEMENT DU JSON VALIDE:
{
  "message": if (primaryType === "ITEM") null else "Ta réponse à la requête de l'utilisateur",
  "request": "La requête de l'utilisateur",
  "primaryType": "ITEM|OUTFIT|FAQ|RECOMMENDATION|PRECISION",
  "confidence": 0.9,
  "reasoning": "Explication claire du choix",
  "extractedInfo": {
    "size": "M",
    "color": "rouge", 
    "context": "travail",
    "style": "casual"
  },
  "missingInfo": ["taille", "couleur"],
  "missingInfoSuggestions": ["Précisez la taille souhaitée", "Ajoutez une couleur de préférence"],
  "suggestions": ["Je cherche un sweat noir en M sous 60€", "Conseille-moi une tenue pour l'hiver", "Quelles sont vos dernières tendances ?", "J'ai un budget de 100€, que recommandes-tu ?", "Guide des tailles pour les pantalons"]
}
`
/**
 * IA Master - Orchestrateur intelligent avec personnalisation du chatbot depuis Supabase
 * Récupère automatiquement les configurations depuis la base de données
 */

type ChatbotPersonality = {
  tone: "Professionnel" | "Décontracté" | "Amical" | "Expert" | "Humoristique"
  formality: "Tutoiement" | "Vouvoiement"
  verbosity: "Concis" | "Détaillé" | "Très détaillé"
  empathy: "Faible" | "Moyenne" | "Élevée"
  proactivity: "Réactif" | "Proactif" | "Très proactif"
}

type ChatbotVisualConfig = {
  primaryColor: string
  secondaryColor: string
  textColor: string
  backgroundColor: string
  borderRadius: string
  position: string
  size: string
  welcomeMessage: string
  placeholder: string
}

type AIRoutingResult = {
  success: boolean
  aiType: string
  confidence: number
  response?: any
  error?: string
  metadata?: any
}

const defaultPersonality: ChatbotPersonality = {
  tone: "Amical",
  formality: "Tutoiement", 
  verbosity: "Détaillé",
  empathy: "Élevée",
  proactivity: "Proactif"
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
async function callMasterAI(message: string, chatbotId?: string): Promise<AIRoutingResult> {
  if (typeof window !== 'undefined') {
    if (!window.localStorage.getItem(`${chatbotId}-chatbot-config-younzee`)) {
      window.localStorage.setItem(`${chatbotId}-chatbot-config-younzee`, JSON.stringify(`${Date.now()}`))
    }
  }

  const id = typeof window !== 'undefined' ? window.localStorage.getItem(`${chatbotId}-chatbot-config-younzee`) : null

  const openaiService = new OpenAIService()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const config = await getChatbotConfig(chatbotId)
  const response = await openaiService.generateResponse({
    systemPrompt: PROMPT_MASTER(JSON.stringify(config?.personality)),
    userMessage: message,
    context: {
      conversationHistory: [],
      userPreferences: {},
      userId: `test-${chatbotId}-${id}`
    }
  })
  if (!response) {
    return {
      success: false,
      aiType: 'error',
      confidence: 0,
      error: `Erreur HTTP: ${response}`
    }
  }
  console.log('response', response)
  const data = JSON.parse(response)
  return {
    success: true,
    aiType: 'master',
    confidence: 1,
    response: data
  }
}


/**
 * ✅ NOUVELLE FONCTION: Analyse si une requête convient au RAG
 */
function analyzeForRAG(message: string): {
  canHandle: boolean,
  confidence: number,
  reasoning: string,
  criteria: any
} {
  const lowerMessage = message.toLowerCase().trim()
  let confidence = 0
  let reasoning = ''
  const criteria: any = {}

  // Mots-clés de vêtements spécifiques
  const clothingKeywords = [
    'tshirt', 't-shirt', 'chemise', 'pull', 'sweat', 'gilet', 'veste', 'manteau',
    'pantalon', 'jean', 'short', 'jupe', 'robe', 'combinaison',
    'chaussures', 'baskets', 'sneakers', 'bottes', 'sandales', 'talons',
    'sous-vêtements', 'soutien-gorge', 'culotte', 'boxer', 'chaussettes',
    'accessoires', 'sac', 'ceinture', 'chapeau', 'écharpe', 'gants'
  ]

  const clothingMatches = clothingKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length

  // Critères spécifiques (couleur, taille, prix)
  const criteriaKeywords = [
    'noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'gris', 'marron',
    'taille', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'small', 'medium', 'large',
    '36', '38', '40', '42', '44', '46', '48', '50',
    'prix', 'euro', '€', 'budget', 'moins de', 'maximum', 'pas cher'
  ]

  const criteriaMatches = criteriaKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length

  // Extraction des critères pour les métadonnées
  extractCriteriaForRAG(lowerMessage, criteria)

  // Calcul de la confiance
  confidence += clothingMatches * 0.4  // Poids élevé pour les vêtements
  confidence += criteriaMatches * 0.3  // Poids moyen pour les critères

  // ✅ BONUS: Requêtes avec critères précis (idéal pour RAG)
  if (criteriaMatches >= 2) {
    confidence += 0.3
    reasoning += 'Critères multiples détectés (idéal pour RAG). '
  }

  // ✅ BONUS: Articles spécifiques avec critères
  if (clothingMatches > 0 && criteriaMatches > 0) {
    confidence += 0.4
    reasoning += 'Article spécifique avec critères précis. '
  }

  // ✅ BONUS: Recherche avec taille ET couleur (forte indication RAG)
  const hasSizeAndColor = 
    criteriaKeywords.some(k => ['taille', 'xs', 's', 'm', 'l', 'xl', 'xxl', '36', '38', '40', '42', '44', '46', '48', '50'].includes(k) && lowerMessage.includes(k)) &&
    criteriaKeywords.some(k => ['noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'gris'].includes(k) && lowerMessage.includes(k))
  
  if (hasSizeAndColor) {
    confidence += 0.5
    reasoning += 'Taille ET couleur spécifiées (parfait pour RAG). '
  }

  // ✅ PÉNALITÉ: Demandes d'outfits complets (pas idéal pour RAG)
  const outfitKeywords = ['tenue', 'outfit', 'look', 'ensemble', 'style complet', 'coordonner', 'assortir']
  if (outfitKeywords.some(keyword => lowerMessage.includes(keyword))) {
    confidence -= 0.4
    reasoning += 'Demande d\'outfit détectée (moins adapté au RAG). '
  }

  // ✅ PÉNALITÉ: Questions FAQ
  if (lowerMessage.includes('?') || lowerMessage.includes('comment') || lowerMessage.includes('pourquoi')) {
    confidence -= 0.3
    reasoning += 'Question FAQ détectée. '
  }

  confidence = Math.min(Math.max(confidence, 0), 1)

  // Raisonnement final
  if (confidence > 0.7) {
    reasoning += 'Excellent candidat pour RAG.'
  } else if (confidence > 0.5) {
    reasoning += 'Bon candidat pour RAG.'
  } else {
    reasoning += 'Pas adapté au RAG.'
  }

  return {
    canHandle: confidence > 0.5, // Seuil pour traiter avec RAG
    confidence,
    reasoning,
    criteria
  }
}

/**
 * ✅ NOUVELLE FONCTION: Extrait les critères détaillés
 */
function extractCriteriaForRAG(lowerMessage: string, criteria: any): void {
  // Extraction de la couleur
  const colors = ['noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'gris', 'beige', 'marron']
  for (const color of colors) {
    if (lowerMessage.includes(color)) {
      criteria.color = color
      break
    }
  }

  // Extraction de la taille
  const sizePatterns = [
    /taille\s+(xs|s|m|l|xl|xxl)/i,
    /\b(xs|s|m|l|xl|xxl)\b/i,
    /taille\s+(\d+)/i,
    /\b(36|38|40|42|44|46|48|50)\b/
  ]
  
  for (const pattern of sizePatterns) {
    const match = lowerMessage.match(pattern)
    if (match) {
      criteria.size = match[1].toUpperCase()
      break
    }
  }

  // Extraction du budget
  const pricePatterns = [
    /moins de (\d+)/i,
    /maximum (\d+)/i,
    /budget.*?(\d+)/i,
    /(\d+)\s*€/i,
    /(\d+)\s*euros?/i
  ]
  
  for (const pattern of pricePatterns) {
    const match = lowerMessage.match(pattern)
    if (match) {
      criteria.maxPrice = parseInt(match[1])
      break
    }
  }
}

/**
 * ✅ NOUVELLE FONCTION: Formate la réponse RAG pour l'interface Master
 */
function formatRAGResponse(ragData: any, originalQuery: string, criteria: any): any {
  if (!ragData.success || !ragData.data?.results) {
    return {
      id: `rag-error-${Date.now()}`,
      content: "Je n'ai pas trouvé de produits correspondant à votre recherche. Pourriez-vous préciser vos critères ?",
      type: 'bot',
      timestamp: new Date().toISOString(),
      metadata: {
        intent: 'product_search_failed',
        confidence: 0.2,
        aiType: 'rag-openai',
        originalQuery,
        criteria
      }
    }
  }

  const results = ragData.data.results
  
  // Si c'est une demande de clarification
  if (results.length === 1 && results[0].searchType === 'clarification') {
    return {
      id: `rag-clarification-${Date.now()}`,
      content: results[0].document.content,
      type: 'bot',
      timestamp: new Date().toISOString(),
      metadata: {
        intent: 'clarification_request',
        confidence: 1.0,
        aiType: 'rag-openai',
        originalQuery,
        missingInfo: results[0].document.metadata.missingInfo || []
      }
    }
  }

  // Si on a des résultats de produits
  if (results.length > 0) {
    let content = `Voici ce que j'ai trouvé pour votre recherche "${originalQuery}" :\n\n`
    
    results.slice(0, 3).forEach((result: any, index: number) => {
      const product = result.document.metadata
      content += `${index + 1}. **${product.title}**\n`
      content += `   Prix: ${product.price}€\n`
      
      if (product.colors?.length > 0) {
        content += `   Couleurs: ${product.colors.join(', ')}\n`
      }
      
      if (product.sizes?.length > 0) {
        content += `   Tailles: ${product.sizes.join(', ')}\n`
      }
      
      content += `\n`
    })

    content += `\n💡 J'ai trouvé ${results.length} produit${results.length > 1 ? 's' : ''} correspondant à vos critères.`

    return {
      id: `rag-products-${Date.now()}`,
      content,
      type: 'bot',
      timestamp: new Date().toISOString(),
      metadata: {
        intent: 'product_recommendations',
        confidence: 0.9,
        aiType: 'rag-openai',
        originalQuery,
        criteria,
        productsFound: results.length,
        searchTime: ragData.data.searchTime,
        searchType: ragData.data.searchType
      }
    }
  }

  return {
    id: `rag-noresults-${Date.now()}`,
    content: "Je n'ai pas trouvé de produits correspondant exactement à votre recherche. Pouvez-vous reformuler ou préciser vos critères ?",
    type: 'bot',
    timestamp: new Date().toISOString(),
    metadata: {
      intent: 'no_products_found',
      confidence: 0.3,
      aiType: 'rag-openai',
      originalQuery,
      criteria
    }
  }
}

/**
 * Applique la personnalisation du chatbot à la réponse
 */
function applyPersonalization(content: string, personality: ChatbotPersonality): string {
  let personalizedContent = content

  // Adaptation du ton
  if (personality.tone === "Humoristique") {
    // Ajouter des touches d'humour si approprié
    if (!personalizedContent.includes('😄') && !personalizedContent.includes('😊')) {
      personalizedContent = personalizedContent.replace(/^/, '😄 ')
    }
  } else if (personality.tone === "Professionnel") {
    // Assurer un ton plus formel
    personalizedContent = personalizedContent.replace(/!/g, '.')
  }

  // Adaptation de la formalité
  if (personality.formality === "Vouvoiement") {
    personalizedContent = personalizedContent
      .replace(/\btu\b/g, 'vous')
      .replace(/\bte\b/g, 'vous')
      .replace(/\bton\b/g, 'votre')
      .replace(/\bta\b/g, 'votre')
      .replace(/\btes\b/g, 'vos')
  }

  // Adaptation de la verbosité
  if (personality.verbosity === "Concis") {
    // Raccourcir si la réponse est très longue
    if (personalizedContent.length > 300) {
      const sentences = personalizedContent.split('. ')
      personalizedContent = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '')
    }
  } else if (personality.verbosity === "Très détaillé") {
    // Ajouter des détails supplémentaires si approprié
    if (!personalizedContent.includes('💡') && !personalizedContent.includes('ℹ️')) {
      personalizedContent += '\n\n💡 N\'hésitez pas si vous avez d\'autres questions !'
    }
  }

  // Adaptation de l'empathie
  if (personality.empathy === "Élevée") {
    if (!personalizedContent.includes('😊') && !personalizedContent.includes('🤗')) {
      personalizedContent = personalizedContent.replace(/^/, '😊 ')
    }
  }

  // Adaptation de la proactivité
  if (personality.proactivity === "Très proactif") {
    if (!personalizedContent.includes('Puis-je') && !personalizedContent.includes('Souhaitez-vous')) {
      personalizedContent += '\n\nPuis-je vous aider avec autre chose ?'
    }
  }

  return personalizedContent
}

/**
 * Génère une réponse de fallback personnalisée
 */
function generatePersonalizedFallback(personality: ChatbotPersonality): string {
  const baseMessages = {
    "Professionnel": "Je vous prie de m'excuser, mais je ne peux pas traiter votre demande pour le moment.",
    "Décontracté": "Désolé, je ne peux pas t'aider avec ça pour l'instant.",
    "Amical": "Oh, je ne suis pas sûr de pouvoir t'aider avec ça, mais essayons autre chose !",
    "Expert": "Cette demande dépasse mes compétences actuelles. Permettez-moi de vous orienter.",
    "Humoristique": "Oups ! 😅 Là tu me poses une colle ! Essaie quelque chose d'autre ?"
  }

  let fallback = baseMessages[personality.tone] || baseMessages["Amical"]

  if (personality.empathy === "Élevée") {
    fallback += " Je comprends que cela puisse être frustrant."
  }

  if (personality.proactivity === "Très proactif") {
    fallback += " Puis-je vous suggérer de reformuler votre question ?"
  }

  return fallback
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

    const routingResult = await callMasterAI(userMessage, chatbotId)
    console.log('routingResult', routingResult)
    if (routingResult.success) {
      const response = routingResult.response
      const personalizedContent = applyPersonalization(response.message, personality)
      console.log('personalizedContent', personalizedContent)
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