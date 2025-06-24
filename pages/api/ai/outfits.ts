import { NextApiRequest, NextApiResponse } from 'next'

/**
 * IA spécialisée dans les recommandations d'outfits complets
 */

type OutfitItem = {
  id: string
  name: string
  category: 'top' | 'bottom' | 'shoes' | 'accessory'
  price: number
  colors: string[]
  style: string
}

type Outfit = {
  id: string
  name: string
  description: string
  occasion: string
  style: string
  totalPrice: number
  items: OutfitItem[]
  compatibilityScore: number
}

// Base de données d'articles pour outfits
const outfitItemsDatabase: OutfitItem[] = [
  {
    id: 'top-1',
    name: 'Chemise blanche classique',
    category: 'top',
    price: 59.99,
    colors: ['blanc'],
    style: 'chic'
  },
  {
    id: 'top-2',
    name: 'T-shirt noir basique',
    category: 'top',
    price: 29.99,
    colors: ['noir'],
    style: 'casual'
  },
  {
    id: 'bottom-1',
    name: 'Pantalon de costume noir',
    category: 'bottom',
    price: 99.99,
    colors: ['noir'],
    style: 'chic'
  },
  {
    id: 'bottom-2',
    name: 'Jean délavé bleu',
    category: 'bottom',
    price: 79.99,
    colors: ['bleu'],
    style: 'casual'
  },
  {
    id: 'shoes-1',
    name: 'Escarpins noirs',
    category: 'shoes',
    price: 129.99,
    colors: ['noir'],
    style: 'chic'
  },
  {
    id: 'shoes-2',
    name: 'Sneakers blanches',
    category: 'shoes',
    price: 99.99,
    colors: ['blanc'],
    style: 'casual'
  }
]

function canHandleOutfits(message: string): { canHandle: boolean; confidence: number } {
  const lowerMessage = message.toLowerCase().trim()
  let confidence = 0

  // Refuser les salutations et questions générales
  const generalPatterns = [
    /^(bonjour|salut|hello|hey|bonsoir|coucou)$/i,
    /^(aide|help|au revoir|bye|merci)$/i
  ]
  
  if (generalPatterns.some(pattern => pattern.test(lowerMessage))) {
    return { canHandle: false, confidence: 0 }
  }

  // Mots-clés spécifiques aux outfits
  const outfitKeywords = [
    'outfit', 'tenue', 'look', 'style', 'ensemble', 'coordination',
    'assortir', 'porter ensemble', 'tenue complète', 'look complet',
    'comment m\'habiller', 'que porter'
  ]

  const outfitMatches = outfitKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length

  // Occasions spécifiques
  const occasions = [
    'travail', 'bureau', 'professionnel', 'entretien',
    'soirée', 'sortie', 'fête', 'dîner',
    'mariage', 'cocktail', 'événement',
    'weekend', 'vacances', 'casual'
  ]

  const occasionMatches = occasions.filter(occasion => 
    lowerMessage.includes(occasion)
  ).length

  // Patterns spécifiques aux outfits
  const outfitPatterns = [
    /tenue.*(pour|de)/i,
    /look.*(pour|de)/i,
    /outfit.*(pour|de)/i,
    /comment.*habiller/i,
    /que.*porter/i
  ]

  const patternMatches = outfitPatterns.filter(pattern => 
    pattern.test(lowerMessage)
  ).length

  // Calcul de la confiance
  confidence += outfitMatches * 0.4
  confidence += occasionMatches * 0.3
  confidence += patternMatches * 0.4

  confidence = Math.min(Math.max(confidence, 0), 1)

  return {
    canHandle: confidence > 0.4,
    confidence
  }
}

function analyzeOutfitRequest(message: string) {
  const lowerMessage = message.toLowerCase()
  
  return {
    occasion: extractOccasion(lowerMessage),
    style: extractStyle(lowerMessage)
  }
}

function extractOccasion(message: string): string {
  const occasions = {
    'travail': ['travail', 'bureau', 'professionnel', 'entretien'],
    'soirée': ['soirée', 'sortie', 'fête', 'dîner'],
    'casual': ['weekend', 'casual', 'décontracté', 'quotidien']
  }

  for (const [occasion, keywords] of Object.entries(occasions)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      return occasion
    }
  }
  return 'casual'
}

function extractStyle(message: string): string {
  const styles = {
    'chic': ['chic', 'élégant', 'sophistiqué', 'classe'],
    'casual': ['casual', 'décontracté', 'simple', 'confortable']
  }

  for (const [style, keywords] of Object.entries(styles)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      return style
    }
  }
  return 'casual'
}

