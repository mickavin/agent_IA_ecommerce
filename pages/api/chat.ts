import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import { ProductService } from '@/lib/services/api.service'

// Configuration OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

interface ChatRequest {
  message: string
  context?: {
    userId?: string
    sessionId?: string
    userPreferences?: UserPreferences
    conversationHistory?: ConversationMessage[]
  }
  chatbotConfig?: {
    personality?: ChatbotPersonality
  }
}

interface UserPreferences {
  budget?: { min: number; max: number }
  categories?: string[]
  sizes?: string[]
  colors?: string[]
  gender?: string
  style?: string
  userId?: string
}

interface ChatbotPersonality {
  tone: string
  formality: string
  verbosity: string
  empathy: string
  proactivity: string
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

interface ChatResponse {
  success: boolean
  response: {
    id: string
    content: string
    type: 'bot'
    timestamp: string
    metadata: {
      intent: string
      confidence: number
      responseTime: number
      products?: any[]
      recommendations?: any[]
      totalTokens?: number
      model?: string
    }
  }
  error?: string
}

// Agent IA intelligent pour Younzee
class YounzeeAIAgent {
  
  private static getSystemPrompt(personality: ChatbotPersonality, availableProducts: any[]): string {
    const toneMap: Record<string, string> = {
      'Professionnel': 'Vous êtes un assistant professionnel et courtois.',
      'Décontracté': 'Vous êtes détendu et accessible, sans être familier.',
      'Amical': 'Vous êtes chaleureux et bienveillant.',
      'Expert': 'Vous êtes un expert en mode avec des connaissances approfondies.',
      'Humoristique': 'Vous avez un ton léger avec une pointe d\'humour subtil.'
    }

    const formalityStyle = personality.formality === 'Tutoiement' ? 'tutoiement' : 'vouvoiement'
    const verbosityLevel = personality.verbosity === 'Concis' ? 'concises' : 
                          personality.verbosity === 'Détaillé' ? 'détaillées' : 'très détaillées'

    return `Tu es Younzee Assistant, un conseiller mode IA expert pour la boutique en ligne Younzee.

## 🎯 MISSION
Tu aides les clients à trouver les produits parfaits, donnes des conseils de style personnalisés et améliores leur expérience shopping.

## 👤 PERSONNALITÉ
- ${toneMap[personality.tone] || toneMap['Amical']}
- Utilise le ${formalityStyle} dans tes réponses
- Fournis des réponses ${verbosityLevel}
- Niveau d'empathie : ${personality.empathy}
- Style : ${personality.proactivity}

## 🛍️ CATALOGUE ACTUEL
Tu as accès à ${availableProducts.length} produits incluant :
${availableProducts.slice(0, 10).map(p => `- ${p.name}: ${p.price}€ (${p.category})`).join('\n')}
${availableProducts.length > 10 ? `... et ${availableProducts.length - 10} autres produits` : ''}

## 🧠 CAPACITÉS PRINCIPALES
1. **Recherche de produits** : Trouve des articles selon critères spécifiques
2. **Recommandations personnalisées** : Suggère des produits selon les goûts/budget
3. **Conseils de style** : Aide à créer des looks et assortir les pièces
4. **Guide des tailles** : Conseille sur le sizing
5. **Informations stock/prix** : Renseigne sur disponibilité et tarifs
6. **Tendances mode** : Partage les dernières tendances

## 📋 INSTRUCTIONS COMPORTEMENTALES
- **Toujours** proposer des produits concrets du catalogue quand c'est pertinent
- **Personnaliser** selon les préférences/budget mentionnés
- **Poser des questions** pour mieux cerner les besoins
- **Être proactif** : suggérer des compléments, alternatives, idées look
- **Rester focus mode** : éviter les sujets non liés à la mode/shopping
- **Utiliser des emojis** avec parcimonie pour rendre les réponses vivantes

## 💡 EXEMPLES DE RÉPONSES EXCELLENTES
- "Pour ton budget de 80€, je recommande le Sweatshirt Coton Bio (49€) + le Jean Slim (39€) = 88€. Un look décontracté parfait ! 🔥"
- "Cette robe est disponible en S et M. Vu tes mensurations, je recommande la taille M pour un tombage parfait."
- "Tendance actuelle : les tons terreux ! Nos pièces en camel et marron se vendent très bien."

## ⚠️ LIMITATIONS
- Tu ne peux que recommander les produits du catalogue Younzee
- Si un produit n'existe pas, propose des alternatives similaires
- Pour les commandes/SAV, redirige vers le service client

Réponds maintenant avec cette personnalité et ces instructions !`
  }

