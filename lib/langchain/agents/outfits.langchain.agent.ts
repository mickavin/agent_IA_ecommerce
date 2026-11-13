import { BaseLangchainService, LangchainAgentConfig, LangchainResponse } from '../base.langchain.service'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'

/**
 * Types pour les outfits
 */
interface OutfitCriteria {
  occasion: string
  style?: string
  budget?: { min: number; max: number }
  gender?: string
  season?: string
  colors?: string[]
}

interface OutfitItem {
  id: string
  name: string
  category: 'top' | 'bottom' | 'shoes' | 'accessory'
  price: number
  colors: string[]
  style: string
  occasion: string[]
  gender: string
  season: string[]
}

interface Outfit {
  id: string
  name: string
  occasion: string
  style: string
  items: OutfitItem[]
  totalPrice: number
  description: string
}

/**
 * Agent Outfits Langchain - Spécialisé dans la création d'outfits complets
 */
export class OutfitsLangchainAgent extends BaseLangchainService {
  private analysisChain!: RunnableSequence<any, string>
  private creationChain!: RunnableSequence<any, string>
  private items!: OutfitItem[]

  constructor(config?: Partial<LangchainAgentConfig>) {
    super({
      agentType: 'outfits',
      temperature: 0.5,
      maxTokens: 1000,
      confidenceThreshold: 0.5,
      ...config
    })

    this.initializeItems()
    this.initializeChains()
  }

  /**
   * Initialise la base de données d'articles pour outfits
   */
  private initializeItems(): void {
    this.items = [
      // TOPS
      {
        id: 'top1',
        name: 'Chemise Blanche Classique',
        category: 'top',
        price: 49.99,
        colors: ['Blanc', 'Bleu ciel'],
        style: 'classique',
        occasion: ['travail', 'formel', 'ceremonie'],
        gender: 'unisex',
        season: ['printemps', 'été', 'automne']
      },
      {
        id: 'top2',
        name: 'T-shirt Coton Premium',
        category: 'top',
        price: 29.99,
        colors: ['Blanc', 'Noir', 'Gris', 'Marine'],
        style: 'casual',
        occasion: ['quotidien', 'weekend', 'sport'],
        gender: 'unisex',
        season: ['printemps', 'été']
      },
      {
        id: 'top3',
        name: 'Blouse Élégante',
        category: 'top',
        price: 59.99,
        colors: ['Noir', 'Bordeaux', 'Vert sapin'],
        style: 'élégant',
        occasion: ['travail', 'soirée', 'ceremonie'],
        gender: 'femme',
        season: ['automne', 'hiver']
      },
      {
        id: 'top4',
        name: 'Pull Cachemire',
        category: 'top',
        price: 89.99,
        colors: ['Gris', 'Noir', 'Beige', 'Marine'],
        style: 'élégant',
        occasion: ['travail', 'quotidien', 'soirée'],
        gender: 'unisex',
        season: ['automne', 'hiver']
      },

      // BOTTOMS
      {
        id: 'bottom1',
        name: 'Pantalon Costume',
        category: 'bottom',
        price: 79.99,
        colors: ['Noir', 'Gris anthracite', 'Marine'],
        style: 'formel',
        occasion: ['travail', 'formel', 'ceremonie'],
        gender: 'unisex',
        season: ['printemps', 'été', 'automne', 'hiver']
      },
      {
        id: 'bottom2',
        name: 'Jean Slim',
        category: 'bottom',
        price: 69.99,
        colors: ['Bleu brut', 'Noir', 'Gris foncé'],
        style: 'casual',
        occasion: ['quotidien', 'weekend', 'sortie'],
        gender: 'unisex',
        season: ['printemps', 'été', 'automne']
      },
      {
        id: 'bottom3',
        name: 'Jupe Midi',
        category: 'bottom',
        price: 54.99,
        colors: ['Noir', 'Marine', 'Bordeaux'],
        style: 'élégant',
        occasion: ['travail', 'soirée', 'ceremonie'],
        gender: 'femme',
        season: ['printemps', 'été', 'automne']
      },

      // CHAUSSURES
      {
        id: 'shoes1',
        name: 'Chaussures de Ville',
        category: 'shoes',
        price: 99.99,
        colors: ['Noir', 'Marron'],
        style: 'formel',
        occasion: ['travail', 'formel', 'ceremonie'],
        gender: 'unisex',
        season: ['printemps', 'été', 'automne', 'hiver']
      },
      {
        id: 'shoes2',
        name: 'Sneakers Blanches',
        category: 'shoes',
        price: 79.99,
        colors: ['Blanc', 'Blanc cassé'],
        style: 'casual',
        occasion: ['quotidien', 'weekend', 'sport'],
        gender: 'unisex',
        season: ['printemps', 'été', 'automne']
      },
      {
        id: 'shoes3',
        name: 'Escarpins Élégants',
        category: 'shoes',
        price: 89.99,
        colors: ['Noir', 'Nude', 'Marine'],
        style: 'élégant',
        occasion: ['travail', 'soirée', 'ceremonie'],
        gender: 'femme',
        season: ['printemps', 'été', 'automne', 'hiver']
      },

      // ACCESSOIRES
      {
        id: 'acc1',
        name: 'Ceinture Cuir',
        category: 'accessory',
        price: 39.99,
        colors: ['Noir', 'Marron', 'Cognac'],
        style: 'classique',
        occasion: ['travail', 'formel', 'quotidien'],
        gender: 'unisex',
        season: ['printemps', 'été', 'automne', 'hiver']
      },
      {
        id: 'acc2',
        name: 'Sac à Main',
        category: 'accessory',
        price: 79.99,
        colors: ['Noir', 'Cognac', 'Marine'],
        style: 'élégant',
        occasion: ['travail', 'soirée', 'quotidien'],
        gender: 'femme',
        season: ['printemps', 'été', 'automne', 'hiver']
      }
    ]
  }

