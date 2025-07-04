/**
 * Service Manager pour RAG S3 - Interface simplifiée
 * Fournit des méthodes haut niveau pour utiliser le RAG S3
 */

import { s3RagService, S3RAGService } from '@/lib/langchain/services/rag-s3.service'
import { ProductMatch } from '@/lib/langchain/services/rag.service'

export interface SearchOptions {
  maxResults?: number
  category?: string
  colors?: string[]
  sizes?: string[]
  availableOnly?: boolean
  minPrice?: number
  maxPrice?: number
  vendor?: string
  tags?: string[]
}

export interface SearchResult {
  id: string
  title: string
  description: string
  price: number
  category: string
  colors: string[]
  sizes: string[]
  handle: string
  availableForSale: boolean
  vendor: string
  tags: string[]
  stock: number
  thumbnailUrl: string
  score: number
  relevance: 'high' | 'medium' | 'low'
}

export interface SearchResponse {
  results: SearchResult[]
  totalResults: number
  searchTime: number
  query: string
  filters: any
  suggestions?: string[]
}

export class RAGS3Manager {
  private service: S3RAGService

  constructor() {
    this.service = s3RagService
  }

  /**
   * Recherche de produits avec options simplifiées
   */
  async searchProducts(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const startTime = Date.now()
    
    // Convertir les options en filtres
    const filters: any = {}
    
    if (options.category) filters.category = options.category
    if (options.availableOnly) filters.availableForSale = true
    if (options.vendor) filters.vendor = options.vendor
    if (options.colors && options.colors.length > 0) filters.colors = options.colors
    if (options.sizes && options.sizes.length > 0) filters.sizes = options.sizes
    if (options.tags && options.tags.length > 0) filters.tags = options.tags

    // Effectuer la recherche
    const matches = await this.service.search(query, {
      k: options.maxResults || 10,
      filters,
      searchType: 'semantic'
    })

    // Filtrer par prix si spécifié
    let filteredMatches = matches
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      filteredMatches = matches.filter(match => {
        const price = match.document.metadata.price
        if (options.minPrice !== undefined && price < options.minPrice) return false
        if (options.maxPrice !== undefined && price > options.maxPrice) return false
        return true
      })
    }

    // Convertir en format simplifié
    const results: SearchResult[] = filteredMatches.map(match => ({
      id: match.document.id,
      title: match.document.metadata.title,
      description: match.document.metadata.description,
      price: match.document.metadata.price,
      category: match.document.metadata.category,
      colors: match.document.metadata.colors,
      sizes: match.document.metadata.sizes,
      handle: match.document.metadata.handle,
      availableForSale: match.document.metadata.availableForSale,
      vendor: match.document.metadata.vendor || '',
      tags: match.document.metadata.tags || [],
      stock: match.document.metadata.stock || 0,
      thumbnailUrl: match.document.metadata.thumbnailUrl || '',
      score: match.score,
      relevance: match.relevance
    }))

    const searchTime = Date.now() - startTime

