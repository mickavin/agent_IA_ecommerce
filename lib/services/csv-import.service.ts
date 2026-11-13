import { supabase } from '../supabase'
import { cleanData } from '@/utils/clean-data'
import Papa from 'papaparse'
import { ProductService, OrderService, ClientService, StockService, FAQService } from './api.service'
import type { TablesInsert } from '../supabase'

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  duplicates: number
  skipped: number
}

export interface ImportOptions {
  skipDuplicates: boolean
  validateData: boolean
  batchSize: number
}

export class AdvancedCSVImportService {
  
  // Import des produits avec validation avancée
  static async importProducts(
    file: File, 
    options: ImportOptions = { skipDuplicates: true, validateData: true, batchSize: 500 }
  ): Promise<ImportResult> {
    console.log('Import des produits')
    try {
      const csvText = await file.text()
      const { data, errors: parseErrors } = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase()
      })

      if (parseErrors.length > 0) {
        return {
          success: false,
          imported: 0,
          errors: parseErrors.map((e: any) => e.message),
          duplicates: 0,
          skipped: 0
        }
      }

      const result: ImportResult = {
        success: true,
        imported: 0,
        errors: [],
        duplicates: 0,
        skipped: 0
      }
      // Validation et transformation des données
      const validProducts: TablesInsert<'products'>[] = []
      const seenHandles = new Set<string>()

