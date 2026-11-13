import { NextApiRequest, NextApiResponse } from 'next'
import { MasterLangchainAgent } from '../../../lib/langchain/agents/master.langchain.agent'
import { streamingService } from '../../../lib/services/streaming.service'

/**
 * Endpoint Chat Stream Langchain - Streaming des réponses en temps réel
 * Migré vers le vrai streaming avec le AI SDK de Vercel
 */

interface StreamRequestBody {
  message: string
  chatbotId?: string
  context?: any
  conversationHistory?: any[]
}

// Instance globale pour éviter la réinitialisation
let masterAgent: MasterLangchainAgent | null = null

function getMasterAgent(): MasterLangchainAgent {
  if (!masterAgent) {
    masterAgent = new MasterLangchainAgent()
  }
  return masterAgent
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { message, chatbotId, context = {}, conversationHistory = [] }: StreamRequestBody = req.body

    // Validation des données
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message requis' })
    }

    const userMessage = message.trim()
    const requestContext = {
      ...context,
      conversationHistory: conversationHistory.slice(-10),
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    }

    console.log(`🌊 Chat Stream Langchain: "${userMessage.substring(0, 50)}..." (chatbot: ${chatbotId || 'default'})`)

    try {
      // Traitement par l'Agent Master Langchain pour déterminer le type
      const agent = getMasterAgent()
      const routingResult = await agent.processQuery(userMessage, chatbotId, requestContext)

      if (!routingResult.success) {
        return res.status(500).json({ error: routingResult.error || 'Erreur lors du traitement' })
      }

      // Déterminer le type d'IA à utiliser
      const aiType = routingResult.metadata?.routedTo || 'faq'
      const aiTypeMap: { [key: string]: 'faq' | 'articles' | 'outfits' } = {
        'FAQ AI': 'faq',
        'Individual Clothing AI': 'articles',
        'Outfit Recommendation AI': 'outfits'
      }

      // Utilisation du vrai streaming avec le AI SDK de Vercel
      const streamResult = await streamingService.generateSpecializedStreamingResponse(
        aiTypeMap[aiType] || 'faq',
        userMessage,
        requestContext
      )

      // Configuration des headers pour le streaming
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Access-Control-Allow-Origin', '*')

      // Stream des données
      for await (const chunk of streamResult.textStream) {
        res.write(chunk)
      }

      res.end()

      console.log(`✅ Stream Langchain: ${routingResult.metadata?.routedTo} → streaming completed`)

    } catch (processingError: any) {
      console.error('❌ Erreur traitement stream:', processingError)
      return res.status(500).json({ error: processingError.message || 'Erreur lors du traitement' })
    }

  } catch (error: any) {
    console.error('❌ Erreur Chat Stream Langchain:', error)
    
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error.message
    })
  }
} 