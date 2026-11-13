import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { getAIProviderConfig } from '../config/ai-config'

/**
 * Types pour l'infrastructure Langchain
 */
export interface LangchainMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LangchainResponse {
  success: boolean
  content?: string
  metadata?: {
    model: string
    tokens?: number
    confidence?: number
    processingTime?: number
    chainType?: string
    routedTo?: string
    routingConfidence?: number
    personalityApplied?: any
    configSource?: string
    chatbotName?: string
    masterVersion?: string
    originalLength?: number
    personalizedLength?: number
    [key: string]: any // Pour flexibilité
  }
  error?: string
}

export interface LangchainAgentConfig {
  agentType: 'faq' | 'articles' | 'outfits' | 'master'
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  confidenceThreshold?: number
}

/**
 * Service de base Langchain - Infrastructure commune
 */
export class BaseLangchainService {
  protected llm: ChatOpenAI
  protected config: LangchainAgentConfig
  protected outputParser: StringOutputParser

  constructor(config: LangchainAgentConfig) {
    this.config = config
    this.outputParser = new StringOutputParser()
    
    // Configuration du LLM OpenAI via Langchain
    const aiConfig = getAIProviderConfig('openai')
    
    this.llm = new ChatOpenAI({
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      temperature: config.temperature || aiConfig.temperature,
      maxTokens: config.maxTokens || aiConfig.maxTokens,
      timeout: aiConfig.timeout,
      streaming: false
    })
  }

  /**
   * Crée un prompt template personnalisé
   */
  protected createPromptTemplate(templateString: string): PromptTemplate {
    return PromptTemplate.fromTemplate(templateString)
  }

  /**
   * Crée une chain simple de type: Prompt → LLM → Output Parser
   */
  protected createSimpleChain(promptTemplate: PromptTemplate): RunnableSequence<any, string> {
    return RunnableSequence.from([
      promptTemplate,
      this.llm,
      this.outputParser
    ])
  }

  /**
   * Convertit les messages en format Langchain BaseMessage[]
   */
  protected convertMessages(messages: LangchainMessage[]): BaseMessage[] {
    return messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content)
        case 'user':
          return new HumanMessage(msg.content)
        case 'assistant':
          return new AIMessage(msg.content)
        default:
          return new HumanMessage(msg.content)
      }
    })
  }

  /**
   * Exécute une chain avec gestion d'erreurs et métadonnées
   */
  protected async executeChain(
    chain: RunnableSequence<any, string>,
    input: any,
    metadata?: any
  ): Promise<LangchainResponse> {
    const startTime = Date.now()

    try {
      const result = await chain.invoke(input)
      const processingTime = Date.now() - startTime

      return {
        success: true,
        content: result,
        metadata: {
          model: this.llm.modelName,
          processingTime,
          chainType: this.config.agentType,
          ...metadata
        }
      }
    } catch (error: any) {
      console.error(`❌ Erreur Langchain ${this.config.agentType}:`, error)
      
      return {
        success: false,
        error: error.message,
        metadata: {
          model: this.llm.modelName,
          processingTime: Date.now() - startTime,
          chainType: this.config.agentType
        }
      }
    }
  }

  /**
   * Calcule un score de confiance basé sur des critères
   */
  protected calculateConfidence(content: string, criteria: any = {}): number {
    let confidence = 0.5 // Base

    // Longueur de la réponse (plus long = plus confiant)
    if (content.length > 100) confidence += 0.1
    if (content.length > 300) confidence += 0.1

    // Présence d'émoticônes/formatage (indique une réponse structurée)
    if (content.includes('•') || content.includes('*') || content.includes('✓')) confidence += 0.1
    if (content.includes('😊') || content.includes('👍') || content.includes('🎯')) confidence += 0.1

    // Critères spécifiques selon l'agent
    if (criteria.keywordsFound > 0) confidence += criteria.keywordsFound * 0.05
    if (criteria.structuredResponse) confidence += 0.15
    if (criteria.specificData) confidence += 0.2

    return Math.min(confidence, 1.0)
  }

  /**
   * Log des métriques Langchain
   */
  protected logMetrics(response: LangchainResponse, input: any): void {
    if (response.success) {
      console.log(`✅ ${this.config.agentType.toUpperCase()} Chain: ${response.metadata?.processingTime}ms - ${response.content?.length} chars`)
    } else {
      console.log(`❌ ${this.config.agentType.toUpperCase()} Chain Error: ${response.error}`)
    }
  }
} 