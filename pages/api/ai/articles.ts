import { NextApiRequest, NextApiResponse } from 'next'

/**
 * IA spécialisée dans les recommandations d'articles individuels
 * Suggère des vêtements spécifiques basés sur les critères utilisateur
 */

type Product = {
  id: string
  name: string
  price: number
  category: string
  gender?: string
  colors?: string[]
  sizes?: string[]
  stock: number
  description?: string
  images?: string[]
}

// Exemple de base de données de produits
const productsDatabase: Product[] = [
  {
    id: '1',
    name: 'T-shirt basique coton bio',
    price: 29.99,
    category: 'Hauts',
    gender: 'Unisexe',
    colors: ['Blanc', 'Noir', 'Gris', 'Marine'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 45,
    description: 'T-shirt en coton bio, coupe classique, parfait pour le quotidien'
  },
  {
    id: '2',
    name: 'Jean slim stretch noir',
    price: 89.99,
    category: 'Bas',
    gender: 'Femme',
    colors: ['Noir'],
    sizes: ['36', '38', '40', '42', '44'],
    stock: 23,
    description: 'Jean slim stretch ultra confortable avec finition premium'
  },
  {
    id: '3',
    name: 'Robe midi fluide',
    price: 79.99,
    category: 'Robes',
    gender: 'Femme',
    colors: ['Rouge', 'Bleu', 'Vert'],
    sizes: ['S', 'M', 'L'],
    stock: 18,
    description: 'Robe midi élégante, parfaite pour toutes occasions'
  },
  {
    id: '4',
    name: 'Chemise oxford homme',
    price: 59.99,
    category: 'Hauts',
    gender: 'Homme',
    colors: ['Blanc', 'Bleu ciel'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 34,
    description: 'Chemise oxford classique, parfaite pour le bureau'
  },
  {
    id: '5',
    name: 'Sneakers urbaines',
    price: 129.99,
    category: 'Chaussures',
    gender: 'Unisexe',
    colors: ['Blanc', 'Noir', 'Gris'],
    sizes: ['39', '40', '41', '42', '43', '44'],
    stock: 67,
    description: 'Sneakers modernes et confortables pour tous les jours'
  }
]

/**
 * Analyse si le message demande des recommandations d'articles
 */
function canHandleArticles(message: string): { canHandle: boolean; confidence: number } {
  const lowerMessage = message.toLowerCase().trim()
  let confidence = 0

  // Refuser les salutations et questions générales
  const generalPatterns = [
    /^(bonjour|salut|hello|hey|bonsoir|coucou)$/i,
    /^(comment ça va|ça va|comment allez-vous)$/i,
    /^(qui es-tu|qu'est-ce que tu fais|que peux-tu faire)$/i,
    /^(aide|help|au revoir|bye|merci)$/i
  ]
  
  if (generalPatterns.some(pattern => pattern.test(lowerMessage))) {
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
  
  if (faqPatterns.some(pattern => pattern.test(lowerMessage))) {
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
    lowerMessage.includes(keyword)
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
    lowerMessage.includes(keyword)
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
    pattern.test(lowerMessage)
  ).length

  // Calcul de la confiance
  confidence += keywordMatches * 0.3
  confidence += patternMatches * 0.5

  // Bonus pour les demandes de produits spécifiques
  const specificProducts = ['tshirt', 'chemise', 'pantalon', 'jean', 'robe', 'veste', 'chaussures']
  if (specificProducts.some(product => lowerMessage.includes(product))) {
    confidence += 0.4
  }

  // Bonus pour mention de critères spécifiques
  const criteria = ['couleur', 'taille', 'prix', 'budget', 'style', 'marque']
  if (criteria.some(criterion => lowerMessage.includes(criterion))) {
    confidence += 0.2
  }

  // Pénalité si c'est clairement une demande d'outfit complet
  if (lowerMessage.includes('outfit') || lowerMessage.includes('tenue complète') || lowerMessage.includes('look complet')) {
    confidence -= 0.3
  }

  confidence = Math.min(Math.max(confidence, 0), 1)

  return {
    canHandle: confidence > 0.5,
    confidence
  }
}

/**
 * Analyse la requête pour extraire les critères
 */
function analyzeRequest(message: string) {
  const lowerMessage = message.toLowerCase()
  
  return {
    category: extractCategory(lowerMessage),
    style: extractStyle(lowerMessage),
    colors: extractColors(lowerMessage),
    budget: extractBudget(lowerMessage),
    gender: extractGender(lowerMessage),
    occasion: extractOccasion(lowerMessage)
  }
}

function extractCategory(message: string): string[] {
  const categories = {
    'Hauts': ['tshirt', 't-shirt', 'chemise', 'pull', 'sweat', 'polo', 'top'],
    'Bas': ['pantalon', 'jean', 'short', 'jupe', 'legging'],
    'Robes': ['robe'],
    'Vestes': ['veste', 'blouson', 'manteau', 'cardigan'],
    'Chaussures': ['chaussures', 'sneakers', 'baskets', 'bottes', 'sandales'],
    'Accessoires': ['sac', 'ceinture', 'chapeau', 'écharpe']
  }

  const foundCategories: string[] = []
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      foundCategories.push(category)
    }
  }

  return foundCategories.length > 0 ? foundCategories : ['Hauts']
}

function extractStyle(message: string): string {
  const styles = {
    'casual': ['casual', 'décontracté', 'relax', 'confortable'],
    'chic': ['chic', 'élégant', 'sophistiqué', 'classe'],
    'sportif': ['sport', 'sportif', 'fitness', 'gym'],
    'tendance': ['tendance', 'mode', 'fashion', 'branché', 'moderne']
  }

  for (const [style, keywords] of Object.entries(styles)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      return style
    }
  }
  return 'casual'
}

function extractColors(message: string): string[] {
  const colors = ['noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'violet', 'gris', 'marron']
  return colors.filter(color => message.includes(color))
}

function extractBudget(message: string): { min: number; max: number } | null {
  const budgetMatch = message.match(/(\d+)\s*€|budget.*(\d+)|moins.*(\d+)|max.*(\d+)/i)
  if (budgetMatch) {
    const amount = parseInt(budgetMatch[1] || budgetMatch[2] || budgetMatch[3] || budgetMatch[4])
    return { min: 0, max: amount }
  }

  if (message.includes('pas cher') || message.includes('économique')) {
    return { min: 0, max: 50 }
  }
  if (message.includes('milieu de gamme') || message.includes('moyen')) {
    return { min: 50, max: 150 }
  }

  return null
}

function extractGender(message: string): string | null {
  if (message.includes('homme') || message.includes('masculin')) return 'Homme'
  if (message.includes('femme') || message.includes('féminin')) return 'Femme'
  return null
}

function extractOccasion(message: string): string | null {
  const occasions = {
    'travail': ['travail', 'bureau', 'professionnel'],
    'soirée': ['soirée', 'sortie', 'fête'],
    'casual': ['quotidien', 'tous les jours'],
    'sport': ['sport', 'gym', 'fitness']
  }

  for (const [occasion, keywords] of Object.entries(occasions)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      return occasion
    }
  }
  return null
}

/**
 * Filtre et recommande des produits
 */
function generateRecommendations(analysis: any): Product[] {
  let products = [...productsDatabase]

  // Filtrage par catégorie
  if (analysis.category.length > 0) {
    products = products.filter(product => 
      analysis.category.includes(product.category)
    )
  }

  // Filtrage par genre
  if (analysis.gender) {
    products = products.filter(product => 
      !product.gender || product.gender === analysis.gender || product.gender === 'Unisexe'
    )
  }

  // Filtrage par budget
  if (analysis.budget) {
    products = products.filter(product => 
      product.price <= analysis.budget.max
    )
  }

  // Filtrage par couleurs
  if (analysis.colors.length > 0) {
    products = products.filter(product => 
      product.colors?.some(color => 
        analysis.colors.some((reqColor: string) => 
          color.toLowerCase().includes(reqColor)
        )
      )
    )
  }

  // Filtrage par stock
  products = products.filter(product => product.stock > 0)

  // Tri par pertinence (stock élevé, prix attractif)
  products.sort((a, b) => {
    const scoreA = a.stock + (200 - a.price)
    const scoreB = b.stock + (200 - b.price)
    return scoreB - scoreA
  })

  return products.slice(0, 5)
}

/**
 * Formate la réponse avec les recommandations
 */
function formatRecommendationResponse(recommendations: Product[], analysis: any): string {
  if (recommendations.length === 0) {
    return `😔 Je n'ai pas trouvé de produits correspondant exactement à vos critères.

**Pour de meilleurs résultats, essayez :**
• D'élargir vos critères de couleur ou de prix
• De choisir une catégorie différente
• De préciser votre style ou l'occasion

💡 Je peux aussi vous suggérer des alternatives ou vous aider à créer un outfit complet !`
  }

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
    
    if (product.stock < 10) {
      response += `   ⚠️ Stock limité: ${product.stock} restant(s)\n`
    } else {
      response += `   ✅ En stock\n`
    }
    
    response += `   💡 ${product.description}\n\n`
  })

  response += `🛍️ Ces recommandations sont basées sur vos critères et les tendances actuelles !\n`
  response += `💬 Besoin de plus d'informations sur un produit ou d'autres suggestions ?`

  return response
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { message, context = {} } = req.body

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message requis' })
    }

    const userMessage = message.trim()
    const analysis = canHandleArticles(userMessage)

    if (!analysis.canHandle) {
      return res.status(200).json({
        success: false,
        canHandle: false,
        confidence: analysis.confidence,
        message: 'Cette IA ne peut pas traiter cette requête'
      })
    }

    // Analyse de la demande
    const requestAnalysis = analyzeRequest(userMessage)
    
    // Génération des recommandations
    const recommendations = generateRecommendations(requestAnalysis)
    
    // Formatage de la réponse
    const content = formatRecommendationResponse(recommendations, requestAnalysis)

    return res.status(200).json({
      success: true,
      response: {
        id: `articles-${Date.now()}`,
        content,
        type: 'bot',
        timestamp: new Date().toISOString(),
        metadata: {
          intent: 'article_recommendation',
          confidence: analysis.confidence,
          aiType: 'articles',
          recommendations,
          criteria: requestAnalysis,
          processingTime: Date.now()
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur IA Articles:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération de recommandations d\'articles',
      details: error.message
    })
  }
} 