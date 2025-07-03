export type ProductStatus = "Actif" | "Active" | "En attente" | "Archivé" | "Rupture de stock"

export type Product = {
  id?: string
  taille?: string
  couleur?: string
  handle?: string
  variant_title?: string
  availableForSale?: boolean
  product_title?: string
  name?: string
  thumbnailUrl?: string
  stock?: number
  price?: number
  category?: string
  gender?: "Homme" | "Femme" | "Unisexe"
  sizes?: string[]
  colors?: string[]
  status?: ProductStatus
  description?: string
  images?: string[] // For multiple product images
  url?: string
}

export type OrderStatus = "Payée" | "En préparation" | "Expédiée" | "Livrée" | "Annulée"

export type Order = {
  id: string
  customerName: string
  customerEmail: string
  date: string
  status: OrderStatus
  totalAmount: number
  itemsCount: number
  shippingAddress?: string
  billingAddress?: string
  notes?: string
}

export type StockLocation = "Entrepôt Principal" | "Boutique Paris" | "Stock Tampon"

export type StockItem = {
  id: string
  productId: string
  productName: string
  thumbnailUrl: string
  location: StockLocation
  quantity: number
  reorderThreshold: number
  lastMovementDate: string
}

export type StockMovementType = "Entrée" | "Sortie" | "Ajustement"
export type StockMovement = {
  id: string
  stockItemId: string
  productName: string
  type: StockMovementType
  quantityChanged: number
  reason: string
  date: string
  user: string
}

export type IATicketStatus = "Ouvert" | "En cours" | "En attente" | "Résolu" | "Fermé"
export type IATicketPriority = "Basse" | "Moyenne" | "Haute" | "Critique"
export type IATicketCategory = "Performance" | "Erreur Réponse" | "Bug Technique" | "Intégration" | "Configuration" | "Amélioration" | "Maintenance"

export type IATicket = {
  id: string
  chatbotId?: string
  title: string
  category: IATicketCategory
  status: IATicketStatus
  priority: IATicketPriority
  lastUpdate: string
  creationDate: string
  assignedTo?: string
  description: string
  stepsToReproduce?: string
  expectedBehavior?: string
  actualBehavior?: string
  environment?: string
  attachments?: string[] // URLs to screenshots, logs, etc.
  resolution?: string
  technicalNotes?: string[]
  impactedUsers?: number
  errorCode?: string
}

// Garder l'ancien type pour compatibilité avec les données existantes
export type SupportTicketStatus = "Ouvert" | "En cours" | "En attente client" | "Résolu" | "Fermé"
export type SupportTicketPriority = "Basse" | "Moyenne" | "Haute" | "Urgente"

export type SupportTicket = {
  id: string
  orderId?: string
  customerName: string
  customerEmail: string
  subject: string
  status: SupportTicketStatus
  priority: SupportTicketPriority
  lastUpdate: string
  creationDate: string
  assignedTo?: string
  description?: string
  attachments?: string[] // URLs to attachments
  resolution?: string
}

export type DeliveryStatus =
  | "En attente"
  | "En transit"
  | "Arrivée (à vérifier)"
  | "Vérifiée & Stockée"
  | "Expédiée"
  | "Livrée"
  | "Problème"

export type SupplierDelivery = {
  id: string
  supplierName: string
  purchaseOrderId: string
  expectedDate: string
  status: DeliveryStatus
  itemCount: number
  trackingNumber?: string
  notes?: string
  items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }>
}

export type CustomerDelivery = {
  id: string
  orderId: string
  customerName: string
  shippingDate: string
  carrier: string
  trackingNumber: string
  status: DeliveryStatus // "Expédiée", "En transit", "Livrée", "Problème"
  estimatedDeliveryDate: string
  items: Array<{ productId: string; productName: string; quantity: number }>
  deliveryNotes?: string
}

export type SalesByCategory = {
  category: string
  sales: number
}

export type TopSellingProduct = {
  name: string
  unitsSold: number
}

export type OrderStatusDistribution = {
  status: OrderStatus
  count: number
}

