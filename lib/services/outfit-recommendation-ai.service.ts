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
 * Service IA spécialisé dans les recommandations de tenues complètes
 * Génère des outfits cohérents basés sur les préférences et le contexte
 */
export class OutfitRecommendationAIService implements IChildAI {
  public readonly type: AIType = 'outfit_recommendation'
  public readonly name = 'IA Recommandation Outfit'

  private config: ChildAIConfig = {
    id: 'outfit-ai-001',
    name: 'IA Recommandation Outfit',
    type: 'outfit_recommendation',
    description: 'IA spécialisée dans la création de tenues complètes et harmonieuses',
    isActive: true,
    priority: 2,
    keywords: [
      'outfit', 'tenue', 'look', 'style', 'ensemble', 'assortir', 'coordonner',
      'occasion', 'événement', 'sortie', 'travail', 'soirée', 'casual', 'chic',
      'mode', 'fashion', 'stylisme', 'conseils mode', 'tendance'
    ],
    patterns: [
      /outfit/i,
      /tenue.*(complète|pour|occasion)/i,
      /look.*(pour|style)/i,
      /que.*porter.*pour/i,
      /comment.*habiller/i,
      /style.*(pour|occasion)/i,
      /assortir.*avec/i,
      /coordonner/i
    ]
  }

  // Règles de style pour les combinaisons
  private styleRules = {
    occasions: {
      'travail': {
        requiredCategories: ['Hauts', 'Bas'],
        preferredColors: ['noir', 'blanc', 'gris', 'bleu marine', 'beige'],
        excludedColors: ['rose fluo', 'jaune vif'],
        style: 'professionnel'
      },
      'soirée': {
        requiredCategories: ['Hauts', 'Bas'],
        preferredColors: ['noir', 'rouge', 'bleu', 'or', 'argent'],
        style: 'élégant',
        occasionPremium: true
      },
      'casual': {
        requiredCategories: ['Hauts', 'Bas'],
        preferredColors: ['toutes'],
        style: 'décontracté'
      },
      'sport': {
        requiredCategories: ['Hauts', 'Bas'],
        preferredColors: ['noir', 'blanc', 'gris', 'bleu'],
        style: 'sportif'
      }
    },
    colorHarmony: {
      'noir': ['blanc', 'gris', 'rouge', 'bleu', 'toutes'],
      'blanc': ['noir', 'bleu', 'rouge', 'gris', 'toutes'],
      'bleu': ['blanc', 'gris', 'beige', 'jaune'],
      'rouge': ['noir', 'blanc', 'gris', 'beige'],
      'gris': ['toutes']
    },
    seasonalColors: {
      'printemps': ['vert', 'rose', 'jaune', 'blanc'],
      'été': ['blanc', 'bleu', 'jaune', 'vert'],
      'automne': ['marron', 'orange', 'rouge', 'beige'],
      'hiver': ['noir', 'gris', 'bleu marine', 'rouge']
    }
  }

  /**
   * Détermine si cette IA peut traiter la requête
   */
  async canHandle(request: AIRequest): Promise<{ canHandle: boolean; confidence: number }> {
    const message = request.message.toLowerCase()
    let confidence = 0

    // Vérification des mots-clés
    const keywordMatches = this.config.keywords.filter(keyword => 
      message.includes(keyword.toLowerCase())
    ).length

    // Vérification des patterns
    const patternMatches = this.config.patterns.filter(pattern => 
      pattern.test(message)
    ).length

    // Calcul de la confiance
    confidence += keywordMatches * 0.25
    confidence += patternMatches * 0.4

    // Bonus pour les demandes d'occasion spécifique
    const occasions = ['travail', 'soirée', 'casual', 'sport', 'mariage', 'rendez-vous']
    if (occasions.some(occasion => message.includes(occasion))) {
      confidence += 0.3
    }

    // Bonus pour les demandes de combinaisons
    if (message.includes('avec') || message.includes('assortir') || message.includes('combiner')) {
      confidence += 0.2
    }

    // Normalisation de la confiance
    confidence = Math.min(confidence, 1)

    return {
      canHandle: confidence > 0.5,
      confidence
    }
  }

