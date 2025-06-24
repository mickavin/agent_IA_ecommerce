import { NextApiRequest, NextApiResponse } from 'next'

/**
 * API Chat Stream - Version streaming avec l'IA Master et personnalisation depuis Supabase
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { message, context = {}, chatbotId, chatbotConfig = {} } = req.body

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message requis' })
    }

    // Configuration pour le streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Transfer-Encoding', 'chunked')

    // Fonction pour envoyer des chunks
    const sendChunk = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    try {
      // Appel à l'IA Master avec chatbotId
      const masterResponse = await fetch(`${req.headers.origin || process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/ai/master`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          chatbotId,
          chatbotConfig: {
            personality: chatbotConfig.personality || {},
            visualConfig: chatbotConfig.visualConfig || {}
          }
        })
      })

      if (!masterResponse.ok) {
        throw new Error(`Erreur IA Master: ${masterResponse.statusText}`)
      }

      const masterData = await masterResponse.json()

      if (masterData.success && masterData.response) {
        // Simulation du streaming en envoyant la réponse par chunks
        const content = masterData.response.content
        const words = content.split(' ')
        
        for (let i = 0; i < words.length; i++) {
          const chunk = words.slice(0, i + 1).join(' ')
          
          sendChunk({
            type: 'chunk',
            content: chunk,
            isComplete: i === words.length - 1,
            metadata: i === words.length - 1 ? masterData.response.metadata : undefined
          })
          
          // Délai pour simuler le streaming
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        // Chunk final
        sendChunk({
          type: 'complete',
          response: masterData.response
        })
      } else {
        sendChunk({
          type: 'error',
          error: 'Erreur lors du traitement'
        })
      }

    } catch (error: any) {
      sendChunk({
        type: 'error',
        error: error.message
      })
    }

    res.end()

  } catch (error: any) {
    console.error('❌ Erreur API Chat Stream:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement du message en streaming',
      details: error.message
    })
  }
} 