export type StockEvolution = {
  date: string // e.g., "YYYY-MM-DD"
  totalStockValue: number // Could be quantity or monetary value
}

export type SupportTicketByType = {
  type: string // e.g., "Article défectueux", "Retard de livraison"
  count: number
}

// Types pour le système de chatbots
export type ChatbotStatus = "Actif" | "Inactif" | "En test" | "Maintenance"

export type ChatbotPersonality = {
  tone: "Professionnel" | "Décontracté" | "Amical" | "Expert" | "Humoristique"
  formality: "Tutoiement" | "Vouvoiement"
  verbosity: "Concis" | "Détaillé" | "Très détaillé"
  empathy: "Faible" | "Moyenne" | "Élevée"
  proactivity: "Réactif" | "Proactif" | "Très proactif"
}

export type ChatbotVisualConfig = {
  primaryColor: string
  secondaryColor: string
  textColor: string
  backgroundColor: string
  borderRadius: "Carré" | "Arrondi" | "Très arrondi"
  position: "Bas droite" | "Bas gauche" | "Flottant centre"
  size: "Compact" | "Standard" | "Large"
  avatar?: string // URL de l'avatar
  welcomeMessage: string
  placeholder: string
}

export type ChatbotDataSource = {
  id: string
  type: "faq" | "products" | "orders" | "policies" | "blog" | "reviews" | "custom"
  name: string
  isEnabled: boolean
  priority: number
  lastSync?: string
}

// Type correspondant exactement à la structure Supabase
export type ChatbotDB = {
  id: string
  name: string
  description: string
  status: ChatbotStatus
  is_default: boolean
  personality: ChatbotPersonality
  visual_config: ChatbotVisualConfig
  data_sources: ChatbotDataSource[]
  conversations_count: number
  avg_response_time: number
  satisfaction_rate: number
  created_at: string
  updated_at: string
}

// Type pour l'interface utilisateur avec des noms plus lisibles
export type Chatbot = {
  id: string
  name: string
  description: string
  status: ChatbotStatus
  isDefault: boolean
  personality: ChatbotPersonality
  visualConfig: ChatbotVisualConfig
  dataSources: ChatbotDataSource[]
  conversationsCount: number
  avgResponseTime: number
  satisfactionRate: number
  createdAt: string
  updatedAt: string
}

// Types pour la création/mise à jour (sans les champs auto-générés)
export type ChatbotCreateInput = Omit<ChatbotDB, 'id' | 'created_at' | 'updated_at'>
export type ChatbotUpdateInput = Partial<ChatbotCreateInput>

// Type pour les réponses API
export type ChatbotResponse = {
  success: boolean
  data?: Chatbot | Chatbot[]
  total?: number
  page?: number
  totalPages?: number
  message?: string
  error?: string
}

// Types pour les conversations
export type MessageType = "user" | "bot" | "system" | "recommendation"
export type MessageSentiment = "Positive" | "Neutre" | "Négative"

export type ChatMessage = {
  id: string
  content: string
  type: MessageType
  timestamp: string
  products?: Product[]
  metadata?: {
    confidence?: number
    intent?: string
    entities?: Array<{ type: string; value: string }>
    recommendations?: Array<{ type: string; value: string }>
    products?: Product[]
    showCarousel?: boolean
  }
}

export type Conversation = {
  id: string
  chatbotId: string
  userId?: string
  sessionId: string
  startedAt: string
  endedAt?: string
  messages: ChatMessage[]
  status: "Active" | "Fermée" | "Abandonnée"
  satisfaction?: number // 1-5
  sentiment: MessageSentiment
  resolvedIssue: boolean
  tags: string[]
  clientInfo?: {
    anonymousId: string // Format: [PREFIX]_[SHOP_ID]_[12_DIGITS_RANDOM]
    ipAddress: string    // Seule identification personnelle autorisée
    device: string
    browser: string
  }
}

// Types pour la FAQ
export type FAQCategory = "Commandes" | "Livraison" | "Retours" | "Paiements" | "Produits" | "Compte" | "Technique"
export type FAQStatus = "Publié" | "Brouillon" | "Archivé"

