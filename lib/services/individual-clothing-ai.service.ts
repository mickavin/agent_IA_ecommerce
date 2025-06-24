import type { 
  AIRequest, 
  AIResponse, 
  IChildAI, 
  ChildAIConfig, 
  AIType,
  Product,
  UserPreferences
} from '../types'
import { ProductService } from './api.service'

/**
 * Service IA spécialisé dans les recommandations de vêtements individuels
 * Suggère des pièces spécifiques basées sur les critères et préférences
 */
export class IndividualClothingAIService implements IChildAI {
  public readonly type: AIType = 'individual_clothing_recommendation'
  public readonly name = 'IA Recommandation Vêtements'

  private config: ChildAIConfig = {
    id: 'individual-ai-001',
    name: 'IA Recommandation Vêtements',
    type: 'individual_clothing_recommendation',
    description: 'IA spécialisée dans les recommandations de vêtements et accessoires individuels',
    isActive: true,
    priority: 3,
    keywords: [
      'recommande', 'suggère', 'conseil', 'trouve', 'cherche', 'veux', 'besoin',
      'tshirt', 'chemise', 'pantalon', 'jean', 'robe', 'veste', 'pull', 'sweat',
      'chaussures', 'sneakers', 'bottes', 'sandales', 'accessoire', 'sac', 'ceinture',
      'produit', 'article', 'pièce', 'vêtement', 'mode', 'tendance'
    ],
    patterns: [
      /recommande.*moi/i,
      /suggère.*moi/i,
      /conseil.*pour/i,
      /trouve.*moi/i,
      /cherche.*(un|une)/i,
      /veux.*(un|une)/i,
      /besoin.*(un|une)/i,
      /quel.*(tshirt|chemise|pantalon|jean|robe)/i
    ]
  }

  // Critères de recommandation
  private recommendationCriteria = {
    trending: {
      weight: 0.3,
      minPopularity: 50,
      recentThreshold: 30 // jours
    },
    personalizedMatch: {
      weight: 0.4,
      preferenceBonus: 0.2,
      historyBonus: 0.1
    },
    availability: {
      weight: 0.2,
      stockThreshold: 5,
      lowStockPenalty: 0.1
    },
    price: {
      weight: 0.1,
      budgetMatch: 0.2,
      valueProportion: 0.1
    }
  }

