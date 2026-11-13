import { supabase, type Tables, type TablesInsert, type TablesUpdate } from '../supabase'
import type { 
  Product, 
  Order, 
  Client, 
  StockItem, 
  SupportTicket,
  Chatbot,
  WidgetConfiguration,
  WidgetConfigurationInput,
  WidgetConfigurationUpdate,
  WidgetTemplate,
  WidgetAsset,
  WidgetStats,
  WidgetPreview,
  WidgetPerformanceMetrics
} from '../types'

// Service pour les produits
export class ProductService {
  static async getAll(page = 1, limit = 10, search?: string, filters?: Record<string, string[]>) {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,product_title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Appliquer les filtres
    if (filters) {
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category)
      }
      if (filters.gender && filters.gender.length > 0) {
        query = query.in('gender', filters.gender)
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }
      // Filtres pour les arrays (tailles et couleurs)
      if (filters.sizes && filters.sizes.length > 0) {
        // Utiliser l'opérateur overlaps pour vérifier si les arrays ont des éléments en commun
        query = query.overlaps('sizes', filters.sizes)
      }
      if (filters.colors && filters.colors.length > 0) {
        // Utiliser l'opérateur overlaps pour vérifier si les arrays ont des éléments en commun
        query = query.overlaps('colors', filters.colors)
      }
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async create(product: TablesInsert<'products'>) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, product: TablesUpdate<'products'>) {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...product,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async bulkInsert(products: TablesInsert<'products'>[]) {
    const { data, error } = await supabase
      .from('products')
      .insert(products)
      .select()

    if (error) throw error
    return data
  }

  // Nouvelles méthodes pour récupérer les filtres dynamiquement
  static async getUniqueCategories() {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null)

    if (error) throw error

    const categories = [...new Set(data?.map(item => item.category).filter(Boolean))]
    return categories.sort()
  }

  static async getUniqueGenders() {
    const { data, error } = await supabase
      .from('products')
      .select('gender')
      .not('gender', 'is', null)

    if (error) throw error

    const genders = [...new Set(data?.map(item => item.gender).filter(Boolean))]
    return genders.sort()
  }

  static async getUniqueStatuses() {
    const { data, error } = await supabase
      .from('products')
      .select('status')
      .not('status', 'is', null)

    if (error) throw error

    const statuses = [...new Set(data?.map(item => item.status).filter(Boolean))]
    return statuses.sort()
  }

  static async getUniqueSizes() {
    const { data, error } = await supabase
      .from('products')
      .select('sizes')

    if (error) throw error

    const allSizes = new Set<string>()
    data?.forEach(product => {
      if (product.sizes && Array.isArray(product.sizes)) {
        product.sizes.forEach(size => allSizes.add(size))
      }
    })

    return Array.from(allSizes).sort()
  }

  static async getUniqueColors() {
    const { data, error } = await supabase
      .from('products')
      .select('colors')

    if (error) throw error

    const allColors = new Set<string>()
    data?.forEach(product => {
      if (product.colors && Array.isArray(product.colors)) {
        product.colors.forEach(color => allColors.add(color))
      }
    })

    return Array.from(allColors).sort()
  }

  static async getFilterOptions() {
    const [categories, genders, statuses, sizes, colors] = await Promise.all([
      this.getUniqueCategories(),
      this.getUniqueGenders(),
      this.getUniqueStatuses(),
      this.getUniqueSizes(),
      this.getUniqueColors()
    ])

    return {
      categories,
      genders,
      statuses,
      sizes,
      colors
    }
  }
}