  static async processUserMessage(
    userMessage: string,
    personality: ChatbotPersonality,
    userPreferences: UserPreferences = {},
    conversationHistory: ConversationMessage[] = []
  ): Promise<{ content: string; metadata: any }> {
    
    const startTime = Date.now()
    
    try {
      // 1. Récupérer les produits disponibles
      let products: any[] = []
      try {
        const productsResult = await ProductService.getAll(1, 50) // Top 50 produits
        products = productsResult.data.filter(p => p.status === 'Actif' && p.stock > 0)
      } catch (error) {
        console.error('Erreur récupération produits:', error)
        products = []
      }

      // 2. Analyser l'intention de l'utilisateur
      const intent = await this.analyzeIntent(userMessage)

      // 3. Enrichir le contexte avec des données produits si nécessaire
      let relevantProducts: any[] = []
      if (intent.needsProductData) {
        relevantProducts = await this.findRelevantProducts(userMessage, products, userPreferences)
      }

      // 4. Construire l'historique de conversation
      const messages: ConversationMessage[] = [
        {
          role: 'system',
          content: this.getSystemPrompt(personality, products)
        },
        ...conversationHistory.slice(-8), // Garder les 8 derniers messages pour le contexte
        {
          role: 'user',
          content: userMessage
        }
      ]

      // 5. Ajouter le contexte produits si pertinent
      if (relevantProducts.length > 0) {
        const productContext = `\n\n## 🛍️ PRODUITS PERTINENTS POUR CETTE DEMANDE:\n${
          relevantProducts.map(p => 
            `- **${p.name}** (${p.category}) - ${p.price}€\n` +
            `  Couleurs: ${p.colors?.join(', ') || 'N/A'}\n` +
            `  Tailles: ${p.sizes?.join(', ') || 'N/A'}\n` +
            `  Stock: ${p.stock} unités\n`
          ).join('\n')
        }`
        
        messages[messages.length - 1].content += productContext
      }

      // 6. Appel à OpenAI avec streaming
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Modèle performant et économique
        messages: messages as any,
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        user: userPreferences.userId || 'anonymous',
        stream: true
      })

      let fullResponse = ''
      let totalTokens = 0

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        fullResponse += content
        if (chunk.usage?.total_tokens) {
          totalTokens = chunk.usage.total_tokens
        }
      }

      const response = fullResponse || 
        "Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ?"