export type FAQItem = {
  id: string
  question: string
  answer: string
  category: FAQCategory
  status: FAQStatus
  tags: string[]
  popularity: number // nombre de fois consultée
  lastUpdated: string
  createdBy: string
  isHighlighted: boolean
}

// Types pour les clients
export type ClientSegment = "Nouveau" | "Régulier" | "VIP" | "Inactif" | "À risque"
export type ClientStatus = "Actif" | "Inactif" | "Bloqué"

export type Client = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  birthDate?: string
  registrationDate: string
  lastOrderDate?: string
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  segment: ClientSegment
  status: ClientStatus
  preferences?: {
    categories: string[]
    brands: string[]
    size?: string
    color?: string
  }
  loyaltyPoints: number
  notes?: string
  tags: string[]
}

// Types pour l'historique clients
export type ClientAction = "Commande" | "Connexion" | "Navigation" | "Contact" | "Retour" | "Avis"

export type ClientHistory = {
  id: string
  clientId: string
  action: ClientAction
  details: string
  timestamp: string
  metadata?: Record<string, any>
  orderId?: string
  productId?: string
  value?: number
}

// Types pour les avis et commentaires
export type ReviewStatus = "En attente" | "Approuvé" | "Rejeté" | "Signalé"
export type ReviewSource = "Site web" | "Email" | "SMS" | "Réseaux sociaux"

export type Review = {
  id: string
  productId: string
  productName: string
  clientId: string
  clientName: string
  rating: number // 1-5
  title: string
  comment: string
  status: ReviewStatus
  source: ReviewSource
  isVerifiedPurchase: boolean
  helpfulVotes: number
  reportedCount: number
  createdAt: string
  moderatedAt?: string
  moderatedBy?: string
  response?: {
    content: string
    author: string
    timestamp: string
  }
}

// Types pour les retours produits
export type ReturnStatus = "Demandé" | "Approuvé" | "Reçu" | "Inspecté" | "Remboursé" | "Refusé"
export type ReturnReason = "Défectueux" | "Mauvaise taille" | "Différent de la description" | "Changement d'avis" | "Erreur de commande"

export type ProductReturn = {
  id: string
  orderId: string
  productId: string
  productName: string
  clientId: string
  clientName: string
  status: ReturnStatus
  reason: ReturnReason
  description: string
  requestDate: string
  approvalDate?: string
  returnDate?: string
  refundDate?: string
  refundAmount: number
  restockable: boolean
  images?: string[]
  notes?: string
}

// Types pour les campagnes marketing  
export type CampaignType = "Email" | "SMS" | "Push" | "Réseaux sociaux" | "Bannière web"
export type CampaignStatus = "Brouillon" | "Programmée" | "En cours" | "Terminée" | "Annulée"

export type MarketingCampaign = {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  subject?: string
  content: string
  targetAudience: {
    segments: ClientSegment[]
    tags: string[]
    customFilters?: Record<string, any>
  }
  scheduledDate?: string
  startDate?: string
  endDate?: string
  budget?: number
  metrics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    converted: number
    revenue: number
  }
  createdBy: string
  createdAt: string
}

// Types pour les réseaux sociaux
export type SocialPlatform = "Facebook" | "Instagram" | "Twitter" | "TikTok" | "LinkedIn" | "YouTube"
export type PostStatus = "Brouillon" | "Programmé" | "Publié" | "Archivé"
export type PostType = "Image" | "Vidéo" | "Carrousel" | "Story" | "Reel"

export type SocialMediaPost = {
  id: string
  platform: SocialPlatform
  type: PostType
  content: string
  media: string[]
  status: PostStatus
  scheduledDate?: string
  publishedDate?: string
  tags: string[]
  productIds?: string[]
  metrics: {
    likes: number
    comments: number
    shares: number
    views: number
    clicks: number
    engagement: number
  }
  createdBy: string
  createdAt: string
}

