import { BaseLangchainService, LangchainAgentConfig, LangchainResponse } from '../base.langchain.service'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'

/**
 * Agent FAQ Langchain - Spécialisé dans les questions fréquentes
 */
export class FAQLangchainAgent extends BaseLangchainService {
  private faqChain!: RunnableSequence<any, string>
  private greetingChain!: RunnableSequence<any, string>
  private searchChain!: RunnableSequence<any, string>

  constructor(config?: Partial<LangchainAgentConfig>) {
    super({
      agentType: 'faq',
      temperature: 0.3,
      maxTokens: 500,
      confidenceThreshold: 0.3,
      ...config
    })

    this.initializeChains()
  }

  /**
   * Initialise les chains spécialisées
   */
  private initializeChains(): void {
    // Chain pour les salutations
    this.greetingChain = this.createGreetingChain()
    
    // Chain pour les recherches FAQ
    this.searchChain = this.createSearchChain()
    
    // Chain principale FAQ
    this.faqChain = this.createFAQChain()
  }

  /**
   * Chain pour gérer les salutations
   */
  private createGreetingChain(): RunnableSequence<any, string> {
    const greetingPrompt = this.createPromptTemplate(`
Tu es l'assistant client Younzee, expert en mode et service client.

CONTEXTE: L'utilisateur te salue ou demande de l'aide générale.
PERSONNALITÉ: {personality}

MESSAGE: {message}

INSTRUCTIONS:
- Réponds chaleureusement en tant qu'assistant Younzee
- Présente brièvement tes capacités
- Propose des suggestions d'aide
- Utilise des emojis appropriés
- Adapte ton ton selon la personnalité: {personality}

RÉPONSE:`)

    return this.createSimpleChain(greetingPrompt)
  }

  /**
   * Chain pour rechercher dans la FAQ
   */
  private createSearchChain(): RunnableSequence<any, string> {
    const searchPrompt = this.createPromptTemplate(`
Tu es l'expert FAQ de Younzee. Réponds avec précision aux questions sur nos services.

INFORMATIONS YOUNZEE:
📦 LIVRAISON: 2-3 jours ouvrés en France métropolitaine, gratuite dès 50€
🔄 RETOURS: 30 jours pour retourner, processus via l'espace client
💳 PAIEMENTS: CB, PayPal, Apple Pay, Google Pay, virement bancaire
📏 TAILLES: Guide disponible sur chaque fiche produit
📞 SUPPORT: 01 23 45 67 89 (9h-18h du lundi au vendredi)
🔧 MODIFICATIONS: Possibles avant expédition via l'espace client
🎁 EMBALLAGE: Emballage cadeau disponible lors de la commande

QUESTION: {question}
PERSONNALITÉ: {personality}

INSTRUCTIONS:
- Réponds avec les informations exactes de Younzee
- Utilise le format approprié avec emojis
- Propose des actions complémentaires si pertinent
- Adapte ton ton selon: {personality}
- Si tu ne connais pas la réponse précise, oriente vers le service client

RÉPONSE:`)

    return this.createSimpleChain(searchPrompt)
  }

  /**
   * Chain principale FAQ avec routage intelligent
   */
  private createFAQChain(): RunnableSequence<any, string> {
    const faqPrompt = this.createPromptTemplate(`
Tu es l'agent FAQ Younzee. Analyse la question et détermine la meilleure réponse.

QUESTION: {question}
PERSONNALITÉ: {personality}
CONTEXTE: {context}

ANALYSE:
1. S'agit-il d'une salutation ou demande d'aide générale?
2. S'agit-il d'une question FAQ spécifique?
3. Quel est le niveau de confiance pour traiter cette question?

INFORMATIONS YOUNZEE:
📦 Livraison: 2-3 jours, gratuite dès 50€
🔄 Retours: 30 jours, via espace client
💳 Paiements: CB, PayPal, Apple Pay, Google Pay
📏 Tailles: Guide sur chaque produit
📞 Support: 01 23 45 67 89
🔧 Modifications: Avant expédition
🎁 Emballage cadeau disponible

RÉPONSE (selon personnalité {personality}):`)

    return this.createSimpleChain(faqPrompt)
  }

