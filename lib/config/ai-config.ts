/**
 * Configuration centralisée pour le système d'IA Master
 * Gère les variables d'environnement et les paramètres par défaut
 */

export interface AIProviderConfig {
  provider: 'openai' | 'grok' | 'anthropic' | 'local'
  apiKey?: string
  model: string
  maxTokens: number
  temperature: number
  timeout: number
}

export interface IAMasterEnvironmentConfig {
  // Configuration générale IA Master
  confidenceThreshold: number
  maxProcessingTime: number
  enableLogging: boolean
  enableAnalytics: boolean
  defaultAI: 'faq' | 'outfit_recommendation' | 'individual_clothing_recommendation'
  retryAttempts: number
  
  // Configuration des logs
  logRetentionDays: number
  maxLogsInMemory: number
  
  // Configuration des IA spécialisées
  faq: {
    confidenceThreshold: number
    maxSearchResults: number
    enableSimilarityBoost: boolean
  }
  
  outfit: {
    maxOutfits: number
    minItemsPerOutfit: number
    maxItemsPerOutfit: number
    confidenceThreshold: number
  }
  
  individual: {
    maxRecommendations: number
    confidenceThreshold: number
    weights: {
      trending: number
      personalized: number
      availability: number
      price: number
    }
  }
  
  // Configuration sécurité
  security: {
    rateLimitPerMinute: number
    maxRequestSizeKB: number
    externalAPITimeout: number
  }
  
  // Configuration API externe
  aiProvider: AIProviderConfig
  
  // Configuration développement
  development: {
    debugMode: boolean
    testMode: boolean
    simulateLatency: number
  }
}

/**
 * Lit une variable d'environnement avec une valeur par défaut
 */
function getEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue
}

/**
 * Lit une variable d'environnement booléenne
 */
function getEnvBool(key: string, defaultValue: boolean): boolean {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  return value.toLowerCase() === 'true'
}

/**
 * Lit une variable d'environnement numérique
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  const parsed = parseFloat(value)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Configuration par défaut du système IA Master
 */
export const defaultAIConfig: IAMasterEnvironmentConfig = {
  // Configuration générale
  confidenceThreshold: getEnvNumber('AI_MASTER_CONFIDENCE_THRESHOLD', 0.4),
  maxProcessingTime: getEnvNumber('AI_MASTER_MAX_PROCESSING_TIME', 30000),
  enableLogging: getEnvBool('AI_MASTER_ENABLE_LOGGING', true),
  enableAnalytics: getEnvBool('AI_MASTER_ENABLE_ANALYTICS', true),
  defaultAI: (getEnvVar('AI_MASTER_DEFAULT_AI', 'faq') as any),
  retryAttempts: getEnvNumber('AI_MASTER_RETRY_ATTEMPTS', 2),
  
  // Configuration des logs
  logRetentionDays: getEnvNumber('AI_MASTER_LOG_RETENTION_DAYS', 30),
  maxLogsInMemory: getEnvNumber('AI_MASTER_MAX_LOGS_IN_MEMORY', 1000),
  
  // Configuration FAQ IA
  faq: {
    confidenceThreshold: getEnvNumber('FAQ_AI_CONFIDENCE_THRESHOLD', 0.3),
    maxSearchResults: getEnvNumber('FAQ_AI_MAX_SEARCH_RESULTS', 5),
    enableSimilarityBoost: getEnvBool('FAQ_AI_ENABLE_SIMILARITY_BOOST', true)
  },
  
  // Configuration Outfit IA
  outfit: {
    maxOutfits: getEnvNumber('OUTFIT_AI_MAX_OUTFITS', 3),
    minItemsPerOutfit: getEnvNumber('OUTFIT_AI_MIN_ITEMS_PER_OUTFIT', 2),
    maxItemsPerOutfit: getEnvNumber('OUTFIT_AI_MAX_ITEMS_PER_OUTFIT', 5),
    confidenceThreshold: getEnvNumber('OUTFIT_AI_CONFIDENCE_THRESHOLD', 0.5)
  },
  
  // Configuration Individual IA
  individual: {
    maxRecommendations: getEnvNumber('INDIVIDUAL_AI_MAX_RECOMMENDATIONS', 5),
    confidenceThreshold: getEnvNumber('INDIVIDUAL_AI_CONFIDENCE_THRESHOLD', 0.5),
    weights: {
      trending: getEnvNumber('INDIVIDUAL_AI_TRENDING_WEIGHT', 0.3),
      personalized: getEnvNumber('INDIVIDUAL_AI_PERSONALIZED_WEIGHT', 0.4),
      availability: getEnvNumber('INDIVIDUAL_AI_AVAILABILITY_WEIGHT', 0.2),
      price: getEnvNumber('INDIVIDUAL_AI_PRICE_WEIGHT', 0.1)
    }
  },
  
  // Configuration sécurité
  security: {
    rateLimitPerMinute: getEnvNumber('RATE_LIMIT_PER_MINUTE', 60),
    maxRequestSizeKB: getEnvNumber('MAX_REQUEST_SIZE_KB', 100),
    externalAPITimeout: getEnvNumber('EXTERNAL_API_TIMEOUT', 15000)
  },
  
  // Configuration fournisseur IA
  aiProvider: {
    provider: (getEnvVar('AI_PROVIDER', 'local') as any),
    apiKey: getEnvVar('AI_API_KEY', ''),
    model: getEnvVar('AI_MODEL', 'gpt-3.5-turbo'),
    maxTokens: getEnvNumber('AI_MAX_TOKENS', 1000),
    temperature: getEnvNumber('AI_TEMPERATURE', 0.7),
    timeout: getEnvNumber('AI_TIMEOUT', 10000)
  },
  
  // Configuration développement
  development: {
    debugMode: getEnvBool('DEBUG_MODE', false),
    testMode: getEnvBool('TEST_MODE', false),
    simulateLatency: getEnvNumber('SIMULATE_LATENCY', 0)
  }
}

