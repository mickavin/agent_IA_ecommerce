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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
  
  try {
    // Récupération de la configuration depuis Supabase
    const configResult = await ChatbotConfigService.resolveConfig(chatbotId)
    
    if (!configResult.success || !configResult.config) {
      throw new Error('Impossible de récupérer la configuration du chatbot')
    }

    const { config, source } = configResult
    ChatbotConfigService.logConfigSource(chatbotId, source, config.name)

    // Test des IAs dans l'ordre de priorité
    const aiEndpoints = [
      { name: 'faq', endpoint: '/api/ai/faq' },
      { name: 'articles', endpoint: '/api/ai/articles' },
      { name: 'outfits', endpoint: '/api/ai/outfits' }
    ]

    for (const ai of aiEndpoints) {
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