  /**
   * Détermine si cette IA peut traiter la requête
   */
  async canHandle(request: AIRequest): Promise<{ canHandle: boolean; confidence: number }> {
    const message = request.message.toLowerCase()
    let confidence = 0

    // Refuser les salutations et questions générales
    const generalPatterns = [
      /^(bonjour|salut|hello|hey|bonsoir|coucou)$/i,
      /^(comment ça va|ça va|comment allez-vous)$/i,
      /^(qui es-tu|qu'est-ce que tu fais|que peux-tu faire)$/i,
      /^(aide|help|au revoir|bye|merci)$/i
    ]
    
    if (generalPatterns.some(pattern => pattern.test(message.trim()))) {
      return { canHandle: false, confidence: 0 }
    }

    // Refuser les questions FAQ typiques
    const faqPatterns = [
      /comment.*livraison/i,
      /délais.*livraison/i,
      /retour.*commande/i,
      /paiement.*accepté/i,
      /politique.*retour/i,
      /service.*client/i,
      /contact/i
    ]
    
    if (faqPatterns.some(pattern => pattern.test(message))) {
      return { canHandle: false, confidence: 0 }
    }

    // Vérifier si c'est une vraie demande de vêtements
    const clothingKeywords = [
      'vêtement', 'habit', 'tenue', 'porter', 'style', 'mode',
      'tshirt', 't-shirt', 'chemise', 'pull', 'sweat', 'polo', 'top',
      'pantalon', 'jean', 'short', 'jupe', 'legging', 'robe',
      'veste', 'blouson', 'manteau', 'cardigan',
      'chaussures', 'sneakers', 'baskets', 'bottes', 'sandales',
      'sac', 'accessoire', 'ceinture', 'chapeau'
    ]

    const hasClothingKeywords = clothingKeywords.some(keyword => 
      message.includes(keyword)
    )

    if (!hasClothingKeywords) {
      return { canHandle: false, confidence: 0 }
    }

    // Vérification des mots-clés de recommandation
    const recommendationKeywords = [
      'recommande', 'suggère', 'conseil', 'trouve', 'cherche', 'veux', 'besoin',
      'montre', 'propose', 'idée', 'choisir'
    ]

    const keywordMatches = recommendationKeywords.filter(keyword => 
      message.includes(keyword)
    ).length

    // Vérification des patterns de demande
    const requestPatterns = [
      /recommande.*moi/i,
      /suggère.*moi/i,
      /conseil.*pour/i,
      /trouve.*moi/i,
      /cherche.*(un|une)/i,
      /veux.*(un|une)/i,
      /besoin.*(un|une)/i,
      /quel.*(tshirt|chemise|pantalon|jean|robe)/i,
      /je.*voudrai/i,
      /j'aimerais/i
    ]

    const patternMatches = requestPatterns.filter(pattern => 
      pattern.test(message)
    ).length

    // Calcul de la confiance
    confidence += keywordMatches * 0.3
    confidence += patternMatches * 0.5

    // Bonus pour les demandes de produits spécifiques
    const specificProducts = ['tshirt', 'chemise', 'pantalon', 'jean', 'robe', 'veste', 'chaussures']
    if (specificProducts.some(product => message.includes(product))) {
      confidence += 0.4
    }

    // Bonus pour mention de critères spécifiques
    const criteria = ['couleur', 'taille', 'prix', 'budget', 'style', 'marque']
    if (criteria.some(criterion => message.includes(criterion))) {
      confidence += 0.2
    }

    // Pénalité si c'est clairement une demande d'outfit complet
    if (message.includes('outfit') || message.includes('tenue complète') || message.includes('look complet')) {
      confidence -= 0.3
    }

    // Normalisation de la confiance
    confidence = Math.min(Math.max(confidence, 0), 1)

    return {
      canHandle: confidence > 0.5, // Seuil plus élevé pour être plus sélectif
      confidence
    }
  }

  /**
   * Traite la requête et génère des recommandations de vêtements
   */
  async process(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      // Analyse de la requête
      const analysis = await this.analyzeClothingRequest(request.message)
      
      // Génération des recommandations
      const recommendations = await this.generateRecommendations(analysis, request.context?.userPreferences)
      
      let content = ''
      let confidence = 0

      if (recommendations.length > 0) {
        content = this.formatRecommendationResponse(recommendations, analysis)
        confidence = 0.85
      } else {
        content = this.getNoRecommendationResponse(analysis)
        confidence = 0.2
      }

      const processingTime = Date.now() - startTime

      return {
        id: `individual-response-${Date.now()}`,
        aiType: this.type,
        content,
        confidence,
        metadata: {
          intent: 'individual_clothing_recommendation',
          entities: analysis,
          recommendations,
          processingTime,
          totalProductsAnalyzed: recommendations.length
        },
        timestamp: new Date().toISOString(),
        success: true
      }

    } catch (error) {
      return {
        id: `individual-error-${Date.now()}`,
        aiType: this.type,
        content: 'Désolé, je n\'ai pas pu générer de recommandations de vêtements pour le moment.',
        confidence: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  /**
   * Retourne la configuration de cette IA
   */
  getConfig(): ChildAIConfig {
    return { ...this.config }
  }

  /**
   * Analyse la requête pour extraire les intentions de vêtements
   */
  private async analyzeClothingRequest(message: string) {
    const messageLower = message.toLowerCase()
    
    const analysis = {
      category: this.extractCategory(messageLower),
      style: this.extractStyle(messageLower),
      colors: this.extractColors(messageLower),
      size: this.extractSize(messageLower),
      budget: this.extractBudget(messageLower),
      gender: this.extractGender(messageLower),
      occasion: this.extractOccasion(messageLower),
      brand: this.extractBrand(messageLower),
      material: this.extractMaterial(messageLower)
    }

    return analysis
  }

  /**
   * Extrait la catégorie de vêtement demandée
   */
  private extractCategory(message: string): string[] {
    const categories = {
      'Hauts': ['tshirt', 't-shirt', 'chemise', 'pull', 'sweat', 'polo', 'top'],
      'Bas': ['pantalon', 'jean', 'short', 'jupe', 'legging'],
      'Robes': ['robe'],
      'Vestes': ['veste', 'blouson', 'manteau', 'cardigan'],
      'Chaussures': ['chaussures', 'sneakers', 'baskets', 'bottes', 'sandales', 'escarpins'],
      'Accessoires': ['sac', 'ceinture', 'chapeau', 'écharpe', 'bijoux']
    }

    const foundCategories: string[] = []
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        foundCategories.push(category)
      }
    }

    return foundCategories.length > 0 ? foundCategories : ['Hauts'] // Par défaut
  }

  /**
   * Extrait le style souhaité
   */
  private extractStyle(message: string): string {
    const styles = {
      'casual': ['casual', 'décontracté', 'relax', 'confortable'],
      'chic': ['chic', 'élégant', 'sophistiqué', 'classe'],
      'sportif': ['sport', 'sportif', 'fitness', 'gym'],
      'tendance': ['tendance', 'mode', 'fashion', 'branché', 'moderne'],
      'classique': ['classique', 'intemporel', 'traditionnel'],
      'vintage': ['vintage', 'rétro', 'ancien']
    }

    for (const [style, keywords] of Object.entries(styles)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return style
      }
    }
    return 'casual' // par défaut
  }