function generateOutfits(analysis: any): Outfit[] {
  const { occasion, style } = analysis
  
  let availableItems = outfitItemsDatabase.filter(item => {
    if (style === 'chic' && item.style !== 'chic') return false
    return true
  })

  const outfits: Outfit[] = []
  
  if (occasion === 'travail') {
    outfits.push(createWorkOutfit(availableItems))
  } else if (occasion === 'soirée') {
    outfits.push(createEveningOutfit(availableItems))
  } else {
    outfits.push(createCasualOutfit(availableItems))
  }

  outfits.forEach(outfit => {
    outfit.totalPrice = outfit.items.reduce((sum, item) => sum + item.price, 0)
    outfit.compatibilityScore = 0.8
  })

  return outfits.slice(0, 2)
}

function createWorkOutfit(items: OutfitItem[]): Outfit {
  const top = items.find(item => item.category === 'top' && item.style === 'chic')
  const bottom = items.find(item => item.category === 'bottom' && item.style === 'chic')
  const shoes = items.find(item => item.category === 'shoes' && item.style === 'chic')

  const outfitItems = [top, bottom, shoes].filter(Boolean) as OutfitItem[]

  return {
    id: 'work-outfit-1',
    name: 'Look Professionnel',
    description: 'Tenue élégante pour le bureau',
    occasion: 'travail',
    style: 'chic',
    totalPrice: 0,
    items: outfitItems,
    compatibilityScore: 0
  }
}

function createEveningOutfit(items: OutfitItem[]): Outfit {
  const top = items.find(item => item.category === 'top' && item.style === 'chic')
  const bottom = items.find(item => item.category === 'bottom')
  const shoes = items.find(item => item.category === 'shoes' && item.style === 'chic')

  const outfitItems = [top, bottom, shoes].filter(Boolean) as OutfitItem[]

  return {
    id: 'evening-outfit-1',
    name: 'Look Soirée',
    description: 'Tenue élégante pour vos sorties',
    occasion: 'soirée',
    style: 'chic',
    totalPrice: 0,
    items: outfitItems,
    compatibilityScore: 0
  }
}

function createCasualOutfit(items: OutfitItem[]): Outfit {
  const top = items.find(item => item.category === 'top' && item.style === 'casual')
  const bottom = items.find(item => item.category === 'bottom' && item.style === 'casual')
  const shoes = items.find(item => item.category === 'shoes' && item.style === 'casual')

  const outfitItems = [top, bottom, shoes].filter(Boolean) as OutfitItem[]

  return {
    id: 'casual-outfit-1',
    name: 'Look Décontracté',
    description: 'Tenue confortable pour le quotidien',
    occasion: 'casual',
    style: 'casual',
    totalPrice: 0,
    items: outfitItems,
    compatibilityScore: 0
  }
}

function formatOutfitResponse(outfits: Outfit[], analysis: any): string {
  if (outfits.length === 0) {
    return `😔 Je n'ai pas pu créer d'outfits correspondant à vos critères.

💡 Essayez de préciser l'occasion ou le style souhaité !`
  }

  let response = `✨ **Mes suggestions d'outfits pour ${analysis.occasion}**\n\n`

  outfits.forEach((outfit, index) => {
    const emoji = ['🏆', '⭐'][index] || '👍'
    response += `${emoji} **${outfit.name}** - ${outfit.totalPrice.toFixed(2)}€\n`
    response += `   📝 ${outfit.description}\n\n`
    
    response += `   **Composition:**\n`
    outfit.items.forEach(item => {
      const categoryEmoji = {
        'top': '👕',
        'bottom': '👖',
        'shoes': '👠',
        'accessory': '👜'
      }[item.category] || '📦'
      
      response += `   ${categoryEmoji} ${item.name} - ${item.price}€\n`
    })
    
    response += `\n`
  })

  response += `💬 Besoin d'ajustements ou d'autres suggestions ?`

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
    const analysis = canHandleOutfits(userMessage)

    if (!analysis.canHandle) {
      return res.status(200).json({
        success: false,
        canHandle: false,
        confidence: analysis.confidence,
        message: 'Cette IA ne peut pas traiter cette requête'
      })
    }

    const requestAnalysis = analyzeOutfitRequest(userMessage)
    const outfits = generateOutfits(requestAnalysis)
    const content = formatOutfitResponse(outfits, requestAnalysis)

    return res.status(200).json({
      success: true,
      response: {
        id: `outfits-${Date.now()}`,
        content,
        type: 'bot',
        timestamp: new Date().toISOString(),
        metadata: {
          intent: 'outfit_recommendation',
          confidence: analysis.confidence,
          aiType: 'outfits',
          outfits,
          criteria: requestAnalysis
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur IA Outfits:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération de recommandations d\'outfits',
      details: error.message
    })
  }
}
