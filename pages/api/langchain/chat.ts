import { NextApiRequest, NextApiResponse } from 'next'
import { MasterLangchainAgent } from '../../../lib/langchain/agents/master.langchain.agent'

/**
 * Endpoint Chat Langchain - Point d'entrée principal avec infrastructure Langchain
 */

interface ChatRequestBody {
  message: string
  chatbotId?: string
  context?: any
  conversationHistory?: any[]
}

interface ChatResponse {
  success: boolean
  response?: {
    id: string
    content: string
    type: 'bot'
    timestamp: string
    metadata: any
  }
  error?: string
  details?: string
}

// Instance globale pour éviter la réinitialisation
let masterAgent: MasterLangchainAgent | null = null

function getMasterAgent(): MasterLangchainAgent {
  if (!masterAgent) {
    masterAgent = new MasterLangchainAgent()
  }
  return masterAgent
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ChatResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Méthode non autorisée' 
    })
  }

  try {
    const { message, chatbotId, context = {}, conversationHistory = [] }: ChatRequestBody = req.body

    // Validation des données
    if (!message?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message requis' 
      })
    }

    const userMessage = message.trim()
    const requestContext = {
      ...context,
      conversationHistory: conversationHistory.slice(-10), // Garde les 10 derniers messages
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    }

    console.log(`🚀 Chat Langchain: "${userMessage.substring(0, 50)}..." (chatbot: ${chatbotId || 'default'})`)

    // Traitement par l'Agent Master Langchain
    const agent = getMasterAgent()
    const result = await agent.processQuery(userMessage, chatbotId, requestContext)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du traitement par l\'Agent Master',
        details: result.error
      })
    }

    // Formation de la réponse
    const response: ChatResponse = {
      success: true,
      response: {
        id: `langchain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: result.content || 'Réponse générée',
        type: 'bot',
        timestamp: new Date().toISOString(),
        metadata: {
          ...result.metadata,
          framework: 'Langchain',
          version: '1.0',
          processingTime: result.metadata?.processingTime,
          model: result.metadata?.model,
          routedTo: result.metadata?.routedTo,
          confidence: result.metadata?.routingConfidence,
          personalityApplied: result.metadata?.personalityApplied,
          configSource: result.metadata?.configSource,
          chatbotName: result.metadata?.chatbotName
        }
      }
    }

    // Log de succès
    console.log(`✅ Chat Langchain: ${result.metadata?.routedTo} → ${result.content?.length} chars (${result.metadata?.processingTime}ms)`)

    return res.status(200).json(response)

  } catch (error: any) {
    console.error('❌ Erreur Chat Langchain:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    })
  }
} 