import { BaseLangchainService, LangchainAgentConfig, LangchainResponse } from '../base.langchain.service'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { FAQLangchainAgent } from './faq.langchain.agent'
import { ArticlesLangchainAgent } from './articles.langchain.agent'
import { OutfitsLangchainAgent } from './outfits.langchain.agent'
import { ChatbotConfigService } from '../../services/chatbot-config.service'

/**
 * Types pour l'Agent Master
 */
interface MasterRoutingResult {
  success: boolean
  selectedAgent: string
  confidence: number
  response?: LangchainResponse
  error?: string
  routingReason?: string
}

interface PersonalizationConfig {
  tone: string
  formality: string
  verbosity: string
  empathy: string
  proactivity: string
}

/**
 * Agent Master Langchain - Orchestrateur intelligent avec personnalisation
 */
export class MasterLangchainAgent extends BaseLangchainService {
  private routingChain!: RunnableSequence<any, string>
  private personalizationChain!: RunnableSequence<any, string>
  private faqAgent!: FAQLangchainAgent
  private articlesAgent!: ArticlesLangchainAgent
  private outfitsAgent!: OutfitsLangchainAgent

  constructor(config?: Partial<LangchainAgentConfig>) {
    super({
      agentType: 'master',
      temperature: 0.1,
      maxTokens: 1200,
      confidenceThreshold: 0.4,
      ...config
    })

    this.initializeAgents()
    this.initializeChains()
  }

  /**
   * Initialise les agents spécialisés
   */
  private initializeAgents(): void {
    this.faqAgent = new FAQLangchainAgent()
    this.articlesAgent = new ArticlesLangchainAgent()
    this.outfitsAgent = new OutfitsLangchainAgent()
  }

  /**
   * Initialise les chains spécialisées
   */
  private initializeChains(): void {
    this.routingChain = this.createRoutingChain()
    this.personalizationChain = this.createPersonalizationChain()
  }

  /**
   * Chain pour le routage intelligent
   */
  private createRoutingChain(): RunnableSequence<any, string> {
    const routingPrompt = this.createPromptTemplate(`
Tu es l'agent Master de Younzee. Analyse la demande et détermine quel agent spécialisé doit la traiter.

DEMANDE: {request}
CONTEXTE: {context}

AGENTS DISPONIBLES:
1. **FAQ Agent**: Salutations, questions sur livraison, retours, paiements, tailles, service client
2. **Articles Agent**: Recommandations de produits individuels (t-shirt, jean, robe, chaussures...)
3. **Outfits Agent**: Création de tenues complètes, looks, styles pour occasions spécifiques

ANALYSE:
- Quel est le type de demande?
- Quel agent est le mieux adapté?
- Quel niveau de confiance pour cette décision?

FORMAT JSON STRICT:
{{
  "selectedAgent": "faq|articles|outfits",
  "confidence": 0.0-1.0,
  "reasoning": "Explication du choix",
  "fallbackAgent": "faq|articles|outfits|null"
}}

RÉPONSE JSON:`)

    return this.createSimpleChain(routingPrompt)
  }

  /**
   * Chain pour la personnalisation des réponses
   */
  private createPersonalizationChain(): RunnableSequence<any, string> {
    const personalizationPrompt = this.createPromptTemplate(`
Tu es l'agent de personnalisation Younzee. Adapte la réponse selon la personnalité configurée.

RÉPONSE ORIGINALE: {originalResponse}
PERSONNALITÉ: {personality}

INSTRUCTIONS DE PERSONNALISATION:
- **Ton**: Adapte le style général
- **Formalité**: Ajuste tutoiement/vouvoiement
- **Verbosité**: Modifie la longueur et le détail
- **Empathie**: Adapte l'émotion et la compréhension
- **Proactivité**: Ajuste les suggestions et questions

PERSONNALITÉ CIBLE: {personality}

RÈGLES:
- Garde le contenu informatif intact
- Adapte uniquement le style et la forme
- Maintiens les emojis et la structure si approprié
- Respecte l'intention originale

RÉPONSE PERSONNALISÉE:`)

    return this.createSimpleChain(personalizationPrompt)
  }

  /**
   * Traite une demande avec routage intelligent
   */
  async processQuery(
    request: string,
    chatbotId?: string,
    context: any = {}
  ): Promise<LangchainResponse> {
    try {
      console.log(`🎯 Master Agent Langchain: "${request.substring(0, 50)}..."`)

      // Étape 1: Récupération de la configuration
      const configResult = await ChatbotConfigService.resolveConfig(chatbotId)
      
      if (!configResult.success || !configResult.config) {
        throw new Error('Configuration chatbot non disponible')
      }

      const { config, source } = configResult
      const personality = config.personality

      console.log(`📋 Configuration: ${config.name} (${source})`)

      // Étape 2: Routage intelligent
      const routingResult = await this.routeToAgent(request, context)

      if (!routingResult.success) {
        return this.generateFallbackResponse(request, personality, routingResult.error)
      }

      // Étape 3: Exécution par l'agent spécialisé
      const agentResponse = await this.executeSpecializedAgent(
        routingResult.selectedAgent,
        request,
        personality,
        context
      )

      if (!agentResponse.success) {
        return this.generateFallbackResponse(request, personality, agentResponse.error)
      }

      // Étape 4: Personnalisation de la réponse
      const personalizedResponse = await this.personalizeResponse(
        agentResponse.content!,
        personality
      )

      // Étape 5: Enrichissement des métadonnées
      const enrichedMetadata = {
        ...agentResponse.metadata,
        routedTo: routingResult.selectedAgent,
        routingConfidence: routingResult.confidence,
        personalityApplied: personality,
        configSource: source,
        chatbotName: config.name,
        masterVersion: 'Langchain v1.0',
        originalLength: agentResponse.content?.length,
        personalizedLength: personalizedResponse.content?.length
      }

      console.log(`✅ Master: ${routingResult.selectedAgent} → ${personalizedResponse.content?.length} chars`)

      return {
        success: true,
        content: personalizedResponse.content,
        metadata: enrichedMetadata
      }

    } catch (error: any) {
      console.error('❌ Erreur Master Agent:', error)
      
      return {
        success: false,
        error: error.message,
        metadata: {
          model: this.llm.modelName,
          chainType: 'master',
          errorType: 'master_processing_error'
        }
      }
    }
  }

