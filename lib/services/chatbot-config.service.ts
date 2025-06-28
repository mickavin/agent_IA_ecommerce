import { supabase, isSupabaseConfigured } from '../supabase'
import type { ChatbotPersonality, ChatbotVisualConfig } from '../types'

/**
 * Service pour récupérer les configurations de chatbot depuis Supabase
 * Utilisé par les APIs d'IA pour appliquer les personnalisations
 */

export interface ChatbotConfig {
  id: string
  name: string
  personality: ChatbotPersonality
  visualConfig: ChatbotVisualConfig
  isDefault: boolean
  status: string
}

export interface ChatbotPersonalizationResult {
  success: boolean
  config?: ChatbotConfig
  error?: string
  source: 'supabase' | 'mock' | 'default'
}

export class ChatbotConfigService {
  
  /**
   * Configuration par défaut si aucun chatbot n'est trouvé
   */
  private static defaultConfig: ChatbotConfig = {
    id: 'default',
    name: 'Assistant Younzee',
    personality: {
      tone: "Amical",
      formality: "Tutoiement",
      verbosity: "Détaillé", 
      empathy: "Élevée",
      proactivity: "Proactif"
    },
    visualConfig: {
      primaryColor: "#3B82F6",
      secondaryColor: "#EFF6FF",
      textColor: "#1F2937",
      backgroundColor: "#FFFFFF",
      borderRadius: "Arrondi",
      position: "Bas droite",
      size: "Standard",
      welcomeMessage: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
      placeholder: "Tapez votre message..."
    },
    isDefault: true,
    status: 'Actif'
  }

  /**
   * Données de fallback si Supabase n'est pas disponible
   */
  private static mockConfigs: ChatbotConfig[] = [
    {
      id: 'default-younzee',
      name: 'Assistant Younzee Principal',
      personality: {
        tone: "Amical",
        formality: "Tutoiement",
        verbosity: "Détaillé",
        empathy: "Élevée", 
        proactivity: "Proactif"
      },
      visualConfig: {
        primaryColor: "#3B82F6",
        secondaryColor: "#EFF6FF",
        textColor: "#1F2937",
        backgroundColor: "#FFFFFF",
        borderRadius: "Arrondi",
        position: "Bas droite",
        size: "Standard",
        welcomeMessage: "👋 Bonjour ! Je suis votre assistant mode Younzee. Comment puis-je vous aider ?",
        placeholder: "Posez-moi une question..."
      },
      isDefault: true,
      status: 'Actif'
    },
    {
      id: 'professional-support',
      name: 'Support Professionnel',
      personality: {
        tone: "Professionnel",
        formality: "Vouvoiement", 
        verbosity: "Concis",
        empathy: "Moyenne",
        proactivity: "Réactif"
      },
      visualConfig: {
        primaryColor: "#1F2937",
        secondaryColor: "#F9FAFB",
        textColor: "#374151",
        backgroundColor: "#FFFFFF",
        borderRadius: "Carré",
        position: "Bas droite",
        size: "Standard",
        welcomeMessage: "Bonjour, comment puis-je vous assister aujourd'hui ?",
        placeholder: "Votre question..."
      },
      isDefault: false,
      status: 'Actif'
    },
    {
      id: 'friendly-casual',
      name: 'Assistant Décontracté',
      personality: {
        tone: "Humoristique",
        formality: "Tutoiement",
        verbosity: "Très détaillé",
        empathy: "Élevée",
        proactivity: "Très proactif"
      },
      visualConfig: {
        primaryColor: "#F59E0B",
        secondaryColor: "#FEF3C7",
        textColor: "#92400E",
        backgroundColor: "#FFFBEB",
        borderRadius: "Très arrondi",
        position: "Bas droite", 
        size: "Large",
        welcomeMessage: "Hey ! 🎉 Prêt(e) à découvrir des super looks ?",
        placeholder: "Dis-moi tout !"
      },
      isDefault: false,
      status: 'Actif'
    }
  ]