// Types pour les données d'analytics spécifiques aux chatbots
export type ChatbotAnalytics = {
  chatbotId: string
  period: string
  totalConversations: number
  successfulResolutions: number
  averageResponseTime: number
  userSatisfaction: number
  topIntents: Array<{ intent: string; count: number }>
  topFailures: Array<{ query: string; count: number }>
  conversationsByHour: Array<{ hour: number; count: number }>
  conversionRate: number
}

// ================================
// TYPES POUR LES WIDGETS
// ================================

// Configuration du thème visuel
export type WidgetTheme = {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
  shadowColor: string
  borderRadius: string
  fontFamily: string
  fontSize: string
}

// Configuration de la mise en page
export type WidgetLayout = {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' | 'floating'
  offsetX: number
  offsetY: number
  width: number
  height: number
  minimized: boolean
  showOnMobile: boolean
  showOnDesktop: boolean
  zIndex: number
}

// Configuration du comportement
export type WidgetBehavior = {
  autoOpen: boolean
  autoOpenDelay: number
  showWelcomeMessage: boolean
  enableNotifications: boolean
  soundEnabled: boolean
  enableTypingIndicator: boolean
  maxMessages: number
  sessionTimeout: number
}

// Messages personnalisés
export type WidgetMessages = {
  welcomeMessage: string
  placeholderText: string
  sendButtonText: string
  minimizeTooltip: string
  closeTooltip: string
  offlineMessage: string
  errorMessage: string
  typingIndicator: string
  poweredByText: string
}

// Configuration avancée
export type WidgetAdvancedConfig = {
  allowFileUpload: boolean
  allowedFileTypes: string[]
  maxFileSize: number
  enableEmojis: boolean
  enableMarkdown: boolean
  showTimestamps: boolean
  showAvatars: boolean
  enableFeedback: boolean
  collectUserEmail: boolean
  gdprCompliant: boolean
  customCSS: string
}

// Intégrations tierces
export type WidgetIntegrations = {
  googleAnalytics?: string | null
  facebookPixel?: string | null
  customTracking?: string | null
  webhookUrl?: string | null
  apiEndpoints: Array<{
    name: string
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
  }>
}

// Configuration complète du widget
export type WidgetConfiguration = {
  id: string
  chatbotId: string
  name: string
  description?: string
  theme: WidgetTheme
  layout: WidgetLayout
  behavior: WidgetBehavior
  messages: WidgetMessages
  advancedConfig: WidgetAdvancedConfig
  integrations: WidgetIntegrations
  allowedDomains: string[]
  isActive: boolean
  isPublic: boolean
  installationCount: number
  lastUsedAt?: string
  version: string
  createdAt: string
  updatedAt: string
}

// Types pour les assets
export type WidgetAssetType = 'avatar' | 'logo' | 'background' | 'icon' | 'sound' | 'custom'

export type WidgetAsset = {
  id: string
  widgetConfigId: string
  assetType: WidgetAssetType
  assetName: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
  altText?: string
  isDefault: boolean
  createdAt: string
}

// Types pour les templates
export type WidgetTemplateCategory = 'Business' | 'E-commerce' | 'Support' | 'Marketing' | 'Education' | 'Healthcare'

export type WidgetTemplate = {
  id: string
  name: string
  description?: string
  category: WidgetTemplateCategory
  previewImage?: string
  configTemplate: Partial<WidgetConfiguration>
  isPremium: boolean
  usageCount: number
  createdBy?: string
  createdAt: string
  updatedAt: string
}

// Types pour les données d'input/formulaire
export type WidgetConfigurationInput = Omit<WidgetConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'installationCount' | 'lastUsedAt'>

export type WidgetConfigurationUpdate = Partial<WidgetConfigurationInput>

