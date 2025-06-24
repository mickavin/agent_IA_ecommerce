import { NextApiRequest, NextApiResponse } from 'next'

/**
 * API Chat Stream - Utilise l'IA Master avec streaming simulé
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

    console.log('📡 API Chat Stream - Routage vers IA Master')

    // Configuration streaming avec headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Expose-Headers': '*',
      'X-Accel-Buffering': 'no'
    })

    // Signal de démarrage
    const startData = `data: ${JSON.stringify({ 
      type: 'start', 
      data: { 
        timestamp: new Date().toISOString(),
        aiType: 'master',
        message: 'Analyse en cours...'
      } 
    })}\n\n`
    res.write(startData)

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

    // Conversion de la réponse IA Master en format streaming
    if (data.success && data.response) {
      // Signal de routage
      const routingData = `data: ${JSON.stringify({ 
        type: 'routing', 
        data: { 
          aiType: data.response.metadata?.aiType,
          routedTo: data.response.metadata?.routedTo,
          confidence: data.response.metadata?.confidence,
          personalityApplied: data.response.metadata?.personalityApplied
        } 
      })}\n\n`
      res.write(routingData)

      // Simulation du streaming en envoyant le contenu par chunks
      const content = data.response.content
      const chunks = content.match(/.{1,25}/g) || [content]
      let fullResponse = ''

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        fullResponse += chunk
        
        const chunkData = `data: ${JSON.stringify({ 
          type: 'content', 
          data: { 
            content: chunk, 
            fullResponse,
            progress: Math.round((i + 1) / chunks.length * 100)
          } 
        })}\n\n`
        
        res.write(chunkData)
        
        // Délai pour simuler le streaming naturel
        await new Promise(resolve => setTimeout(resolve, 30))
      }

      // Signal de fin
      const completeData = `data: ${JSON.stringify({ 
        type: 'complete', 
        data: { 
          fullResponse,
          timestamp: new Date().toISOString(),
          id: data.response.id,
          stats: { 
            chunks: chunks.length, 
            length: fullResponse.length,
            aiType: data.response.metadata?.aiType,
            routedTo: data.response.metadata?.routedTo,
            confidence: data.response.metadata?.confidence,
            processingTime: data.response.metadata?.processingTime || 0,
            personalityApplied: data.response.metadata?.personalityApplied
          } 
        } 
      })}\n\n`
      
      res.write(completeData)
      res.write('data: [DONE]\n\n')
      res.end()

    } else {
      // Erreur de l'IA Master
      const errorData = `data: ${JSON.stringify({ 
        type: 'error', 
        data: { 
          error: data.error || 'Erreur IA Master',
          message: 'Erreur lors du traitement par l\'IA Master'
        } 
      })}\n\n`
      
      res.write(errorData)
      res.end()
    }

  } catch (error: any) {
    console.error('❌ Erreur API Chat Stream:', error)
    
    const errorData = `data: ${JSON.stringify({ 
      type: 'error', 
      data: { 
        error: error.message,
        message: 'Erreur lors de l\'appel à l\'IA Master'
      } 
    })}\n\n`
    
    res.write(errorData)
    res.end()
  }
} 