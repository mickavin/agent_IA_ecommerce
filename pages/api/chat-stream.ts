import { NextApiRequest, NextApiResponse } from 'next'
import { streamingService } from '../../lib/services/streaming.service'

/**
 * API Chat Stream - Version streaming avec l'IA Master et personnalisation depuis Supabase
 * Migré vers le vrai streaming avec le AI SDK de Vercel
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

    // Appel à l'IA Master pour déterminer le type de réponse
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
      return res.status(500).json({ error: 'Erreur IA Master' })
    }

    const masterData = await masterResponse.json()

    // Déterminer le type d'IA à utiliser
    const aiType = masterData.response?.metadata?.routedTo || 'faq'
    const aiTypeMap: { [key: string]: 'faq' | 'articles' | 'outfits' } = {
      'FAQ AI': 'faq',
      'Individual Clothing AI': 'articles',
      'Outfit Recommendation AI': 'outfits'
    }

    try {
      // Utilisation du vrai streaming avec le AI SDK de Vercel
      const streamResult = await streamingService.generateSpecializedStreamingResponse(
        aiTypeMap[aiType] || 'faq',
        message,
        context,
        chatbotConfig.personality
      )

      // Configuration des headers pour le streaming
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      // Stream des données
      for await (const chunk of streamResult.textStream) {
        res.write(chunk)
      }

      res.end()

    } catch (error: any) {
      console.error('❌ Erreur streaming:', error)
      return res.status(500).json({ error: 'Erreur lors du streaming' })
    }

  } catch (error: any) {
    console.error('❌ Erreur API Chat Stream:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement du message en streaming',
      details: error.message
    })
  }
} 