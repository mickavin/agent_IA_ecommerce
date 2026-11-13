import type { 
  AIRequest, 
  AIResponse, 
  IChildAI, 
  RoutingResult,
  AIMasterConfig,
  AIMasterLog,
  AIType,
  AIPerformanceStats
} from '../types'
import { FAQAIService } from './faq-ai.service'
import { OutfitRecommendationAIService } from './outfit-recommendation-ai.service'
import { IndividualClothingAIService } from './individual-clothing-ai.service'

/**
 * Service IA Master - Orchestrateur principal qui route les requêtes
 * vers les IA spécialisées appropriées
 */
export class IAMasterService {
  private childAIs: Map<AIType, IChildAI> = new Map()
  private logs: AIMasterLog[] = []
  private config: AIMasterConfig

  constructor(config?: Partial<AIMasterConfig>) {
    // Configuration par défaut
    this.config = {
      defaultAI: 'faq',
      confidenceThreshold: 0.3,
      maxProcessingTime: 30000, // 30 seconds
      enableLogging: true,
      enableAnalytics: true,
      fallbackMessages: {
        noAIAvailable: 'Désolé, aucune IA n\'est disponible pour traiter votre demande pour le moment.',
        timeout: 'Le traitement de votre demande a pris trop de temps. Veuillez réessayer.',
        error: 'Une erreur s\'est produite lors du traitement de votre demande.',
        lowConfidence: 'Je ne suis pas sûr de bien comprendre votre demande. Pouvez-vous la reformuler ?'
      },
      retryAttempts: 2,
      ...config
    }

    // Initialisation des IA enfants
    this.initializeChildAIs()
  }

  /**
   * Initialise toutes les IA enfants
   */
  private initializeChildAIs(): void {
    try {
      // Enregistrement des IA enfants
      const faqAI = new FAQAIService()
      const outfitAI = new OutfitRecommendationAIService()
      const individualAI = new IndividualClothingAIService()

      this.childAIs.set(faqAI.type, faqAI)
      this.childAIs.set(outfitAI.type, outfitAI)
      this.childAIs.set(individualAI.type, individualAI)

      console.log(`✅ IA Master initialisée avec ${this.childAIs.size} IA(s) enfant(s)`)
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des IA enfants:', error)
    }
  }

