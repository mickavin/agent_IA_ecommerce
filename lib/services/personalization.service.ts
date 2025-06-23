import { supabase } from '@/lib/supabase'

// Types pour la personnalisation utilisateur
export interface ApiKey {
  id: string
  keyValue: string
  name: string
  description?: string
  ownerEmail: string
  widgetConfigId: string
  permissions: {
    read_preferences: boolean
    write_preferences: boolean
    read_analytics: boolean
    manage_users: boolean
  }
  rateLimitPerHour: number
  maxUsers: number
  allowedDomains: string[]
  allowedIps: string[]
  totalRequests: number
  lastUsedAt?: string
  usersCount: number
  isActive: boolean
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface UserPreferences {
  id: string
  userId: string
  apiKeyId: string
  widgetConfigId: string
  displayName?: string
  email?: string
  avatarUrl?: string
  language: string
  timezone: string
  visualPreferences: {
    theme: 'light' | 'dark' | 'auto'
    primaryColor?: string
    backgroundColor?: string
    textSize: 'small' | 'medium' | 'large'
    highContrast: boolean
    animations: boolean
    sounds: boolean
    position?: string
    customWelcomeMessage?: string
    showAvatars: boolean
    showTimestamps: boolean
    compactMode: boolean
  }
  behaviorPreferences: {
    autoOpen?: boolean
    welcomeMessageSeen: boolean
    preferredLanguage: string
    quickRepliesEnabled: boolean
    typingIndicatorEnabled: boolean
    notificationsEnabled: boolean
    soundEnabled: boolean
    sessionRemember: boolean
    dataCollection: 'none' | 'essential' | 'all'
  }
  conversationPreferences: {
    tone?: string
    formality?: string
    verbosity?: string
    interests: string[]
    topics: string[]
    blockedTopics: string[]
    preferredResponseTime: 'fast' | 'normal' | 'slow'
    helpfulness: 'minimal' | 'standard' | 'comprehensive'
  }
  contentPreferences: {
    categories: string[]
    brands: string[]
    priceRange: { min?: number; max?: number }
    excludedProducts: string[]
    favoriteProducts: string[]
    size?: string
    style?: string
    notifications: {
      newProducts: boolean
      offers: boolean
      tips: boolean
    }
  }
  gdprConsent: {
    essential: boolean
    analytics: boolean
    marketing: boolean
    personalization: boolean
    consentDate?: string
    consentVersion: string
  }
  lastConversationId?: string
  conversationCount: number
  totalMessages: number
  lastActiveAt: string
  firstVisitAt: string
  createdAt: string
  updatedAt: string
}

export interface UserSession {
  id: string
  sessionId: string
  userPreferenceId: string
  userId: string
  apiKeyId: string
  ipAddress?: string
  userAgent?: string
  refererUrl?: string
  currentUrl?: string
  deviceType?: string
  browser?: string
  os?: string
  country?: string
  city?: string
  isActive: boolean
  messagesCount: number
  durationSeconds: number
  lastActivityAt: string
  satisfactionRating?: number
  feedback?: string
  conversionEvents: any[]
  createdAt: string
  endedAt?: string
}

// Service pour les clés API
export class ApiKeyService {
  static async validateKey(keyValue: string): Promise<{
    isValid: boolean
    apiKey?: ApiKey
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_value', keyValue)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return { isValid: false, error: 'Clé API invalide' }
      }

      // Vérifier l'expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { isValid: false, error: 'Clé API expirée' }
      }