  /**
   * Initialise les chains spécialisées
   */
  private initializeChains(): void {
    this.analysisChain = this.createAnalysisChain()
    this.creationChain = this.createCreationChain()
  }

  /**
   * Chain pour analyser la demande d'outfit
   */
  private createAnalysisChain(): RunnableSequence<any, string> {
    const analysisPrompt = this.createPromptTemplate(`
Tu es un expert en analyse de demandes d'outfits et styling. Analyse la demande et extrais les critères.

DEMANDE: {request}
PERSONNALITÉ: {personality}

INSTRUCTIONS:
1. Détermine si c'est une demande d'outfit complet (pas un article individuel)
2. Identifie l'occasion, le style, le budget, le genre
3. Format JSON strict:

{{
  "isOutfitRequest": true/false,
  "confidence": 0.0-1.0,
  "criteria": {{
    "occasion": "travail/soirée/quotidien/weekend/ceremonie/sport",
    "style": "formel/casual/élégant/classique ou null",
    "budget": {{"min": nombre, "max": nombre}} ou null,
    "gender": "homme/femme/unisex ou null",
    "season": "printemps/été/automne/hiver ou null",
    "colors": ["couleur1", "couleur2"] ou []
  }},
  "reasoning": "Explication de l'analyse"
}}

RÉPONSE JSON:`)

    return this.createSimpleChain(analysisPrompt)
  }

  /**
   * Chain pour créer les outfits
   */
  private createCreationChain(): RunnableSequence<any, string> {
    const creationPrompt = this.createPromptTemplate(`
Tu es un styliste expert de Younzee. Crée des outfits complets harmonieux.

CRITÈRES: {criteria}
ARTICLES DISPONIBLES: {items}
PERSONNALITÉ: {personality}

INSTRUCTIONS:
- Crée 2-3 outfits complets différents
- Chaque outfit doit contenir au minimum: top + bottom + chaussures
- Assure l'harmonie des couleurs et styles
- Respecte l'occasion et le budget
- Explique les choix stylistiques

FORMAT:
✨ **Mes Suggestions d'Outfits**

**🏆 Outfit 1: [Nom]**
• **Style**: [Description]
• **Composition**:
  - 👕 [Top] - [Prix]€ ([Couleurs])
  - 👖 [Bottom] - [Prix]€ ([Couleurs])
  - 👟 [Chaussures] - [Prix]€ ([Couleurs])
  - 👜 [Accessoire] - [Prix]€ ([Couleurs]) *(optionnel)*
• **Prix total**: [Total]€
• **Pourquoi ça marche**: [Explication]

**🏆 Outfit 2: [Nom]**
• **Style**: [Description]
• **Composition**:
  - 👕 [Top] - [Prix]€ ([Couleurs])
  - 👖 [Bottom] - [Prix]€ ([Couleurs])
  - 👟 [Chaussures] - [Prix]€ ([Couleurs])
• **Prix total**: [Total]€
• **Pourquoi ça marche**: [Explication]

💡 **Conseil Style**: [Conseils personnalisés]

RÉPONSE:`)

    return this.createSimpleChain(creationPrompt)
  }