  /**
   * Extrait les couleurs mentionnées
   */
  private extractColors(message: string): string[] {
    const colors = ['noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'violet', 'gris', 'marron', 'beige', 'orange']
    return colors.filter(color => message.includes(color))
  }

  /**
   * Extrait la taille
   */
  private extractSize(message: string): string | null {
    const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl']
    return sizes.find(size => message.includes(size.toLowerCase())) || null
  }

  /**
   * Extrait le budget
   */
  private extractBudget(message: string): { min: number; max: number } | null {
    const budgetMatch = message.match(/(\d+)\s*€|budget.*(\d+)|moins.*(\d+)|max.*(\d+)/i)
    if (budgetMatch) {
      const amount = parseInt(budgetMatch[1] || budgetMatch[2] || budgetMatch[3] || budgetMatch[4])
      return { min: 0, max: amount }
    }

    // Budgets types
    if (message.includes('pas cher') || message.includes('économique')) {
      return { min: 0, max: 50 }
    }
    if (message.includes('milieu de gamme') || message.includes('moyen')) {
      return { min: 50, max: 150 }
    }
    if (message.includes('haut de gamme') || message.includes('premium')) {
      return { min: 150, max: 1000 }
    }

    return null
  }

  /**
   * Extrait le genre
   */
  private extractGender(message: string): string | null {
    if (message.includes('homme') || message.includes('masculin')) return 'Homme'
    if (message.includes('femme') || message.includes('féminin')) return 'Femme'
    return null
  }

  /**
   * Extrait l'occasion
   */
  private extractOccasion(message: string): string | null {
    const occasions = {
      'travail': ['travail', 'bureau', 'professionnel'],
      'soirée': ['soirée', 'sortie', 'fête'],
      'casual': ['quotidien', 'tous les jours'],
      'sport': ['sport', 'gym', 'fitness'],
      'voyage': ['voyage', 'vacances']
    }

    for (const [occasion, keywords] of Object.entries(occasions)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return occasion
      }
    }
    return null
  }

  /**
   * Extrait la marque mentionnée
   */
  private extractBrand(message: string): string | null {
    // Ici on pourrait avoir une liste de marques
    const brands = ['nike', 'adidas', 'zara', 'h&m', 'uniqlo']
    return brands.find(brand => message.includes(brand)) || null
  }

  /**
   * Extrait le matériau souhaité
   */
  private extractMaterial(message: string): string | null {
    const materials = ['coton', 'lin', 'soie', 'laine', 'polyester', 'denim', 'cuir']
    return materials.find(material => message.includes(material)) || null
  }

