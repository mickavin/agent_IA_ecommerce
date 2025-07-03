import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from '@langchain/core/vectorstores/memory'
import { Document } from '@langchain/core/documents'
import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'

/**
 * Configuration du service RAG
 */
export interface RAGConfig {
  csvFiles: string[]
  embeddingModel: 'text-embedding-3-small' | 'text-embedding-ada-002'
  chunkSize: number
  overlapSize: number
  confidenceThreshold: number
  cacheEnabled: boolean
  maxResults: number
}

/**
 * Structure d'un document produit pour RAG
 */
export interface ProductDocument {
  id: string
  content: string // Description enrichie pour embeddings
  metadata: {
    title: string
    description: string
    price: number
    category: string
    colors: string[]
    sizes: string[]
    handle: string
    status: string
    availableForSale: boolean
    type_produit_classifié: string
    libelle_groupe: string
    couleur_younzee: string
    [key: string]: any
  }
}

/**
 * Résultat de recherche RAG
 */
export interface ProductMatch {
  document: ProductDocument
  score: number
  relevance: 'high' | 'medium' | 'low'
  searchType: 'semantic' | 'keyword' | 'hybrid'
}

/**
 * Métrics RAG pour monitoring
 */
export interface RAGMetrics {
  totalDocuments: number
  lastUpdated: Date
  searchCount: number
  averageSearchTime: number
  cacheHitRate: number
  embeddingModel: string
}

/**
 * Service RAG Core pour LangChain - Gestion complète des données CSV
 */
export class RAGLangchainService {
  private config: RAGConfig
  private embeddings: OpenAIEmbeddings
  private vectorStore: MemoryVectorStore | null = null
  private documents: ProductDocument[] = []
  private searchCache: Map<string, ProductMatch[]> = new Map()
  private metrics: RAGMetrics
  private isInitialized: boolean = false

  constructor(config?: Partial<RAGConfig>) {
    this.config = {
      csvFiles: ['files/shopify_processed.csv'],
      embeddingModel: 'text-embedding-3-small',
      chunkSize: 500,
      overlapSize: 50,
      confidenceThreshold: 0.7,
      cacheEnabled: true,
      maxResults: 10,
      ...config
    }

    this.embeddings = new OpenAIEmbeddings({
      model: this.config.embeddingModel,
      apiKey: process.env.OPENAI_API_KEY,
      batchSize: 50 // Optimisation pour traitement par batch
    })

    this.metrics = {
      totalDocuments: 0,
      lastUpdated: new Date(),
      searchCount: 0,
      averageSearchTime: 0,
      cacheHitRate: 0,
      embeddingModel: this.config.embeddingModel
    }

    console.log('🚀 RAG LangChain Service initialisé')
  }

  /**
   * Initialise le service RAG avec chargement des données
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ RAG déjà initialisé')
      return
    }

    try {
      console.log('📋 Chargement des données CSV...')
      await this.loadAllCSVData()
      
      console.log('🧮 Création des embeddings...')
      await this.createVectorStore()
      
      this.isInitialized = true
      this.metrics.lastUpdated = new Date()
      
      console.log(`✅ RAG initialisé avec ${this.documents.length} produits`)
    } catch (error) {
      console.error('❌ Erreur initialisation RAG:', error)
      throw error
    }
  }

  /**
   * Charge tous les fichiers CSV configurés
   */
  private async loadAllCSVData(): Promise<void> {
    this.documents = []

    for (const csvFile of this.config.csvFiles) {
      try {
        const filePath = path.resolve(csvFile)
        if (fs.existsSync(filePath)) {
          const documents = await this.loadCSVFile(filePath)
          this.documents.push(...documents)
          console.log(`📄 ${csvFile}: ${documents.length} produits chargés`)
        } else {
          console.warn(`⚠️ Fichier non trouvé: ${csvFile}`)
        }
      } catch (error) {
        console.error(`❌ Erreur chargement ${csvFile}:`, error)
      }
    }

    // Déduplication par ID/handle
    this.documents = this.deduplicateDocuments(this.documents)
    this.metrics.totalDocuments = this.documents.length
  }