      return { 
        isValid: true, 
        apiKey: {
          id: data.id,
          keyValue: data.key_value,
          name: data.name,
          description: data.description,
          ownerEmail: data.owner_email,
          widgetConfigId: data.widget_config_id,
          permissions: data.permissions,
          rateLimitPerHour: data.rate_limit_per_hour,
          maxUsers: data.max_users,
          allowedDomains: data.allowed_domains,
          allowedIps: data.allowed_ips || [],
          totalRequests: data.total_requests || 0,
          lastUsedAt: data.last_used_at,
          usersCount: data.users_count || 0,
          isActive: data.is_active,
          expiresAt: data.expires_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }
      }
    } catch (error: any) {
      return { isValid: false, error: error.message }
    }
  }

  static async create(keyData: Omit<ApiKey, 'id' | 'keyValue' | 'createdAt' | 'totalRequests'>): Promise<ApiKey> {
    // Générer une clé API unique
    const keyValue = 'yzk_' + Math.random().toString(36).substr(2, 15) + Date.now().toString(36)

    const { data, error } = await supabase
      .from('api_keys')
      .insert([{
        key_value: keyValue,
        name: keyData.name,
        description: keyData.description,
        owner_email: keyData.ownerEmail,
        widget_config_id: keyData.widgetConfigId,
        permissions: keyData.permissions,
        rate_limit_per_hour: keyData.rateLimitPerHour,
        max_users: keyData.maxUsers,
        allowed_domains: keyData.allowedDomains,
        is_active: keyData.isActive
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur création clé API: ${error.message}`)
    }

    return {
      id: data.id,
      keyValue: data.key_value,
      name: data.name,
      description: data.description,
      ownerEmail: data.owner_email,
      widgetConfigId: data.widget_config_id,
      permissions: data.permissions,
      rateLimitPerHour: data.rate_limit_per_hour,
      maxUsers: data.max_users,
      allowedDomains: data.allowed_domains,
      allowedIps: data.allowed_ips || [],
      totalRequests: data.total_requests || 0,
      lastUsedAt: data.last_used_at,
      usersCount: data.users_count || 0,
      isActive: data.is_active,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  static async getAll(widgetConfigId?: string): Promise<ApiKey[]> {
    let query = supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false })

    if (widgetConfigId) {
      query = query.eq('widget_config_id', widgetConfigId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Erreur récupération clés API: ${error.message}`)
    }

    return (data || []).map(this.mapApiKey)
  }

  static async updateUsage(keyId: string): Promise<void> {
    await supabase.rpc('update_api_key_usage', { key_id: keyId })
  }

  static async revoke(keyId: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', keyId)

    if (error) {
      throw new Error(`Erreur révocation clé API: ${error.message}`)
    }
  }

  private static mapApiKey(data: any): ApiKey {
    return {
      id: data.id,
      keyValue: data.key_value,
      name: data.name,
      description: data.description,
      ownerEmail: data.owner_email,
      widgetConfigId: data.widget_config_id,
      permissions: data.permissions,
      rateLimitPerHour: data.rate_limit_per_hour,
      maxUsers: data.max_users,
      allowedDomains: data.allowed_domains,
      allowedIps: data.allowed_ips,
      totalRequests: data.total_requests,
      lastUsedAt: data.last_used_at,
      usersCount: data.users_count,
      isActive: data.is_active,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
}

// Service pour les préférences utilisateur
export class UserPreferencesService {
  static async getByUserId(userId: string, apiKeyId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('api_key_id', apiKeyId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erreur récupération préférences: ${error.message}`)
    }

    return data ? {
      id: data.id,
      userId: data.user_id,
      apiKeyId: data.api_key_id,
      widgetConfigId: data.widget_config_id,
      displayName: data.display_name,
      email: data.email,
      avatarUrl: data.avatar_url,
      language: data.language,
      timezone: data.timezone,
      visualPreferences: data.visual_preferences,
      behaviorPreferences: data.behavior_preferences,
      conversationPreferences: data.conversation_preferences,
      contentPreferences: data.content_preferences,
      gdprConsent: data.gdpr_consent,
      lastConversationId: data.last_conversation_id,
      conversationCount: data.conversation_count,
      totalMessages: data.total_messages,
      lastActiveAt: data.last_active_at,
      firstVisitAt: data.first_visit_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } : null
  }

  static async create(preferences: Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .insert([{
        user_id: preferences.userId,
        api_key_id: preferences.apiKeyId,
        widget_config_id: preferences.widgetConfigId,
        display_name: preferences.displayName,
        email: preferences.email,
        avatar_url: preferences.avatarUrl,
        language: preferences.language,
        timezone: preferences.timezone,
        visual_preferences: preferences.visualPreferences,
        behavior_preferences: preferences.behaviorPreferences,
        conversation_preferences: preferences.conversationPreferences,
        content_preferences: preferences.contentPreferences,
        gdpr_consent: preferences.gdprConsent,
        conversation_count: preferences.conversationCount,
        total_messages: preferences.totalMessages,
        last_active_at: preferences.lastActiveAt,
        first_visit_at: preferences.firstVisitAt
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur création préférences: ${error.message}`)
    }

    return {
      id: data.id,
      userId: data.user_id,
      apiKeyId: data.api_key_id,
      widgetConfigId: data.widget_config_id,
      displayName: data.display_name,
      email: data.email,
      avatarUrl: data.avatar_url,
      language: data.language,
      timezone: data.timezone,
      visualPreferences: data.visual_preferences,
      behaviorPreferences: data.behavior_preferences,
      conversationPreferences: data.conversation_preferences,
      contentPreferences: data.content_preferences,
      gdprConsent: data.gdpr_consent,
      lastConversationId: data.last_conversation_id,
      conversationCount: data.conversation_count,
      totalMessages: data.total_messages,
      lastActiveAt: data.last_active_at,
      firstVisitAt: data.first_visit_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  static async update(userId: string, apiKeyId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const updateData: any = { updated_at: new Date().toISOString() }

    if (updates.displayName !== undefined) updateData.display_name = updates.displayName
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl
    if (updates.language !== undefined) updateData.language = updates.language
    if (updates.timezone !== undefined) updateData.timezone = updates.timezone
    if (updates.visualPreferences !== undefined) updateData.visual_preferences = updates.visualPreferences
    if (updates.behaviorPreferences !== undefined) updateData.behavior_preferences = updates.behaviorPreferences
    if (updates.conversationPreferences !== undefined) updateData.conversation_preferences = updates.conversationPreferences
    if (updates.contentPreferences !== undefined) updateData.content_preferences = updates.contentPreferences
    if (updates.gdprConsent !== undefined) updateData.gdpr_consent = updates.gdprConsent
    if (updates.lastConversationId !== undefined) updateData.last_conversation_id = updates.lastConversationId
    if (updates.conversationCount !== undefined) updateData.conversation_count = updates.conversationCount
    if (updates.totalMessages !== undefined) updateData.total_messages = updates.totalMessages
    if (updates.lastActiveAt !== undefined) updateData.last_active_at = updates.lastActiveAt

    const { data, error } = await supabase
      .from('user_preferences')
      .update(updateData)
      .eq('user_id', userId)
      .eq('api_key_id', apiKeyId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur mise à jour préférences: ${error.message}`)
    }

    return {
      id: data.id,
      userId: data.user_id,
      apiKeyId: data.api_key_id,
      widgetConfigId: data.widget_config_id,
      displayName: data.display_name,
      email: data.email,
      avatarUrl: data.avatar_url,
      language: data.language,
      timezone: data.timezone,
      visualPreferences: data.visual_preferences,
      behaviorPreferences: data.behavior_preferences,
      conversationPreferences: data.conversation_preferences,
      contentPreferences: data.content_preferences,
      gdprConsent: data.gdpr_consent,
      lastConversationId: data.last_conversation_id,
      conversationCount: data.conversation_count,
      totalMessages: data.total_messages,
      lastActiveAt: data.last_active_at,
      firstVisitAt: data.first_visit_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  static async delete(userId: string, apiKeyId: string): Promise<void> {
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)
      .eq('api_key_id', apiKeyId)

    if (error) {
      throw new Error(`Erreur suppression préférences: ${error.message}`)
    }
  }

  static async updateLastActivity(userId: string, apiKeyId: string): Promise<void> {
    await supabase
      .from('user_preferences')
      .update({ 
        last_active_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('api_key_id', apiKeyId)
  }
}

// Service pour les sessions utilisateur
export class UserSessionService {
  static async create(sessionData: Omit<UserSession, 'id' | 'createdAt' | 'endedAt'>): Promise<UserSession> {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert([{
        session_id: sessionData.sessionId,
        user_preference_id: sessionData.userPreferenceId,
        user_id: sessionData.userId,
        api_key_id: sessionData.apiKeyId,
        ip_address: sessionData.ipAddress,
        user_agent: sessionData.userAgent,
        referer_url: sessionData.refererUrl,
        current_url: sessionData.currentUrl,
        device_type: sessionData.deviceType,
        browser: sessionData.browser,
        os: sessionData.os,
        country: sessionData.country,
        city: sessionData.city,
        is_active: sessionData.isActive,
        messages_count: sessionData.messagesCount,
        duration_seconds: sessionData.durationSeconds,
        last_activity_at: sessionData.lastActivityAt,
        satisfaction_rating: sessionData.satisfactionRating,
        feedback: sessionData.feedback,
        conversion_events: sessionData.conversionEvents
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur création session: ${error.message}`)
    }

    return this.mapUserSession(data)
  }

  static async updateActivity(sessionId: string, messagesCount?: number): Promise<void> {
    const updateData: any = {
      last_activity_at: new Date().toISOString()
    }

    if (messagesCount !== undefined) {
      updateData.messages_count = messagesCount
    }

    await supabase
      .from('user_sessions')
      .update(updateData)
      .eq('session_id', sessionId)
  }

  static async endSession(sessionId: string, satisfactionRating?: number, feedback?: string): Promise<void> {
    const updateData: any = {
      is_active: false,
      ended_at: new Date().toISOString()
    }

    if (satisfactionRating !== undefined) updateData.satisfaction_rating = satisfactionRating
    if (feedback !== undefined) updateData.feedback = feedback

    await supabase
      .from('user_sessions')
      .update(updateData)
      .eq('session_id', sessionId)
  }

  private static mapUserSession(data: any): UserSession {
    return {
      id: data.id,
      sessionId: data.session_id,
      userPreferenceId: data.user_preference_id,
      userId: data.user_id,
      apiKeyId: data.api_key_id,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      refererUrl: data.referer_url,
      currentUrl: data.current_url,
      deviceType: data.device_type,
      browser: data.browser,
      os: data.os,
      country: data.country,
      city: data.city,
      isActive: data.is_active,
      messagesCount: data.messages_count,
      durationSeconds: data.duration_seconds,
      lastActivityAt: data.last_activity_at,
      satisfactionRating: data.satisfaction_rating,
      feedback: data.feedback,
      conversionEvents: data.conversion_events,
      createdAt: data.created_at,
      endedAt: data.ended_at
    }
  }
}

// Service pour les événements de personnalisation
export class PersonalizationEventService {
  static async logEvent(eventData: {
    userPreferenceId: string
    sessionId?: string
    apiKeyId: string
    eventType: string
    eventCategory?: string
    eventData?: any
    oldValue?: any
    newValue?: any
    triggerSource?: string
    userAgent?: string
    ipAddress?: string
  }): Promise<void> {
    await supabase
      .from('personalization_events')
      .insert([{
        user_preference_id: eventData.userPreferenceId,
        session_id: eventData.sessionId,
        api_key_id: eventData.apiKeyId,
        event_type: eventData.eventType,
        event_category: eventData.eventCategory || 'user_action',
        event_data: eventData.eventData || {},
        old_value: eventData.oldValue,
        new_value: eventData.newValue,
        trigger_source: eventData.triggerSource || 'api',
        user_agent: eventData.userAgent,
        ip_address: eventData.ipAddress
      }])
  }

  static async getEvents(userPreferenceId: string, limit = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('personalization_events')
      .select('*')
      .eq('user_preference_id', userPreferenceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Erreur récupération événements: ${error.message}`)
    }

    return data || []
  }
} 