  /**
   * Traite la requête et génère des recommandations d'outfit
   */
  async process(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      // Analyse de la requête
      const analysis = await this.analyzeOutfitRequest(request.message)
      
      // Génération des outfits
      const outfits = await this.generateOutfits(analysis, request.context?.userPreferences)
      
      let content = ''
      let confidence = 0

      if (outfits.length > 0) {
        content = this.formatOutfitResponse(outfits, analysis)
        confidence = 0.8
      } else {
        content = this.getNoOutfitResponse(analysis)
        confidence = 0.3
      }

      const processingTime = Date.now() - startTime

      return {
        id: `outfit-response-${Date.now()}`,
        aiType: this.type,
        content,
        confidence,
        metadata: {
          intent: 'outfit_recommendation',
          entities: analysis,
          recommendations: outfits.flat(),
          processingTime,
          outfitsGenerated: outfits.length
        },
        timestamp: new Date().toISOString(),
        success: true
      }

    } catch (error) {
      return {
        id: `outfit-error-${Date.now()}`,
        aiType: this.type,
        content: 'Désolé, je n\'ai pas pu générer de recommandations d\'outfit pour le moment.',
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
   * Analyse la requête pour extraire les intentions d'outfit
   */
  private async analyzeOutfitRequest(message: string) {
    const messageLower = message.toLowerCase()
    
    const analysis = {
      occasion: this.extractOccasion(messageLower),
      style: this.extractStyle(messageLower),
      colors: this.extractColors(messageLower),
      season: this.extractSeason(messageLower),
      budget: this.extractBudget(messageLower),
      gender: this.extractGender(messageLower),
      sizes: this.extractSizes(messageLower)
    }

    return analysis
  }

  /**
   * Extrait l'occasion de la requête
   */
  private extractOccasion(message: string): string {
    const occasions = {
      'travail': ['travail', 'bureau', 'professionnel', 'meeting', 'réunion'],
      'soirée': ['soirée', 'sortie', 'dîner', 'restaurant', 'fête'],
      'casual': ['casual', 'décontracté', 'quotidien', 'shopping', 'balade'],
      'sport': ['sport', 'gym', 'course', 'fitness', 'yoga'],
      'mariage': ['mariage', 'cérémonie', 'célébration'],
      'rendez-vous': ['rendez-vous', 'date', 'rencontre']
    }

    for (const [occasion, keywords] of Object.entries(occasions)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return occasion
      }
    }
    return 'casual' // par défaut
  }

  /**
   * Extrait le style souhaité
   */
  private extractStyle(message: string): string {
    const styles = {
      'chic': ['chic', 'élégant', 'sophistiqué'],
      'décontracté': ['décontracté', 'casual', 'relax'],
      'tendance': ['tendance', 'mode', 'fashion', 'branché'],
      'classique': ['classique', 'intemporel', 'traditionnel'],
      'moderne': ['moderne', 'contemporain', 'actuel']
    }

    for (const [style, keywords] of Object.entries(styles)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return style
      }
    }
    return 'décontracté' // par défaut
  }

