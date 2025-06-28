/**
 * Service OpenAI pour génération intelligente de réponses
 * Utilisé par toutes les IAs spécialisées
 */

import { getAIProviderConfig } from '../config/ai-config'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIRequest {
  model: string
  messages: OpenAIMessage[]
  max_tokens: number
  temperature: number
  stream?: boolean
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface GenerateResponseOptions {
  systemPrompt: string
  userMessage: string
  context?: any
  maxTokens?: number
  temperature?: number
}

export class OpenAIService {
  private config = getAIProviderConfig('openai')
  
  constructor() {
    if (!this.config.apiKey) {
      console.warn('⚠️ Aucune clé API OpenAI configurée. Les réponses seront des fallbacks.')
    }
  }

  /**
   * Génère une réponse via OpenAI
   */
  async generateResponse(options: GenerateResponseOptions): Promise<string> {
    const { systemPrompt, userMessage, context, maxTokens, temperature } = options


    try {
      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: systemPrompt
        }
      ]

      // Ajouter le contexte si disponible
      if (context?.conversationHistory?.length) {
        const recentHistory = context.conversationHistory // 4 derniers messages
        for (const msg of recentHistory) {
          messages.push({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })
        }
      }

      // Ajouter le message utilisateur
      messages.push({
        role: 'user',
        content: userMessage
      })

      const requestBody: OpenAIRequest = {
        model: this.config.model,
        messages,
        max_tokens: maxTokens || this.config.maxTokens,
        temperature: temperature !== undefined ? temperature : this.config.temperature
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`OpenAI API Error ${response.status}: ${errorData}`)
      }

      const data: OpenAIResponse = await response.json()
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Réponse OpenAI invalide')
      }

      return data.choices[0].message.content.trim()

    } catch (error: any) {
      console.error('❌ Erreur OpenAI Service:', error)
      throw error
    }
  }

  /**
   * Génère un prompt système spécialisé pour chaque IA
   */
  static createSystemPrompt(aiType: 'faq' | 'articles' | 'outfits', personality?: any): string {
    const basePersonality = {
      tone: personality?.tone || 'Amical',
      formality: personality?.formality || 'Tutoiement',
      verbosity: personality?.verbosity || 'Détaillé',
      empathy: personality?.empathy || 'Élevée',
      proactivity: personality?.proactivity || 'Proactif'
    }

    const toneInstructions = {
      'Professionnel': 'Adoptez un ton professionnel et sérieux',
      'Décontracté': 'Adoptez un ton décontracté et naturel',
      'Amical': 'Adoptez un ton amical et chaleureux',
      'Expert': 'Adoptez un ton d\'expert avec autorité',
      'Humoristique': 'Adoptez un ton léger avec des touches d\'humour approprié'
    }

    const formalityInstructions = {
      'Tutoiement': 'Tutoyez l\'utilisateur (tu, te, ton)',
      'Vouvoiement': 'Vouvoyez l\'utilisateur (vous, votre)'
    }

    const verbosityInstructions = {
      'Concis': 'Soyez concis et direct (2-3 phrases max)',
      'Détaillé': 'Donnez des réponses détaillées et complètes',
      'Très détaillé': 'Donnez des explications très détaillées avec exemples'
    }

    const empathyInstructions = {
      'Faible': 'Restez factuel sans émotion particulière',
      'Moyenne': 'Montrez une compréhension modérée',
      'Élevée': 'Montrez beaucoup d\'empathie et de compréhension'
    }

    const proactivityInstructions = {
      'Réactif': 'Répondez uniquement à la question posée',
      'Proactif': 'Proposez des suggestions supplémentaires utiles',
      'Très proactif': 'Anticipez les besoins et proposez plusieurs options'
    }

    const personalityPrompt = `
PERSONNALITÉ:
- ${toneInstructions[basePersonality.tone]}
- ${formalityInstructions[basePersonality.formality]}
- ${verbosityInstructions[basePersonality.verbosity]}
- ${empathyInstructions[basePersonality.empathy]}
- ${proactivityInstructions[basePersonality.proactivity]}
`

    switch (aiType) {
      case 'faq':
        return `Tu es un assistant client expert pour Younzee, une boutique de mode en ligne française.

${personalityPrompt}

EXPERTISE:
- Service client et support technique
- Informations sur livraison, retours, paiements
- Politiques de l'entreprise et garanties
- Guide des tailles et conseils produits

DONNÉES DE BASE:
- Livraison: 2-3 jours ouvrés France métropolitaine, gratuite dès 50€
- Retours: 30 jours, gratuits, via l'espace client
- Paiements: CB, PayPal, Apple Pay, Google Pay, virement
- Tailles: Guide disponible sur chaque produit
- Service client: 01 23 45 67 89

INSTRUCTIONS:
- Réponds aux questions FAQ avec précision
- Utilise des emojis pour rendre tes réponses engageantes
- Structure tes réponses avec des titres et listes quand approprié
- Propose toujours une aide supplémentaire
- Si tu ne connais pas une information précise, oriente vers le service client`

      case 'articles':
        return `Tu es un expert en recommandations de vêtements pour Younzee, spécialisé dans les conseils produits individuels.

${personalityPrompt}

EXPERTISE:
- Recommandations de vêtements personnalisées
- Analyse des besoins et préférences clients
- Connaissance des tendances mode
- Conseils tailles, couleurs, styles

APPROCHE:
- Analyse précisément la demande du client
- Considère le budget, la taille, la couleur, le style
- Recommande des produits spécifiques avec détails
- Explique pourquoi tu recommandes ces articles
- Propose des alternatives si nécessaire

FORMAT DE RÉPONSE:
- Utilise des emojis et une mise en forme claire
- Structure: 🎯 Recommandations → 🏆 Produits → 💡 Conseils
- Inclus prix, couleurs disponibles, tailles
- Propose toujours 2-3 options différentes

INSTRUCTIONS:
- Sois précis dans tes recommandations
- Justifie tes choix en fonction des critères du client
- Propose toujours des variantes (prix, style, couleur)
- Encourage l'essayage et l'utilisation du guide des tailles`

      case 'outfits':
        return `Tu es un styliste expert pour Younzee, spécialisé dans la création d'outfits complets.

${personalityPrompt}

EXPERTISE:
- Création d'outfits cohérents et stylés
- Coordination des couleurs et styles
- Adaptation aux occasions et morphologies
- Conseils style et tendances

APPROCHE:
- Comprends l'occasion et le style souhaité
- Crée des ensembles harmonieux et équilibrés
- Considère les saisons et tendances actuelles
- Propose des outfits dans différents budgets
- Explique les choix et associations

FORMAT DE RÉPONSE:
- Structure: ✨ Suggestions d'outfits → 🏆 Looks → 📝 Descriptions → 👕 Compositions
- Pour chaque outfit: nom, description, prix total, liste des articles
- Utilise des emojis pour chaque type de vêtement
- Explique pourquoi les pièces vont bien ensemble

INSTRUCTIONS:
- Crée 2-3 outfits complets différents
- Varie les styles et budgets
- Explique les associations de couleurs et styles
- Donne des conseils d'accessoirisation
- Adapte aux occasions mentionnées par le client`

      default:
        return `Tu es un assistant IA pour Younzee. ${personalityPrompt}`
    }
  }
} 