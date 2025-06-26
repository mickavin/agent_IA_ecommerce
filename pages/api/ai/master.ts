import { NextApiRequest, NextApiResponse } from 'next'
import { ChatbotConfigService } from '../../../lib/services/chatbot-config.service'

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
 * Route un message vers l'IA spécialisée appropriée
 */
async function routeToSpecializedAI(message: string, chatbotId?: string): Promise<AIRoutingResult> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    // Récupération de la configuration depuis Supabase
    const configResult = await ChatbotConfigService.resolveConfig(chatbotId)
    
    if (!configResult.success || !configResult.config) {
      throw new Error('Impossible de récupérer la configuration du chatbot')
    }

    const { config, source } = configResult
    ChatbotConfigService.logConfigSource(chatbotId, source, config.name)

    // ✅ 1️⃣ DÉTECTION ET APPEL RAG-OPENAI EN PRIORITÉ
    const ragResult = await tryRAGOpenAI(message, baseUrl)
    if (ragResult.success) {
      console.log(`🎯 RAG-OpenAI utilisé avec confiance ${ragResult.confidence}`)
      return {
        success: true,
        aiType: 'rag-openai',
        confidence: ragResult.confidence,
        response: ragResult.response,
        metadata: {
          configSource: source,
          chatbotName: config.name,
          ragData: ragResult.metadata
        }
      }
    }

    // ✅ 2️⃣ FALLBACK vers autres IAs si RAG pas adapté
    console.log(`⚠️ RAG-OpenAI non utilisé: ${ragResult.reason}`)
    
    const fallbackEndpoints = [
      { name: 'faq', endpoint: '/api/ai/faq' },
      { name: 'articles', endpoint: '/api/ai/articles' },
      { name: 'outfits', endpoint: '/api/ai/outfits' }
    ]

    for (const ai of fallbackEndpoints) {
      try {
        const response = await fetch(`${baseUrl}${ai.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            context: {},
            chatbotConfig: {
              personality: config.personality,
              visualConfig: config.visualConfig
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.success && data.response) {
            return {
              success: true,
              aiType: ai.name,
              confidence: data.response.metadata?.confidence || 0.5,
              response: data.response,
              metadata: {
                configSource: source,
                chatbotName: config.name
              }
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Erreur IA ${ai.name}:`, error)
        continue
      }
    }

    // Aucune IA n'a pu traiter, fallback
    return {
      success: false,
      aiType: 'none',
      confidence: 0,
      error: 'Aucune IA disponible'
    }

  } catch (error: any) {
    console.error('❌ Erreur routage IA Master:', error)
    return {
      success: false,
      aiType: 'error',
      confidence: 0,
      error: error.message
    }
  }
}

/**
 * ✅ NOUVELLE FONCTION: Teste si RAG-OpenAI peut traiter la requête
 */
async function tryRAGOpenAI(message: string, baseUrl: string): Promise<{
  success: boolean,
  confidence: number,
  response?: any,
  metadata?: any,
  reason?: string
}> {
  console.log(`🔍 Test RAG-OpenAI pour: "${message.substring(0, 50)}..."`)
  
  // ✅ 1️⃣ ANALYSE DE LA REQUÊTE pour déterminer si RAG est adapté
  const ragAnalysis = analyzeForRAG(message)
  
  if (!ragAnalysis.canHandle) {
    return {
      success: false,
      confidence: ragAnalysis.confidence,
      reason: ragAnalysis.reasoning
    }
  }

  console.log(`✅ RAG adapté (${(ragAnalysis.confidence * 100).toFixed(1)}%): ${ragAnalysis.reasoning}`)

  try {
    // ✅ 2️⃣ APPEL DE RAG-OPENAI
    const response = await fetch(`${baseUrl}/api/rag-openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: message,
        k: 5,
        searchType: 'hybrid'
      })
    })

    if (!response.ok) {
      return {
        success: false,
        confidence: 0,
        reason: `Erreur HTTP RAG: ${response.status}`
      }
    }

    const ragData = await response.json()

    if (!ragData.success) {
      return {
        success: false,
        confidence: 0,
        reason: `RAG failed: ${ragData.error}`
      }
    }

    // ✅ 3️⃣ FORMATAGE DE LA RÉPONSE RAG pour l'interface Master
    const formattedResponse = formatRAGResponse(ragData, message, ragAnalysis.criteria)

    return {
      success: true,
      confidence: ragAnalysis.confidence,
      response: formattedResponse,
      metadata: {
        ragResults: ragData.data?.results?.length || 0,
        searchTime: ragData.data?.searchTime || 0,
        searchType: ragData.data?.searchType || 'hybrid',
        extractedCriteria: ragAnalysis.criteria,
        reasoning: ragAnalysis.reasoning
      }
    }

  } catch (error: any) {
    console.error('❌ Erreur appel RAG-OpenAI:', error)
    return {
      success: false,
      confidence: 0,
      reason: `Exception: ${error.message}`
    }
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
    
    if (!configResult.success || !configResult.config) {
      return res.status(500).json({ 
        error: 'Configuration chatbot non disponible',
        details: configResult.error 
      })
    }

    const { config, source } = configResult
    console.log('config', config)
    const personality = config.personality

    // Log de la configuration utilisée
    console.log(`🎯 IA Master: message "${userMessage.substring(0, 50)}..." avec config ${config.name} (${source})`)

    // Routage vers l'IA spécialisée
    const routingResult = await routeToSpecializedAI(userMessage, chatbotId)

    if (routingResult.success && routingResult.response) {
      // Appliquer la personnalisation
      const originalContent = routingResult.response.content
      const personalizedContent = applyPersonalization(originalContent, personality)

      // Enrichir les métadonnées
      const enrichedMetadata = {
        ...routingResult.response.metadata,
        routedTo: routingResult.aiType,
        confidence: routingResult.confidence,
        personalityApplied: personality,
        configSource: source,
        chatbotName: config.name,
        originalLength: originalContent.length,
        personalizedLength: personalizedContent.length,
        model: 'IA Master (Supabase)'
      }

      return res.status(200).json({
        success: true,
        response: {
          id: `master-${Date.now()}`,
          content: personalizedContent,
          type: 'bot',
          timestamp: new Date().toISOString(),
          metadata: enrichedMetadata
        }
      })
    }

    // Fallback si aucune IA n'a pu traiter
    const fallbackContent = generatePersonalizedFallback(personality)

    return res.status(200).json({
      success: true,
      response: {
        id: `master-fallback-${Date.now()}`,
        content: fallbackContent,
        type: 'bot',
        timestamp: new Date().toISOString(),
        metadata: {
          intent: 'fallback',
          confidence: 0.1,
          aiType: 'master_fallback',
          routedTo: 'none',
          personalityApplied: personality,
          configSource: source,
          chatbotName: config.name,
          model: 'IA Master (Fallback)',
          reason: routingResult.error || 'Aucune IA spécialisée disponible'
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur IA Master:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement par l\'IA Master',
      details: error.message
    })
  }
} 