  /**
   * Extrait les couleurs mentionnées
   */
  private extractColors(message: string): string[] {
    const colors = ['noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'violet', 'gris', 'marron', 'beige', 'orange']
    return colors.filter(color => message.includes(color))
  }

  /**
   * Extrait la saison
   */
  private extractSeason(message: string): string {
    const seasons = ['printemps', 'été', 'automne', 'hiver']
    return seasons.find(season => message.includes(season)) || this.getCurrentSeason()
  }

  /**
   * Extrait le budget mentionné
   */
  private extractBudget(message: string): { min: number; max: number } | null {
    const budgetMatch = message.match(/(\d+)\s*€|budget.*(\d+)/i)
    if (budgetMatch) {
      const amount = parseInt(budgetMatch[1] || budgetMatch[2])
      return { min: 0, max: amount }
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
   * Extrait les tailles
   */
  private extractSizes(message: string): string[] {
    const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl']
    return sizes.filter(size => message.includes(size))
  }

  /**
   * Obtient la saison actuelle
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth()
    if (month >= 2 && month <= 4) return 'printemps'
    if (month >= 5 && month <= 7) return 'été'
    if (month >= 8 && month <= 10) return 'automne'
    return 'hiver'
  }

  /**
   * Génère des outfits basés sur l'analyse
   */
  private async generateOutfits(analysis: any, preferences?: UserPreferences): Promise<Product[][]> {
    const outfits: Product[][] = []

    try {
      // Récupération des produits disponibles
      const productsResult = await ProductService.getAll(1, 50)
      let products = productsResult.data

      // Filtrage selon les critères
      products = this.filterProducts(products, analysis, preferences)

      // Génération de 2-3 outfits différents
      for (let i = 0; i < 3 && products.length > 0; i++) {
        const outfit = this.createOutfit(products, analysis)
        if (outfit.length >= 2) { // Au minimum haut + bas
          outfits.push(outfit)
          // Retirer les produits utilisés pour créer de la diversité
          products = products.filter(p => !outfit.find(o => o.id === p.id))
        }
      }

    } catch (error) {
      console.error('Erreur lors de la génération d\'outfits:', error)
    }

    return outfits
  }

  /**
   * Filtre les produits selon les critères
   */
  private filterProducts(products: Product[], analysis: any, preferences?: UserPreferences): Product[] {
    return products.filter(product => {
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

      // Filtre par catégories préférées
      if (preferences?.categories && preferences.categories.length > 0) {
        if (!preferences.categories.includes(product.category || '')) {
          return false
        }
      }

      // Produit doit être en stock
      return (product.stock || 0) > 0
    })
  }

  /**
   * Crée un outfit cohérent
   */
  private createOutfit(products: Product[], analysis: any): Product[] {
    const outfit: Product[] = []
    
    // Sélection d'un haut
    const tops = products.filter(p => 
      ['Hauts', 'T-shirts', 'Chemises', 'Pulls', 'Sweats'].includes(p.category || '')
    )
    if (tops.length > 0) {
      outfit.push(tops[Math.floor(Math.random() * tops.length)])
    }

    // Sélection d'un bas
    const bottoms = products.filter(p => 
      ['Bas', 'Pantalons', 'Jeans', 'Jupes', 'Shorts'].includes(p.category || '')
    )
    if (bottoms.length > 0) {
      const selectedTop = outfit[0]
      const compatibleBottoms = this.findCompatibleBottoms(bottoms, selectedTop, analysis)
      if (compatibleBottoms.length > 0) {
        outfit.push(compatibleBottoms[Math.floor(Math.random() * compatibleBottoms.length)])
      }
    }

    // Ajout d'accessoires si disponibles
    const accessories = products.filter(p => 
      ['Accessoires', 'Chaussures', 'Vestes'].includes(p.category || '')
    )
    if (accessories.length > 0 && outfit.length >= 2) {
      const accessory = accessories[Math.floor(Math.random() * accessories.length)]
      outfit.push(accessory)
    }

    return outfit
  }

  /**
   * Trouve des bas compatibles avec le haut sélectionné
   */
  private findCompatibleBottoms(bottoms: Product[], top: Product, analysis: any): Product[] {
    return bottoms.filter(bottom => {
      // Vérification de l'harmonie des couleurs
      if (top.colors && bottom.colors) {
        return this.areColorsCompatible(top.colors, bottom.colors)
      }
      return true
    })
  }

  /**
   * Vérifie si les couleurs sont compatibles
   */
  private areColorsCompatible(colors1: string[], colors2: string[]): boolean {
    for (const color1 of colors1) {
      for (const color2 of colors2) {
        const compatible = this.styleRules.colorHarmony[color1.toLowerCase()]
        if (compatible && (compatible.includes(color2.toLowerCase()) || compatible.includes('toutes'))) {
          return true
        }
      }
    }
    return true // Par défaut, accepter la combinaison
  }

  /**
   * Formate la réponse avec les outfits
   */
  private formatOutfitResponse(outfits: Product[][], analysis: any): string {
    let response = `✨ **Voici mes recommandations d'outfits pour ${analysis.occasion}** ✨\n\n`

    outfits.forEach((outfit, index) => {
      const emoji = ['🏆', '⭐', '💎'][index] || '🔥'
      response += `${emoji} **Outfit ${index + 1}** :\n`
      
      let totalPrice = 0
      outfit.forEach((item, itemIndex) => {
        const category = this.getCategoryEmoji(item.category || '')
        response += `   ${category} ${item.name} - ${item.price}€\n`
        if (item.colors && item.colors.length > 0) {
          response += `      Couleurs: ${item.colors.join(', ')}\n`
        }
        totalPrice += item.price || 0
      })
      
      response += `   💰 Total: ${totalPrice}€\n\n`
      response += `   💡 **Pourquoi cet outfit ?** ${this.getOutfitReason(outfit, analysis)}\n\n`
    })

    response += `🎯 Ces outfits sont parfaits pour votre style ${analysis.style} et l'occasion "${analysis.occasion}" !\n`
    response += `💬 Voulez-vous des alternatives ou des conseils pour accessoiriser ?`

    return response
  }

  /**
   * Retourne l'emoji correspondant à la catégorie
   */
  private getCategoryEmoji(category: string): string {
    const emojis: Record<string, string> = {
      'Hauts': '👕',
      'T-shirts': '👕',
      'Chemises': '👔',
      'Pulls': '🧥',
      'Sweats': '👘',
      'Bas': '👖',
      'Pantalons': '👖',
      'Jeans': '👖',
      'Jupes': '👗',
      'Shorts': '🩳',
      'Chaussures': '👟',
      'Accessoires': '👜',
      'Vestes': '🧥'
    }
    return emojis[category] || '👔'
  }

  /**
   * Génère une explication pour l'outfit
   */
  private getOutfitReason(outfit: Product[], analysis: any): string {
    const reasons = []

    if (analysis.occasion !== 'casual') {
      reasons.push(`adapté pour ${analysis.occasion}`)
    }
    
    if (analysis.colors.length > 0) {
      reasons.push(`respecte vos couleurs préférées`)
    }
    
    if (outfit.length >= 3) {
      reasons.push(`look complet avec accessoires`)
    }
    
    reasons.push(`harmonie parfaite des couleurs`)

    return reasons.length > 0 
      ? reasons.join(' et ')
      : 'sélectionné pour son style impeccable'
  }

  /**
   * Réponse quand aucun outfit ne peut être généré
   */
  private getNoOutfitResponse(analysis: any): string {
    return `😔 Je n'ai pas pu créer d'outfit complet avec les critères demandés.\n\n` +
           `**Suggestions pour obtenir de meilleurs résultats :**\n` +
           `• Élargissez vos critères de couleur ou de budget\n` +
           `• Essayez une occasion différente (${Object.keys(this.styleRules.occasions).join(', ')})\n` +
           `• Consultez nos produits individuels avec des recommandations personnalisées\n\n` +
           `💡 Je peux aussi vous conseiller sur des pièces spécifiques !`
  }

  /**
   * Obtient les statistiques des recommandations d'outfits
   */
  public getOutfitStats() {
    return {
      totalOccasions: Object.keys(this.styleRules.occasions).length,
      availableStyles: ['chic', 'décontracté', 'tendance', 'classique', 'moderne'],
      colorCombinations: Object.keys(this.styleRules.colorHarmony).length,
      seasonalRecommendations: Object.keys(this.styleRules.seasonalColors).length
    }
  }
} 