      for (const row of data as any[]) {
        try {
          // Validation des champs obligatoires
          if (!row.name && !row.product_title && !row.titre_extrait) {
            result.errors.push(`Ligne ignorée : nom de produit manquant`)
            result.skipped++
            continue
          }

          // Création du handle unique
          const handle = (row.handle || this.generateHandle(row.name || row.product_title || row.titre_extrait)) + row.taille + row.couleur
          
          // Vérification des doublons
          if (options.skipDuplicates && seenHandles.has(handle)) {
            result.duplicates++
            continue
          }
          seenHandles.add(handle)
          console.log('Validation et transformation des données', row)
            //data.forEach((item_cmp: any) => {
               //if (row.handle === item_cmp.handle) {
                //if (item_cmp.taille && !sizes?.includes(item_cmp.taille)) {
                    //sizes.push(item_cmp.taille)
                //}
                //if (item_cmp.couleur && !colors?.includes(item_cmp.couleur)) {
                    //colors.push(item_cmp.couleur)
                //}
                //if (item_cmp.variant_title && !other_variants?.includes(item_cmp.variant_title)) {
                    //other_variants.push(item_cmp.variant_title)
                //}
               //}
            //})
            console.log(row, "dsd")
          // Transformation des données
          const product: TablesInsert<'products'> = {
            name: row.name || row.product_title || row.titre_extrait,
            product_title: row.product_title || row.name || row.titre_extrait,
            description: row.description || '',
            handle,
            thumbnail_url: row.thumbnail_url || row.image_url || row.image || '/placeholder.svg',
            stock: Math.floor(Math.random() * 100),
            price: row.price ? parseFloat(row.price) : row.prix ? parseFloat(row.prix) : 0,
            category: row.type_produit_classifié ? row.type_produit_classifié : row.type_extrait ? row.type_extrait : 'Non classé',
            gender: this.normalizeGender(row.gender),
            sizes: row.taille ? [row.taille] : [],
            colors: row.couleur ? [row.couleur] : [],
            status: this.normalizeStatus(row.status),
            images: this.parseArray(row.images).length > 0 ? this.parseArray(row.images) : [row.image],
            variant_title: row.variant_title || row.couleur + ' - ' + row.taille,
            url: row.url || null,
            available_for_sale: row.availableForSale !== 'false',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          validProducts.push(product)

        } catch (error) {
          result.errors.push(`Erreur ligne ${result.imported + result.skipped + 1}: ${error}`)
          result.skipped++
        }
      }

      // Import par batches
      for (let i = 0; i < validProducts.length; i += options.batchSize) {
        const batch = validProducts.slice(i, i + options.batchSize)
        try {
          await ProductService.bulkInsert(batch)
          result.imported += batch.length
        } catch (error) {
          result.errors.push(`Erreur batch ${Math.floor(i / options.batchSize) + 1}: ${error}`)
        }
      }

      return result

    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Erreur générale: ${error}`],
        duplicates: 0,
        skipped: 0
      }
    }
  }

  // Import des commandes
  static async importOrders(
    file: File,
    options: ImportOptions = { skipDuplicates: true, validateData: true, batchSize: 500 }
  ): Promise<ImportResult> {
    try {
      const csvText = await file.text()
      const { data, errors: parseErrors } = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase()
      })

      if (parseErrors.length > 0) {
        return {
          success: false,
          imported: 0,
          errors: parseErrors.map((e: any) => e.message),
          duplicates: 0,
          skipped: 0
        }
      }

      const result: ImportResult = {
        success: true,
        imported: 0,
        errors: [],
        duplicates: 0,
        skipped: 0
      }

      const validOrders: TablesInsert<'orders'>[] = []

      for (const row of data as any[]) {
        try {
          // Validation des champs obligatoires
          if (!row.customer_name && !row.customer_email) {
            result.errors.push(`Ligne ignorée : informations client manquantes`)
            result.skipped++
            continue
          }

          if (!row.total_amount || isNaN(Number(row.total_amount))) {
            result.errors.push(`Ligne ignorée : montant invalide`)
            result.skipped++
            continue
          }

          const order: TablesInsert<'orders'> = {
            id: row.id || undefined,
            customer_name: row.customer_name || '',
            customer_email: row.customer_email || '',
            date: row.date || new Date().toISOString().split('T')[0],
            status: this.normalizeOrderStatus(row.status),
            total_amount: parseFloat(row.total_amount),
            items_count: parseInt(row.items_count) || 1,
            shipping_address: row.shipping_address || null,
            billing_address: row.billing_address || null,
            notes: row.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          validOrders.push(order)

        } catch (error) {
          result.errors.push(`Erreur ligne ${result.imported + result.skipped + 1}: ${error}`)
          result.skipped++
        }
      }

      // Import par batches
      for (let i = 0; i < validOrders.length; i += options.batchSize) {
        const batch = validOrders.slice(i, i + options.batchSize)
        try {
          await OrderService.bulkInsert(batch)
          result.imported += batch.length
        } catch (error) {
          result.errors.push(`Erreur batch ${Math.floor(i / options.batchSize) + 1}: ${error}`)
        }
      }

      return result

    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Erreur générale: ${error}`],
        duplicates: 0,
        skipped: 0
      }
    }
  }

  // Import des clients
  static async importClients(
    file: File,
    options: ImportOptions = { skipDuplicates: true, validateData: true, batchSize: 500 }
  ): Promise<ImportResult> {
    try {
      const csvText = await file.text()
      const { data, errors: parseErrors } = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase()
      })

      if (parseErrors.length > 0) {
        return {
          success: false,
          imported: 0,
          errors: parseErrors.map((e: any) => e.message),
          duplicates: 0,
          skipped: 0
        }
      }

      const result: ImportResult = {
        success: true,
        imported: 0,
        errors: [],
        duplicates: 0,
        skipped: 0
      }

      const validClients: TablesInsert<'clients'>[] = []
      const seenEmails = new Set<string>()

      for (const row of data as any[]) {
        try {
          // Validation des champs obligatoires
          if (!row.email || !this.isValidEmail(row.email)) {
            result.errors.push(`Ligne ignorée : email invalide ou manquant`)
            result.skipped++
            continue
          }

          // Vérification des doublons
          if (options.skipDuplicates && seenEmails.has(row.email)) {
            result.duplicates++
            continue
          }
          seenEmails.add(row.email)

          const client: TablesInsert<'clients'> = {
            first_name: row.first_name || row.firstname || '',
            last_name: row.last_name || row.lastname || '',
            email: row.email,
            phone: row.phone || null,
            birth_date: row.birth_date || null,
            registration_date: row.registration_date || new Date().toISOString(),
            last_order_date: row.last_order_date || null,
            total_orders: parseInt(row.total_orders) || 0,
            total_spent: parseFloat(row.total_spent) || 0,
            average_order_value: parseFloat(row.average_order_value) || 0,
            segment: this.normalizeClientSegment(row.segment),
            status: this.normalizeClientStatus(row.status),
            preferences: this.parsePreferences(row.preferences),
            loyalty_points: parseInt(row.loyalty_points) || 0,
            notes: row.notes || null,
            tags: this.parseArray(row.tags),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          validClients.push(client)

        } catch (error) {
          result.errors.push(`Erreur ligne ${result.imported + result.skipped + 1}: ${error}`)
          result.skipped++
        }
      }

      // Import par batches
      for (let i = 0; i < validClients.length; i += options.batchSize) {
        const batch = validClients.slice(i, i + options.batchSize)
        try {
          await ClientService.bulkInsert(batch)
          result.imported += batch.length
        } catch (error) {
          result.errors.push(`Erreur batch ${Math.floor(i / options.batchSize) + 1}: ${error}`)
        }
      }

      return result

    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Erreur générale: ${error}`],
        duplicates: 0,
        skipped: 0
      }
    }
  }

  // Méthodes utilitaires
  private static generateHandle(name: string): string {
    return name
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  }

  private static parseArray(value: string | undefined): string[] {
    if (!value) return []
    try {
      // Essayer de parser comme JSON
      return JSON.parse(value)
    } catch {
      // Sinon, diviser par virgule
      return value.split(',').map(item => item.trim()).filter(Boolean)
    }
  }

  private static normalizeGender(gender: string | undefined): string | null {
    if (!gender) return null
    const normalized = gender.toLowerCase()
    if (normalized.includes('homme') || normalized.includes('man')) return 'Homme'
    if (normalized.includes('femme') || normalized.includes('woman')) return 'Femme'
    if (normalized.includes('unisex') || normalized.includes('unisexe')) return 'Unisexe'
    return null
  }

  private static normalizeStatus(status: string | undefined): string {
    if (!status) return 'Actif'
    const normalized = status.toLowerCase()
    if (normalized.includes('actif') || normalized.includes('active')) return 'Actif'
    if (normalized.includes('rupture') || normalized.includes('stock')) return 'Rupture de stock'
    if (normalized.includes('archiv')) return 'Archivé'
    return 'Actif'
  }

  private static normalizeOrderStatus(status: string | undefined): string {
    if (!status) return 'Payée'
    const normalized = status.toLowerCase()
    if (normalized.includes('pay')) return 'Payée'
    if (normalized.includes('prepar')) return 'En préparation'
    if (normalized.includes('expedi')) return 'Expédiée'
    if (normalized.includes('livr')) return 'Livrée'
    if (normalized.includes('annul')) return 'Annulée'
    return 'Payée'
  }

  private static normalizeClientSegment(segment: string | undefined): string {
    if (!segment) return 'Nouveau'
    const normalized = segment.toLowerCase()
    if (normalized.includes('nouveau')) return 'Nouveau'
    if (normalized.includes('regulier') || normalized.includes('regular')) return 'Régulier'
    if (normalized.includes('vip')) return 'VIP'
    if (normalized.includes('inactif')) return 'Inactif'
    if (normalized.includes('risque')) return 'À risque'
    return 'Nouveau'
  }

  private static normalizeClientStatus(status: string | undefined): string {
    if (!status) return 'Actif'
    const normalized = status.toLowerCase()
    if (normalized.includes('actif')) return 'Actif'
    if (normalized.includes('inactif')) return 'Inactif'
    if (normalized.includes('bloqu')) return 'Bloqué'
    return 'Actif'
  }

  private static parsePreferences(preferences: string | undefined): any {
    if (!preferences) return {}
    try {
      return JSON.parse(preferences)
    } catch {
      return {}
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Méthode pour obtenir un template CSV
  static getProductTemplate(): string {
    const headers = [
      'name',
      'product_title',
      'description',
      'handle',
      'price',
      'stock',
      'category',
      'gender',
      'sizes',
      'colors',
      'status',
      'variant_title',
      'thumbnail_url'
    ]
    
    const sampleData = [
      'T-Shirt Élégant',
      'T-Shirt Élégant Noir',
      'Un t-shirt noir classique et élégant',
      't-shirt-elegant-noir',
      '49.99',
      '100',
      'Hauts',
      'Unisexe',
      '["S","M","L","XL"]',
      '["Noir","Blanc"]',
      'Actif',
      'Noir - M',
      '/placeholder.svg'
    ]

    return [headers.join(','), sampleData.join(',')].join('\n')
  }

  static getClientTemplate(): string {
    const headers = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'segment',
      'status',
      'total_orders',
      'total_spent',
      'loyalty_points'
    ]
    
    const sampleData = [
      'Jean',
      'Dupont',
      'jean.dupont@email.com',
      '0123456789',
      'Nouveau',
      'Actif',
      '0',
      '0.00',
      '0'
    ]

    return [headers.join(','), sampleData.join(',')].join('\n')
  }

  static getOrderTemplate(): string {
    const headers = [
      'customer_name',
      'customer_email',
      'date',
      'status',
      'total_amount',
      'items_count',
      'shipping_address',
      'notes'
    ]
    
    const sampleData = [
      'Jean Dupont',
      'jean.dupont@email.com',
      '2024-01-15',
      'Livrée',
      '149.99',
      '2',
      '123 Rue de la Paix, 75001 Paris',
      'Livraison rapide demandée'
    ]

    return [headers.join(','), sampleData.join(',')].join('\n')
  }

  // Import des FAQ
  static async importFAQ(
    file: File,
    options: ImportOptions = { skipDuplicates: true, validateData: true, batchSize: 500 }
  ): Promise<ImportResult> {
    try {
      const csvText = await file.text()
      const { data, errors: parseErrors } = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase()
      })

      if (parseErrors.length > 0) {
        return {
          success: false,
          imported: 0,
          errors: parseErrors.map((e: any) => e.message),
          duplicates: 0,
          skipped: 0
        }
      }

      const result: ImportResult = {
        success: true,
        imported: 0,
        errors: [],
        duplicates: 0,
        skipped: 0
      }

      const validFAQs: Array<{
        question: string
        answer: string
        category: string
        status?: string
        tags?: string[]
        is_highlighted?: boolean
        created_by?: string
      }> = []
      const seenQuestions = new Set<string>()

      for (const row of data as any[]) {
        try {
          // Validation des champs obligatoires
          if (!row.question || !row.answer) {
            result.errors.push(`Ligne ignorée : question ou réponse manquante`)
            result.skipped++
            continue
          }

          // Normaliser la question pour la comparaison
          const normalizedQuestion = row.question.trim().toLowerCase()

          // Vérification des doublons
          if (options.skipDuplicates && seenQuestions.has(normalizedQuestion)) {
            result.duplicates++
            continue
          }
          seenQuestions.add(normalizedQuestion)

          // Normaliser la catégorie
          const category = this.normalizeFAQCategory(row.category)
          if (!category) {
            result.errors.push(`Ligne ignorée : catégorie invalide "${row.category}"`)
            result.skipped++
            continue
          }

          // Normaliser le statut
          const status = this.normalizeFAQStatus(row.status)

          // Parser les tags
          const tags = this.parseArray(row.tags)

          const faq = {
            question: row.question.trim(),
            answer: row.answer.trim(),
            category,
            status,
            tags,
            is_highlighted: row.is_highlighted === 'true' || row.is_highlighted === '1' || row.highlighted === 'true',
            created_by: row.created_by || 'Import CSV'
          }

          validFAQs.push(faq)

        } catch (error: any) {
          result.errors.push(`Erreur ligne ${result.imported + result.skipped + 1}: ${error.message}`)
          result.skipped++
        }
      }

      // Import par batches
      for (let i = 0; i < validFAQs.length; i += options.batchSize) {
        const batch = validFAQs.slice(i, i + options.batchSize)
        try {
          await FAQService.bulkInsert(batch)
          result.imported += batch.length
        } catch (error: any) {
          result.errors.push(`Erreur batch ${Math.floor(i / options.batchSize) + 1}: ${error.message}`)
        }
      }

      return result

    } catch (error: any) {
      return {
        success: false,
        imported: 0,
        errors: [`Erreur générale: ${error.message}`],
        duplicates: 0,
        skipped: 0
      }
    }
  }

  // Méthodes utilitaires pour FAQ
  private static normalizeFAQCategory(category: string | undefined): string | null {
    if (!category) return 'Commandes' // Catégorie par défaut
    
    const normalized = category.trim()
    const validCategories = ['Commandes', 'Livraison', 'Retours', 'Paiements', 'Produits', 'Compte', 'Technique']
    
    // Vérifier si c'est déjà une catégorie valide
    if (validCategories.includes(normalized)) {
      return normalized
    }

    // Normaliser les variations
    const lower = normalized.toLowerCase()
    if (lower.includes('commande') || lower.includes('order')) return 'Commandes'
    if (lower.includes('livraison') || lower.includes('delivery') || lower.includes('shipping')) return 'Livraison'
    if (lower.includes('retour') || lower.includes('return') || lower.includes('refund')) return 'Retours'
    if (lower.includes('paiement') || lower.includes('payment') || lower.includes('pay')) return 'Paiements'
    if (lower.includes('produit') || lower.includes('product')) return 'Produits'
    if (lower.includes('compte') || lower.includes('account')) return 'Compte'
    if (lower.includes('technique') || lower.includes('technical') || lower.includes('tech')) return 'Technique'
    
    return null
  }

  private static normalizeFAQStatus(status: string | undefined): string {
    if (!status) return 'Brouillon'
    
    const normalized = status.trim()
    const validStatuses = ['Publié', 'Brouillon', 'Archivé']
    
    if (validStatuses.includes(normalized)) {
      return normalized
    }

    const lower = normalized.toLowerCase()
    if (lower.includes('publi') || lower.includes('publish') || lower.includes('active')) return 'Publié'
    if (lower.includes('brouillon') || lower.includes('draft')) return 'Brouillon'
    if (lower.includes('archiv') || lower.includes('archive')) return 'Archivé'
    
    return 'Brouillon'
  }

  // Template CSV pour les FAQ
  static getFAQTemplate(): string {
    const headers = [
      'question',
      'answer',
      'category',
      'status',
      'tags',
      'is_highlighted',
      'created_by'
    ]
    
    const sampleData = [
      'Comment puis-je suivre ma commande ?',
      'Vous pouvez suivre votre commande en vous connectant à votre compte et en consultant la section "Mes commandes".',
      'Commandes',
      'Publié',
      'commande,suivi,livraison',
      'true',
      'Admin'
    ]

    return [headers.join(','), sampleData.join(',')].join('\n')
  }
} 