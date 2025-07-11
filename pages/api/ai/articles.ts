import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAIService } from '../../../lib/services/openai.service' // Migré vers le AI SDK de Vercel
import { ChatbotConfigService } from '../../../lib/services/chatbot-config.service'

/**
 * IA spécialisée dans les recommandations d'articles individuels
 * Utilise OpenAI avec personnalisation depuis Supabase
 */

/**
 * Analyse si le message correspond à une demande d'articles
 */
function canHandleArticles(message: string): { canHandle: boolean; confidence: number } {
  const lowerMessage = message.toLowerCase().trim()
  let confidence = 0

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

  // Mots-clés d'action
  const actionKeywords = [
    'cherche', 'veux', 'besoin', 'trouve', 'recommande', 'suggère',
    'conseil', 'aide', 'choix', 'sélection', 'acheter', 'shopping'
  ]

  const actionMatches = actionKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length

  // Critères spécifiques (couleur, taille, prix)
  const criteriaKeywords = [
    'noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'gris',
    'taille', 'xs', 'sm', 'md', 'lg', 'xl', 'small', 'medium', 'large',
    'prix', 'euro', '€', 'budget', 'moins de', 'maximum', 'pas cher'
  ]

  const criteriaMatches = criteriaKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length

  // Calcul de la confiance
  confidence += clothingMatches * 0.5
  confidence += actionMatches * 0.3
  confidence += criteriaMatches * 0.2

  // Bonus pour les demandes spécifiques
  if (clothingMatches > 0 && actionMatches > 0) {
    confidence += 0.3
  }

  // Bonus pour les messages avec critères précis
  if (criteriaMatches > 1) {
    confidence += 0.2
  }

  // Pénalité pour les demandes d'outfits complets
  const outfitKeywords = ['tenue', 'outfit', 'look', 'ensemble', 'style complet', 'coordonner']
  if (outfitKeywords.some(keyword => lowerMessage.includes(keyword))) {
    confidence -= 0.3
  }

  confidence = Math.min(Math.max(confidence, 0), 1)

  return {
    canHandle: confidence > 0.4,
    confidence
  }
}

/**
 * Extrait les critères de recherche du message
 */
function extractCriteria(message: string): any {
  const lowerMessage = message.toLowerCase()
  const criteria: any = {}

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
    /taille\s+(\d+)/i
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

  // Extraction du type de vêtement
  const clothingTypes = {
    'tshirt': ['tshirt', 't-shirt', 't shirt'],
    'chemise': ['chemise'],
    'pull': ['pull', 'pullover'],
    'sweat': ['sweat', 'sweatshirt'],
    'veste': ['veste', 'blazer'],
    'manteau': ['manteau', 'coat'],
    'pantalon': ['pantalon'],
    'jean': ['jean', 'jeans'],
    'short': ['short'],
    'jupe': ['jupe'],
    'robe': ['robe'],
    'chaussures': ['chaussures', 'shoes'],
    'baskets': ['baskets', 'sneakers', 'tennis'],
    'bottes': ['bottes', 'boots']
  }

  for (const [type, keywords] of Object.entries(clothingTypes)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      criteria.category = type
      break
    }
  }

  return criteria
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
    const analysis = canHandleArticles(userMessage)

    if (!analysis.canHandle) {
      return res.status(200).json({
        success: false,
        canHandle: false,
        confidence: analysis.confidence,
        message: 'Cette IA ne peut pas traiter cette requête'
      })
    }

    // Récupération de la configuration depuis Supabase
    const configResult = await ChatbotConfigService.resolveConfig(chatbotId, chatbotConfig)
    
    if (!configResult.success || !configResult.config) {
      console.warn('⚠️ Utilisation config par défaut pour IA Articles')
    }

    const { config, source } = configResult
    console.log('config', config)
    const personality = config?.personality || {
      tone: "Amical",
      formality: "Tutoiement",
      verbosity: "Détaillé",
      empathy: "Élevée",
      proactivity: "Proactif"
    }

    // Log de la configuration utilisée
    ChatbotConfigService.logConfigSource(chatbotId, source || 'default', config?.name || 'Config par défaut')

    // Extraction des critères de recherche
    const criteria = extractCriteria(userMessage)
    
    // Ajout des critères au contexte pour OpenAI
    const enhancedContext = {
      ...context,
      searchCriteria: criteria,
      userPreferences: context.userPreferences || {}
    }

    // Construction du prompt enrichi avec les critères
    let contextualInfo = ''
    if (Object.keys(criteria).length > 0) {
      contextualInfo = `\n\nCRITÈRES DÉTECTÉS:\n`
      if (criteria.category) contextualInfo += `- Type: ${criteria.category}\n`
      if (criteria.color) contextualInfo += `- Couleur: ${criteria.color}\n`
      if (criteria.size) contextualInfo += `- Taille: ${criteria.size}\n`
      if (criteria.maxPrice) contextualInfo += `- Budget max: ${criteria.maxPrice}€\n`
      contextualInfo += '\nUtilise ces critères pour personnaliser tes recommandations.'
    }

    // Génération de la réponse via OpenAI
    const openAIService = new OpenAIService()
    const systemPrompt = OpenAIService.createSystemPrompt('articles', personality) + contextualInfo
    
    const startTime = Date.now()
    const content = await openAIService.generateResponse({
      systemPrompt,
      userMessage,
      context: enhancedContext,
      maxTokens: 1000,
      temperature: 0.8
    })
    const processingTime = Date.now() - startTime

    return res.status(200).json({
      success: true,
      response: {
        id: `articles-${Date.now()}`,
        content,
        type: 'bot',
        timestamp: new Date().toISOString(),
        metadata: {
          intent: 'product_recommendation',
          confidence: analysis.confidence,
          aiType: 'articles',
          processingTime,
          model: 'openai',
          searchCriteria: criteria,
          routedTo: 'articles',
          personalityApplied: personality,
          configSource: source || 'default',
          chatbotName: config?.name || 'Assistant par défaut'
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur IA Articles:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de la recommandation d\'articles',
      details: error.message
    })
  }
} 