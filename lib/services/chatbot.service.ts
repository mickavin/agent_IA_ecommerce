import { supabase, isSupabaseConfigured } from '../supabase'
import type { 
  Chatbot, 
  ChatbotDB, 
  ChatbotStatus, 
  ChatbotCreateInput, 
  ChatbotUpdateInput,
  ChatbotResponse 
} from '../types'

/**
 * Service pour gérer les chatbots avec fallback sur des données mock
 * si Supabase n'est pas configuré ou disponible
 */
export class ChatbotService {
  // Données mock pour développement/fallback (format DB)
  private static mockChatbotsDB: ChatbotDB[] = [
    {
      id: "1",
      name: "Assistant Younzee IA",
      description: "Assistant intelligent pour l'e-commerce mode avec IA Master",
      status: "Actif" as ChatbotStatus,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-20T14:30:00Z",
      is_default: true,
      personality: {
        tone: "Amical",
        formality: "Tutoiement",
        verbosity: "Détaillé",
        empathy: "Élevée",
        proactivity: "Proactif"
      },
      visual_config: {
        primaryColor: "#3B82F6",
        secondaryColor: "#EFF6FF",
        textColor: "#1F2937",
        backgroundColor: "#FFFFFF",
        borderRadius: "Arrondi",
        position: "Bas droite",
        size: "Standard",
        welcomeMessage: "👋 Salut ! Je suis votre assistant mode personnel ! Comment puis-je vous aider à trouver le produit parfait aujourd'hui ?",
        placeholder: "Décrivez ce que vous cherchez..."
      },
      data_sources: [
        { id: "1", type: "faq", name: "FAQ Générale", isEnabled: true, priority: 1 },
        { id: "2", type: "products", name: "Catalogue Produits", isEnabled: true, priority: 2 },
        { id: "3", type: "orders", name: "Commandes", isEnabled: true, priority: 3 },
        { id: "4", type: "policies", name: "Politiques", isEnabled: true, priority: 4 }
      ],
      conversations_count: 1247,
      avg_response_time: 850,
      satisfaction_rate: 94.2
    },
    {
      id: "2", 
      name: "Support Client IA",
      description: "Assistant spécialisé dans le support client et SAV",
      status: "Actif" as ChatbotStatus,
      created_at: "2024-01-10T09:00:00Z",
      updated_at: "2024-01-18T16:45:00Z",
      is_default: false,
      personality: {
        tone: "Professionnel",
        formality: "Vouvoiement", 
        verbosity: "Très détaillé",
        empathy: "Élevée",
        proactivity: "Réactif"
      },
      visual_config: {
        primaryColor: "#059669",
        secondaryColor: "#ECFDF5",
        textColor: "#1F2937",
        backgroundColor: "#FFFFFF",
        borderRadius: "Arrondi",
        position: "Bas droite",
        size: "Standard",
        welcomeMessage: "Bonjour ! Je suis votre assistant support. Comment puis-je vous aider avec votre commande ?",
        placeholder: "Décrivez votre problème..."
      },
      data_sources: [
        { id: "1", type: "faq", name: "FAQ Support", isEnabled: true, priority: 1 },
        { id: "2", type: "orders", name: "Commandes", isEnabled: true, priority: 2 },
        { id: "3", type: "policies", name: "Politiques SAV", isEnabled: true, priority: 3 }
      ],
      conversations_count: 892,
      avg_response_time: 1200,
      satisfaction_rate: 91.8
    },
    {
      id: "3",
      name: "Conseiller Mode IA",
      description: "Expert en style et conseils vestimentaires personnalisés",
      status: "En test" as ChatbotStatus,
      created_at: "2024-01-12T11:30:00Z",
      updated_at: "2024-01-19T13:20:00Z",
      is_default: false,
      personality: {
        tone: "Expert",
        formality: "Tutoiement",
        verbosity: "Détaillé",
        empathy: "Moyenne",
        proactivity: "Très proactif"
      },
      visual_config: {
        primaryColor: "#8B5CF6",
        secondaryColor: "#F3E8FF",
        textColor: "#1F2937", 
        backgroundColor: "#FFFFFF",
        borderRadius: "Très arrondi",
        position: "Bas droite",
        size: "Large",
        welcomeMessage: "✨ Salut ! Ton styliste personnel est là ! Prêt(e) pour un nouveau look ?",
        placeholder: "Dis-moi ton style préféré..."
      },
      data_sources: [
        { id: "1", type: "products", name: "Catalogue Mode", isEnabled: true, priority: 1 },
        { id: "2", type: "blog", name: "Articles Tendances", isEnabled: true, priority: 2 },
        { id: "3", type: "faq", name: "FAQ Style", isEnabled: true, priority: 3 }
      ],
      conversations_count: 456,
      avg_response_time: 950,
      satisfaction_rate: 96.5
    }
  ]