// Service pour les commandes
export class OrderService {
  static async getAll(page = 1, limit = 10, search?: string, filters?: Record<string, string[]>) {
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`)
    }

    // Appliquer les filtres
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async create(order: TablesInsert<'orders'>) {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, order: TablesUpdate<'orders'>) {
    const { data, error } = await supabase
      .from('orders')
      .update({
        ...order,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async bulkInsert(orders: TablesInsert<'orders'>[]) {
    const { data, error } = await supabase
      .from('orders')
      .insert(orders)
      .select()

    if (error) throw error
    return data
  }

  static async getUniqueStatuses() {
    const { data, error } = await supabase
      .from('orders')
      .select('status')
      .not('status', 'is', null)

    if (error) throw error

    const statuses = [...new Set(data?.map(item => item.status).filter(Boolean))]
    return statuses.sort()
  }
}

// Service pour les clients
export class ClientService {
  static async getAll(page = 1, limit = 10, search?: string, filters?: Record<string, string[]>) {
    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Appliquer les filtres
    if (filters) {
      if (filters.segment && filters.segment.length > 0) {
        query = query.in('segment', filters.segment)
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async create(client: TablesInsert<'clients'>) {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, client: TablesUpdate<'clients'>) {
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...client,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async bulkInsert(clients: TablesInsert<'clients'>[]) {
    const { data, error } = await supabase
      .from('clients')
      .insert(clients)
      .select()

    if (error) throw error
    return data
  }

  static async getUniqueSegments() {
    const { data, error } = await supabase
      .from('clients')
      .select('segment')
      .not('segment', 'is', null)

    if (error) throw error

    const segments = [...new Set(data?.map(item => item.segment).filter(Boolean))]
    return segments.sort()
  }

  static async getUniqueStatuses() {
    const { data, error } = await supabase
      .from('clients')
      .select('status')
      .not('status', 'is', null)

    if (error) throw error

    const statuses = [...new Set(data?.map(item => item.status).filter(Boolean))]
    return statuses.sort()
  }
}

// Service pour le stock
export class StockService {
  static async getAll(page = 1, limit = 10, search?: string) {
    let query = supabase
      .from('stock_items')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`product_name.ilike.%${search}%,location.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  static async create(stockItem: TablesInsert<'stock_items'>) {
    const { data, error } = await supabase
      .from('stock_items')
      .insert(stockItem)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, stockItem: TablesUpdate<'stock_items'>) {
    const { data, error } = await supabase
      .from('stock_items')
      .update({
        ...stockItem,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUniqueLocations() {
    const { data, error } = await supabase
      .from('stock_items')
      .select('location')
      .not('location', 'is', null)

    if (error) throw error

    const locations = [...new Set(data?.map(item => item.location).filter(Boolean))]
    return locations.sort()
  }
}

// Service pour les tickets de support
export class SupportService {
  static async getAll(page = 1, limit = 10, search?: string, filters?: Record<string, string[]>) {
    let query = supabase
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,subject.ilike.%${search}%,customer_email.ilike.%${search}%`)
    }

    // Appliquer les filtres
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }
      if (filters.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority)
      }
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  static async create(ticket: TablesInsert<'support_tickets'>) {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert(ticket)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, ticket: TablesUpdate<'support_tickets'>) {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        ...ticket,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUniqueStatuses() {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('status')
      .not('status', 'is', null)

    if (error) throw error

    const statuses = [...new Set(data?.map(item => item.status).filter(Boolean))]
    return statuses.sort()
  }

  static async getUniquePriorities() {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('priority')
      .not('priority', 'is', null)

    if (error) throw error

    const priorities = [...new Set(data?.map(item => item.priority).filter(Boolean))]
    return priorities.sort()
  }
}

// Service pour les chatbots
export class ChatbotService {
  static async getAll(page = 1, limit = 10, search?: string) {
    let query = supabase
      .from('chatbots')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  static async create(chatbot: TablesInsert<'chatbots'>) {
    const { data, error } = await supabase
      .from('chatbots')
      .insert(chatbot)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, chatbot: TablesUpdate<'chatbots'>) {
    const { data, error } = await supabase
      .from('chatbots')
      .update({
        ...chatbot,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Service pour les statistiques
export class AnalyticsService {
  static async getSalesByCategory() {
    const { data, error } = await supabase
      .from('products')
      .select('category')

    if (error) throw error

    return data?.reduce((acc: any, product: any) => {
      const category = product.category || 'Autres'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})
  }

  static async getOrderStatusDistribution() {
    const { data, error } = await supabase
      .from('orders')
      .select('status')

    if (error) throw error

    return data?.reduce((acc: any, order: any) => {
      const status = order.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
  }

  static async getTotalStats() {
    const [products, orders, clients, tickets] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true })
    ])

    return {
      totalProducts: products.count || 0,
      totalOrders: orders.count || 0,
      totalClients: clients.count || 0,
      totalTickets: tickets.count || 0
    }
  }

  static async getProductStats() {
    const [total, lowStock, outOfStock] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 10),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('stock', 0)
    ])

    return {
      total: total.count || 0,
      lowStock: lowStock.count || 0,
      outOfStock: outOfStock.count || 0,
      inStock: (total.count || 0) - (outOfStock.count || 0)
    }
  }
}

// ================================
// SERVICES POUR LES WIDGETS
// ================================

// Service pour les configurations de widget
// TEMPORAIREMENT DÉSACTIVÉ - Tables widget_* non créées dans Supabase
// Cause de l'erreur ERR_INVALID_ARG_TYPE
export class WidgetConfigurationService {
  static async getAll(
    page = 1,
    limit = 10,
    search = '',
    filters?: Record<string, string[]>
  ): Promise<{
    data: WidgetConfiguration[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    let query = supabase
      .from('widget_configurations')
      .select(`
        *,
        chatbots!inner(
          id,
          name,
          status
        )
      `)

    // Recherche dans le nom et description
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Application des filtres
    if (filters) {
      Object.entries(filters).forEach(([key, values]) => {
        if (values.length > 0) {
          if (key === 'isActive' || key === 'isPublic') {
            query = query.eq(key, values[0] === 'true')
          } else {
            query = query.in(key, values)
          }
        }
      })
    }

    // Pagination avec validation
    const from = Math.max(0, (page - 1) * limit)
    const to = from + limit - 1

    try {
      const { data, error, count } = await query
        .order('updated_at', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('Erreur Supabase:', error)
        // Si la table n'existe pas, retourner des données vides
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          return {
            data: [],
            total: 0,
            page,
            pageSize: limit,
            totalPages: 0
          }
        }
        throw new Error(`Erreur récupération widgets: ${error.message}`)
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize: limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (err: any) {
      console.error('Erreur dans WidgetConfigurationService.getAll:', err)
      // Fallback gracieux
      return {
        data: [],
        total: 0,
        page,
        pageSize: limit,
        totalPages: 0
      }
    }
  }

  static async getById(id: string): Promise<WidgetConfiguration> {
    const { data, error } = await supabase
      .from('widget_configurations')
      .select(`
        *,
        chatbots!inner(
          id,
          name,
          status,
          personality,
          visual_config
        ),
        widget_assets(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Widget non trouvé: ${error.message}`)
    }

    return data
  }

  static async create(widgetData: WidgetConfigurationInput): Promise<WidgetConfiguration> {
    const { data, error } = await supabase
      .from('widget_configurations')
      .insert([{
        ...widgetData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur création widget: ${error.message}`)
    }

    return data
  }

  static async update(id: string, updateData: WidgetConfigurationUpdate): Promise<WidgetConfiguration> {
    const { data, error } = await supabase
      .from('widget_configurations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur mise à jour widget: ${error.message}`)
    }

    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('widget_configurations')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erreur suppression widget: ${error.message}`)
    }
  }

  static async duplicate(id: string, newName: string): Promise<WidgetConfiguration> {
    const original = await this.getById(id)
    
    const duplicatedData: WidgetConfigurationInput = {
      ...original,
      name: newName,
      isActive: false
    }

    delete (duplicatedData as any).id
    delete (duplicatedData as any).createdAt
    delete (duplicatedData as any).updatedAt

    return this.create(duplicatedData)
  }

  static async toggleActive(id: string): Promise<WidgetConfiguration> {
    const widget = await this.getById(id)
    return this.update(id, { isActive: !widget.isActive })
  }

  static async updateLastUsed(id: string): Promise<void> {
    // Récupérer la valeur actuelle
    const { data: current } = await supabase
      .from('widget_configurations')
      .select('installation_count')
      .eq('id', id)
      .single()

    // Incrémenter
    await supabase
      .from('widget_configurations')
      .update({ 
        last_used_at: new Date().toISOString(),
        installation_count: (current?.installation_count || 0) + 1
      })
      .eq('id', id)
  }

  static async getStats(): Promise<WidgetStats> {
    // Statistiques générales
    const { count: totalConfigurations } = await supabase
      .from('widget_configurations')
      .select('*', { count: 'exact', head: true })

    const { count: activeConfigurations } = await supabase
      .from('widget_configurations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Total des installations
    const { data: installationData } = await supabase
      .from('widget_configurations')
      .select('installation_count')

    const totalInstallations = installationData?.reduce((sum, item) => sum + (item.installation_count || 0), 0) || 0

    // Templates populaires
    const { data: templateData } = await supabase
      .from('widget_templates')
      .select('id, name, usage_count')
      .order('usage_count', { ascending: false })
      .limit(5)

    // Configurations par catégorie
    const { data: categoryData } = await supabase
      .from('widget_configurations')
      .select(`
        widget_templates!inner(category)
      `)

    const configurationsByCategory = categoryData?.reduce((acc: any[], item: any) => {
      const category = item.widget_templates?.category
      if (category) {
        const existing = acc.find(c => c.category === category)
        if (existing) {
          existing.count++
        } else {
          acc.push({ category, count: 1 })
        }
      }
      return acc
    }, []) || []

    // Activité récente
    const { data: recentActivity } = await supabase
      .from('widget_configurations')
      .select('id, name, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10)

    const recentActivityFormatted = recentActivity?.map(item => ({
      configId: item.id,
      configName: item.name,
      action: item.created_at === item.updated_at ? 'created' : 'updated' as 'created' | 'updated',
      timestamp: item.updated_at
    })) || []

    return {
      totalConfigurations: totalConfigurations || 0,
      activeConfigurations: activeConfigurations || 0,
      totalInstallations,
      popularTemplates: templateData?.map(t => ({
        templateId: t.id,
        templateName: t.name,
        usageCount: t.usage_count
      })) || [],
      configurationsByCategory,
      recentActivity: recentActivityFormatted
    }
  }
}

// TEMPORAIREMENT DÉSACTIVÉ - Tables widget_templates non créées
export class WidgetTemplateService {
  static async getAll(page = 1, limit = 10, search?: string, filters?: Record<string, string[]>) {
    let query = supabase
      .from('widget_templates')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Appliquer les filtres
    if (filters) {
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category)
      }
      if (filters.isPremium && filters.isPremium.length > 0) {
        query = query.in('is_premium', filters.isPremium.map(f => f === 'true'))
      }
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('widget_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async getByCategory(category: string) {
    const { data, error } = await supabase
      .from('widget_templates')
      .select('*')
      .eq('category', category)
      .order('usage_count', { ascending: false })

    if (error) throw error
    return data
  }

  static async create(template: Omit<WidgetTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) {
    const { data, error } = await supabase
      .from('widget_templates')
      .insert({
        name: template.name,
        description: template.description,
        category: template.category,
        preview_image: template.previewImage,
        config_template: template.configTemplate,
        is_premium: template.isPremium,
        created_by: template.createdBy
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, template: Partial<WidgetTemplate>) {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (template.name !== undefined) updateData.name = template.name
    if (template.description !== undefined) updateData.description = template.description
    if (template.category !== undefined) updateData.category = template.category
    if (template.previewImage !== undefined) updateData.preview_image = template.previewImage
    if (template.configTemplate !== undefined) updateData.config_template = template.configTemplate
    if (template.isPremium !== undefined) updateData.is_premium = template.isPremium

    const { data, error } = await supabase
      .from('widget_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async incrementUsage(id: string) {
    const { data, error } = await supabase
      .rpc('increment_template_usage', { template_id: id })

    if (error) throw error
    return data
  }

  static async getCategories() {
    const { data, error } = await supabase
      .from('widget_templates')
      .select('category')
      .not('category', 'is', null)

    if (error) throw error

    const categories = [...new Set(data?.map(item => item.category).filter(Boolean))]
    return categories.sort()
  }
}

// TEMPORAIREMENT DÉSACTIVÉ - Tables widget_assets non créées
export class WidgetAssetService {
  static async getByConfigId(configId: string) {
    const { data, error } = await supabase
      .from('widget_assets')
      .select('*')
      .eq('widget_config_id', configId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async getByType(configId: string, assetType: string) {
    const { data, error } = await supabase
      .from('widget_assets')
      .select('*')
      .eq('widget_config_id', configId)
      .eq('asset_type', assetType)

    if (error) throw error
    return data
  }

  static async create(asset: Omit<WidgetAsset, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('widget_assets')
      .insert({
        widget_config_id: asset.widgetConfigId,
        asset_type: asset.assetType,
        asset_name: asset.assetName,
        file_url: asset.fileUrl,
        file_size: asset.fileSize,
        mime_type: asset.mimeType,
        alt_text: asset.altText,
        is_default: asset.isDefault
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, asset: Partial<WidgetAsset>) {
    const updateData: any = {}

    if (asset.assetName !== undefined) updateData.asset_name = asset.assetName
    if (asset.fileUrl !== undefined) updateData.file_url = asset.fileUrl
    if (asset.altText !== undefined) updateData.alt_text = asset.altText
    if (asset.isDefault !== undefined) updateData.is_default = asset.isDefault

    const { data, error } = await supabase
      .from('widget_assets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('widget_assets')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Service pour les prévisualisations et code embed
export class WidgetPreviewService {
  static async generatePreview(configId: string): Promise<WidgetPreview> {
    const config = await WidgetConfigurationService.getById(configId)
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const previewUrl = `${baseUrl}/widget-iframe/${configId}`
    
    const embedCode = `<iframe 
  src="${previewUrl}" 
  width="${config.layout.width}" 
  height="${config.layout.height}"
  frameborder="0"
  style="border: none; position: fixed; ${config.layout.position.includes('right') ? 'right' : 'left'}: ${config.layout.offsetX}px; ${config.layout.position.includes('top') ? 'top' : 'bottom'}: ${config.layout.offsetY}px; z-index: ${config.layout.zIndex};">
</iframe>`

    const jsCode = `<script>
(function() {
  var widget = document.createElement('iframe');
  widget.src = '${previewUrl}';
  widget.style.cssText = 'border: none; position: fixed; ${config.layout.position.includes('right') ? 'right' : 'left'}: ${config.layout.offsetX}px; ${config.layout.position.includes('top') ? 'top' : 'bottom'}: ${config.layout.offsetY}px; width: ${config.layout.width}px; height: ${config.layout.height}px; z-index: ${config.layout.zIndex};';
  document.body.appendChild(widget);
})();
</script>`

    const cssCode = `/* Styles pour le widget Younzee */
.younzee-widget {
  position: fixed;
  ${config.layout.position.includes('right') ? 'right' : 'left'}: ${config.layout.offsetX}px;
  ${config.layout.position.includes('top') ? 'top' : 'bottom'}: ${config.layout.offsetY}px;
  width: ${config.layout.width}px;
  height: ${config.layout.height}px;
  z-index: ${config.layout.zIndex};
  border: none;
  border-radius: ${config.theme.borderRadius}px;
  box-shadow: ${config.theme.shadowColor} 0 4px 12px;
}`

    return {
      configId,
      previewUrl,
      embedCode,
      jsCode,
      cssCode
    }
  }

  static async updateLastUsed(configId: string) {
    await WidgetConfigurationService.update(configId, {
      // lastUsedAt sera mis à jour automatiquement
    })
  }
}

// Service pour les FAQ
export class FAQService {
  static async getAll(page = 1, limit = 10, search?: string, filters?: { category?: string[], status?: string[] }) {
    let query = supabase
      .from('faq')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`)
    }

    if (filters) {
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category)
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query.range(from, to)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('faq')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async create(faq: {
    question: string
    answer: string
    category: string
    status?: string
    tags?: string[]
    is_highlighted?: boolean
    created_by?: string
  }) {
    const { data, error } = await supabase
      .from('faq')
      .insert({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        status: faq.status || 'Brouillon',
        tags: faq.tags || [],
        is_highlighted: faq.is_highlighted || false,
        created_by: faq.created_by || null,
        popularity: 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, updates: {
    question?: string
    answer?: string
    category?: string
    status?: string
    tags?: string[]
    is_highlighted?: boolean
    popularity?: number
  }) {
    const { data, error } = await supabase
      .from('faq')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('faq')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async bulkInsert(faqs: Array<{
    question: string
    answer: string
    category: string
    status?: string
    tags?: string[]
    is_highlighted?: boolean
    created_by?: string
  }>) {
    const { data, error } = await supabase
      .from('faq')
      .insert(faqs.map(faq => ({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        status: faq.status || 'Brouillon',
        tags: faq.tags || [],
        is_highlighted: faq.is_highlighted || false,
        created_by: faq.created_by,
        popularity: 0
      })))
      .select()

    if (error) throw error
    return data
  }

  static async incrementPopularity(id: string) {
    try {
      const { data, error } = await supabase.rpc('increment_faq_popularity', { faq_id: id })
      if (error) {
        // Si la fonction RPC n'existe pas, faire manuellement
        const current = await this.getById(id)
        return this.update(id, { popularity: (current.popularity || 0) + 1 })
      }
      return data
    } catch (error) {
      // Fallback manuel
      const current = await this.getById(id)
      return this.update(id, { popularity: (current.popularity || 0) + 1 })
    }
  }
}

// Service pour les conversations
export class ConversationService {
  static async getAll(page = 1, limit = 10, search?: string, filters?: { 
    status?: string[], 
    sentiment?: string[],
    chatbotId?: string 
  }) {
    let query = supabase
      .from('conversations')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })

    if (search) {
      // Recherche dans user_id, session_id, tags, et client_info (anonymousId, ipAddress)
      query = query.or(`
        user_id.ilike.%${search}%,
        session_id.ilike.%${search}%,
        tags.cs.{${search}}
      `)
      // Recherche dans client_info JSONB
      query = query.or(`client_info->>anonymousId.ilike.%${search}%,client_info->>ipAddress.ilike.%${search}%`)
    }

    if (filters) {
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }
      if (filters.sentiment && filters.sentiment.length > 0) {
        query = query.in('sentiment', filters.sentiment)
      }
      if (filters.chatbotId) {
        query = query.eq('chatbot_id', filters.chatbotId)
      }
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query.range(from, to)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async getBySessionId(sessionId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data
  }

  static async create(conversation: {
    chatbot_id: string
    user_id?: string
    session_id: string
    status?: string
    sentiment?: string
    resolved_issue?: boolean
    tags?: string[]
    client_info?: {
      anonymousId?: string
      ipAddress?: string
      device?: string
      browser?: string
    }
    messages?: any[]
    metadata?: any
  }) {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        chatbot_id: conversation.chatbot_id,
        user_id: conversation.user_id || null,
        session_id: conversation.session_id,
        status: conversation.status || 'Active',
        sentiment: conversation.sentiment || 'Neutre',
        resolved_issue: conversation.resolved_issue || false,
        tags: conversation.tags || [],
        client_info: conversation.client_info || {},
        messages: conversation.messages || [],
        metadata: conversation.metadata || {}
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, updates: {
    status?: string
    ended_at?: string
    satisfaction?: number
    sentiment?: string
    resolved_issue?: boolean
    tags?: string[]
    messages?: any[]
    client_info?: any
    metadata?: any
  }) {
    const updateData: any = {}
    
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.ended_at !== undefined) updateData.ended_at = updates.ended_at
    if (updates.satisfaction !== undefined) updateData.satisfaction = updates.satisfaction
    if (updates.sentiment !== undefined) updateData.sentiment = updates.sentiment
    if (updates.resolved_issue !== undefined) updateData.resolved_issue = updates.resolved_issue
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.messages !== undefined) updateData.messages = updates.messages
    if (updates.client_info !== undefined) updateData.client_info = updates.client_info
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata

    const { data, error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async addMessage(id: string, message: {
    id: string
    content: string
    type: string
    timestamp: string
    metadata?: any
  }) {
    // Récupérer la conversation actuelle
    const conversation = await this.getById(id)
    const currentMessages = (conversation.messages || []) as any[]
    
    // Ajouter le nouveau message
    const updatedMessages = [...currentMessages, message]
    
    // Mettre à jour la conversation
    return this.update(id, { messages: updatedMessages })
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async getStats(chatbotId?: string) {
    let query = supabase
      .from('conversations')
      .select('*', { count: 'exact' })

    if (chatbotId) {
      query = query.eq('chatbot_id', chatbotId)
    }

    const { data, error, count } = await query

    if (error) throw error

    const conversations = data || []
    const active = conversations.filter(c => c.status === 'Active').length
    const withSatisfaction = conversations.filter(c => c.satisfaction).map(c => c.satisfaction)
    const avgSatisfaction = withSatisfaction.length > 0
      ? withSatisfaction.reduce((sum, s) => sum + s, 0) / withSatisfaction.length
      : 0
    const resolvedRate = conversations.length > 0
      ? (conversations.filter(c => c.resolved_issue).length / conversations.length) * 100
      : 0

    return {
      total: count || 0,
      active,
      averageSatisfaction: avgSatisfaction,
      resolvedRate
    }
  }
}

// Service pour les métriques et performances des widgets
export class WidgetPerformanceService {
  static async getMetrics(configId: string, period: string) {
    // Simulation de métriques pour la démonstration
    const mockMetrics = {
      configId,
      period,
      totalViews: Math.floor(Math.random() * 10000) + 1000,
      totalInteractions: Math.floor(Math.random() * 5000) + 500,
      conversionRate: (Math.random() * 0.15 + 0.05).toFixed(3),
      averageSessionTime: Math.floor(Math.random() * 300) + 60,
      bounceRate: (Math.random() * 0.4 + 0.1).toFixed(3),
      topPages: [
        { page: '/', views: Math.floor(Math.random() * 1000) + 100 },
        { page: '/products', views: Math.floor(Math.random() * 800) + 80 },
        { page: '/contact', views: Math.floor(Math.random() * 500) + 50 }
      ],
      dailyStats: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 500) + 50,
        interactions: Math.floor(Math.random() * 100) + 10
      })).reverse()
    }

    return mockMetrics
  }

  static async getConversationMetrics(configId: string, period: string) {
    return {
      totalConversations: Math.floor(Math.random() * 1000) + 100,
      avgResponseTime: Math.floor(Math.random() * 3000) + 500,
      satisfactionRate: (Math.random() * 0.3 + 0.7).toFixed(3),
      resolvedIssues: Math.floor(Math.random() * 800) + 80,
      escalatedIssues: Math.floor(Math.random() * 50) + 5
    }
  }
} 