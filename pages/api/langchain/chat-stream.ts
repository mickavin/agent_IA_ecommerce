import { NextApiRequest, NextApiResponse } from 'next'
import { MasterLangchainAgent } from '../../../lib/langchain/agents/master.langchain.agent'

/**
 * Endpoint Chat Stream Langchain - Streaming des réponses en temps réel
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

    // Configuration du streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // Fonction pour envoyer des chunks
    const sendChunk = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    // Début du stream
    sendChunk({
      type: 'start',
      timestamp: new Date().toISOString(),
      message: 'Démarrage du traitement...'
    })

    try {
      // Traitement par l'Agent Master Langchain
      const agent = getMasterAgent()
      
      // Simulation du streaming (en attendant une vraie implémentation streaming de Langchain)
      sendChunk({
        type: 'processing',
        timestamp: new Date().toISOString(),
        message: 'Analyse de votre demande...'
      })

      const result = await agent.processQuery(userMessage, chatbotId, requestContext)

      if (!result.success) {
        sendChunk({
          type: 'error',
          timestamp: new Date().toISOString(),
          error: result.error || 'Erreur lors du traitement'
        })
        return res.end()
      }

      // Simulation du streaming de la réponse
      const content = result.content || ''
      const words = content.split(' ')
      
      sendChunk({
        type: 'processing',
        timestamp: new Date().toISOString(),
        message: 'Génération de la réponse...'
      })

      // Stream mot par mot
      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        const isLast = i === words.length - 1
        
        sendChunk({
          type: 'chunk',
          timestamp: new Date().toISOString(),
          content: word + (isLast ? '' : ' '),
          isComplete: isLast,
          metadata: isLast ? {
            ...result.metadata,
            framework: 'Langchain Stream',
            version: '1.0',
            totalWords: words.length,
            processingTime: result.metadata?.processingTime,
            routedTo: result.metadata?.routedTo,
            confidence: result.metadata?.routingConfidence
          } : undefined
        })

        // Petit délai pour simuler le streaming naturel
        if (!isLast) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      // Fin du stream
      sendChunk({
        type: 'complete',
        timestamp: new Date().toISOString(),
        message: 'Réponse terminée',
        metadata: {
          ...result.metadata,
          framework: 'Langchain Stream',
          version: '1.0'
        }
      })

      console.log(`✅ Stream Langchain: ${result.metadata?.routedTo} → ${content.length} chars`)

    } catch (processingError: any) {
      console.error('❌ Erreur traitement stream:', processingError)
      
      sendChunk({
        type: 'error',
        timestamp: new Date().toISOString(),
        error: processingError.message || 'Erreur lors du traitement'
      })
    }

    res.end()

  } catch (error: any) {
    console.error('❌ Erreur Chat Stream Langchain:', error)
    
    // Si les headers ne sont pas encore envoyés
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Erreur interne du serveur',
        details: error.message
      })
    }

    // Sinon envoyer l'erreur via stream
    try {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      })}\n\n`)
      res.end()
    } catch (streamError) {
      console.error('❌ Erreur envoi erreur stream:', streamError)
      res.end()
    }
  }
} 