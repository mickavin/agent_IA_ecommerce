import type { 
  AIRequest, 
  AIResponse, 
  IChildAI, 
  ChildAIConfig, 
  AIType,
  FAQItem 
} from '../types'

/**
 * Service IA spécialisé dans la gestion des FAQ
 * Analyse les questions utilisateurs et trouve les réponses appropriées
 */
export class FAQAIService implements IChildAI {
  public readonly type: AIType = 'faq'
  public readonly name = 'IA FAQ'

  private config: ChildAIConfig = {
    id: 'faq-ai-001',
    name: 'IA FAQ',
    type: 'faq',
    description: 'IA spécialisée dans les réponses aux questions fréquentes',
    isActive: true,
    priority: 1,
    keywords: [
      'question', 'help', 'aide', 'comment', 'pourquoi', 'que', 'qui', 'quand', 'où',
      'livraison', 'retour', 'paiement', 'commande', 'politique', 'garantie',
      'service client', 'support', 'problème', 'bug', 'erreur'
    ],
    patterns: [
      /comment\s+.*\?/i,
      /pourquoi\s+.*\?/i,
      /que\s+.*\?/i,
      /qui\s+.*\?/i,
      /quand\s+.*\?/i,
      /où\s+.*\?/i,
      /help/i,
      /aide/i,
      /question/i
    ]
  }

  private faqDatabase: FAQItem[] = [
    {
      id: 'faq-001',
      question: 'Quels sont les délais de livraison ?',
      answer: 'Nos délais de livraison sont de 2-3 jours ouvrés en France métropolitaine, 4-5 jours pour la Corse et les DOM-TOM. Livraison gratuite dès 50€ d\'achat.',
      category: 'Livraison',
      status: 'Publié',
      tags: ['livraison', 'délais', 'transport'],
      popularity: 150,
      lastUpdated: new Date().toISOString(),
      createdBy: 'system',
      isHighlighted: true
    },
    {
      id: 'faq-002',
      question: 'Comment puis-je retourner un article ?',
      answer: 'Vous avez 30 jours pour retourner un article. Connectez-vous à votre compte, accédez à vos commandes, sélectionnez l\'article à retourner et suivez les instructions. Le retour est gratuit.',
      category: 'Retours',
      status: 'Publié',
      tags: ['retour', 'échange', 'remboursement'],
      popularity: 120,
      lastUpdated: new Date().toISOString(),
      createdBy: 'system',
      isHighlighted: true
    },
    {
      id: 'faq-003',
      question: 'Quels moyens de paiement acceptez-vous ?',
      answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay et les virements bancaires.',
      category: 'Paiements',
      status: 'Publié',
      tags: ['paiement', 'carte', 'paypal'],
      popularity: 100,
      lastUpdated: new Date().toISOString(),
      createdBy: 'system',
      isHighlighted: false
    },
    {
      id: 'faq-004',
      question: 'Comment connaître ma taille ?',
      answer: 'Consultez notre guide des tailles disponible sur chaque fiche produit. En cas de doute, commandez une taille au-dessus. Notre service client peut vous conseiller au 01 23 45 67 89.',
      category: 'Produits',
      status: 'Publié',
      tags: ['taille', 'guide', 'mesure'],
      popularity: 95,
      lastUpdated: new Date().toISOString(),
      createdBy: 'system',
      isHighlighted: true
    },
    {
      id: 'faq-005',
      question: 'Puis-je modifier ma commande ?',
      answer: 'Vous pouvez modifier votre commande dans les 2 heures suivant sa validation, depuis votre espace client. Passé ce délai, contactez notre service client.',
      category: 'Commandes',
      status: 'Publié',
      tags: ['commande', 'modification', 'annulation'],
      popularity: 80,
      lastUpdated: new Date().toISOString(),
      createdBy: 'system',
      isHighlighted: false
    }
  ]