  /**
   * Charge un fichier CSV spécifique
   */
  private async loadCSVFile(filePath: string): Promise<ProductDocument[]> {
    return new Promise((resolve, reject) => {
      const csvContent = fs.readFileSync(filePath, 'utf8')
      
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const documents = this.convertCSVToDocuments(results.data as any[])
            resolve(documents)
          } catch (error) {
            reject(error)
          }
        },
        error: (error) => reject(error)
      })
    })
  }

  /**
   * Convertit les données CSV en documents ProductDocument
   */
  private convertCSVToDocuments(csvData: any[]): ProductDocument[] {
    const documents: ProductDocument[] = []

    for (const row of csvData) {
      if (!row.product_title && !row.title) continue // Skip lignes vides

      // Normalisation des champs CSV (support multiple formats)
      const title = row.product_title || row.title || 'Produit sans titre'
      const description = row.description || ''
      const handle = row.handle || this.slugify(title)
      const price = parseFloat(row.price) || 0
      const category = row.type_produit_classifié || row.category || 'Non classifié'

      // Extraction couleurs et tailles
      const colors = this.extractArray(row.couleur || row.colors || row.couleur_younzee)
      const sizes = this.extractArray(row.taille || row.sizes || row.variant_title)

      // Création du contenu enrichi pour embeddings
      const enrichedContent = this.createEnrichedContent({
        title,
        description,
        category,
        colors,
        sizes: sizes,
        price,
        groupe: row['Libellé GROUPE'] || row.libelle_groupe
      })

      const document: ProductDocument = {
        id: `${handle}-${row.variant_title || 'default'}`,
        content: enrichedContent,
        metadata: {
          title,
          description,
          price,
          category,
          colors,
          sizes,
          handle,
          status: row.status || 'ACTIVE',
          availableForSale: row.availableForSale !== 'False' && row.availableForSale !== false,
          type_produit_classifié: category,
          libelle_groupe: row['Libellé GROUPE'] || row.libelle_groupe || '',
          couleur_younzee: row.couleur_younzee || colors[0] || '',
          // Préservation de tous les autres champs
          ...Object.fromEntries(
            Object.entries(row).filter(([key]) => 
              !['product_title', 'title', 'description', 'price', 'colors', 'sizes'].includes(key)
            )
          )
        }
      }

      documents.push(document)
    }

    return documents
  }

  /**
   * Crée un contenu enrichi optimisé pour les embeddings
   */
  private createEnrichedContent(product: any): string {
    const parts = [
      `Produit: ${product.title}`,
      product.description ? `Description: ${product.description}` : '',
      `Catégorie: ${product.category}`,
      product.colors?.length ? `Couleurs: ${product.colors.join(', ')}` : '',
      product.sizes?.length ? `Tailles: ${product.sizes.join(', ')}` : '',
      `Prix: ${product.price}€`,
      product.groupe ? `Groupe: ${product.groupe}` : ''
    ]

    return parts.filter(Boolean).join(' | ')
  }

  /**
   * Extrait un array à partir d'une chaîne ou valeur
   */
  private extractArray(value: any): string[] {
    if (!value) return []
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      // Split par virgules, points-virgules ou espaces multiples
      return value.split(/[,;]\s*|\s{2,}/).filter(v => v.trim().length > 0)
    }
    return [String(value)]
  }

  /**
   * Génère un slug à partir d'un titre
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * Déduplique les documents par ID
   */
  private deduplicateDocuments(documents: ProductDocument[]): ProductDocument[] {
    const seen = new Set<string>()
    return documents.filter(doc => {
      const key = `${doc.metadata.handle}-${doc.metadata.title}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Crée le vector store avec embeddings
   */
  private async createVectorStore(): Promise<void> {
    if (this.documents.length === 0) {
      throw new Error('Aucun document à vectoriser')
    }

    // Conversion en documents LangChain
    const langchainDocs = this.documents.map(doc => new Document({
      pageContent: doc.content,
      metadata: { ...doc.metadata, id: doc.id }
    }))

    // Création du vector store par batches pour éviter les timeouts
    const batchSize = 50
    const batches = []
    
    for (let i = 0; i < langchainDocs.length; i += batchSize) {
      batches.push(langchainDocs.slice(i, i + batchSize))
    }

    console.log(`🔄 Traitement en ${batches.length} batches de ${batchSize} documents...`)

    // Traitement du premier batch pour initialiser
    this.vectorStore = await MemoryVectorStore.fromDocuments(
      batches[0],
      this.embeddings
    )

    // Ajout des autres batches
    for (let i = 1; i < batches.length; i++) {
      console.log(`📊 Batch ${i + 1}/${batches.length}...`)
      await this.vectorStore.addDocuments(batches[i])
    }

    console.log('✅ Vector store créé avec succès')
  }

  /**
   * Recherche sémantique dans les produits
   */
  async search(
    query: string, 
    options: {
      k?: number
      confidenceThreshold?: number
      filters?: Partial<ProductDocument['metadata']>
      searchType?: 'semantic' | 'keyword' | 'hybrid'
    } = {}
  ): Promise<ProductMatch[]> {
    
    if (!this.isInitialized) {
      await this.initialize()
    }

    const startTime = Date.now()
    const cacheKey = `${query}-${JSON.stringify(options)}`

    // Vérification cache
    if (this.config.cacheEnabled && this.searchCache.has(cacheKey)) {
      this.metrics.cacheHitRate++
      console.log(`💾 Cache hit pour: "${query.substring(0, 30)}..."`)
      return this.searchCache.get(cacheKey)!
    }

    try {
      const k = options.k || this.config.maxResults
      const searchType = options.searchType || 'semantic'
      
      let results: ProductMatch[] = []

      switch (searchType) {
        case 'semantic':
          results = await this.semanticSearch(query, k)
          break
        case 'keyword':
          results = await this.keywordSearch(query, k)
          break
        case 'hybrid':
          results = await this.hybridSearch(query, k)
          break
      }

      // Application des filtres
      if (options.filters) {
        results = this.applyFilters(results, options.filters)
      }

      // Filtrage par confidence
      const threshold = options.confidenceThreshold || this.config.confidenceThreshold
      results = results.filter(r => r.score >= threshold)

      // Classification de la pertinence
      results = results.map(result => ({
        ...result,
        relevance: this.classifyRelevance(result.score)
      }))

      // Mise en cache
      if (this.config.cacheEnabled) {
        this.searchCache.set(cacheKey, results)
        
        // Nettoyage cache si trop volumineux
        if (this.searchCache.size > 1000) {
          const oldestKey = this.searchCache.keys().next().value
          this.searchCache.delete(oldestKey)
        }
      }

      // Mise à jour des métrics
      const searchTime = Date.now() - startTime
      this.metrics.searchCount++
      this.metrics.averageSearchTime = 
        (this.metrics.averageSearchTime * (this.metrics.searchCount - 1) + searchTime) / 
        this.metrics.searchCount

      console.log(`🔍 Recherche "${query.substring(0, 30)}...": ${results.length} résultats en ${searchTime}ms`)

      return results

    } catch (error) {
      console.error('❌ Erreur recherche RAG:', error)
      return []
    }
  }

  /**
   * Recherche sémantique via embeddings
   */
  private async semanticSearch(query: string, k: number): Promise<ProductMatch[]> {
    if (!this.vectorStore) {
      throw new Error('Vector store non initialisé')
    }

    const results = await this.vectorStore.similaritySearchWithScore(query, k)
    
    return results.map(([doc, score]) => ({
      document: this.findDocumentById(doc.metadata.id),
      score,
      relevance: 'medium' as const,
      searchType: 'semantic' as const
    })).filter(r => r.document) as ProductMatch[]
  }

  /**
   * Recherche par mots-clés (fallback)
   */
  private async keywordSearch(query: string, k: number): Promise<ProductMatch[]> {
    const queryLower = query.toLowerCase()
    const matches: ProductMatch[] = []

    for (const doc of this.documents) {
      const contentLower = doc.content.toLowerCase()
      const titleLower = doc.metadata.title.toLowerCase()
      
      let score = 0
      
      // Score basé sur les mots-clés dans le titre (poids plus élevé)
      const titleWords = queryLower.split(/\s+/)
      for (const word of titleWords) {
        if (titleLower.includes(word)) {
          score += 0.8
        }
      }
      
      // Score basé sur les mots-clés dans le contenu
      const contentWords = queryLower.split(/\s+/)
      for (const word of contentWords) {
        if (contentLower.includes(word)) {
          score += 0.3
        }
      }
      
      if (score > 0) {
        matches.push({
          document: doc,
          score: Math.min(score, 1.0),
          relevance: 'medium' as const,
          searchType: 'keyword' as const
        })
      }
    }

    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
  }

  /**
   * Recherche hybride (sémantique + mots-clés)
   */
  private async hybridSearch(query: string, k: number): Promise<ProductMatch[]> {
    const [semanticResults, keywordResults] = await Promise.all([
      this.semanticSearch(query, k),
      this.keywordSearch(query, k)
    ])

    // Fusion et déduplication des résultats
    const combined = new Map<string, ProductMatch>()

    // Ajout des résultats sémantiques avec poids
    for (const result of semanticResults) {
      combined.set(result.document.id, {
        ...result,
        score: result.score * 0.7,
        searchType: 'hybrid' as const
      })
    }

    // Ajout/fusion des résultats mots-clés
    for (const result of keywordResults) {
      const existing = combined.get(result.document.id)
      if (existing) {
        // Combinaison des scores
        existing.score = Math.min(existing.score + result.score * 0.3, 1.0)
      } else {
        combined.set(result.document.id, {
          ...result,
          score: result.score * 0.3,
          searchType: 'hybrid' as const
        })
      }
    }

    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
  }

  /**
   * Applique des filtres aux résultats
   */
  private applyFilters(results: ProductMatch[], filters: Partial<ProductDocument['metadata']>): ProductMatch[] {
    return results.filter(result => {
      const metadata = result.document.metadata

      // Filtre par catégorie
      if (filters.category && metadata.category !== filters.category) {
        return false
      }

      // Filtre par prix
      if (filters.price && metadata.price > filters.price) {
        return false
      }

      // Filtre par couleurs
      if (filters.colors && filters.colors.length > 0) {
        const hasColor = filters.colors.some(color => 
          metadata.colors.some(productColor => 
            productColor.toLowerCase().includes(color.toLowerCase())
          )
        )
        if (!hasColor) return false
      }

      // Filtre par tailles
      if (filters.sizes && filters.sizes.length > 0) {
        const hasSize = filters.sizes.some(size => 
          metadata.sizes.includes(size)
        )
        if (!hasSize) return false
      }

      // Filtre par disponibilité
      if (filters.availableForSale !== undefined && 
          metadata.availableForSale !== filters.availableForSale) {
        return false
      }

      return true
    })
  }

  /**
   * Classifie la pertinence d'un résultat
   */
  private classifyRelevance(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high'
    if (score >= 0.6) return 'medium'
    return 'low'
  }

  /**
   * Trouve un document par son ID
   */
  private findDocumentById(id: string): ProductDocument | null {
    return this.documents.find(doc => doc.id === id) || null
  }

  /**
   * Rafraîchit les données (rechargement complet)
   */
  async refreshData(): Promise<void> {
    console.log('🔄 Rafraîchissement des données RAG...')
    
    this.isInitialized = false
    this.searchCache.clear()
    this.vectorStore = null
    this.documents = []
    
    await this.initialize()
    
    console.log('✅ Données RAG rafraîchies')
  }

  /**
   * Obtient les métriques du service
   */
  getMetrics(): RAGMetrics {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.searchCount > 0 ? 
        (this.metrics.cacheHitRate / this.metrics.searchCount) * 100 : 0
    }
  }

  /**
   * Test du service RAG
   */
  async test(): Promise<{
    success: boolean
    metrics: RAGMetrics
    sampleSearch?: ProductMatch[]
    error?: string
  }> {
    try {
      console.log('🧪 Test du service RAG...')
      
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Test de recherche
      const sampleSearch = await this.search('t-shirt bleu', { k: 3 })
      
      return {
        success: true,
        metrics: this.getMetrics(),
        sampleSearch
      }
    } catch (error: any) {
      return {
        success: false,
        metrics: this.getMetrics(),
        error: error.message
      }
    }
  }
}

// Export d'une instance singleton
export const ragService = new RAGLangchainService() 