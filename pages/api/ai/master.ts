import { NextApiRequest, NextApiResponse } from 'next'

/**
 * IA Master - Orchestrateur intelligent avec personnalisation du chatbot
 * Route les messages vers les bonnes IAs spécialisées et applique la personnalisation
 */

type ChatbotPersonality = {
  tone: "Professionnel" | "Décontracté" | "Amical" | "Expert" | "Humoristique"
  formality: "Tutoiement" | "Vouvoiement"
  verbosity: "Concis" | "Détaillé" | "Très détaillé"
  empathy: "Faible" | "Moyenne" | "Élevée"
  proactivity: "Réactif" | "Proactif" | "Très proactif"
}

type ChatbotVisualConfig = {
  primaryColor: string
  secondaryColor: string
  textColor: string
  backgroundColor: string
  borderRadius: "Carré" | "Arrondi" | "Très arrondi"
  position: "Bas droite" | "Bas gauche" | "Flottant centre"
  size: "Compact" | "Standard" | "Large"
  avatar?: string
  welcomeMessage: string
  placeholder: string
}

type SpecializedAI = 'faq' | 'articles' | 'outfits'

type AIRoutingResult = {
  selectedAI: SpecializedAI | 'none'
  confidence: number
  reason: string
  needsPersonalization: boolean
}

/**
 * Configuration par défaut de personnalité
 */
const defaultPersonality: ChatbotPersonality = {
  tone: "Amical",
  formality: "Tutoiement",
  verbosity: "Détaillé",
  empathy: "Élevée",
  proactivity: "Proactif"
}

/**
 * Route la requête vers l'IA spécialisée appropriée
 */