  /**
   * Route vers l'agent approprié
   */
  private async routeToAgent(request: string, context: any): Promise<MasterRoutingResult> {
    try {
      const routingResult = await this.executeChain(this.routingChain, {
        request,
        context: JSON.stringify(context)
      })

      if (!routingResult.success) {
        return {
          success: false,
          selectedAgent: 'none',
          confidence: 0,
          error: 'Erreur de routage'
        }
      }

      // Parse du JSON de routage
      let routing: any
      try {
        routing = JSON.parse(routingResult.content || '{}')
      } catch (error) {
        console.warn('⚠️ Erreur parsing routage:', error)
        return {
          success: false,
          selectedAgent: 'none',
          confidence: 0,
          error: 'Erreur d\'analyse de routage'
        }
      }

      if (routing.confidence < this.config.confidenceThreshold!) {
        return {
          success: false,
          selectedAgent: routing.selectedAgent || 'none',
          confidence: routing.confidence || 0,
          error: 'Confiance de routage insuffisante',
          routingReason: routing.reasoning
        }
      }

      return {
        success: true,
        selectedAgent: routing.selectedAgent,
        confidence: routing.confidence,
        routingReason: routing.reasoning
      }

    } catch (error: any) {
      return {
        success: false,
        selectedAgent: 'none',
        confidence: 0,
        error: error.message
      }
    }
  }

  /**
   * Exécute l'agent spécialisé sélectionné
   */
  private async executeSpecializedAgent(
    agentType: string,
    request: string,
    personality: any,
    context: any
  ): Promise<LangchainResponse & { canHandle?: boolean; confidence?: number }> {
    try {
      switch (agentType) {
        case 'faq':
          return await this.faqAgent.processQuery(request, personality, context)
        
        case 'articles':
          return await this.articlesAgent.processQuery(request, personality, context)
        
        case 'outfits':
          return await this.outfitsAgent.processQuery(request, personality, context)
        
        default:
          return {
            success: false,
            error: `Agent inconnu: ${agentType}`,
            metadata: { agentType }
          }
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Erreur agent ${agentType}: ${error.message}`,
        metadata: { agentType }
      }
    }
  }

  /**
   * Personnalise la réponse selon la configuration
   */
  private async personalizeResponse(
    originalResponse: string,
    personality: PersonalizationConfig
  ): Promise<LangchainResponse> {
    try {
      return await this.executeChain(this.personalizationChain, {
        originalResponse,
        personality: this.formatPersonalityForPrompt(personality)
      })
    } catch (error: any) {
      console.warn('⚠️ Erreur personnalisation, retour original:', error)
      return {
        success: true,
        content: originalResponse,
        metadata: { personalizationError: error.message }
      }
    }
  }

  /**
   * Génère une réponse de fallback personnalisée
   */
  private generateFallbackResponse(
    request: string,
    personality: PersonalizationConfig,
    error?: string
  ): LangchainResponse {
    const tone = personality?.tone || 'Amical'
    
    const fallbackMessages = {
      'Professionnel': 'Je vous prie de m\'excuser, je ne peux pas traiter votre demande pour le moment. Veuillez reformuler votre question.',
      'Amical': 'Désolé, je ne peux pas t\'aider avec ça pour l\'instant ! Peux-tu reformuler ta question ?',
      'Expert': 'Cette demande dépasse mes compétences actuelles. Pouvez-vous préciser votre besoin ?',
      'Humoristique': 'Oups ! 😅 Tu me poses une colle ! Essaie de reformuler ta question ?'
    }

    const content = fallbackMessages[tone as keyof typeof fallbackMessages] || fallbackMessages['Amical']

    return {
      success: true,
      content,
      metadata: {
        model: this.llm.modelName,
        chainType: 'master_fallback',
        personalityApplied: personality,
        fallbackReason: error || 'Routage impossible'
      }
    }
  }

  /**
   * Formate la personnalité pour les prompts
   */
  private formatPersonalityForPrompt(personality: PersonalizationConfig): string {
    if (!personality) return 'Amical et professionnel'
    
    return `Ton: ${personality.tone}, Formalité: ${personality.formality}, Verbosité: ${personality.verbosity}, Empathie: ${personality.empathy}, Proactivité: ${personality.proactivity}`
  }

  /**
   * Test complet de l'agent Master
   */
  async test(): Promise<void> {
    console.log('🧪 Test complet du Master Agent Langchain...')
    
    const testCases = [
      { request: 'Bonjour, pouvez-vous m\'aider ?', expected: 'faq' },
      { request: 'Je cherche un t-shirt bleu', expected: 'articles' },
      { request: 'J\'ai besoin d\'une tenue pour un mariage', expected: 'outfits' }
    ]

    for (const testCase of testCases) {
      console.log(`\n🔍 Test: "${testCase.request}"`)
      
      const result = await this.processQuery(testCase.request, 'default')
      
      console.log(`📊 Résultat:`, {
        success: result.success,
        routedTo: result.metadata?.routedTo,
        confidence: result.metadata?.routingConfidence,
        contentLength: result.content?.length
      })
    }
    
    console.log('\n✅ Tests Master Agent terminés')
  }
} 