  /**
   * Génère des recommandations basées sur l'analyse
   */
  private async generateRecommendations(analysis: any, preferences?: UserPreferences): Promise<Product[]> {
    try {
      // Récupération des produits disponibles
      const productsResult = await ProductService.getAll(1, 100)
      let products = productsResult.data

      // Filtrage des produits
      products = this.filterProducts(products, analysis, preferences)

      // Calcul des scores de recommandation
      const scoredProducts = products.map(product => ({
        product,
        score: this.calculateRecommendationScore(product, analysis, preferences)
      }))

      // Tri par score décroissant et sélection des 5 meilleurs
      return scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.product)

    } catch (error) {
      console.error('Erreur lors de la génération de recommandations:', error)
      return []
    }
  }

  /**
   * Filtre les produits selon les critères
   */
  private filterProducts(products: Product[], analysis: any, preferences?: UserPreferences): Product[] {
    return products.filter(product => {
      // Filtre par catégorie
      if (analysis.category.length > 0) {
        if (!analysis.category.includes(product.category || '')) {
          return false
        }
      }

      // Filtre par genre
      if (analysis.gender && product.gender && product.gender !== analysis.gender) {
        return false
      }
      if (preferences?.gender && product.gender && product.gender !== preferences.gender) {
        return false
      }

      // Filtre par budget
      if (analysis.budget && product.price && product.price > analysis.budget.max) {
        return false
      }
      if (preferences?.budget && product.price && product.price > preferences.budget.max) {
        return false
      }

      // Filtre par couleurs
      if (analysis.colors.length > 0 && product.colors) {
        const hasMatchingColor = analysis.colors.some(color => 
          product.colors?.some(pc => pc.toLowerCase().includes(color))
        )
        if (!hasMatchingColor) return false
      }

      // Filtre par taille
      if (analysis.size && product.sizes) {
        if (!product.sizes.includes(analysis.size.toUpperCase())) {
          return false
        }
      }

      // Produit doit être en stock
      return (product.stock || 0) > 0
    })
  }

  /**
   * Calcule le score de recommandation pour un produit
   */
  private calculateRecommendationScore(product: Product, analysis: any, preferences?: UserPreferences): number {
    let score = 0

    // Score basé sur la popularité/tendance
    if (product.stock && product.stock > this.recommendationCriteria.trending.minPopularity) {
      score += this.recommendationCriteria.trending.weight
    }

    // Score basé sur les préférences utilisateur
    if (preferences) {
      if (preferences.categories?.includes(product.category || '')) {
        score += this.recommendationCriteria.personalizedMatch.preferenceBonus
      }
      if (preferences.colors?.some(color => 
        product.colors?.some(pc => pc.toLowerCase().includes(color.toLowerCase()))
      )) {
        score += this.recommendationCriteria.personalizedMatch.preferenceBonus
      }
    }

    // Score basé sur la disponibilité
    if (product.stock && product.stock > this.recommendationCriteria.availability.stockThreshold) {
      score += this.recommendationCriteria.availability.weight
    } else if (product.stock && product.stock < this.recommendationCriteria.availability.stockThreshold) {
      score -= this.recommendationCriteria.availability.lowStockPenalty
    }

    // Score basé sur le rapport qualité-prix
    if (product.price) {
      if (analysis.budget && product.price <= analysis.budget.max * 0.8) {
        score += this.recommendationCriteria.price.budgetMatch
      }
    }

    // Bonus pour correspondance exacte des critères
    if (analysis.style && this.matchesStyle(product, analysis.style)) {
      score += 0.2
    }

    return score
  }

  /**
   * Vérifie si le produit correspond au style demandé
   */
  private matchesStyle(product: Product, style: string): boolean {
    // Logique simplifiée - pourrait être plus sophistiquée
    const productName = product.name?.toLowerCase() || ''
    const productDescription = product.description?.toLowerCase() || ''
    
    const styleKeywords = {
      'casual': ['casual', 'décontracté', 'confort'],
      'chic': ['chic', 'élégant', 'classe'],
      'sportif': ['sport', 'fitness', 'performance'],
      'tendance': ['tendance', 'mode', 'fashion'],
      'classique': ['classique', 'intemporel'],
      'vintage': ['vintage', 'rétro']
    }

    const keywords = styleKeywords[style] || []
    return keywords.some(keyword => 
      productName.includes(keyword) || productDescription.includes(keyword)
    )
  }

  /**
   * Formate la réponse avec les recommandations
   */
  private formatRecommendationResponse(recommendations: Product[], analysis: any): string {
    let response = `🎯 **Mes recommandations personnalisées** ${analysis.category.length > 0 ? `pour ${analysis.category.join(', ').toLowerCase()}` : ''}\n\n`

    recommendations.forEach((product, index) => {
      const emoji = ['🏆', '⭐', '💎', '🔥', '✨'][index] || '👍'
      response += `${emoji} **${product.name}** - ${product.price}€\n`
      
      if (product.category) {
        response += `   📂 Catégorie: ${product.category}\n`
      }
      
      if (product.colors && product.colors.length > 0) {
        response += `   🎨 Couleurs: ${product.colors.join(', ')}\n`
      }
      
      if (product.sizes && product.sizes.length > 0) {
        response += `   📏 Tailles: ${product.sizes.join(', ')}\n`
      }
      
      if (product.stock) {
        if (product.stock < 10) {
          response += `   ⚠️ Stock limité: ${product.stock} restant(s)\n`
        } else {
          response += `   ✅ En stock\n`
        }
      }
      
      response += `   💡 **Pourquoi je le recommande ?** ${this.getRecommendationReason(product, analysis)}\n\n`
    })

    response += `🛍️ Ces recommandations sont basées sur vos critères et les tendances actuelles !\n`
    response += `💬 Besoin de plus d'informations sur un produit ou d'autres suggestions ?`

    return response
  }

  /**
   * Génère une raison pour la recommandation
   */
  private getRecommendationReason(product: Product, analysis: any): string {
    const reasons = []

    if (analysis.style && this.matchesStyle(product, analysis.style)) {
      reasons.push(`parfait pour un style ${analysis.style}`)
    }

    if (analysis.colors.length > 0 && product.colors?.some(color => 
      analysis.colors.some(ac => color.toLowerCase().includes(ac))
    )) {
      reasons.push('dans vos couleurs préférées')
    }

    if (product.stock && product.stock > 50) {
      reasons.push('très populaire')
    }

    if (analysis.budget && product.price && product.price <= analysis.budget.max * 0.7) {
      reasons.push('excellent rapport qualité-prix')
    }

    if (product.stock && product.stock < 10) {
      reasons.push('pièce rare, derniers exemplaires')
    }

    return reasons.length > 0 
      ? reasons.join(' et ')
      : 'sélectionné spécialement pour vous'
  }

  /**
   * Réponse quand aucune recommandation ne peut être générée
   */
  private getNoRecommendationResponse(analysis: any): string {
    return `😔 Je n'ai pas trouvé de produits correspondant exactement à vos critères.\n\n` +
           `**Pour de meilleurs résultats, essayez :**\n` +
           `• D'élargir vos critères de couleur ou de prix\n` +
           `• De choisir une catégorie différente (${analysis.category.join(', ')})\n` +
           `• De préciser votre style ou l'occasion\n\n` +
           `💡 Je peux aussi vous suggérer des alternatives ou vous aider à créer un outfit complet !`
  }

  /**
   * Obtient les statistiques des recommandations
   */
  public getRecommendationStats() {
    return {
      supportedCategories: ['Hauts', 'Bas', 'Robes', 'Vestes', 'Chaussures', 'Accessoires'],
      supportedStyles: ['casual', 'chic', 'sportif', 'tendance', 'classique', 'vintage'],
      supportedOccasions: ['travail', 'soirée', 'casual', 'sport', 'voyage'],
      criteriaWeights: this.recommendationCriteria
    }
  }
} 