// Types pour les réponses API
export type WidgetConfigurationResponse = {
  data: WidgetConfiguration[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Types pour les statistiques de widget
export type WidgetStats = {
  totalConfigurations: number
  activeConfigurations: number
  totalInstallations: number
  popularTemplates: Array<{
    templateId: string
    templateName: string
    usageCount: number
  }>
  configurationsByCategory: Array<{
    category: WidgetTemplateCategory
    count: number
  }>
  recentActivity: Array<{
    configId: string
    configName: string
    action: 'created' | 'updated' | 'activated' | 'deactivated'
    timestamp: string
  }>
}

// Types pour les prévisualisations
export type WidgetPreview = {
  configId: string
  previewUrl: string
  embedCode: string
  jsCode: string
  cssCode: string
}

// Types pour les événements de widget
export type WidgetEvent = {
  id: string
  widgetConfigId: string
  eventType: 'load' | 'interaction' | 'error' | 'conversion'
  eventData: Record<string, any>
  userId?: string
  sessionId: string
  timestamp: string
  userAgent?: string
  referer?: string
}

// Types pour l'analyse des performances
export type WidgetPerformanceMetrics = {
  configId: string
  period: string
  totalViews: number
  totalInteractions: number
  conversionRate: number
  averageSessionDuration: number
  topPages: Array<{
    url: string
    views: number
    interactions: number
  }>
  deviceBreakdown: {
    desktop: number
    mobile: number
    tablet: number
  }
  hourlyActivity: Array<{
    hour: number
    interactions: number
  }>
}

// Types pour les webhooks
export type WebhookEvent = {
  event: string
  widgetConfigId: string
  conversationId?: string
  userId?: string
  data: Record<string, any>
  timestamp: string
}

export type WebhookResponse = {
  success: boolean
  message?: string
  data?: any
}

// ================================
// TYPES POUR LE SYSTÈME IA MASTER
// ================================

// Préférences utilisateur pour le système d'IA
export interface UserPreferences {
  budget?: { min: number; max: number }
  categories?: string[]
  sizes?: string[]
  colors?: string[]
  gender?: string
  style?: string
}

// Types des IA enfants disponibles
export type AIType = 'faq' | 'outfit_recommendation' | 'individual_clothing_recommendation' | 'contextual'

// Configuration d'une IA enfant
export type ChildAIConfig = {
  id: string
  name: string
  type: AIType
  description: string
  isActive: boolean
  priority: number
  keywords: string[]
  patterns: RegExp[]
}

// Requête utilisateur avec contexte
export type AIRequest = {
  id: string
  message: string
  userId?: string
  sessionId: string
  context?: {
    conversationHistory?: ChatMessage[]
    userPreferences?: UserPreferences
    previousIntent?: string
  }
  metadata?: Record<string, any>
  timestamp: string
}

// Réponse d'une IA enfant
export type AIResponse = {
  id: string
  aiType: AIType
  content: string
  confidence: number
  metadata?: {
    intent?: string
    entities?: Record<string, any>
    recommendations?: Product[]
    faqMatches?: FAQItem[]
    processingTime?: number
    [key: string]: any
  }
  timestamp: string
  success: boolean
  error?: string
}

// Résultat du routage par l'IA Master
export type RoutingResult = {
  selectedAI: AIType
  confidence: number
  reason: string
  alternativeAIs?: AIType[]
  processingTime: number
}

// Interface commune pour toutes les IA enfants
export interface IChildAI {
  type: AIType
  name: string
  canHandle(request: AIRequest): Promise<{ canHandle: boolean; confidence: number }>
  process(request: AIRequest): Promise<AIResponse>
  getConfig(): ChildAIConfig
}

// Logs et analytiques pour l'IA Master
export type AIMasterLog = {
  id: string
  requestId: string
  selectedAI: AIType
  routingConfidence: number
  processingTime: number
  responseGenerated: boolean
  userSatisfaction?: number
  timestamp: string
  metadata?: Record<string, any>
}

// Configuration globale de l'IA Master
export type AIMasterConfig = {
  defaultAI: AIType
  confidenceThreshold: number
  maxProcessingTime: number
  enableLogging: boolean
  enableAnalytics: boolean
  fallbackMessages: Record<string, string>
  retryAttempts: number
}

// Statistiques de performance des IA
export type AIPerformanceStats = {
  aiType: AIType
  totalRequests: number
  successfulResponses: number
  averageConfidence: number
  averageProcessingTime: number
  userSatisfactionRate: number
  commonIntents: Array<{ intent: string; count: number }>
  period: string
}