      // 7. Retourner la réponse avec métadonnées
      return {
        content: response,
        metadata: {
          intent: intent.category,
          confidence: intent.confidence,
          responseTime: Date.now() - startTime,
          products: relevantProducts,
          totalTokens,
          model: "gpt-4o-mini",
          recommendations: relevantProducts.slice(0, 3)
        }
      }

    } catch (error: any) {
      console.error('Erreur OpenAI:', error)
      
      // Fallback en cas d'erreur
      return {
        content: "😅 Je rencontre un petit problème technique. Pouvez-vous réessayer dans quelques instants ?",
        metadata: {
          intent: 'error',
          confidence: 0,
          responseTime: Date.now() - startTime,
          error: error.message
        }
      }
    }
  }

  private static async analyzeIntent(message: string) {
    const normalized = message.toLowerCase()
    
    // Analyse d'intention basique
    const intentPatterns = {
      search: { 
        keywords: ['cherche', 'veux', 'besoin', 'trouve', 'recherche', 'montre', 'voir'],
        needsProductData: true,
        confidence: 0.8
      },
      recommendation: { 
        keywords: ['conseil', 'recommande', 'suggère', 'propose', 'aide-moi', 'que choisir'],
        needsProductData: true,
        confidence: 0.9
      },
      style_advice: { 
        keywords: ['style', 'look', 'outfit', 'tenue', 'assortir', 'porter avec'],
        needsProductData: true,
        confidence: 0.7
      },
      size_guide: { 
        keywords: ['taille', 'pointure', 'grandeur', 'guide', 'sizing'],
        needsProductData: false,
        confidence: 0.9
      },
      price_info: { 
        keywords: ['prix', 'coût', 'coûte', 'cher', 'budget', 'tarif', 'combien'],
        needsProductData: true,
        confidence: 0.8
      },
      availability: { 
        keywords: ['disponible', 'stock', 'rupture', 'livraison', 'dispo'],
        needsProductData: true,
        confidence: 0.8
      },
      greeting: { 
        keywords: ['bonjour', 'salut', 'hello', 'coucou', 'hey'],
        needsProductData: false,
        confidence: 0.9
      }
    }

    let bestMatch = { category: 'general', confidence: 0.3, needsProductData: false }

    for (const [category, pattern] of Object.entries(intentPatterns)) {
      const matchCount = pattern.keywords.filter(keyword => normalized.includes(keyword)).length
      if (matchCount > 0) {
        const confidence = Math.min(matchCount * 0.3 + pattern.confidence * 0.7, 1)
        if (confidence > bestMatch.confidence) {
          bestMatch = { category, confidence, needsProductData: pattern.needsProductData }
        }
      }
    }

    return bestMatch
  }

  private static async findRelevantProducts(
    message: string, 
    allProducts: any[], 
    userPreferences: UserPreferences
  ): Promise<any[]> {
    
    const normalized = message.toLowerCase()
    let relevantProducts = [...allProducts]

    // Filtrage par mots-clés dans le message
    const categoryKeywords = {
      'tshirt': ['tshirt', 't-shirt', 'tee-shirt'],
      'sweatshirt': ['sweat', 'sweatshirt', 'hoodie', 'pull'],
      'robe': ['robe', 'dress'],
      'pantalon': ['pantalon', 'jean', 'trouser'],
      'chaussures': ['chaussure', 'basket', 'sneaker', 'shoe']
    }

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => normalized.includes(keyword))) {
        relevantProducts = relevantProducts.filter(p => 
          p.category?.toLowerCase().includes(category) ||
          p.name?.toLowerCase().includes(category)
        )
        break
      }
    }

    // Filtrage par couleurs mentionnées
    const colorKeywords = ['noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'violet', 'gris', 'marron']
    const mentionedColors = colorKeywords.filter(color => normalized.includes(color))
    if (mentionedColors.length > 0) {
      relevantProducts = relevantProducts.filter(p => 
        p.colors?.some((color: string) => 
          mentionedColors.some(mentioned => color.toLowerCase().includes(mentioned))
        )
      )
    }

    // Filtrage par tailles mentionnées
    const sizeKeywords = ['xs', 's', 'm', 'l', 'xl', 'xxl']
    const mentionedSizes = sizeKeywords.filter(size => normalized.includes(size))
    if (mentionedSizes.length > 0) {
      relevantProducts = relevantProducts.filter(p => 
        p.sizes?.some((size: string) => 
          mentionedSizes.some(mentioned => size.toLowerCase() === mentioned)
        )
      )
    }

    // Filtrage par budget
    const budgetMatch = normalized.match(/(\d+)\s*€|budget.*?(\d+)|(\d+).*?euro/i)
    if (budgetMatch) {
      const budget = parseInt(budgetMatch[1] || budgetMatch[2] || budgetMatch[3])
      relevantProducts = relevantProducts.filter(p => p.price <= budget * 1.2) // 20% de marge
    }

    // Appliquer les préférences utilisateur
    if (userPreferences.categories?.length) {
      relevantProducts = relevantProducts.filter(p => 
        userPreferences.categories!.includes(p.category)
      )
    }

    if (userPreferences.colors?.length) {
      relevantProducts = relevantProducts.filter(p => 
        p.colors?.some((color: string) => userPreferences.colors!.includes(color))
      )
    }

    if (userPreferences.budget) {
      relevantProducts = relevantProducts.filter(p => 
        p.price >= userPreferences.budget!.min && p.price <= userPreferences.budget!.max
      )
    }

    // Trier par pertinence et popularité
    relevantProducts.sort((a, b) => {
      // Favoriser les produits en stock
      if (a.stock > 0 && b.stock === 0) return -1
      if (a.stock === 0 && b.stock > 0) return 1
      
      // Puis par prix croissant
      return a.price - b.price
    })

    return relevantProducts.slice(0, 10) // Limiter à 10 produits les plus pertinents
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ChatResponse>) {
  // Vérification de la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      response: null as any,
      error: 'Méthode non autorisée. Utilisez POST.'
    })
  }

  // Vérification de la clé API OpenAI
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      response: null as any,
      error: 'Configuration OpenAI manquante'
    })
  }

  try {
    const { message, context = {}, chatbotConfig = {} }: ChatRequest = req.body

    // Validation des données d'entrée
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        response: null as any,
        error: 'Message requis et non vide'
      })
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        response: null as any,
        error: 'Message trop long (max 2000 caractères)'
      })
    }

    // Configuration par défaut de la personnalité
    const defaultPersonality: ChatbotPersonality = {
      tone: "Amical",
      formality: "Tutoiement",
      verbosity: "Détaillé",
      empathy: "Élevée",
      proactivity: "Proactif"
    }

    const personality = { ...defaultPersonality, ...chatbotConfig.personality }
    const userPreferences = { ...context.userPreferences, userId: context.userId }
    const conversationHistory = context.conversationHistory || []

    // Traitement par l'agent IA
    const result = await YounzeeAIAgent.processUserMessage(
      message.trim(),
      personality,
      userPreferences,
      conversationHistory
    )

    // Construction de la réponse
    const response: ChatResponse = {
      success: true,
      response: {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: result.content,
        type: 'bot',
        timestamp: new Date().toISOString(),
        metadata: result.metadata
      }
    }

    // Headers pour la performance
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Content-Type', 'application/json')

    res.status(200).json(response)

  } catch (error: any) {
    console.error('Erreur API Chat:', error)
    
    // Gestion détaillée des erreurs
    let errorMessage = 'Erreur interne du serveur'
    let statusCode = 500

    if (error.code === 'insufficient_quota') {
      errorMessage = 'Quota OpenAI dépassé'
      statusCode = 429
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'Clé API OpenAI invalide'
      statusCode = 401
    } else if (error.code === 'rate_limit_exceeded') {
      errorMessage = 'Limite de débit dépassée'
      statusCode = 429
    }

    res.status(statusCode).json({
      success: false,
      response: null as any,
      error: errorMessage
    })
  }
}
