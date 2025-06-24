import { NextApiRequest, NextApiResponse } from 'next'

/**
 * API Chat - Utilise l'IA Master avec personnalisation du chatbot
 * Compatible avec l'ancienne interface mais utilise la nouvelle architecture
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { message, context = {}, chatbotConfig = {} } = req.body

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message requis' })
    }

    console.log('📞 API Chat - Routage vers IA Master')

    // Appel vers l'IA Master
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/master`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message.trim(),
        context: {
          conversationHistory: context.conversationHistory || [],
          userPreferences: context.userPreferences || {},
          previousIntent: context.previousIntent,
          userId: context.userId
        },
        chatbotConfig: {
          personality: chatbotConfig.personality || {},
          visualConfig: chatbotConfig.visualConfig || {}
        }
      })
    })

    const data = await response.json()

    if (data.success && data.response) {
      // Conversion au format de l'ancienne API pour compatibilité
      const legacyResponse = {
        success: true,
        response: {
          id: data.response.id,
          content: data.response.content,
          type: 'bot',
          timestamp: data.response.timestamp,
          metadata: {
            intent: data.response.metadata?.intent || 'general',
            confidence: data.response.metadata?.confidence || 0.5,
            responseTime: data.response.metadata?.processingTime || 0,
            products: data.response.metadata?.recommendations || [],
            recommendations: data.response.metadata?.recommendations?.slice(0, 3) || [],
            totalTokens: 0, // Non applicable avec IA Master
            model: `IA Master (${data.response.metadata?.routedTo || 'master'})`,
            aiType: data.response.metadata?.aiType || 'master',
            routedTo: data.response.metadata?.routedTo,
            personalityApplied: data.response.metadata?.personalityApplied,
            masterMetadata: data.response.metadata
          }
        }
      }

      return res.status(200).json(legacyResponse)
    } else {
      return res.status(500).json({
        success: false,
        error: data.error || 'Erreur IA Master'
      })
    }

  } catch (error: any) {
    console.error('❌ Erreur API Chat:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'appel à l\'IA Master',
      details: error.message
    })
  }
}
