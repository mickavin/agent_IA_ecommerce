/**
 * Service de streaming utilisant le AI SDK de Vercel
 * Pour remplacer le streaming simulé
 */

import { streamText } from 'ai'
import { getAIProviderConfig } from '../config/ai-config'
import { OpenAIService } from './openai.service'

interface StreamingOptions {
  systemPrompt: string
  userMessage: string
  context?: any
  maxTokens?: number
  temperature?: number
}

export class StreamingService {
  private config = getAIProviderConfig('openai')
  
  constructor() {
    if (!this.config.apiKey) {
      console.warn('⚠️ Aucune clé API OpenAI configurée pour le streaming.')
    }
  }

  /**
   * Génère une réponse en streaming avec le AI SDK de Vercel
   */
  async generateStreamingResponse(options: StreamingOptions) {
    const { systemPrompt, userMessage, context, maxTokens, temperature } = options

    try {
      // Préparation des messages
      const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
        {
          role: 'system',
          content: systemPrompt
        }
      ]

      // Ajouter le contexte si disponible
      if (context?.conversationHistory?.length) {
        const recentHistory = context.conversationHistory.slice(-4) // 4 derniers messages
        for (const msg of recentHistory) {
          messages.push({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })
        }
      }

      // Ajouter le message utilisateur
      messages.push({
        role: 'user',
        content: userMessage
      })

      // Utilisation du streaming AI SDK de Vercel
      const result = await streamText({
        model: this.config.vercelAIModel,
        messages,
        maxTokens: maxTokens || this.config.maxTokens,
        temperature: temperature !== undefined ? temperature : this.config.temperature,
      })

      return result

    } catch (error: any) {
      console.error('❌ Erreur Streaming Service:', error)
      throw error
    }
  }

  /**
   * Génère une réponse spécialisée en streaming
   */
  async generateSpecializedStreamingResponse(
    aiType: 'faq' | 'articles' | 'outfits',
    userMessage: string,
    context?: any,
    personality?: any
  ) {
    const systemPrompt = OpenAIService.createSystemPrompt(aiType, personality)
    
    return this.generateStreamingResponse({
      systemPrompt,
      userMessage,
      context
    })
  }
}

export const streamingService = new StreamingService() 