async function routeToSpecializedAI(message: string, chatbotConfig?: any): Promise<AIRoutingResult> {
  const lowerMessage = message.toLowerCase().trim()
  let bestAI: SpecializedAI | 'none' = 'none'
  let maxConfidence = 0
  let reason = ''

  // Test de chaque IA spécialisée
  const aiTests = [
    {
      ai: 'faq' as SpecializedAI,
      test: async () => {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/faq`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, context: {} })
        })
        
        if (!response.ok) return { canHandle: false, confidence: 0 }
        
        const data = await response.json()
        return { 
          canHandle: data.success || false, 
          confidence: data.response?.metadata?.confidence || 0 
        }
      }
    },
    {
      ai: 'articles' as SpecializedAI,
      test: async () => {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/articles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, context: {} })
        })
        
        if (!response.ok) return { canHandle: false, confidence: 0 }
        
        const data = await response.json()
        return { 
          canHandle: data.success || false, 
          confidence: data.response?.metadata?.confidence || 0 
        }
      }
    },
    {
      ai: 'outfits' as SpecializedAI,
      test: async () => {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/outfits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, context: {} })
        })
        
        if (!response.ok) return { canHandle: false, confidence: 0 }
        
        const data = await response.json()
        return { 
          canHandle: data.success || false, 
          confidence: data.response?.metadata?.confidence || 0 
        }
      }
    }
  ]

  // Test de chaque IA pour trouver la meilleure
  for (const aiTest of aiTests) {
    try {
      const result = await aiTest.test()
      if (result.canHandle && result.confidence > maxConfidence) {
        maxConfidence = result.confidence
        bestAI = aiTest.ai
        reason = `IA ${aiTest.ai} sélectionnée avec confiance ${Math.round(result.confidence * 100)}%`
      }
    } catch (error) {
      console.error(`Erreur test IA ${aiTest.ai}:`, error)
    }
  }

  // Si aucune IA spécialisée ne peut traiter, on utilise FAQ par défaut
  if (bestAI === 'none') {
    bestAI = 'faq'
    maxConfidence = 0.3
    reason = 'Aucune IA spécialisée détectée, routage vers FAQ par défaut'
  }

  return {
    selectedAI: bestAI,
    confidence: maxConfidence,
    reason,
    needsPersonalization: true
  }
}

/**
 * Appelle l'IA spécialisée sélectionnée
 */
async function callSpecializedAI(ai: SpecializedAI, message: string, context: any = {}) {
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/${ai}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context })
  })

  if (!response.ok) {
    throw new Error(`Erreur IA ${ai}: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Applique la personnalisation du chatbot à la réponse
 */
function applyPersonalization(content: string, personality: ChatbotPersonality): string {
  let personalizedContent = content

  // Application du ton
  switch (personality.tone) {
    case "Professionnel":
      personalizedContent = makeMoreProfessional(personalizedContent)
      break
    case "Décontracté":
      personalizedContent = makeMoreCasual(personalizedContent)
      break
    case "Amical":
      personalizedContent = makeMoreFriendly(personalizedContent)
      break
    case "Expert":
      personalizedContent = makeMoreExpert(personalizedContent)
      break
    case "Humoristique":
      personalizedContent = makeMoreHumorous(personalizedContent)
      break
  }

  // Application de la formalité
  if (personality.formality === "Vouvoiement") {
    personalizedContent = convertToVouvoiement(personalizedContent)
  }

  // Application de la verbosité
  switch (personality.verbosity) {
    case "Concis":
      personalizedContent = makeConcise(personalizedContent)
      break
    case "Très détaillé":
      personalizedContent = makeVeryDetailed(personalizedContent)
      break
    // "Détaillé" reste tel quel
  }

  // Application de l'empathie
  switch (personality.empathy) {
    case "Élevée":
      personalizedContent = addHighEmpathy(personalizedContent)
      break
    case "Moyenne":
      personalizedContent = addMediumEmpathy(personalizedContent)
      break
    // "Faible" reste tel quel
  }

  // Application de la proactivité
  switch (personality.proactivity) {
    case "Proactif":
      personalizedContent = addProactivity(personalizedContent)
      break
    case "Très proactif":
      personalizedContent = addHighProactivity(personalizedContent)
      break
    // "Réactif" reste tel quel
  }

  return personalizedContent
}

/**
 * Fonctions de personnalisation du ton
 */
function makeMoreProfessional(content: string): string {
  return content
    .replace(/👋/g, '')
    .replace(/!/g, '.')
    .replace(/😊|😀|🎉|✨/g, '')
    .replace(/Super|Génial|Cool/gi, 'Excellent')
    .replace(/\n\n/g, '\n')
}

function makeMoreCasual(content: string): string {
  return content
    .replace(/\bvous\b/gi, 'toi')
    .replace(/\bvotre\b/gi, 'ton/ta')
    .replace(/\bvos\b/gi, 'tes')
    .replace(/Excellent/gi, 'Super')
    .replace(/parfait/gi, 'cool')
}

function makeMoreFriendly(content: string): string {
  if (!content.includes('😊') && !content.includes('😀')) {
    content = content.replace(/^([^!])/, '$1 😊')
  }
  
  return content
    .replace(/\bje peux\b/gi, 'je serais ravi de pouvoir')
    .replace(/\bn\'hésitez pas\b/gi, 'n\'hésite surtout pas')
}

function makeMoreExpert(content: string): string {
  return content
    .replace(/👍|😊|🎉/g, '')
    .replace(/Super|Génial/gi, 'Optimisé')
    .replace(/cool/gi, 'approprié')
    .replace(/!\s/g, '. ')
}

function makeMoreHumorous(content: string): string {
  const funnyEndings = [
    " 😄 Promis, je ne mords pas !",
    " 😉 Mode styliste activé !",
    " 🤗 Allez, faisons de toi une star de la mode !",
    " 😎 On va bien s'amuser !"
  ]
  
  if (Math.random() < 0.3) {
    content += funnyEndings[Math.floor(Math.random() * funnyEndings.length)]
  }
  
  return content
    .replace(/\berror\b/gi, 'petit souci')
    .replace(/problème/gi, 'petit défi')
}

/**
 * Application de la formalité
 */
function convertToVouvoiement(content: string): string {
  return content
    .replace(/\btu\b/gi, 'vous')
    .replace(/\bton\b/gi, 'votre')
    .replace(/\bta\b/gi, 'votre')
    .replace(/\btes\b/gi, 'vos')
    .replace(/\btoi\b/gi, 'vous')
}

/**
 * Application de la verbosité
 */
function makeConcise(content: string): string {
  return content
    .split('\n\n')
    .map(paragraph => {
      if (paragraph.includes('**') || paragraph.includes('•')) {
        return paragraph
      }
      return paragraph.split('.')[0] + '.'
    })
    .filter(p => p.length > 5)
    .join('\n\n')
}

function makeVeryDetailed(content: string): string {
  const additions = {
    'Nos délais de livraison': 'Nos délais de livraison (calculés depuis notre entrepôt parisien)',
    'Vous avez 30 jours': 'Vous disposez d\'une période généreuse de 30 jours calendaires',
    'Nous acceptons': 'Nous acceptons avec plaisir plusieurs moyens de paiement sécurisés',
    'Consultez notre guide': 'Consultez notre guide des tailles détaillé et interactif'
  }
  
  let detailed = content
  Object.entries(additions).forEach(([original, replacement]) => {
    detailed = detailed.replace(original, replacement)
  })
  
  return detailed
}

/**
 * Application de l'empathie
 */
function addHighEmpathy(content: string): string {
  const empathyPhrases = [
    "Je comprends que cela puisse être préoccupant",
    "Je réalise que c'est important pour vous",
    "Je sens que vous avez besoin d'une réponse claire"
  ]
  
  if (content.includes('problème') || content.includes('erreur') || content.includes('souci')) {
    const randomEmpathy = empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)]
    content = `${randomEmpathy}. ${content}`
  }
  
  return content
}

function addMediumEmpathy(content: string): string {
  return content.replace(/^/, "Je vais vous aider avec plaisir. ")
}

/**
 * Application de la proactivité
 */
function addProactivity(content: string): string {
  const proactiveSuggestions = [
    "\n\n💡 **Suggestions complémentaires :**\n• Consultez notre blog mode pour plus d'inspiration\n• Abonnez-vous à notre newsletter pour les nouveautés",
    "\n\n🎯 **Conseil personnalisé :** N'hésitez pas à créer un compte pour sauvegarder vos préférences !",
    "\n\n⭐ **Le saviez-vous ?** Nous proposons un service de personal shopping sur rendez-vous."
  ]
  
  if (Math.random() < 0.6) {
    const randomSuggestion = proactiveSuggestions[Math.floor(Math.random() * proactiveSuggestions.length)]
    content += randomSuggestion
  }
  
  return content
}

function addHighProactivity(content: string): string {
  content = addProactivity(content)
  
  const extraProactive = [
    "\n\n🚀 **Actions recommandées :**\n• Créez votre wishlist personnalisée\n• Activez les notifications pour vos marques préférées\n• Rejoignez notre programme de fidélité",
    "\n\n📱 **Téléchargez notre app** pour une expérience optimale et des offres exclusives !",
    "\n\n🎁 **Offre spéciale :** Code BIENVENUE10 pour 10% de réduction sur votre première commande !"
  ]
  
  const randomExtra = extraProactive[Math.floor(Math.random() * extraProactive.length)]
  content += randomExtra
  
  return content
}

/**
 * Génère une réponse de fallback personnalisée
 */
function generatePersonalizedFallback(personality: ChatbotPersonality): string {
  let fallback = ""
  
  switch (personality.tone) {
    case "Professionnel":
      fallback = "Je n'ai pas pu identifier précisément votre demande. Pourriez-vous la reformuler ?"
      break
    case "Amical":
      fallback = "😊 Je n'ai pas bien saisi votre demande. Peux-tu me donner plus de détails ?"
      break
    case "Humoristique":
      fallback = "🤔 Oups ! Mon cerveau mode a bugué. Peux-tu reformuler ta question ?"
      break
    default:
      fallback = "Je n'ai pas bien compris votre demande. Pouvez-vous préciser ?"
  }
  
  return applyPersonalization(fallback, personality)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { message, context = {}, chatbotConfig = {} } = req.body

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message requis' })
    }

    const userMessage = message.trim()
    
    // Configuration de personnalité (utilisée depuis chatbotConfig ou par défaut)
    const personality: ChatbotPersonality = {
      ...defaultPersonality,
      ...chatbotConfig.personality
    }

    console.log(`🤖 IA Master - Message reçu: "${userMessage}"`)
    console.log(`🎭 Personnalité appliquée:`, personality)

    // Routage vers l'IA spécialisée
    const routingResult = await routeToSpecializedAI(userMessage, chatbotConfig)
    console.log(`🎯 Routage:`, routingResult)

    let response
    let content = ''

    if (routingResult.selectedAI !== 'none') {
      try {
        // Appel de l'IA spécialisée
        response = await callSpecializedAI(routingResult.selectedAI, userMessage, context)
        
        if (response.success && response.response) {
          content = response.response.content
          
          // Application de la personnalisation
          if (routingResult.needsPersonalization) {
            content = applyPersonalization(content, personality)
            console.log(`✨ Personnalisation appliquée`)
          }
          
          return res.status(200).json({
            success: true,
            response: {
              id: `master-${Date.now()}`,
              content,
              type: 'bot',
              timestamp: new Date().toISOString(),
              metadata: {
                intent: response.response.metadata?.intent || 'general',
                confidence: routingResult.confidence,
                aiType: 'master',
                routedTo: routingResult.selectedAI,
                personalityApplied: personality,
                originalAIType: response.response.metadata?.aiType,
                originalResponse: response.response,
                processingTime: Date.now()
              }
            }
          })
        }
      } catch (error) {
        console.error(`❌ Erreur IA spécialisée ${routingResult.selectedAI}:`, error)
      }
    }

    // Fallback si aucune IA n'a pu traiter la demande
    content = generatePersonalizedFallback(personality)
    
    return res.status(200).json({
      success: true,
      response: {
        id: `master-fallback-${Date.now()}`,
        content,
        type: 'bot',
        timestamp: new Date().toISOString(),
        metadata: {
          intent: 'fallback',
          confidence: 0.1,
          aiType: 'master',
          routedTo: 'fallback',
          personalityApplied: personality,
          reason: 'Aucune IA spécialisée n\'a pu traiter la demande',
          processingTime: Date.now()
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur IA Master:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement par l\'IA Master',
      details: error.message
    })
  }
} 