  /**
   * Convertit un ChatbotDB en Chatbot (pour l'interface utilisateur)
   */
  private static dbToUi(chatbotDB: ChatbotDB): Chatbot {
    return {
      id: chatbotDB.id,
      name: chatbotDB.name,
      description: chatbotDB.description,
      status: chatbotDB.status,
      isDefault: chatbotDB.is_default,
      personality: chatbotDB.personality,
      visualConfig: chatbotDB.visual_config,
      dataSources: chatbotDB.data_sources,
      conversationsCount: chatbotDB.conversations_count,
      avgResponseTime: chatbotDB.avg_response_time,
      satisfactionRate: chatbotDB.satisfaction_rate,
      createdAt: chatbotDB.created_at,
      updatedAt: chatbotDB.updated_at
    }
  }

  /**
   * Convertit un Chatbot en ChatbotDB (pour la base de données)
   */
  private static uiToDb(chatbot: Chatbot): ChatbotDB {
    return {
      id: chatbot.id,
      name: chatbot.name,
      description: chatbot.description,
      status: chatbot.status,
      is_default: chatbot.isDefault,
      personality: chatbot.personality,
      visual_config: chatbot.visualConfig,
      data_sources: chatbot.dataSources,
      conversations_count: chatbot.conversationsCount,
      avg_response_time: chatbot.avgResponseTime,
      satisfaction_rate: chatbot.satisfactionRate,
      created_at: chatbot.createdAt,
      updated_at: chatbot.updatedAt
    }
  }

  /**
   * Convertit un ChatbotCreateInput en format pour Supabase
   */
  private static inputToDb(input: ChatbotCreateInput): Omit<ChatbotDB, 'id' | 'created_at' | 'updated_at'> {
    return {
      name: input.name,
      description: input.description,
      status: input.status,
      is_default: input.is_default,
      personality: input.personality,
      visual_config: input.visual_config,
      data_sources: input.data_sources,
      conversations_count: input.conversations_count,
      avg_response_time: input.avg_response_time,
      satisfaction_rate: input.satisfaction_rate
    }
  }