    return {
      results,
      totalResults: results.length,
      searchTime,
      query,
      filters,
      suggestions: this.generateSuggestions(query, results)
    }
  }

  /**
   * Recherche par catégorie
   */
  async searchByCategory(category: string, options: SearchOptions = {}): Promise<SearchResponse> {
    return this.searchProducts(category, { ...options, category })
  }

  /**
   * Recherche par couleur
   */
  async searchByColor(color: string, options: SearchOptions = {}): Promise<SearchResponse> {
    return this.searchProducts(color, { ...options, colors: [color] })
  }

  /**
   * Recherche de produits similaires
   */
  async findSimilarProducts(productId: string, maxResults: number = 5): Promise<SearchResponse> {
    // Récupérer d'abord le produit de référence
    const stats = await this.service.getStats()
    if (!stats.isInitialized) {
      throw new Error('Service RAG S3 non initialisé')
    }

    // Simuler une recherche basée sur les métadonnées du produit
    // En pratique, vous pourriez récupérer le produit et utiliser ses caractéristiques
    const query = `produit similaire ${productId}`
    
    return this.searchProducts(query, { maxResults })
  }

  /**
   * Recherche avec autocomplétion
   */
  async autocomplete(partialQuery: string, limit: number = 5): Promise<string[]> {
    if (partialQuery.length < 2) return []

    try {
      const results = await this.searchProducts(partialQuery, { maxResults: limit * 2 })
      
      // Extraire les suggestions basées sur les titres des résultats
      const suggestions = new Set<string>()
      
      results.results.forEach(result => {
        const title = result.title.toLowerCase()
        const words = title.split(' ')
        
        words.forEach(word => {
          if (word.startsWith(partialQuery.toLowerCase()) && word.length > partialQuery.length) {
            suggestions.add(word)
          }
        })
      })

      return Array.from(suggestions).slice(0, limit)
    } catch (error) {
      console.error('Erreur autocomplétion:', error)
      return []
    }
  }

  /**
   * Obtient les catégories disponibles
   */
  async getCategories(): Promise<string[]> {
    const stats = this.service.getStats()
    if (!stats.isInitialized) {
      await this.service.initialize()
    }

    // Effectuer une recherche large pour obtenir un échantillon
    const results = await this.service.search('*', { k: 100 })
    const categories = new Set<string>()
    
    results.forEach(match => {
      if (match.document.metadata.category) {
        categories.add(match.document.metadata.category)
      }
    })

    return Array.from(categories).sort()
  }

  /**
   * Obtient les couleurs disponibles
   */
  async getAvailableColors(): Promise<string[]> {
    const stats = this.service.getStats()
    if (!stats.isInitialized) {
      await this.service.initialize()
    }

    const results = await this.service.search('*', { k: 100 })
    const colors = new Set<string>()
    
    results.forEach(match => {
      if (match.document.metadata.colors) {
        match.document.metadata.colors.forEach(color => {
          if (color && color !== 'Non spécifié') {
            colors.add(color)
          }
        })
      }
    })

    return Array.from(colors).sort()
  }

  /**
   * Obtient les tailles disponibles
   */
  async getAvailableSizes(): Promise<string[]> {
    const stats = this.service.getStats()
    if (!stats.isInitialized) {
      await this.service.initialize()
    }

    const results = await this.service.search('*', { k: 100 })
    const sizes = new Set<string>()
    
    results.forEach(match => {
      if (match.document.metadata.sizes) {
        match.document.metadata.sizes.forEach(size => {
          if (size && size !== 'Non spécifié') {
            sizes.add(size)
          }
        })
      }
    })

    return Array.from(sizes).sort()
  }

  /**
   * Rafraîchit les données depuis S3
   */
  async refresh(): Promise<{ success: boolean; message: string }> {
    try {
      const refreshed = await this.service.refreshFromS3()
      return {
        success: true,
        message: refreshed ? 'Données rafraîchies depuis S3' : 'Données déjà à jour'
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Erreur lors du rafraîchissement: ${error.message}`
      }
    }
  }

  /**
   * Obtient les statistiques du service
   */
  getServiceStats() {
    return this.service.getStats()
  }

  /**
   * Test du service
   */
  async test(): Promise<{ success: boolean; message: string; sampleResults?: SearchResult[] }> {
    try {
      const testResult = await this.service.test()
      
      if (testResult.success && testResult.results) {
        const sampleResults = testResult.results.map(match => ({
          id: match.document.id,
          title: match.document.metadata.title,
          description: match.document.metadata.description,
          price: match.document.metadata.price,
          category: match.document.metadata.category,
          colors: match.document.metadata.colors,
          sizes: match.document.metadata.sizes,
          handle: match.document.metadata.handle,
          availableForSale: match.document.metadata.availableForSale,
          vendor: match.document.metadata.vendor || '',
          tags: match.document.metadata.tags || [],
          stock: match.document.metadata.stock || 0,
          thumbnailUrl: match.document.metadata.thumbnailUrl || '',
          score: match.score,
          relevance: match.relevance
        }))

        return {
          success: true,
          message: 'Test réussi',
          sampleResults
        }
      }

      return {
        success: false,
        message: testResult.error || 'Test échoué'
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Erreur lors du test: ${error.message}`
      }
    }
  }

  /**
   * Génère des suggestions basées sur les résultats
   */
  private generateSuggestions(query: string, results: SearchResult[]): string[] {
    const suggestions: string[] = []
    
    // Suggestions basées sur les catégories trouvées
    const categories = new Set<string>()
    results.forEach(result => {
      if (result.category && !categories.has(result.category)) {
        categories.add(result.category)
        suggestions.push(`${query} ${result.category}`)
      }
    })

    // Suggestions basées sur les couleurs
    const colors = new Set<string>()
    results.forEach(result => {
      result.colors.forEach(color => {
        if (color && color !== 'Non spécifié' && !colors.has(color)) {
          colors.add(color)
          suggestions.push(`${query} ${color}`)
        }
      })
    })

    return suggestions.slice(0, 5) // Limiter à 5 suggestions
  }
}

// Instance singleton
export const ragS3Manager = new RAGS3Manager()

// Fonctions utilitaires pour l'utilisation directe
export const searchProducts = (query: string, options?: SearchOptions) => 
  ragS3Manager.searchProducts(query, options)

export const searchByCategory = (category: string, options?: SearchOptions) => 
  ragS3Manager.searchByCategory(category, options)

export const searchByColor = (color: string, options?: SearchOptions) => 
  ragS3Manager.searchByColor(color, options)

export const findSimilarProducts = (productId: string, maxResults?: number) => 
  ragS3Manager.findSimilarProducts(productId, maxResults)

export const autocomplete = (partialQuery: string, limit?: number) => 
  ragS3Manager.autocomplete(partialQuery, limit)

export const refreshRAG = () => ragS3Manager.refresh()

export const getRAGStats = () => ragS3Manager.getServiceStats()

export const testRAG = () => ragS3Manager.test() 