/**
 * Obtient la configuration spécifique au fournisseur d'IA
 */
export function getAIProviderConfig(provider?: string): AIProviderConfig {
  const selectedProvider = provider || defaultAIConfig.aiProvider.provider
  
  switch (selectedProvider) {
    case 'openai':
      return {
        provider: 'openai',
        apiKey: getEnvVar('OPENAI_API_KEY', ''),
        model: getEnvVar('OPENAI_MODEL', 'gpt-3.5-turbo'),
        maxTokens: getEnvNumber('OPENAI_MAX_TOKENS', 1000),
        temperature: getEnvNumber('OPENAI_TEMPERATURE', 0.7),
        timeout: getEnvNumber('OPENAI_TIMEOUT', 10000)
      }
      
    case 'grok':
      return {
        provider: 'grok',
        apiKey: getEnvVar('GROK_API_KEY', ''),
        model: getEnvVar('GROK_MODEL', 'grok-beta'),
        maxTokens: getEnvNumber('GROK_MAX_TOKENS', 1000),
        temperature: getEnvNumber('GROK_TEMPERATURE', 0.7),
        timeout: getEnvNumber('GROK_TIMEOUT', 10000)
      }
      
    case 'anthropic':
      return {
        provider: 'anthropic',
        apiKey: getEnvVar('ANTHROPIC_API_KEY', ''),
        model: getEnvVar('ANTHROPIC_MODEL', 'claude-3-sonnet-20240229'),
        maxTokens: getEnvNumber('ANTHROPIC_MAX_TOKENS', 1000),
        temperature: getEnvNumber('ANTHROPIC_TEMPERATURE', 0.7),
        timeout: getEnvNumber('ANTHROPIC_TIMEOUT', 10000)
      }
      
    default:
      return defaultAIConfig.aiProvider
  }
}

/**
 * Valide la configuration actuelle
 */
export function validateConfig(config: IAMasterEnvironmentConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validation des seuils de confiance
  if (config.confidenceThreshold < 0 || config.confidenceThreshold > 1) {
    errors.push('Le seuil de confiance doit être entre 0 et 1')
  }
  
  // Validation des timeouts
  if (config.maxProcessingTime < 1000) {
    errors.push('Le temps de traitement maximum doit être d\'au moins 1000ms')
  }
  
  // Validation des poids pour l'IA individuelle
  const totalWeight = Object.values(config.individual.weights).reduce((sum, weight) => sum + weight, 0)
  if (Math.abs(totalWeight - 1) > 0.01) {
    errors.push('La somme des poids pour l\'IA individuelle doit être égale à 1')
  }
  
  // Validation du fournisseur IA
  if (config.aiProvider.provider !== 'local' && !config.aiProvider.apiKey) {
    errors.push(`Une clé API est requise pour le fournisseur ${config.aiProvider.provider}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Obtient la configuration avec surcharges personnalisées
 */
export function getAIConfig(overrides?: Partial<IAMasterEnvironmentConfig>): IAMasterEnvironmentConfig {
  const config = { ...defaultAIConfig, ...overrides }
  
  // Validation
  const validation = validateConfig(config)
  if (!validation.isValid) {
    console.warn('⚠️ Configuration IA invalide:', validation.errors)
  }
  
  return config
}

/**
 * Log de la configuration actuelle (sans données sensibles)
 */
export function logConfigSummary(config: IAMasterEnvironmentConfig): void {
  console.log('🤖 Configuration IA Master:')
  console.log(`   • Seuil de confiance: ${config.confidenceThreshold}`)
  console.log(`   • Timeout max: ${config.maxProcessingTime}ms`)
  console.log(`   • IA par défaut: ${config.defaultAI}`)
  console.log(`   • Logging: ${config.enableLogging ? 'activé' : 'désactivé'}`)
  console.log(`   • Analytics: ${config.enableAnalytics ? 'activé' : 'désactivé'}`)
  console.log(`   • Fournisseur IA: ${config.aiProvider.provider}`)
  console.log(`   • Mode debug: ${config.development.debugMode ? 'activé' : 'désactivé'}`)
}

/**
 * Messages de fallback configurables
 */
export const fallbackMessages = {
  noAIAvailable: getEnvVar('FALLBACK_NO_AI', 'Désolé, aucune IA n\'est disponible pour traiter votre demande pour le moment.'),
  timeout: getEnvVar('FALLBACK_TIMEOUT', 'Le traitement de votre demande a pris trop de temps. Veuillez réessayer.'),
  error: getEnvVar('FALLBACK_ERROR', 'Une erreur s\'est produite lors du traitement de votre demande.'),
  lowConfidence: getEnvVar('FALLBACK_LOW_CONFIDENCE', 'Je ne suis pas sûr de bien comprendre votre demande. Pouvez-vous la reformuler ?'),
  rateLimited: getEnvVar('FALLBACK_RATE_LIMITED', 'Trop de requêtes. Veuillez patienter avant de réessayer.'),
  maintenance: getEnvVar('FALLBACK_MAINTENANCE', 'Le service est temporairement en maintenance. Veuillez réessayer plus tard.')
} 