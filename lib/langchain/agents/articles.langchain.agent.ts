import { BaseLangchainService, LangchainAgentConfig, LangchainResponse } from '../base.langchain.service'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'

/**
 * Types pour les recommandations d'articles
 */
interface ProductCriteria {
  category?: string
  style?: string
  colors?: string[]
  budget?: { min: number; max: number }
  gender?: string
  occasion?: string
  size?: string
}

interface Product {
  id: string
  name: string
  category: string
  price: number
  colors: string[]
  sizes: string[]
  style: string
  description: string
  occasion: string[]
  gender: string
}

/**
 * Agent Articles Langchain - Spécialisé dans les recommandations de produits individuels
 */
export class ArticlesLangchainAgent extends BaseLangchainService {
  private analysisChain!: RunnableSequence<any, string>
  private recommendationChain!: RunnableSequence<any, string>
  private products!: Product[]

  constructor(config?: Partial<LangchainAgentConfig>) {
    super({
      agentType: 'articles',
      temperature: 0.4,
      maxTokens: 800,
      confidenceThreshold: 0.5,
      ...config
    })

    this.initializeProducts()
    this.initializeChains()
  }

  /**
   * Initialise la base de données de produits exemple
   */
  private initializeProducts(): void {
    this.products = [
      {
        id: '1',
        name: 'T-shirt Premium Coton Bio',
        category: 'top',
        price: 29.99,
        colors: ['Blanc', 'Noir', 'Gris', 'Navy'],
        sizes: ['S', 'M', 'L', 'XL'],
        style: 'casual',
        description: 'T-shirt en coton bio, coupe moderne et confortable',
        occasion: ['quotidien', 'weekend', 'sport'],
        gender: 'unisex'
      },
      {
        id: '2', 
        name: 'Jean Slim Fit Stretch',
        category: 'bottom',
        price: 79.99,
        colors: ['Bleu brut', 'Noir', 'Gris foncé'],
        sizes: ['28', '30', '32', '34', '36'],
        style: 'moderne',
        description: 'Jean stretch confortable, coupe slim moderne',
        occasion: ['quotidien', 'sortie', 'travail'],
        gender: 'unisex'
      },
      {
        id: '3',
        name: 'Robe Midi Élégante',
        category: 'dress',
        price: 89.99,
        colors: ['Noir', 'Navy', 'Bordeaux', 'Vert sapin'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        style: 'élégant',
        description: 'Robe midi parfaite pour les occasions spéciales',
        occasion: ['travail', 'soirée', 'ceremonie'],
        gender: 'femme'
      },
      {
        id: '4',
        name: 'Chemise Business Premium',
        category: 'top',
        price: 59.99,
        colors: ['Blanc', 'Bleu ciel', 'Gris clair'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        style: 'formel',
        description: 'Chemise business de qualité premium, coupe ajustée',
        occasion: ['travail', 'formel', 'ceremonie'],
        gender: 'homme'
      },
      {
        id: '5',
        name: 'Sneakers Urban Style',
        category: 'shoes',
        price: 99.99,
        colors: ['Blanc', 'Noir', 'Gris', 'Bleu marine'],
        sizes: ['38', '39', '40', '41', '42', '43', '44'],
        style: 'urbain',
        description: 'Sneakers tendance pour un look urbain moderne',
        occasion: ['quotidien', 'weekend', 'sport'],
        gender: 'unisex'
      }
    ]
  }

  /**
   * Initialise les chains spécialisées
   */
  private initializeChains(): void {
    this.analysisChain = this.createAnalysisChain()
    this.recommendationChain = this.createRecommendationChain()
  }

  /**
   * Chain pour analyser la demande et extraire les critères
   */
  private createAnalysisChain(): RunnableSequence<any, string> {
    const analysisPrompt = this.createPromptTemplate(`
Tu es un expert en analyse de demandes de mode. Analyse la demande et extrais les critères de recherche.

DEMANDE: {request}
PERSONNALITÉ: {personality}

INSTRUCTIONS:
1. Détermine si c'est bien une demande de produit spécifique (pas un outfit complet)
2. Extrais les critères mentionnés ou implicites
3. Format de réponse JSON strict:

{{
  "isProductRequest": true/false,
  "confidence": 0.0-1.0,
  "criteria": {{
    "category": "top/bottom/dress/shoes/accessoire ou null",
    "style": "casual/formel/élégant/urbain/moderne ou null",
    "colors": ["couleur1", "couleur2"] ou [],
    "budget": {{"min": nombre, "max": nombre}} ou null,
    "gender": "homme/femme/unisex ou null",
    "occasion": "quotidien/travail/soirée/sport/weekend ou null",
    "size": "taille mentionnée ou null"
  }},
  "reasoning": "Explication de l'analyse"
}}

RÉPONSE JSON:`)

    return this.createSimpleChain(analysisPrompt)
  }

  /**
   * Chain pour générer les recommandations
   */
  private createRecommendationChain(): RunnableSequence<any, string> {
    const recommendationPrompt = this.createPromptTemplate(`
Tu es un conseiller mode expert de Younzee. Recommande des produits spécifiques.

CRITÈRES: {criteria}
PRODUITS DISPONIBLES: {products}
PERSONNALITÉ: {personality}

INSTRUCTIONS:
- Analyse les produits selon les critères
- Recommande 2-3 produits les plus adaptés
- Explique pourquoi ces produits correspondent
- Utilise un format engageant avec emojis
- Donne des conseils de style
- Mentionne prix, couleurs et tailles disponibles

FORMAT:
🎯 **Mes Recommandations pour vous**

**1. [Nom Produit]** - [Prix]€
• Pourquoi: [Explication]
• Couleurs: [Liste]
• Tailles: [Liste]

**2. [Nom Produit]** - [Prix]€
• Pourquoi: [Explication]
• Couleurs: [Liste]
• Tailles: [Liste]

💡 **Conseil style**: [Conseils personnalisés]

RÉPONSE:`)

    return this.createSimpleChain(recommendationPrompt)
  }

  /**
   * Traite une demande de recommandation d'articles
   */
  async processQuery(
    request: string,
    personality: any = {},
    context: any = {}
  ): Promise<LangchainResponse & { canHandle: boolean; confidence: number }> {
    const cleanRequest = request.trim().toLowerCase()

    // Vérification préliminaire
    const canHandle = this.canHandleRequest(cleanRequest)
    
    if (!canHandle) {
      return {
        success: false,
        canHandle: false,
        confidence: 0,
        error: 'Cette demande ne semble pas concerner des articles spécifiques'
      }
    }

    try {
      // Étape 1: Analyse de la demande
      const analysisResult = await this.executeChain(this.analysisChain, {
        request,
        personality: this.formatPersonality(personality)
      })

      if (!analysisResult.success) {
        return {
          ...analysisResult,
          canHandle: false,
          confidence: 0
        }
      }

      // Parse du JSON d'analyse
      let analysis: any
      try {
        analysis = JSON.parse(analysisResult.content || '{}')
      } catch (error) {
        console.warn('⚠️ Erreur parsing analyse:', error)
        return {
          success: false,
          canHandle: false,
          confidence: 0,
          error: 'Erreur d\'analyse de la demande'
        }
      }

      if (!analysis.isProductRequest || analysis.confidence < this.config.confidenceThreshold!) {
        return {
          success: false,
          canHandle: false,
          confidence: analysis.confidence || 0,
          error: 'Cette demande ne semble pas concerner des articles spécifiques'
        }
      }

      // Étape 2: Filtrage des produits
      const matchingProducts = this.filterProducts(analysis.criteria)
      
      if (matchingProducts.length === 0) {
        return {
          success: true,
          canHandle: true,
          confidence: 0.3,
          content: this.generateNoProductsMessage(personality),
          metadata: {
            model: this.llm.modelName,
            chainType: 'articles',
            productsFound: 0,
            criteria: analysis.criteria
          }
        }
      }

      // Étape 3: Génération des recommandations
      const recommendationResult = await this.executeChain(this.recommendationChain, {
        criteria: JSON.stringify(analysis.criteria),
        products: JSON.stringify(matchingProducts),
        personality: this.formatPersonality(personality)
      }, {
        confidence: analysis.confidence,
        productsCount: matchingProducts.length,
        criteria: analysis.criteria
      })

      this.logMetrics(recommendationResult, { request, productsFound: matchingProducts.length })

      return {
        ...recommendationResult,
        canHandle: true,
        confidence: recommendationResult.success ? analysis.confidence : 0
      }

    } catch (error: any) {
      console.error('❌ Erreur agent Articles:', error)
      return {
        success: false,
        canHandle: false,
        confidence: 0,
        error: error.message
      }
    }
  }

  /**
   * Détermine si la demande peut être traitée
   */
  private canHandleRequest(request: string): boolean {
    // Exclusions (questions générales, salutations, outfits complets)
    const exclusions = [
      'bonjour', 'salut', 'hello', 'comment allez', 'comment ça va',
      'aide', 'help', 'livraison', 'retour', 'paiement',
      'outfit', 'tenue', 'look complet', 'ensemble', 'coordonner'
    ]

    if (exclusions.some(exclusion => request.includes(exclusion))) {
      return false
    }

    // Inclusions (demandes de produits spécifiques)
    const inclusions = [
      't-shirt', 'tshirt', 'polo', 'chemise', 'shirt',
      'jean', 'pantalon', 'short', 'bermuda',
      'robe', 'jupe', 'dress',
      'chaussure', 'sneaker', 'basket', 'shoe',
      'pull', 'sweat', 'hoodie', 'cardigan',
      'veste', 'manteau', 'blouson',
      'accessoire', 'sac', 'ceinture',
      'recommande', 'conseil', 'cherche', 'veux', 'besoin',
      'style', 'mode', 'tendance', 'nouveau', 'acheter'
    ]

    return inclusions.some(inclusion => request.includes(inclusion))
  }

  /**
   * Filtre les produits selon les critères
   */
  private filterProducts(criteria: ProductCriteria): Product[] {
    return this.products.filter(product => {
      // Filtrage par catégorie
      if (criteria.category && product.category !== criteria.category) {
        return false
      }

      // Filtrage par style
      if (criteria.style && product.style !== criteria.style) {
        return false
      }

      // Filtrage par budget
      if (criteria.budget) {
        if (product.price < criteria.budget.min || product.price > criteria.budget.max) {
          return false
        }
      }

      // Filtrage par genre
      if (criteria.gender && criteria.gender !== 'unisex') {
        if (product.gender !== 'unisex' && product.gender !== criteria.gender) {
          return false
        }
      }

      // Filtrage par couleurs
      if (criteria.colors && criteria.colors.length > 0) {
        const hasMatchingColor = criteria.colors.some(color => 
          product.colors.some(productColor => 
            productColor.toLowerCase().includes(color.toLowerCase())
          )
        )
        if (!hasMatchingColor) {
          return false
        }
      }

      // Filtrage par occasion
      if (criteria.occasion) {
        if (!product.occasion.includes(criteria.occasion)) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Génère un message quand aucun produit ne correspond
   */
  private generateNoProductsMessage(personality: any): string {
    const tone = personality?.tone || 'Amical'
    
    const messages = {
      'Professionnel': '😔 Je n\'ai pas trouvé de produits correspondant exactement à vos critères dans notre sélection actuelle.',
      'Amical': '😊 Désolé, je n\'ai pas trouvé de produits qui correspondent parfaitement à ce que tu cherches !',
      'Expert': '🔍 Aucun produit de notre sélection ne correspond précisément à vos spécifications.',
      'Humoristique': '😅 Oups ! Aucun produit ne fait le poids face à tes critères de sélection !'
    }

    return messages[tone as keyof typeof messages] || messages['Amical']
  }

  /**
   * Formate la personnalité pour les prompts
   */
  private formatPersonality(personality: any): string {
    if (!personality) return 'Conseiller mode amical et expert'
    
    const traits = []
    if (personality.tone) traits.push(`Ton: ${personality.tone}`)
    if (personality.formality) traits.push(`Formalité: ${personality.formality}`)
    if (personality.verbosity) traits.push(`Détail: ${personality.verbosity}`)
    
    return traits.join(', ') || 'Conseiller mode amical et expert'
  }

  /**
   * Test de l'agent Articles
   */
  async test(): Promise<LangchainResponse> {
    console.log('🧪 Test de l\'agent Articles Langchain...')
    
    const testResult = await this.processQuery(
      'Je cherche un t-shirt bleu pour le quotidien, budget 30€',
      { tone: 'Amical', formality: 'Tutoiement' }
    )

    console.log('📊 Résultat test Articles:', {
      success: testResult.success,
      canHandle: testResult.canHandle,
      confidence: testResult.confidence,
      contentLength: testResult.content?.length
    })

    return testResult
  }
} 