  /**
   * Détermine si cette IA peut traiter la requête
   */
  async canHandle(request: AIRequest): Promise<{ canHandle: boolean; confidence: number }> {
    const message = request.message.toLowerCase().trim()
    let confidence = 0

    // Gestion des salutations et messages généraux
    const greetingPatterns = [
      /^(bonjour|salut|hello|hey|bonsoir|coucou|bonne journée)$/i,
      /^(bonjour|salut|hello|hey|bonsoir|coucou)[\s\!\.]*$/i
    ]
    
    if (greetingPatterns.some(pattern => pattern.test(message))) {
      return { canHandle: true, confidence: 0.9 }
    }

    // Questions d'aide générales
    const helpPatterns = [
      /^(aide|help|que peux-tu faire|qu'est-ce que tu fais|qui es-tu)$/i,
      /comment.*marche/i,
      /comment.*fonctionne/i,
      /peux.*aider/i
    ]
    
    if (helpPatterns.some(pattern => pattern.test(message))) {
      return { canHandle: true, confidence: 0.8 }
    }

    // Questions FAQ spécifiques
    const faqKeywords = [
      'livraison', 'délais', 'retour', 'échange', 'remboursement',
      'paiement', 'carte', 'paypal', 'commande', 'commander',
      'taille', 'guide', 'politique', 'service client', 'contact',
      'garantie', 'problème', 'bug', 'erreur', 'support'
    ]

    const keywordMatches = faqKeywords.filter(keyword => 
      message.includes(keyword)
    ).length

    // Patterns de questions
    const questionPatterns = [
      /comment\s+.*\?/i,
      /pourquoi\s+.*\?/i,
      /que\s+.*\?/i,
      /qui\s+.*\?/i,
      /quand\s+.*\?/i,
      /où\s+.*\?/i,
      /combien\s+.*\?/i,
      /quel\s+.*\?/i
    ]

    const patternMatches = questionPatterns.filter(pattern => 
      pattern.test(message)
    ).length

    // Calcul de la confiance
    confidence += keywordMatches * 0.4
    confidence += patternMatches * 0.3

    // Bonus pour les questions directes
    if (message.includes('?')) {
      confidence += 0.3
    }

    // Bonus pour les mots interrogatifs
    const questionWords = ['comment', 'pourquoi', 'que', 'qui', 'quand', 'où', 'combien', 'quel']
    if (questionWords.some(word => message.includes(word))) {
      confidence += 0.2
    }

    // Bonus pour demandes d'information
    if (message.includes('information') || message.includes('renseignement') || message.includes('savoir')) {
      confidence += 0.3
    }

    // Pénalité si c'est clairement une demande de produits
    const productKeywords = ['recommande', 'suggère', 'trouve', 'cherche.*vêtement', 'tenue pour']
    if (productKeywords.some(keyword => new RegExp(keyword, 'i').test(message))) {
      confidence -= 0.4
    }

    // Normalisation de la confiance
    confidence = Math.min(Math.max(confidence, 0), 1)

    return {
      canHandle: confidence > 0.3, // Seuil plus bas pour capturer plus de questions
      confidence
    }
  }

  /**
   * Traite la requête et génère une réponse FAQ
   */
  async process(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      const message = request.message.toLowerCase().trim()
      
      // Traitement spécial pour les salutations
      if (this.isGreeting(message)) {
        const content = this.getGreetingResponse()
        const processingTime = Date.now() - startTime
        
        return {
          id: `faq-greeting-${Date.now()}`,
          aiType: this.type,
          content,
          confidence: 0.9,
          metadata: {
            intent: 'greeting',
            responseType: 'greeting',
            processingTime
          },
          timestamp: new Date().toISOString(),
          success: true
        }
      }

      // Traitement spécial pour les demandes d'aide générales
      if (this.isGeneralHelp(message)) {
        const content = this.getGeneralHelpResponse()
        const processingTime = Date.now() - startTime
        
        return {
          id: `faq-help-${Date.now()}`,
          aiType: this.type,
          content,
          confidence: 0.8,
          metadata: {
            intent: 'general_help',
            responseType: 'help',
            processingTime
          },
          timestamp: new Date().toISOString(),
          success: true
        }
      }

      // Recherche des FAQ correspondantes
      const matches = await this.findMatchingFAQs(request.message)
      
      let content = ''
      let confidence = 0

      if (matches.length > 0) {
        const bestMatch = matches[0]
        content = this.formatFAQResponse(bestMatch, matches)
        confidence = bestMatch.score
        
        // Mise à jour de la popularité
        this.updateFAQPopularity(bestMatch.faq.id)
      } else {
        content = this.getNoMatchResponse()
        confidence = 0.1
      }

      const processingTime = Date.now() - startTime

      return {
        id: `faq-response-${Date.now()}`,
        aiType: this.type,
        content,
        confidence,
        metadata: {
          intent: 'faq_query',
          faqMatches: matches.map(m => m.faq),
          processingTime,
          totalFAQsSearched: this.faqDatabase.length
        },
        timestamp: new Date().toISOString(),
        success: true
      }

    } catch (error) {
      return {
        id: `faq-error-${Date.now()}`,
        aiType: this.type,
        content: 'Désolé, je n\'ai pas pu traiter votre question FAQ pour le moment.',
        confidence: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  /**
   * Vérifie si le message est une salutation
   */
  private isGreeting(message: string): boolean {
    const greetingPatterns = [
      /^(bonjour|salut|hello|hey|bonsoir|coucou|bonne journée)$/i,
      /^(bonjour|salut|hello|hey|bonsoir|coucou)[\s\!\.]*$/i
    ]
    return greetingPatterns.some(pattern => pattern.test(message))
  }

  /**
   * Vérifie si le message est une demande d'aide générale
   */
  private isGeneralHelp(message: string): boolean {
    const helpPatterns = [
      /^(aide|help|que peux-tu faire|qu'est-ce que tu fais|qui es-tu)$/i,
      /comment.*marche/i,
      /comment.*fonctionne/i,
      /peux.*aider/i
    ]
    return helpPatterns.some(pattern => pattern.test(message))
  }

  /**
   * Génère une réponse de salutation
   */
  private getGreetingResponse(): string {
    return `👋 **Bonjour ! Je suis votre assistant intelligent chez Younzee !**

🎯 **Je peux vous aider avec :**

**🛍️ Mode & Shopping :**
• Recommandations de vêtements personnalisées
• Conseils de style et tendances
• Création d'outfits complets

**❓ Questions & Support :**
• Informations sur la livraison et les retours
• Politique de paiement et garanties  
• Guide des tailles et conseils produits
• Service client et support technique

**💡 Exemples de ce que vous pouvez me demander :**
• "Quels sont vos délais de livraison ?"
• "Je cherche une robe pour une soirée"
• "Comment retourner un article ?"
• "Montre-moi des tenues décontractées"

✨ **Que puis-je faire pour vous aujourd'hui ?**`
  }

  /**
   * Génère une réponse d'aide générale
   */
  private getGeneralHelpResponse(): string {
    return `🤖 **Je suis votre assistant IA spécialisé mode et support client !**

📋 **Mes domaines d'expertise :**

**🎨 Conseils Mode :**
• Style personnel et tendances
• Recommandations de vêtements
• Création d'outfits complets
• Conseils couleurs et morphologie

**🛒 Support Shopping :**
• Guide des tailles et mesures
• Disponibilité et stock produits
• Comparaison et sélection
• Conseils budget

**📞 Service Client :**
• Livraison et délais
• Retours et échanges
• Paiement et facturation
• Politiques et garanties

**💬 Comment m'utiliser :**
• Posez-moi vos questions naturellement
• Soyez précis dans vos demandes
• N'hésitez pas à détailler vos besoins

🎯 **Prêt à vous aider ! Que souhaitez-vous savoir ?**`
  }

  /**
   * Retourne la configuration de cette IA
   */
  getConfig(): ChildAIConfig {
    return { ...this.config }
  }

  /**
   * Recherche les FAQ correspondant à la question
   */
  private async findMatchingFAQs(query: string): Promise<Array<{ faq: FAQItem; score: number }>> {
    const matches: Array<{ faq: FAQItem; score: number }> = []
    const queryLower = query.toLowerCase()

    for (const faq of this.faqDatabase) {
      if (faq.status !== 'Publié') continue

      let score = 0

      // Score basé sur la correspondance avec la question
      score += this.calculateTextSimilarity(queryLower, faq.question.toLowerCase()) * 0.6

      // Score basé sur la correspondance avec les tags
      const tagMatches = faq.tags.filter(tag => 
        queryLower.includes(tag.toLowerCase())
      ).length
      score += (tagMatches / faq.tags.length) * 0.3

      // Bonus pour les FAQ populaires
      score += (faq.popularity / 200) * 0.1

      if (score > 0.3) {
        matches.push({ faq, score })
      }
    }

    // Tri par score décroissant
    return matches.sort((a, b) => b.score - a.score).slice(0, 3)
  }

  /**
   * Calcule la similarité entre deux textes
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/)
    const words2 = text2.split(/\s+/)
    
    const commonWords = words1.filter(word => 
      words2.some(w => w.includes(word) || word.includes(w))
    )
    
    return commonWords.length / Math.max(words1.length, words2.length)
  }

  /**
   * Formate la réponse FAQ
   */
  private formatFAQResponse(bestMatch: { faq: FAQItem; score: number }, allMatches: Array<{ faq: FAQItem; score: number }>): string {
    let response = `💡 **${bestMatch.faq.question}**\n\n${bestMatch.faq.answer}`

    // Ajout de FAQ similaires si disponibles
    if (allMatches.length > 1) {
      response += '\n\n📚 **Questions similaires :**\n'
      allMatches.slice(1, 3).forEach((match, index) => {
        response += `${index + 2}. ${match.faq.question}\n`
      })
    }

    response += '\n\n💬 Cette réponse vous a-t-elle aidé ? N\'hésitez pas à poser une autre question !'

    return response
  }

  /**
   * Réponse quand aucune FAQ ne correspond
   */
  private getNoMatchResponse(): string {
    return `🤔 Je n'ai pas trouvé de réponse exacte à votre question dans notre FAQ.\n\n` +
           `Quelques suggestions :\n` +
           `• Reformulez votre question avec d'autres mots\n` +
           `• Consultez nos sections : Livraison, Retours, Paiements, Commandes\n` +
           `• Contactez notre service client pour une aide personnalisée\n\n` +
           `💡 Vous pouvez aussi me demander des conseils sur nos produits !`
  }

  /**
   * Met à jour la popularité d'une FAQ
   */
  private updateFAQPopularity(faqId: string): void {
    const faq = this.faqDatabase.find(f => f.id === faqId)
    if (faq) {
      faq.popularity += 1
    }
  }

  /**
   * Ajoute une nouvelle FAQ
   */
  public addFAQ(faq: Omit<FAQItem, 'id' | 'popularity' | 'lastUpdated'>): void {
    const newFAQ: FAQItem = {
      ...faq,
      id: `faq-${Date.now()}`,
      popularity: 0,
      lastUpdated: new Date().toISOString()
    }
    this.faqDatabase.push(newFAQ)
  }

  /**
   * Met à jour une FAQ existante
   */
  public updateFAQ(id: string, updates: Partial<FAQItem>): boolean {
    const index = this.faqDatabase.findIndex(f => f.id === id)
    if (index !== -1) {
      this.faqDatabase[index] = {
        ...this.faqDatabase[index],
        ...updates,
        lastUpdated: new Date().toISOString()
      }
      return true
    }
    return false
  }

  /**
   * Obtient les statistiques des FAQ
   */
  public getFAQStats() {
    return {
      totalFAQs: this.faqDatabase.length,
      publishedFAQs: this.faqDatabase.filter(f => f.status === 'Publié').length,
      topFAQs: this.faqDatabase
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 5)
        .map(f => ({ question: f.question, popularity: f.popularity })),
      categoriesCount: Object.entries(
        this.faqDatabase.reduce((acc, faq) => {
          acc[faq.category] = (acc[faq.category] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      )
    }
  }
} 