  /**
   * Traite une demande d'outfit
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
        error: 'Cette demande ne semble pas concerner un outfit complet'
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
        console.warn('⚠️ Erreur parsing analyse outfits:', error)
        return {
          success: false,
          canHandle: false,
          confidence: 0,
          error: 'Erreur d\'analyse de la demande d\'outfit'
        }
      }

      if (!analysis.isOutfitRequest || analysis.confidence < this.config.confidenceThreshold!) {
        return {
          success: false,
          canHandle: false,
          confidence: analysis.confidence || 0,
          error: 'Cette demande ne semble pas concerner un outfit complet'
        }
      }

      // Étape 2: Sélection des articles compatibles
      const compatibleItems = this.filterItems(analysis.criteria)
      
      if (compatibleItems.length < 3) { // Minimum top + bottom + shoes
        return {
          success: true,
          canHandle: true,
          confidence: 0.3,
          content: this.generateInsufficientItemsMessage(personality),
          metadata: {
            model: this.llm.modelName,
            chainType: 'outfits',
            itemsFound: compatibleItems.length,
            criteria: analysis.criteria
          }
        }
      }

      // Étape 3: Génération des outfits
      const creationResult = await this.executeChain(this.creationChain, {
        criteria: JSON.stringify(analysis.criteria),
        items: JSON.stringify(compatibleItems),
        personality: this.formatPersonality(personality)
      }, {
        confidence: analysis.confidence,
        itemsCount: compatibleItems.length,
        criteria: analysis.criteria
      })

      this.logMetrics(creationResult, { request, itemsFound: compatibleItems.length })

      return {
        ...creationResult,
        canHandle: true,
        confidence: creationResult.success ? analysis.confidence : 0
      }

    } catch (error: any) {
      console.error('❌ Erreur agent Outfits:', error)
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
    // Exclusions (articles individuels, questions générales)
    const exclusions = [
      'bonjour', 'salut', 'hello', 'aide', 'help',
      'livraison', 'retour', 'paiement', 'taille',
      'un t-shirt', 'une chemise', 'un jean', 'une robe',
      'des chaussures', 'un pull', 'une veste'
    ]

    if (exclusions.some(exclusion => request.includes(exclusion))) {
      return false
    }

    // Inclusions (demandes d'outfits complets)
    const inclusions = [
      'outfit', 'tenue', 'look', 'ensemble', 'style',
      'comment m\'habiller', 'que porter', 'coordonner',
      'travail', 'soirée', 'rendez-vous', 'mariage',
      'entretien', 'présentation', 'dîner', 'sortie',
      'week-end', 'quotidien', 'bureau', 'fête'
    ]

    return inclusions.some(inclusion => request.includes(inclusion))
  }

  /**
   * Filtre les articles selon les critères
   */
  private filterItems(criteria: OutfitCriteria): OutfitItem[] {
    return this.items.filter(item => {
      // Filtrage par occasion
      if (criteria.occasion && !item.occasion.includes(criteria.occasion)) {
        return false
      }

      // Filtrage par style
      if (criteria.style && item.style !== criteria.style) {
        return false
      }

      // Filtrage par budget (par article)
      if (criteria.budget) {
        const maxItemPrice = criteria.budget.max / 3 // Budget divisé par 3 articles minimum
        if (item.price > maxItemPrice) {
          return false
        }
      }

      // Filtrage par genre
      if (criteria.gender && criteria.gender !== 'unisex') {
        if (item.gender !== 'unisex' && item.gender !== criteria.gender) {
          return false
        }
      }

      // Filtrage par saison
      if (criteria.season && !item.season.includes(criteria.season)) {
        return false
      }

      return true
    })
  }

  /**
   * Message quand pas assez d'articles
   */
  private generateInsufficientItemsMessage(personality: any): string {
    const tone = personality?.tone || 'Amical'
    
    const messages = {
      'Professionnel': '😔 Je n\'ai pas suffisamment d\'articles correspondant à vos critères pour créer un outfit complet.',
      'Amical': '😊 Désolé, je n\'ai pas assez d\'articles qui correspondent à tes critères pour créer une tenue complète !',
      'Expert': '🔍 Les critères spécifiés ne permettent pas de composer un outfit complet avec notre sélection actuelle.',
      'Humoristique': '😅 Aïe ! Il me manque des pièces pour créer ton outfit de rêve !'
    }

    return messages[tone as keyof typeof messages] || messages['Amical']
  }

  /**
   * Formate la personnalité pour les prompts
   */
  private formatPersonality(personality: any): string {
    if (!personality) return 'Styliste créatif et expert en mode'
    
    const traits = []
    if (personality.tone) traits.push(`Ton: ${personality.tone}`)
    if (personality.formality) traits.push(`Formalité: ${personality.formality}`)
    if (personality.verbosity) traits.push(`Détail: ${personality.verbosity}`)
    
    return traits.join(', ') || 'Styliste créatif et expert en mode'
  }

  /**
   * Test de l'agent Outfits
   */
  async test(): Promise<LangchainResponse> {
    console.log('🧪 Test de l\'agent Outfits Langchain...')
    
    const testResult = await this.processQuery(
      'J\'ai besoin d\'une tenue pour un entretien d\'embauche',
      { tone: 'Professionnel', formality: 'Vouvoiement' }
    )

    console.log('📊 Résultat test Outfits:', {
      success: testResult.success,
      canHandle: testResult.canHandle,
      confidence: testResult.confidence,
      contentLength: testResult.content?.length
    })

    return testResult
  }
} 