  /**
   * Récupère la configuration d'un chatbot par son ID depuis Supabase
   */
  static async getConfigById(chatbotId: string): Promise<ChatbotPersonalizationResult> {
    // Si pas d'ID fourni, utiliser la config par défaut
    console.log('chatbotId', chatbotId)
    if (!chatbotId || chatbotId === 'default') {
      return {
        success: true,
        config: this.defaultConfig,
        source: 'default'
      }
    }

    try {
      // Tentative de récupération depuis Supabase
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('chatbots')
          .select('id, name, personality, visual_config, is_default, status')
          .eq('id', chatbotId)
          .single()

        if (error) {
          console.warn(`⚠️ Chatbot ${chatbotId} non trouvé dans Supabase:`, error.message)
          return this.getFallbackConfig(chatbotId)
        }

        if (data) {
          const config: ChatbotConfig = {
            id: data.id,
            name: data.name,
            personality: data.personality,
            visualConfig: data.visual_config, 
            isDefault: data.is_default || false,
            status: data.status
          }

          return {
            success: true,
            config,
            source: 'supabase'
          }
        }
      }

      // Fallback si Supabase n'est pas configuré
      return this.getFallbackConfig(chatbotId)

    } catch (error: any) {
      console.error(`❌ Erreur récupération config chatbot ${chatbotId}:`, error)
      return this.getFallbackConfig(chatbotId)
    }
  }

  /**
   * Récupère la configuration par défaut ou mock en cas d'erreur
   */
  private static getFallbackConfig(chatbotId: string): ChatbotPersonalizationResult {
    // Chercher dans les configs mock
    const mockConfig = this.mockConfigs.find(config => config.id === chatbotId)
    
    if (mockConfig) {
      return {
        success: true,
        config: mockConfig,
        source: 'mock'
      }
    }

    // Utiliser la config par défaut
    return {
      success: true,
      config: this.defaultConfig,
      source: 'default'
    }
  }

  /**
   * Récupère le chatbot par défaut
   */
  static async getDefaultConfig(): Promise<ChatbotPersonalizationResult> {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('chatbots')
          .select('id, name, personality, visual_config, is_default, status')
          .eq('is_default', true)
          .eq('status', 'Actif')
          .single()

        if (!error && data) {
          const config: ChatbotConfig = {
            id: data.id,
            name: data.name,
            personality: data.personality || this.defaultConfig.personality,
            visualConfig: data.visual_config || this.defaultConfig.visualConfig,
            isDefault: true,
            status: data.status
          }

          return {
            success: true,
            config,
            source: 'supabase'
          }
        }
      }

      // Fallback vers le premier mock config marqué comme default
      const defaultMockConfig = this.mockConfigs.find(config => config.isDefault)
      
      return {
        success: true,
        config: defaultMockConfig || this.defaultConfig,
        source: 'mock'
      }

    } catch (error: any) {
      console.error('❌ Erreur récupération chatbot par défaut:', error)
      
      return {
        success: true,
        config: this.defaultConfig,
        source: 'default'
      }
    }
  }

  /**
   * Récupère la configuration à utiliser en priorisant chatbotId puis les paramètres fournis
   */
  static async resolveConfig(chatbotId?: string, providedConfig?: any): Promise<ChatbotPersonalizationResult> {
    // Si un chatbotId est fourni, l'utiliser en priorité
    if (chatbotId && chatbotId !== 'default') {
      console.log('chatbotId Supabase', chatbotId)
      const result = await this.getConfigById(chatbotId)
      if (result.success && result.config) {
        return result
      }
    }

    // Si une config est fournie manuellement, l'utiliser
    if (providedConfig?.personality || providedConfig?.visualConfig) {
      const config: ChatbotConfig = {
        id: chatbotId || 'custom',
        name: 'Configuration personnalisée',
        personality: {
          ...this.defaultConfig.personality,
          ...providedConfig.personality
        },
        visualConfig: {
          ...this.defaultConfig.visualConfig,
          ...providedConfig.visualConfig
        },
        isDefault: false,
        status: 'Actif'
      }

      return {
        success: true,
        config,
        source: 'default'
      }
    }

    // Utiliser le chatbot par défaut
    return this.getDefaultConfig()
  }

  /**
   * Valide qu'une configuration de personnalité est complète
   */
  static validatePersonality(personality: Partial<ChatbotPersonality>): ChatbotPersonality {
    return {
      tone: personality.tone || this.defaultConfig.personality.tone,
      formality: personality.formality || this.defaultConfig.personality.formality,
      verbosity: personality.verbosity || this.defaultConfig.personality.verbosity,
      empathy: personality.empathy || this.defaultConfig.personality.empathy,
      proactivity: personality.proactivity || this.defaultConfig.personality.proactivity
    }
  }

  /**
   * Logs la source de configuration utilisée
   */
  static logConfigSource(chatbotId: string | undefined, source: string, configName: string) {
    const logMessage = chatbotId 
      ? `🤖 Config chatbot "${configName}" (ID: ${chatbotId}) depuis ${source}`
      : `🤖 Config par défaut "${configName}" depuis ${source}`
    
    console.log(logMessage)
  }
} 