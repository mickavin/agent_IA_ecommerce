import { IAMasterService } from './ia-master.service'
import type { Product, AIRequest, AIResponse } from '../types'

export interface ChatbotMessage {
  id: string
  content: string
  type: 'user' | 'bot'
  timestamp: string
  metadata?: {
    intent?: string
    entities?: any
    confidence?: number
    products?: Product[]
    recommendations?: Product[]
    aiType?: string
    processingTime?: number
  }
}

export interface UserPreferences {
  budget?: { min: number; max: number }
  categories?: string[]
  sizes?: string[]
  colors?: string[]
  gender?: string
  style?: string
}

export interface ChatContext {
  userId?: string
  preferences: UserPreferences
  conversationHistory: ChatbotMessage[]
  currentIntent?: string
}

/**
 * @deprecated Ce service est remplacé par l'architecture IA Master
 * Service de compatibility qui redirige vers l'IA Master
 * 
 * Ce fichier est un doublon de intelligent-chatbot.service.ts et sera supprimé
 * à terme. Utilisez directement l'IA Master pour toutes les nouvelles fonctionnalités.
 */
export class ChatbotIntelligenceService {
  private static iaMasterService: IAMasterService

  private static getIAMasterService(): IAMasterService {
    if (!this.iaMasterService) {
      this.iaMasterService = new IAMasterService({
        enableLogging: true,
        enableAnalytics: true,
        confidenceThreshold: 0.4,
        maxProcessingTime: 25000
      })
    }
    return this.iaMasterService
  }

  /**
   * @deprecated Utilisez directement l'IA Master
   * Génère une réponse via l'IA Master
   */
  static async generateResponse(
    userMessage: string, 
    context: ChatContext
  ): Promise<ChatbotMessage> {
    console.warn('⚠️ DEPRECATED: ChatbotIntelligenceService.generateResponse() est déprécié. Utilisez l\'IA Master directement.')

    try {
      const iaMaster = this.getIAMasterService()

      // Conversion du contexte vers le format IA Master
      const aiRequest: AIRequest = {
        id: `legacy-chatbot-intelligence-${Date.now()}`,
        message: userMessage,
        userId: context.userId,
        sessionId: context.userId || `session-${Date.now()}`,
        context: {
          conversationHistory: context.conversationHistory.map(msg => ({
            id: msg.id,
            content: msg.content,
            type: msg.type === 'user' ? 'user' : 'bot',
            timestamp: msg.timestamp
          })),
          userPreferences: context.preferences,
          previousIntent: context.currentIntent
        },
        timestamp: new Date().toISOString()
      }

      // Appel vers l'IA Master
      const aiResponse: AIResponse = await iaMaster.processRequest(aiRequest)

      // Conversion de la réponse IA Master vers le format legacy
      return {
        id: aiResponse.id,
        content: aiResponse.content,
        type: 'bot',
        timestamp: aiResponse.timestamp,
        metadata: {
          intent: aiResponse.metadata?.intent,
          entities: aiResponse.metadata?.entities,
          confidence: aiResponse.confidence,
          products: aiResponse.metadata?.recommendations || [],
          recommendations: aiResponse.metadata?.recommendations?.slice(0, 3) || [],
          aiType: aiResponse.aiType,
          processingTime: aiResponse.metadata?.processingTime
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'appel à l\'IA Master depuis ChatbotIntelligenceService:', error)
      
      return {
        id: `error-${Date.now()}`,
        content: "Désolé, j'ai rencontré un problème technique. Pouvez-vous réessayer ? 😅",
        type: 'bot',
        timestamp: new Date().toISOString(),
        metadata: {
          intent: 'error',
          entities: {},
          confidence: 0,
          products: [],
          recommendations: [],
          aiType: 'error'
        }
      }
    }
  }

  /**
   * Méthode de migration pour obtenir l'instance IA Master
   */
  static getIAMaster(): IAMasterService {
    return this.getIAMasterService()
  }

  /**
   * @deprecated Utilisez directement IntelligentChatbotService ou IA Master
   */
  static async processMessage(message: string, context?: any): Promise<ChatbotMessage> {
    console.warn('⚠️ DEPRECATED: ChatbotIntelligenceService.processMessage() est déprécié.')
    
    const chatContext: ChatContext = {
      userId: context?.userId,
      preferences: context?.preferences || {},
      conversationHistory: context?.conversationHistory || [],
      currentIntent: context?.currentIntent
    }

    return this.generateResponse(message, chatContext)
  }
} 