  /**
   * Traite une question FAQ
   */
  async processQuery(
    question: string, 
    personality: any = {}, 
    context: any = {}
  ): Promise<LangchainResponse & { canHandle: boolean; confidence: number }> {
    const cleanQuestion = question.trim().toLowerCase()
    
    // Détermine si c'est une question FAQ
    const canHandle = this.canHandleQuestion(cleanQuestion)
    
    if (!canHandle) {
      return {
        success: false,
        canHandle: false,
        confidence: 0,
        error: 'Cette question ne semble pas être une FAQ'
      }
    }

    // Choisit la chain appropriée
    let selectedChain: RunnableSequence<any, string>
    let confidence = 0.5

    if (this.isGreeting(cleanQuestion)) {
      selectedChain = this.greetingChain
      confidence = 0.9
    } else if (this.isSpecificFAQ(cleanQuestion)) {
      selectedChain = this.searchChain
      confidence = 0.8
    } else {
      selectedChain = this.faqChain
      confidence = 0.6
    }

    // Exécute la chain
    const result = await this.executeChain(selectedChain, {
      question,
      message: question,
      personality: this.formatPersonality(personality),
      context: JSON.stringify(context)
    }, {
      confidence,
      queryType: this.getQueryType(cleanQuestion)
    })

    this.logMetrics(result, { question, confidence })

    return {
      ...result,
      canHandle: true,
      confidence: result.success ? confidence : 0
    }
  }

  /**
   * Détermine si la question peut être traitée par l'agent FAQ
   */
  private canHandleQuestion(question: string): boolean {
    const faqKeywords = [
      'bonjour', 'salut', 'hello', 'coucou', 'aide', 'help',
      'livraison', 'délai', 'shipping', 'expédition', 'envoi',
      'retour', 'échange', 'rembourser', 'annuler', 'return',
      'paiement', 'carte', 'paypal', 'payment', 'payer',
      'taille', 'size', 'guide', 'mesure', 'dimension',
      'service', 'client', 'support', 'contact', 'téléphone',
      'compte', 'inscription', 'connexion', 'login', 'mot de passe',
      'commande', 'order', 'suivi', 'tracking', 'status',
      'prix', 'promotion', 'reduction', 'coupon', 'code',
      'emballage', 'cadeau', 'gift', 'personnaliser'
    ]

    return faqKeywords.some(keyword => question.includes(keyword))
  }

  /**
   * Vérifie si c'est une salutation
   */
  private isGreeting(question: string): boolean {
    const greetings = ['bonjour', 'salut', 'hello', 'coucou', 'aide', 'help', 'aidez-moi']
    return greetings.some(greeting => question.includes(greeting))
  }

  /**
   * Vérifie si c'est une FAQ spécifique
   */
  private isSpecificFAQ(question: string): boolean {
    const specificFAQs = [
      'livraison', 'délai', 'shipping', 'expédition',
      'retour', 'échange', 'rembourser',
      'paiement', 'carte', 'paypal',
      'taille', 'guide', 'mesure',
      'service', 'client', 'support', 'contact'
    ]
    
    return specificFAQs.some(faq => question.includes(faq))
  }

  /**
   * Détermine le type de requête
   */
  private getQueryType(question: string): string {
    if (this.isGreeting(question)) return 'greeting'
    if (question.includes('livraison')) return 'delivery'
    if (question.includes('retour')) return 'return'
    if (question.includes('paiement')) return 'payment'
    if (question.includes('taille')) return 'size'
    if (question.includes('service')) return 'support'
    return 'general_faq'
  }

  /**
   * Formate la personnalité pour les prompts
   */
  private formatPersonality(personality: any): string {
    if (!personality) return 'Amical et serviable'
    
    const traits = []
    if (personality.tone) traits.push(`Ton: ${personality.tone}`)
    if (personality.formality) traits.push(`Formalité: ${personality.formality}`)
    if (personality.verbosity) traits.push(`Détail: ${personality.verbosity}`)
    if (personality.empathy) traits.push(`Empathie: ${personality.empathy}`)
    
    return traits.join(', ') || 'Amical et serviable'
  }

  /**
   * Test de l'agent FAQ
   */
  async test(): Promise<LangchainResponse> {
    console.log('🧪 Test de l\'agent FAQ Langchain...')
    
    const testResult = await this.processQuery(
      'Bonjour, pouvez-vous m\'aider avec la livraison ?',
      { tone: 'Amical', formality: 'Tutoiement' }
    )

    console.log('📊 Résultat test FAQ:', {
      success: testResult.success,
      canHandle: testResult.canHandle,
      confidence: testResult.confidence,
      contentLength: testResult.content?.length
    })

    return testResult
  }
} 