import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAIService } from '../../../lib/services/openai.service' // Migré vers le AI SDK de Vercel
import { ChatbotConfigService } from '../../../lib/services/chatbot-config.service'

/**
 * IA spécialisée dans les recommandations d'outfits complets
 * Utilise OpenAI avec personnalisation depuis Supabase
 */

/**
 * Analyse si le message correspond à une demande d'outfit
 */
function canHandleOutfits(message: string): { canHandle: boolean; confidence: number } {
  const lowerMessage = message.toLowerCase().trim()
  let confidence = 0

  // Mots-clés d'outfits et tenues
  const outfitKeywords = [
    'tenue', 'outfit', 'look', 'ensemble', 'style', 'coordonner',
    'assortir', 'harmoniser', 'composer', 'créer', 'stylé'
  ]

  const outfitMatches = outfitKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length

  // Occasions spécifiques
  const occasionKeywords = [
    'travail', 'bureau', 'professionnel', 'réunion', 'entretien',
    'soirée', 'fête', 'mariage', 'cérémonie', 'cocktail',
    'décontracté', 'weekend', 'sortie', 'rendez-vous', 'date',
    'sport', 'gym', 'jogging', 'yoga', 'fitness',
    'vacances', 'voyage', 'plage', 'montagne', 'ville',
    'hiver', 'été', 'printemps', 'automne', 'saison'
  ]

  const occasionMatches = occasionKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length

  // Demandes de conseils style
  const styleKeywords = [
    'comment m\'habiller', 'que porter', 'quoi mettre',
    'conseil style', 'aide style', 'stylisme', 'mode',
    'tendance', 'fashion', 'chic', 'élégant', 'casual'
  ]

  const styleMatches = styleKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length

  // Expressions complètes
  const fullPhrases = [
    /comment.*habiller.*pour/i,
    /que.*porter.*pour/i,
    /tenue.*pour/i,
    /outfit.*pour/i,
    /look.*pour/i,
    /comment.*stylé/i,
    /aide.*composer/i,
    /conseil.*tenue/i
  ]

  const phraseMatches = fullPhrases.filter(phrase => 
    phrase.test(lowerMessage)
  ).length

  // Calcul de la confiance
  confidence += outfitMatches * 0.4
  confidence += occasionMatches * 0.3
  confidence += styleMatches * 0.2
  confidence += phraseMatches * 0.4

  // Bonus pour les demandes spécifiques d'occasions
  if (outfitMatches > 0 && occasionMatches > 0) {
    confidence += 0.3
  }

  // Bonus pour les questions complètes
  if (phraseMatches > 0) {
    confidence += 0.2
  }

  // Bonus pour les mots-clés de style
  if (lowerMessage.includes('pour') && (outfitMatches > 0 || styleMatches > 0)) {
    confidence += 0.2
  }

  confidence = Math.min(Math.max(confidence, 0), 1)

  return {
    canHandle: confidence > 0.5,
    confidence
  }
}

/**
 * Extrait les informations de contexte pour l'outfit
 */
function extractOutfitContext(message: string): any {
  const lowerMessage = message.toLowerCase()
  const context: any = {}

  // Extraction de l'occasion
  const occasions = {
    'professionnel': ['travail', 'bureau', 'professionnel', 'réunion', 'entretien', 'business'],
    'soirée': ['soirée', 'fête', 'mariage', 'cérémonie', 'cocktail', 'gala'],
    'décontracté': ['décontracté', 'casual', 'weekend', 'repos', 'détente'],
    'sport': ['sport', 'gym', 'jogging', 'yoga', 'fitness', 'training'],
    'voyage': ['vacances', 'voyage', 'plage', 'montagne', 'city-trip'],
    'romantique': ['rendez-vous', 'date', 'romantique', 'séduction']
  }

  for (const [occasion, keywords] of Object.entries(occasions)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      context.occasion = occasion
      break
    }
  }

  // Extraction de la saison
  const seasons = {
    'hiver': ['hiver', 'froid', 'neige', 'décembre', 'janvier', 'février'],
    'été': ['été', 'chaud', 'chaleur', 'juin', 'juillet', 'août'],
    'printemps': ['printemps', 'mars', 'avril', 'mai'],
    'automne': ['automne', 'septembre', 'octobre', 'novembre']
  }

  for (const [season, keywords] of Object.entries(seasons)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      context.season = season
      break
    }
  }

  // Extraction du style souhaité
  const styles = {
    'élégant': ['élégant', 'chic', 'sophistiqué', 'classe', 'raffiné'],
    'décontracté': ['décontracté', 'casual', 'relax', 'confort'],
    'moderne': ['moderne', 'tendance', 'fashion', 'à la mode'],
    'classique': ['classique', 'intemporel', 'traditionnel'],
    'rock': ['rock', 'edgy', 'rebel', 'grunge'],
    'bohème': ['bohème', 'boho', 'hippie', 'libre']
  }

  for (const [style, keywords] of Object.entries(styles)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      context.style = style
      break
    }
  }

  // Extraction des couleurs préférées
  const colors = ['noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'gris', 'beige', 'marron']
  for (const color of colors) {
    if (lowerMessage.includes(color)) {
      context.preferredColor = color
      break
    }
  }

  return context
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
    const analysis = canHandleOutfits(userMessage)

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
      console.warn('⚠️ Utilisation config par défaut pour IA Outfits')
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

    // Extraction des critères
    const criteria = extractOutfitContext(userMessage)
    
    // Ajout des critères au contexte
    const enhancedContext = {
      ...context,
      outfitCriteria: criteria,
      userPreferences: context.userPreferences || {}
    }

    // Construction du prompt enrichi
    let contextualInfo = ''
    if (Object.keys(criteria).length > 0) {
      contextualInfo = `\n\nCRITÈRES DÉTECTÉS:\n`
      if (criteria.occasion) contextualInfo += `- Occasion: ${criteria.occasion}\n`
      if (criteria.style) contextualInfo += `- Style: ${criteria.style}\n`
      if (criteria.season) contextualInfo += `- Saison: ${criteria.season}\n`
      if (criteria.budget) contextualInfo += `- Budget: ${criteria.budget}€\n`
      contextualInfo += '\nUtilise ces critères pour tes recommandations d\'outfits.'
    }

    // Génération via OpenAI
    const openAIService = new OpenAIService()
    const systemPrompt = OpenAIService.createSystemPrompt('outfits', personality) + contextualInfo
    
    const startTime = Date.now()
    const content = await openAIService.generateResponse({
      systemPrompt,
      userMessage,
      context: enhancedContext,
      maxTokens: 800,
      temperature: 0.8
    })
    const processingTime = Date.now() - startTime

    return res.status(200).json({
      success: true,
      response: {
        id: `outfits-${Date.now()}`,
        content,
        type: 'bot',
        timestamp: new Date().toISOString(),
        metadata: {
          intent: 'outfit_recommendation',
          confidence: analysis.confidence,
          aiType: 'outfits',
          processingTime,
          model: 'openai',
          outfitCriteria: criteria,
          routedTo: 'outfits',
          personalityApplied: personality,
          configSource: source || 'default',
          chatbotName: config?.name || 'Assistant par défaut'
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur IA Outfits:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de la recommandation d\'outfits',
      details: error.message
    })
  }
}