  /**
   * Point d'entrée principal - traite une requête utilisateur
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    let selectedAI: AIType | null = null
    let routingResult: RoutingResult | null = null

    try {
      // 1. Routage de la requête
      routingResult = await this.routeRequest(request)
      selectedAI = routingResult.selectedAI

      // 2. Traitement par l'IA sélectionnée ou réponse contextuelle
      let response: AIResponse
      
      if (selectedAI === 'contextual') {
        // Génération de réponse contextuelle directe
        response = await this.generateContextualResponse(request)
      } else {
        // Traitement par une IA enfant
        const childAI = this.childAIs.get(selectedAI)
        if (!childAI) {
          throw new Error(`IA ${selectedAI} non disponible`)
        }

        // 3. Traitement avec timeout
        response = await this.processWithTimeout(childAI, request)
      }

      // 4. Logging
      if (this.config.enableLogging) {
        this.logInteraction(request, routingResult, response, true)
      }

      return response

    } catch (error) {
      // Gestion des erreurs avec fallback
      const fallbackResponse = await this.handleError(error, request, selectedAI)
      
      if (this.config.enableLogging && routingResult) {
        this.logInteraction(request, routingResult, fallbackResponse, false)
      }

      return fallbackResponse
    }
  }

  /**
   * Route une requête vers l'IA appropriée
   */
  private async routeRequest(request: AIRequest): Promise<RoutingResult> {
    const startTime = Date.now()
    const candidateAIs: Array<{ ai: AIType; confidence: number; reason: string }> = []

    try {
      // Évaluation de chaque IA enfant
      for (const [aiType, childAI] of this.childAIs.entries()) {
        const aiConfig = childAI.getConfig()
        if (!aiConfig.isActive) continue

        const evaluation = await childAI.canHandle(request)
        if (evaluation.canHandle) {
          candidateAIs.push({
            ai: aiType,
            confidence: evaluation.confidence,
            reason: `Confiance: ${Math.round(evaluation.confidence * 100)}%`
          })
        }
      }

      // Tri par confiance décroissante
      candidateAIs.sort((a, b) => b.confidence - a.confidence)

      // Sélection de l'IA
      let selectedAI: AIType
      let confidence: number
      let reason: string
      let alternativeAIs: AIType[] = []

      if (candidateAIs.length > 0) {
        const best = candidateAIs[0]
        
        // Vérifier si la meilleure IA a assez de confiance
        if (best.confidence >= this.config.confidenceThreshold) {
          selectedAI = best.ai
          confidence = best.confidence
          reason = `${this.getAIName(best.ai)} sélectionnée - ${best.reason}`
          alternativeAIs = candidateAIs.slice(1, 3).map(c => c.ai)
        } else {
          // Aucune IA n'a assez de confiance, utiliser la réponse contextuelle
          return {
            selectedAI: 'contextual' as AIType,
            confidence: 0.6,
            reason: `Confiance insuffisante (meilleure: ${Math.round(best.confidence * 100)}%), génération de réponse contextuelle`,
            alternativeAIs: candidateAIs.map(c => c.ai),
            processingTime: Date.now() - startTime
          }
        }
      } else {
        // Aucune IA enfant ne peut traiter la requête, utiliser la réponse contextuelle
        return {
          selectedAI: 'contextual' as AIType,
          confidence: 0.6,
          reason: 'Aucune IA spécialisée ne peut traiter cette requête - génération de réponse contextuelle',
          alternativeAIs: [],
          processingTime: Date.now() - startTime
        }
      }

      const processingTime = Date.now() - startTime

      return {
        selectedAI,
        confidence,
        reason,
        alternativeAIs,
        processingTime
      }

    } catch (error) {
      console.error('Erreur lors du routage:', error)
      
      return {
        selectedAI: 'contextual' as AIType, // Utiliser contextuel au lieu du defaultAI
        confidence: 0.1,
        reason: `Erreur de routage, utilisation de la réponse contextuelle`,
        alternativeAIs: [],
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Traite une requête avec timeout
   */
  private async processWithTimeout(childAI: IChildAI, request: AIRequest): Promise<AIResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout lors du traitement'))
      }, this.config.maxProcessingTime)

      childAI.process(request)
        .then(response => {
          clearTimeout(timeout)
          resolve(response)
        })
        .catch(error => {
          clearTimeout(timeout)
          reject(error)
        })
    })
  }

  /**
   * Génère une réponse contextuelle quand aucune IA enfant n'est appropriée
   */
  private async generateContextualResponse(request: AIRequest): Promise<AIResponse> {
    const message = request.message.toLowerCase()
    const analysis = this.analyzeMessage(message)
    
    let content = ''
    let confidence = 0.6
    
    // Réponses contextuelles basées sur l'analyse du message
    switch (analysis.intent) {
      case 'greeting':
        content = `👋 Bonjour ! Je suis votre assistant mode intelligent chez Younzee.\n\n🎯 Je peux vous aider avec :\n• Des questions sur nos produits et services\n• Des recommandations de tenues complètes\n• Des conseils pour des vêtements spécifiques\n• Des informations sur nos politiques et services\n\nQue puis-je faire pour vous aujourd'hui ?`
        confidence = 0.9
        break
        
      case 'shopping_general':
        content = `🛍️ Vous cherchez à faire du shopping ?\n\n✨ Laissez-moi vous guider :\n\n**Pour une tenue complète :**\n• "Je cherche une tenue pour un entretien d'embauche"\n• "Trouve-moi un look décontracté pour le weekend"\n\n**Pour un vêtement spécifique :**\n• "Je veux une robe d'été en bleu"\n• "Montre-moi des sneakers pour le sport"\n\n**Questions générales :**\n• "Quels sont vos délais de livraison ?"\n• "Comment puis-je retourner un article ?"\n\nDites-moi plus précisément ce que vous recherchez ! 🎯`
        confidence = 0.8
        break
        
      case 'style_advice':
        content = `👗 Besoin de conseils style ?\n\n🎨 Je suis là pour ça ! Voici comment je peux vous aider :\n\n**Tenues complètes :**\n• Décrivez l'occasion (travail, soirée, casual...)\n• Mentionnez vos préférences de couleurs\n• Indiquez votre budget approximatif\n\n**Vêtements individuels :**\n• Précisez le type d'article recherché\n• Votre style préféré (chic, décontracté, tendance...)\n• Vos mensurations si pertinentes\n\n**Exemple :** "Je cherche une tenue élégante pour un dîner, j'aime le noir et les couleurs sobres, budget 200€"\n\nQuelle est votre demande précise ? ✨`
        confidence = 0.8
        break
        
      case 'technical_support':
        content = `🔧 Questions techniques ou support ?\n\n📞 Je peux vous renseigner sur :\n\n**Commandes & Livraison :**\n• Suivi de commande\n• Délais de livraison\n• Frais de port\n\n**Retours & Échanges :**\n• Politique de retour\n• Procédure d'échange\n• Remboursements\n\n**Compte & Paiement :**\n• Gestion du compte\n• Moyens de paiement\n• Facturation\n\n**Tailles & Produits :**\n• Guide des tailles\n• Informations produits\n• Disponibilité\n\nQuelle est votre question spécifique ? 🎯`
        confidence = 0.7
        break
        
      case 'complaint':
        content = `😟 Je comprends votre préoccupation.\n\n🤝 Laissez-moi vous aider :\n\n**Pour un problème de commande :**\n• Numéro de commande\n• Nature du problème\n• Photos si nécessaire\n\n**Pour un produit défectueux :**\n• Référence du produit\n• Description du défaut\n• Date d'achat\n\n**Pour un service client :**\n• Détails de votre expérience\n• Ce que vous attendez comme solution\n\n📞 **Contact direct :**\n• Email : support@younzee.com\n• Téléphone : 01 23 45 67 89\n• Chat en direct sur le site\n\nPouvez-vous me donner plus de détails sur votre problème ? Je vais faire mon possible pour vous aider. 💪`
        confidence = 0.7
        break
        
      case 'price_budget':
        content = `💰 Questions de budget ou prix ?\n\n🏷️ Voici ce que je peux vous proposer :\n\n**Gammes de prix :**\n• Petit budget : 20-50€\n• Milieu de gamme : 50-150€\n• Premium : 150€+\n\n**Bons plans :**\n• Soldes et promotions en cours\n• Articles démarqués\n• Offres spéciales membres\n\n**Conseils budget :**\n• Investir dans des basiques de qualité\n• Pièces polyvalentes\n• Rapport qualité-prix optimal\n\n💡 **Astuce :** Précisez votre budget et je vous proposerai les meilleures options dans cette gamme !\n\nQuel est votre budget pour votre shopping ? 🎯`
        confidence = 0.7
        break
        
      case 'product_search':
        content = `🔍 Vous cherchez un produit spécifique ?\n\n🎯 Pour vous aider au mieux, dites-moi :\n\n**Type de produit :**\n• Vêtement (robe, pantalon, top...)\n• Chaussures (sneakers, talons, bottes...)\n• Accessoires (sac, bijoux, écharpe...)\n\n**Critères importants :**\n• Couleur préférée\n• Matière souhaitée\n• Style recherché\n• Taille nécessaire\n• Budget approximatif\n\n**Exemple :** "Je cherche une robe noire, élégante, pour une soirée, taille M, budget 100€"\n\nQuel produit recherchez-vous exactement ? ✨`
        confidence = 0.8
        break
        
      default:
        content = `🤔 Je ne suis pas sûr de bien comprendre votre demande...\n\n🎯 **Je suis spécialisé dans :**\n\n🛍️ **Mode & Shopping :**\n• Recommandations de tenues\n• Conseils vestimentaires\n• Recherche de produits\n\n❓ **Questions & Support :**\n• Informations produits\n• Politiques de retour\n• Aide à la commande\n\n💡 **Pour une meilleure aide, essayez :**\n• "Je cherche une tenue pour..." \n• "Où puis-je trouver..."\n• "Comment faire pour..."\n• "Quels sont vos..."\n\n✨ **Reformulez votre demande** et je vous donnerai une réponse personnalisée ! \n\nQue puis-je faire pour vous ? 😊`
        confidence = 0.5
        break
    }

    return {
      id: `master-contextual-${Date.now()}`,
      aiType: 'faq',
      content,
      confidence,
      timestamp: new Date().toISOString(),
      success: true,
      metadata: {
        responseType: 'contextual',
        detectedIntent: analysis.intent,
        intentConfidence: analysis.confidence,
        keywords: analysis.keywords,
        isGeneralResponse: true
      }
    }
  }

  /**
   * Analyse le message pour détecter l'intention
   */
  private analyzeMessage(message: string): { intent: string; confidence: number; keywords: string[] } {
    const lowerMessage = message.toLowerCase()
    
    // Mots-clés pour chaque intention
    const intentPatterns = {
      greeting: {
        keywords: ['bonjour', 'salut', 'hello', 'bonsoir', 'bonne journée', 'hey', 'coucou'],
        confidence: 0.9
      },
      shopping_general: {
        keywords: ['acheter', 'shopping', 'magasin', 'boutique', 'commander', 'panier', 'catalogue'],
        confidence: 0.8
      },
      style_advice: {
        keywords: ['style', 'conseil', 'mode', 'tendance', 'look', 'tenue', 'comment porter', 'assortir'],
        confidence: 0.8
      },
      technical_support: {
        keywords: ['problème', 'aide', 'support', 'bug', 'erreur', 'ne fonctionne pas', 'livraison', 'retour'],
        confidence: 0.7
      },
      complaint: {
        keywords: ['mécontent', 'déçu', 'réclamation', 'plainte', 'mauvais', 'nul', 'catastrophe', 'arnaque'],
        confidence: 0.7
      },
      price_budget: {
        keywords: ['prix', 'coût', 'cher', 'budget', 'économique', 'pas cher', 'abordable', 'promotion', 'solde'],
        confidence: 0.7
      },
      product_search: {
        keywords: ['trouve', 'cherche', 'où', 'disponible', 'stock', 'référence', 'modèle', 'article'],
        confidence: 0.8
      }
    }

    let bestMatch = { intent: 'unknown', confidence: 0, keywords: [] as string[] }

    // Analyser chaque intention
    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      const matches = pattern.keywords.filter(keyword => lowerMessage.includes(keyword))
      
      if (matches.length > 0) {
        const confidence = (matches.length / pattern.keywords.length) * pattern.confidence
        
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent,
            confidence: Math.min(confidence, 0.9),
            keywords: matches
          }
        }
      }
    }

    return bestMatch
  }

  /**
   * Gère les erreurs et retourne une réponse de fallback
   */
  private async handleError(error: any, request: AIRequest, selectedAI: AIType | null): Promise<AIResponse> {
    let errorMessage = this.config.fallbackMessages.error
    let errorType = 'unknown_error'

    if (error.message?.includes('Timeout')) {
      errorMessage = this.config.fallbackMessages.timeout
      errorType = 'timeout'
    } else if (error.message?.includes('non disponible')) {
      errorMessage = this.config.fallbackMessages.noAIAvailable
      errorType = 'ai_unavailable'
    }

    // Si aucune IA n'est disponible, essayer de générer une réponse contextuelle
    if (errorType === 'ai_unavailable' || !selectedAI) {
      try {
        return await this.generateContextualResponse(request)
      } catch (contextualError) {
        console.error('Erreur lors de la génération de réponse contextuelle:', contextualError)
      }
    }

    return {
      id: `master-error-${Date.now()}`,
      aiType: selectedAI || 'faq',
      content: `${errorMessage}\n\n💡 Vous pouvez :\n• Reformuler votre question\n• Être plus spécifique dans votre demande\n• Contacter notre support si le problème persiste`,
      confidence: 0.1,
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message,
      metadata: {
        errorType,
        originalRequest: request.message,
        selectedAI: selectedAI || 'unknown'
      }
    }
  }

  /**
   * Log une interaction
   */
  private logInteraction(
    request: AIRequest,
    routingResult: RoutingResult,
    response: AIResponse,
    success: boolean
  ): void {
    const log: AIMasterLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestId: request.id,
      selectedAI: routingResult.selectedAI,
      routingConfidence: routingResult.confidence,
      processingTime: (response.metadata?.processingTime || 0) + routingResult.processingTime,
      responseGenerated: success,
      timestamp: new Date().toISOString(),
      metadata: {
        requestMessage: request.message,
        routingReason: routingResult.reason,
        alternativeAIs: routingResult.alternativeAIs,
        responseLength: response.content.length
      }
    }

    this.logs.push(log)

    // Limitation du nombre de logs (garder seulement les 1000 derniers)
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000)
    }
  }

  /**
   * Obtient le nom lisible d'une IA
   */
  private getAIName(aiType: AIType): string {
    const ai = this.childAIs.get(aiType)
    return ai?.name || aiType
  }

  /**
   * Obtient les statistiques de performance
   */
  public getPerformanceStats(period: string = '24h'): AIPerformanceStats[] {
    const stats: AIPerformanceStats[] = []
    const now = new Date()
    const periodStart = new Date(now.getTime() - this.getPeriodMilliseconds(period))

    // Filtrer les logs selon la période
    const relevantLogs = this.logs.filter(log => 
      new Date(log.timestamp) >= periodStart
    )

    // Calculer les stats pour chaque IA
    for (const aiType of this.childAIs.keys()) {
      const aiLogs = relevantLogs.filter(log => log.selectedAI === aiType)
      
      if (aiLogs.length === 0) continue

      const successfulResponses = aiLogs.filter(log => log.responseGenerated).length
      const totalProcessingTime = aiLogs.reduce((sum, log) => sum + log.processingTime, 0)
      const averageConfidence = aiLogs.reduce((sum, log) => sum + log.routingConfidence, 0) / aiLogs.length

      stats.push({
        aiType,
        totalRequests: aiLogs.length,
        successfulResponses,
        averageConfidence,
        averageProcessingTime: totalProcessingTime / aiLogs.length,
        userSatisfactionRate: 0.85, // Placeholder - serait calculé avec des données réelles
        commonIntents: this.getCommonIntents(aiLogs),
        period
      })
    }

    return stats
  }

  /**
   * Obtient les intentions communes pour une IA
   */
  private getCommonIntents(logs: AIMasterLog[]): Array<{ intent: string; count: number }> {
    const intentCounts: Record<string, number> = {}
    
    logs.forEach(log => {
      const intent = log.metadata?.intent || 'unknown'
      intentCounts[intent] = (intentCounts[intent] || 0) + 1
    })

    return Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  /**
   * Convertit une période en millisecondes
   */
  private getPeriodMilliseconds(period: string): number {
    const periodMap: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }
    return periodMap[period] || periodMap['24h']
  }

  /**
   * Obtient les logs récents
   */
  public getRecentLogs(limit: number = 50): AIMasterLog[] {
    return this.logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Obtient la configuration actuelle
   */
  public getConfig(): AIMasterConfig {
    return { ...this.config }
  }

  /**
   * Met à jour la configuration
   */
  public updateConfig(newConfig: Partial<AIMasterConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Obtient les informations sur toutes les IA enfants
   */
  public getChildAIsInfo() {
    const info = Array.from(this.childAIs.entries()).map(([type, ai]) => ({
      type,
      name: ai.name,
      config: ai.getConfig(),
      isActive: ai.getConfig().isActive
    }))

    return {
      totalAIs: info.length,
      activeAIs: info.filter(ai => ai.isActive).length,
      ais: info
    }
  }

  /**
   * Active ou désactive une IA enfant
   */
  public toggleChildAI(aiType: AIType, isActive: boolean): boolean {
    const ai = this.childAIs.get(aiType)
    if (!ai) return false

    // Note: Ceci nécessiterait une méthode dans l'interface IChildAI
    // pour modifier la configuration. Pour l'instant, on retourne true
    // comme placeholder
    return true
  }

  /**
   * Teste le routage d'une requête sans l'exécuter
   */
  public async testRouting(message: string): Promise<RoutingResult> {
    const testRequest: AIRequest = {
      id: `test-${Date.now()}`,
      message,
      sessionId: 'test-session',
      timestamp: new Date().toISOString()
    }

    return this.routeRequest(testRequest)
  }

  /**
   * Nettoie les anciens logs
   */
  public cleanupLogs(olderThanDays: number = 30): number {
    const cutoffDate = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000))
    const initialCount = this.logs.length
    
    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoffDate)
    
    const removedCount = initialCount - this.logs.length
    console.log(`🧹 Nettoyage des logs: ${removedCount} entrées supprimées`)
    
    return removedCount
  }
} 