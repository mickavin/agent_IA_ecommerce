import { NextApiRequest, NextApiResponse } from 'next'

/**
 * API Chat - Utilise l'IA Master avec personnalisation du chatbot depuis Supabase
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

    // Appel direct à l'IA Master avec chatbotId
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
    return res.status(200).json(masterData)

  } catch (error: any) {
    console.error('❌ Erreur API Chat:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement du message',
      details: error.message
    })
  }
}
