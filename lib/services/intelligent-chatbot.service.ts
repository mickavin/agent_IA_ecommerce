import { ProductService, AnalyticsService } from './api.service'
import type { Product } from '../types'

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

export class IntelligentChatbotService {
  private static intents = {
    SEARCH_PRODUCT: 'search_product',
    RECOMMENDATION: 'recommendation',
    PRICE_INQUIRY: 'price_inquiry',
    SIZE_GUIDE: 'size_guide',
    AVAILABILITY: 'availability',
    STYLE_ADVICE: 'style_advice',
    GREETING: 'greeting',
    GOODBYE: 'goodbye',
    COMPLAINT: 'complaint',
    ORDER_STATUS: 'order_status'
  }

  // Analyse l'intention du message utilisateur
  static analyzeIntent(message: string): { intent: string; confidence: number; entities: any } {
    const normalizedMessage = message.toLowerCase().trim()
    
    // Mots-clés pour chaque intention
    const intentKeywords = {
      [this.intents.SEARCH_PRODUCT]: [
        'cherche', 'recherche', 'trouve', 'veux', 'besoin', 'produit', 'article',
        'tshirt', 'sweat', 'robe', 'pantalon', 'veste', 'chaussure'
      ],
      [this.intents.RECOMMENDATION]: [
        'conseil', 'recommande', 'suggère', 'propose', 'aide-moi', 'que porter',
        'style', 'tendance', 'mode', 'assortir', 'combiner'
      ],
      [this.intents.PRICE_INQUIRY]: [
        'prix', 'coût', 'coûte', 'cher', 'budget', 'tarif', 'combien'
      ],
      [this.intents.SIZE_GUIDE]: [
        'taille', 'pointure', 'grandeur', 'mesure', 'guide', 'sizing'
      ],
      [this.intents.AVAILABILITY]: [
        'disponible', 'stock', 'rupture', 'livraison', 'délai'
      ],
      [this.intents.STYLE_ADVICE]: [
        'style', 'look', 'outfit', 'tenue', 'mode', 'tendance', 'fashion'
      ],
      [this.intents.GREETING]: [
        'bonjour', 'salut', 'hello', 'coucou', 'bonsoir', 'bonne'
      ],
      [this.intents.GOODBYE]: [
        'au revoir', 'bye', 'tchao', 'merci', 'bonne journée', 'à bientôt'
      ],
      [this.intents.COMPLAINT]: [
        'problème', 'défaut', 'plainte', 'insatisfait', 'déçu', 'erreur'
      ],
      [this.intents.ORDER_STATUS]: [
        'commande', 'livraison', 'suivi', 'status', 'expédition'
      ]
    }

    let bestIntent = this.intents.GREETING
    let bestScore = 0

    // Calcul du score pour chaque intention
    Object.entries(intentKeywords).forEach(([intent, keywords]) => {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (normalizedMessage.includes(keyword) ? 1 : 0)
      }, 0)
      
      if (score > bestScore) {
        bestScore = score
        bestIntent = intent
      }
    })

    // Extraction d'entités (couleurs, tailles, catégories)
    const entities = this.extractEntities(normalizedMessage)

    return {
      intent: bestIntent,
      confidence: Math.min(bestScore / 3, 1), // Normalisation du score
      entities
    }
  }

  // Extraction d'entités depuis le message
  static extractEntities(message: string) {
    const entities: any = {}

    // Couleurs communes
    const colors = ['noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'violet', 'gris', 'marron']
    colors.forEach(color => {
      if (message.includes(color)) {
        entities.color = color
      }
    })

    // Tailles
    const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'petite', 'moyenne', 'grande']
    sizes.forEach(size => {
      if (message.includes(size)) {
        entities.size = size.toUpperCase()
      }
    })

    // Genres
    if (message.includes('homme') || message.includes('masculin')) {
      entities.gender = 'Homme'
    } else if (message.includes('femme') || message.includes('féminin')) {
      entities.gender = 'Femme'
    }

    // Budget
    const priceMatch = message.match(/(\d+)\s*€|(\d+)\s*euros?/i)
    if (priceMatch) {
      entities.budget = parseInt(priceMatch[1] || priceMatch[2])
    }

    return entities
  }

  // Génère une réponse basée sur l'intention et les données
  static async generateResponse(
    userMessage: string, 
    context: ChatContext
  ): Promise<ChatbotMessage> {
    const analysis = this.analyzeIntent(userMessage)
    const { intent, entities, confidence } = analysis

    let response = ''
    let products: Product[] = []
    let recommendations: Product[] = []

    try {
      switch (intent) {
        case this.intents.SEARCH_PRODUCT:
          const searchResult = await this.handleProductSearch(entities, context.preferences)
          response = searchResult.response
          products = searchResult.products
          break

        case this.intents.RECOMMENDATION:
          const recommendationResult = await this.handleRecommendation(entities, context.preferences)
          response = recommendationResult.response
          recommendations = recommendationResult.recommendations
          break

        case this.intents.PRICE_INQUIRY:
          response = await this.handlePriceInquiry(entities, context.preferences)
          break

        case this.intents.SIZE_GUIDE:
          response = this.handleSizeGuide(entities)
          break

        case this.intents.AVAILABILITY:
          response = await this.handleAvailability(entities)
          break

        case this.intents.STYLE_ADVICE:
          const styleResult = await this.handleStyleAdvice(entities, context.preferences)
          response = styleResult.response
          recommendations = styleResult.recommendations
          break

        case this.intents.GREETING:
          response = this.handleGreeting(context)
          break

        case this.intents.GOODBYE:
          response = this.handleGoodbye()
          break

        default:
          response = "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler votre question ? 🤔"
          break
      }
    } catch (error) {
      console.error('Erreur lors de la génération de réponse:', error)
      response = "Désolé, j'ai rencontré un problème technique. Pouvez-vous réessayer ? 😅"
    }

    return {
      id: `bot-${Date.now()}`,
      content: response,
      type: 'bot',
      timestamp: new Date().toISOString(),
      metadata: {
        intent,
        entities,
        confidence,
        products,
        recommendations
      }
    }
  }

  // Gestion de la recherche de produits
  static async handleProductSearch(entities: any, preferences: UserPreferences) {
    const filters: Record<string, string[]> = {}

    // Application des filtres basés sur les entités et préférences
    if (entities.color) {
      filters.colors = [entities.color]
    }
    if (entities.size) {
      filters.sizes = [entities.size]
    }
    if (entities.gender || preferences.gender) {
      filters.gender = [entities.gender || preferences.gender]
    }
    if (preferences.categories && preferences.categories.length > 0) {
      filters.category = preferences.categories
    }

    const result = await ProductService.getAll(1, 8, undefined, filters)
    const products = result.data

    let response = ''
    if (products.length > 0) {
      response = `J'ai trouvé ${products.length} produit${products.length > 1 ? 's' : ''} qui pourrai${products.length > 1 ? 'ent' : 't'} vous intéresser ! 😊\n\n`
      
      products.slice(0, 3).forEach((product: any) => {
        response += `🔹 **${product.name}** - ${product.price}€\n`
        if (product.category) response += `   Catégorie: ${product.category}\n`
        if (product.colors && product.colors.length > 0) {
          response += `   Couleurs: ${product.colors.join(', ')}\n`
        }
        if (product.sizes && product.sizes.length > 0) {
          response += `   Tailles: ${product.sizes.join(', ')}\n`
        }
        response += '\n'
      })

      if (products.length > 3) {
        response += `Et ${products.length - 3} autres produits disponibles ! 🛍️`
      }
    } else {
      response = "Désolé, je n'ai pas trouvé de produits correspondant à vos critères. 😔\n\nPuis-je vous aider à élargir votre recherche ?"
    }

    return { response, products }
  }

  // Gestion des recommandations
  static async handleRecommendation(entities: any, preferences: UserPreferences) {
    // Logique de recommandation intelligente
    const filters: Record<string, string[]> = {}
    
    // Utiliser les préférences utilisateur
    if (preferences.categories && preferences.categories.length > 0) {
      filters.category = preferences.categories
    }
    if (preferences.gender) {
      filters.gender = [preferences.gender]
    }

    const result = await ProductService.getAll(1, 5, undefined, filters)
    let recommendations = result.data

    // Si pas assez de résultats, récupérer des produits populaires
    if (recommendations.length < 3) {
      const popularResult = await ProductService.getAll(1, 5)
      recommendations = popularResult.data
    }

    let response = "Voici mes recommandations personnalisées pour vous ! ✨\n\n"
    
    if (recommendations.length > 0) {
      recommendations.slice(0, 3).forEach((product: any, index: number) => {
        const emoji = ['🏆', '⭐', '💎'][index] || '🔥'
        response += `${emoji} **${product.name}** - ${product.price}€\n`
        response += `   ${this.getRecommendationReason(product, preferences)}\n\n`
      })

      response += "Ces produits sont sélectionnés spécialement pour vous ! 💖"
    } else {
      response = "Je n'ai pas encore assez d'informations pour des recommandations personnalisées. Parlez-moi de vos goûts ! 😊"
    }

    return { response, recommendations }
  }

  // Génère une raison pour la recommandation
  static getRecommendationReason(product: any, preferences: UserPreferences): string {
    const reasons = []
    
    if (preferences.budget && product.price <= preferences.budget.max) {
      reasons.push("dans votre budget")
    }
    if (preferences.colors && product.colors?.some((c: string) => preferences.colors?.includes(c))) {
      reasons.push("dans vos couleurs préférées")
    }
    if (product.stock > 50) {
      reasons.push("très populaire")
    } else if (product.stock < 10 && product.stock > 0) {
      reasons.push("dernières pièces disponibles")
    }
    
    return reasons.length > 0 
      ? `Recommandé car ${reasons.join(' et ')}`
      : "Coup de cœur de nos stylistes"
  }

  // Gestion des demandes de prix
  static async handlePriceInquiry(entities: any, preferences: UserPreferences) {
    if (entities.budget) {
      const result = await ProductService.getAll(1, 5, undefined, {})
      const affordableProducts = result.data.filter((p: any) => p.price <= entities.budget)
      
      return `Avec un budget de ${entities.budget}€, vous avez ${affordableProducts.length} options ! 💰\n\nVoulez-vous que je vous montre les meilleures affaires ?`
    }

    // Statistiques de prix par catégorie
    const stats = await AnalyticsService.getTotalStats()
    return `Nos prix varient selon les catégories :\n\n🏷️ T-shirts : à partir de 29€\n🏷️ Sweatshirts : à partir de 49€\n🏷️ Robes : à partir de 79€\n\nQuel est votre budget ? Je peux vous orienter ! 💡`
  }

  // Guide des tailles
  static handleSizeGuide(entities: any) {
    return `📏 **Guide des tailles** :\n\n` +
           `👕 **Hauts** :\n` +
           `• XS : 32-34 | S : 36-38 | M : 40-42 | L : 44-46 | XL : 48-50\n\n` +
           `👖 **Bas** :\n` +
           `• XS : 34-36 | S : 38-40 | M : 42-44 | L : 46-48 | XL : 50-52\n\n` +
           `💡 En cas de doute, prenez une taille au-dessus ! Besoin d'aide pour un produit spécifique ?`
  }

  // Vérification de disponibilité
  static async handleAvailability(entities: any) {
    const result = await ProductService.getAll(1, 20)
    const products = result.data
    
    const inStock = products.filter((p: any) => p.stock > 0).length
    const outOfStock = products.filter((p: any) => p.stock === 0).length
    const lowStock = products.filter((p: any) => p.stock > 0 && p.stock < 10).length

    return `📦 **État des stocks** :\n\n` +
           `✅ ${inStock} produits en stock\n` +
           `⚠️ ${lowStock} produits en stock limité\n` +
           `❌ ${outOfStock} produits en rupture\n\n` +
           `Quel produit vous intéresse ? Je vérifie la disponibilité ! 🔍`
  }

  // Conseils de style
  static async handleStyleAdvice(entities: any, preferences: UserPreferences) {
    const styleAdvice = [
      "Pour un look décontracté : t-shirt + jean + sneakers 👕👖👟",
      "Pour le bureau : chemise + pantalon + chaussures classiques 👔👔👞",
      "Pour une soirée : robe élégante + talons + accessoires ✨👗👠",
      "Style streetwear : sweat oversize + jogger + baskets tendance 🔥👟🧢"
    ]

    // Recommandations basées sur le style
    const filters: Record<string, string[]> = {}
    if (entities.gender || preferences.gender) {
      filters.gender = [entities.gender || preferences.gender]
    }

    const result = await ProductService.getAll(1, 3, undefined, filters)
    const recommendations = result.data

    let response = `💡 **Conseils style** :\n\n${styleAdvice[Math.floor(Math.random() * styleAdvice.length)]}\n\n`
    
    if (recommendations.length > 0) {
      response += "**Produits tendance** :\n"
      recommendations.forEach((product: any) => {
        response += `• ${product.name} - ${product.price}€\n`
      })
    }

    return { response, recommendations }
  }

  // Messages d'accueil
  static handleGreeting(context: ChatContext) {
    const greetings = [
      "Bonjour ! Je suis votre assistant mode personnel ! 👋 Comment puis-je vous aider aujourd'hui ?",
      "Salut ! Prêt(e) à découvrir votre nouveau look ? ✨ Que recherchez-vous ?",
      "Hello ! Votre styliste virtuel est là ! 😊 Dites-moi ce qui vous ferait plaisir !",
      "Coucou ! Envie de faire du shopping ? 🛍️ Je suis là pour vous conseiller !"
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // Messages d'au revoir
  static handleGoodbye() {
    const goodbyes = [
      "Au revoir ! J'espère vous avoir aidé ! 👋 Revenez quand vous voulez !",
      "À bientôt ! N'hésitez pas à revenir pour de nouveaux conseils ! ✨",
      "Bonne journée ! J'ai été ravi(e) de vous conseiller ! 😊",
      "Merci de votre visite ! À très vite pour de nouveaux looks ! 🛍️"
    ]
    return goodbyes[Math.floor(Math.random() * goodbyes.length)]
  }

  // Mise à jour des préférences utilisateur
  static updateUserPreferences(
    currentPreferences: UserPreferences, 
    entities: any
  ): UserPreferences {
    const newPreferences = { ...currentPreferences }

    if (entities.gender) {
      newPreferences.gender = entities.gender
    }
    if (entities.color) {
      newPreferences.colors = [...(newPreferences.colors || []), entities.color]
    }
    if (entities.size) {
      newPreferences.sizes = [...(newPreferences.sizes || []), entities.size]
    }
    if (entities.budget) {
      newPreferences.budget = {
        min: newPreferences.budget?.min || 0,
        max: entities.budget
      }
    }

    return newPreferences
  }

  // Analyse du sentiment
  static analyzeSentiment(message: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['super', 'génial', 'parfait', 'excellent', 'merci', 'love', 'adore']
    const negativeWords = ['nul', 'horrible', 'déçu', 'problème', 'erreur', 'défaut']

    const lowerMessage = message.toLowerCase()
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length

    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }
} 