  /**
   * Récupère tous les chatbots avec pagination
   */
  static async getAll(page: number = 1, limit: number = 10): Promise<{
    data: Chatbot[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      if (!isSupabaseConfigured() || !supabase) {
        console.warn('📱 Supabase non configuré - utilisation des données mock')
        return this.getMockData(page, limit)
      }

      const offset = (page - 1) * limit
      
      // Tentative de récupération depuis Supabase
      const { data, error, count } = await supabase
        .from('chatbots')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('⚠️ Erreur Supabase:', error.message, '- Fallback vers données mock')
        return this.getMockData(page, limit)
      }

             return {
         data: (data || []).map(this.dbToUi),
         total: count || 0,
         page,
         totalPages: Math.ceil((count || 0) / limit)
       }

     } catch (error) {
       console.warn('⚠️ Erreur réseau Supabase - Fallback vers données mock:', error)
       return this.getMockData(page, limit)
     }
  }

  /**
   * Récupère un chatbot par son ID
   */
  static async getById(id: string): Promise<Chatbot | null> {
    try {
      if (!isSupabaseConfigured() || !supabase) {
        console.warn('📱 Supabase non configuré - utilisation des données mock')
        const mockBot = this.mockChatbotsDB.find((bot: ChatbotDB) => bot.id === id)
        return mockBot ? this.dbToUi(mockBot) : null
      }

      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('⚠️ Erreur Supabase:', error.message, '- Fallback vers données mock')
        const mockBot = this.mockChatbotsDB.find((bot: ChatbotDB) => bot.id === id)
        return mockBot ? this.dbToUi(mockBot) : null
      }

      return data ? this.dbToUi(data) : null

    } catch (error) {
      console.warn('⚠️ Erreur réseau Supabase - Fallback vers données mock:', error)
      const mockBot = this.mockChatbotsDB.find((bot: ChatbotDB) => bot.id === id)
      return mockBot ? this.dbToUi(mockBot) : null
    }
  }

  /**
   * Crée un nouveau chatbot
   */
  static async create(input: ChatbotCreateInput): Promise<Chatbot> {
    try {
      if (!isSupabaseConfigured() || !supabase) {
        console.warn('📱 Supabase non configuré - simulation de création')
        const newBotDB: ChatbotDB = {
          ...input,
          id: `mock-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        this.mockChatbotsDB.unshift(newBotDB)
        return this.dbToUi(newBotDB)
      }

      const dbData = this.inputToDb(input)
      const { data, error } = await supabase
        .from('chatbots')
        .insert([{
          ...dbData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Erreur création chatbot: ${error.message}`)
      }

      return this.dbToUi(data)

    } catch (error) {
      console.error('❌ Erreur création chatbot:', error)
      throw error
    }
  }

  /**
   * Met à jour un chatbot
   */
  static async update(id: string, updates: ChatbotUpdateInput): Promise<Chatbot> {
    try {
      console.log('updates', updates)
      if (!isSupabaseConfigured() || !supabase) {
        console.warn('📱 Supabase non configuré - simulation de mise à jour')
        const index = this.mockChatbotsDB.findIndex((bot: ChatbotDB) => bot.id === id)
        if (index !== -1) {
          this.mockChatbotsDB[index] = {
            ...this.mockChatbotsDB[index],
            ...updates,
            updated_at: new Date().toISOString()
          }
          return this.dbToUi(this.mockChatbotsDB[index])
        }
        throw new Error('Chatbot non trouvé')
      }

      const { data, error } = await supabase
        .from('chatbots')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Erreur mise à jour chatbot: ${error.message}`)
      }

      return this.dbToUi(data)

    } catch (error) {
      console.error('❌ Erreur mise à jour chatbot:', error)
      throw error
    }
  }

  /**
   * Supprime un chatbot
   */
  static async delete(id: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured() || !supabase) {
        console.warn('📱 Supabase non configuré - simulation de suppression')
        const index = this.mockChatbotsDB.findIndex((bot: ChatbotDB) => bot.id === id)
        if (index !== -1) {
          this.mockChatbotsDB.splice(index, 1)
          return true
        }
        return false
      }

      const { error } = await supabase
        .from('chatbots')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Erreur suppression chatbot: ${error.message}`)
      }

      return true

    } catch (error) {
      console.error('❌ Erreur suppression chatbot:', error)
      throw error
    }
  }

  /**
   * Retourne les données mock avec pagination
   */
  private static getMockData(page: number, limit: number) {
    const offset = (page - 1) * limit
    const paginatedData = this.mockChatbotsDB.slice(offset, offset + limit)
    
    return {
      data: paginatedData.map(this.dbToUi),
      total: this.mockChatbotsDB.length,
      page,
      totalPages: Math.ceil(this.mockChatbotsDB.length / limit)
    }
  }

  /**
   * Vérifie l'état de la connexion Supabase
   */
  static async healthCheck(): Promise<{
    supabaseConfigured: boolean
    supabaseConnected: boolean
    usingMockData: boolean
    message: string
  }> {
    const configured = isSupabaseConfigured()
    
    if (!configured) {
      return {
        supabaseConfigured: false,
        supabaseConnected: false,
        usingMockData: true,
        message: 'Variables d\'environnement Supabase manquantes'
      }
    }

    try {
      if (!supabase) {
        throw new Error('Client Supabase non initialisé')
      }

      // Test simple de connexion
      const { data, error } = await supabase
        .from('chatbots')
        .select('id')
        .limit(1)

      if (error) {
        return {
          supabaseConfigured: true,
          supabaseConnected: false,
          usingMockData: true,
          message: `Erreur Supabase: ${error.message}`
        }
      }

      return {
        supabaseConfigured: true,
        supabaseConnected: true,
        usingMockData: false,
        message: 'Supabase opérationnel'
      }

    } catch (error) {
      return {
        supabaseConfigured: true,
        supabaseConnected: false,
        usingMockData: true,
        message: `Erreur connexion: ${error}`
      }
    }
  }
} 