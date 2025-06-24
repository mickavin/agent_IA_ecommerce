import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAIService } from '../../../lib/services/openai.service'
import { ChatbotConfigService } from '../../../lib/services/chatbot-config.service'

/**
 * IA spécialisée dans les réponses FAQ
 * Utilise OpenAI avec personnalisation depuis Supabase
 */

/**
 * Interface pour les éléments FAQ
 */
interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
  popularity: number
  score?: number
}

/**
 * Base de données FAQ simplifiée
 */
const faqDatabase: FAQItem[] = [
  {
    id: 'faq1',
    question: 'Quels sont vos délais de livraison ?',
    answer: 'Nos délais de livraison sont de 2-3 jours ouvrés en France métropolitaine.',
    category: 'livraison',
    tags: ['livraison', 'délais', 'France'],
    popularity: 95
  },
  {
    id: 'faq2', 
    question: 'Comment puis-je retourner un article ?',
    answer: 'Vous avez 30 jours pour retourner un article. Utilisez notre formulaire de retour en ligne.',
    category: 'retour',
    tags: ['retour', 'échange', 'remboursement'],
    popularity: 87
  }
]

/**
 * Analyse si le message correspond à une question FAQ
 */
function canHandleFAQ(message: string): { canHandle: boolean; confidence: number } {
  const lowerMessage = message.toLowerCase().trim()
  let confidence = 0

  // Gestion des salutations
  const greetingPatterns = [
    /^(bonjour|salut|hello|hey|bonsoir|coucou|bonne journée)$/i,
    /^(bonjour|salut|hello|hey|bonsoir|coucou)[\s\!\.]*$/i
  ]
  
  if (greetingPatterns.some(pattern => pattern.test(lowerMessage))) {
    return { canHandle: true, confidence: 0.9 }
  }

  // Questions d'aide générales
  const helpPatterns = [
    /^(aide|help|que peux-tu faire|qu'est-ce que tu fais|qui es-tu)$/i,
    /comment.*marche/i,
    /comment.*fonctionne/i,
    /peux.*aider/i
  ]
  
  if (helpPatterns.some(pattern => pattern.test(lowerMessage))) {
    return { canHandle: true, confidence: 0.8 }
  }

  // Questions FAQ spécifiques
  const faqKeywords = [
    'livraison', 'délais', 'retour', 'échange', 'remboursement',
    'paiement', 'carte', 'paypal', 'commande', 'commander',
    'taille', 'guide', 'politique', 'service client', 'contact',
    'garantie', 'problème', 'bug', 'erreur', 'support',
    'prix', 'frais', 'coût', 'promotion', 'reduction',
    'compte', 'inscription', 'connexion', 'mot de passe'
  ]

  const keywordMatches = faqKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
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
    pattern.test(lowerMessage)
  ).length

  // Calcul de la confiance
  confidence += keywordMatches * 0.4
  confidence += patternMatches * 0.3

  // Bonus pour les questions directes
  if (lowerMessage.includes('?')) {
    confidence += 0.3
  }

  // Bonus pour les mots interrogatifs
  const questionWords = ['comment', 'pourquoi', 'que', 'qui', 'quand', 'où', 'combien', 'quel']
  if (questionWords.some(word => lowerMessage.includes(word))) {
    confidence += 0.2
  }

  // Pénalité si c'est clairement une demande de produits
  const productKeywords = ['recommande', 'suggère', 'trouve', 'cherche.*vêtement', 'tenue pour', 'outfit', 'look']
  if (productKeywords.some(keyword => new RegExp(keyword, 'i').test(lowerMessage))) {
    confidence -= 0.4
  }

  confidence = Math.min(Math.max(confidence, 0), 1)

  return {
    canHandle: confidence > 0.3,
    confidence
  }
}

/**
 * Traitement des salutations
 */
function handleGreeting(): string {
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
 * Traitement de l'aide générale
 */
function handleGeneralHelp(): string {
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
 * Recherche des FAQ correspondantes
 */
function findMatchingFAQs(query: string): Array<{ faq: FAQItem; score: number }> {
  const matches: Array<{ faq: FAQItem; score: number }> = []
  const queryLower = query.toLowerCase()

  for (const faq of faqDatabase) {
    let score = 0

    // Score basé sur la correspondance avec la question
    const questionWords = faq.question.toLowerCase().split(/\s+/)
    const queryWords = queryLower.split(/\s+/)
    const commonWords = queryWords.filter(word => 
      questionWords.some(qw => qw.includes(word) || word.includes(qw))
    )
    score += (commonWords.length / Math.max(queryWords.length, questionWords.length)) * 0.6

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

  return matches.sort((a, b) => b.score - a.score).slice(0, 3)
}

/**
 * Formatage de la réponse FAQ
 */
function formatFAQResponse(bestMatch: { faq: FAQItem; score: number }, allMatches: Array<{ faq: FAQItem; score: number }>): string {
  let response = `💡 **${bestMatch.faq.question}**\n\n${bestMatch.faq.answer}`

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
function getNoMatchResponse(): string {
  return `🤔 Je n'ai pas trouvé de réponse exacte à votre question dans notre FAQ.

**Quelques suggestions :**
• Reformulez votre question avec d'autres mots
• Consultez nos sections : Livraison, Retours, Paiements, Commandes
• Contactez notre service client pour une aide personnalisée

💡 Vous pouvez aussi me demander des conseils sur nos produits !`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { message, context = {}, chatbotId, chatbotConfig = {} } = req.body

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message requis' })
    }

    const userMessage = message.trim()
    const analysis = canHandleFAQ(userMessage)

    if (!analysis.canHandle) {
      return res.status(200).json({
        success: false,
        canHandle: false,
        confidence: analysis.confidence,
        message: 'Cette IA ne peut pas traiter cette requête'
      })
    }

    // Récupération de la configuration depuis Supabase
    const configResult = await ChatbotConfigService.resolveConfig(chatbotId, chatbotConfig)
    
    if (!configResult.success || !configResult.config) {
      console.warn('⚠️ Utilisation config par défaut pour IA FAQ')
    }

    const { config, source } = configResult
    const personality = config?.personality || {
      tone: "Amical",
      formality: "Tutoiement",
      verbosity: "Détaillé",
      empathy: "Élevée", 
      proactivity: "Proactif"
    }

    // Log de la configuration utilisée
    ChatbotConfigService.logConfigSource(chatbotId, source || 'default', config?.name || 'Config par défaut')

    // Génération de la réponse via OpenAI avec personnalisation
    const openAIService = new OpenAIService()
    const systemPrompt = OpenAIService.createSystemPrompt('faq', personality)
    
    const startTime = Date.now()
    const content = await openAIService.generateResponse({
      systemPrompt,
      userMessage,
      context,
      maxTokens: 800,
      temperature: 0.7
    })
    const processingTime = Date.now() - startTime

    return res.status(200).json({
      success: true,
      response: {
        id: `faq-${Date.now()}`,
        content,
        type: 'bot',
        timestamp: new Date().toISOString(),
        metadata: {
          intent: 'faq_query',
          confidence: analysis.confidence,
          aiType: 'faq',
          processingTime,
          model: 'openai',
          routedTo: 'faq',
          personalityApplied: personality,
          configSource: source || 'default',
          chatbotName: config?.name || 'Assistant par défaut'
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur IA FAQ:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de la question FAQ',
      details: error.message
    })
  }
} 