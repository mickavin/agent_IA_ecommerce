import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { Document } from '@langchain/core/documents'
import Papa from 'papaparse'
import fs from 'fs'
import { excelReferentialService, CategoryAnalysis } from '../../lib/services/excel-referential.service'

/**
 * API RAG complète avec OpenAI Embeddings
 * Usage: GET /api/rag-openai?q=t-shirt&k=5&type=semantic
 *        POST /api/rag-openai { "query": "sweat bleu", "k": 3, "searchType": "hybrid" }
 */

interface ProductDocument {
  id: string
  content: string
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
    [key: string]: any
  }
}

interface RAGSearchResult {
  document: ProductDocument
  score: number
  relevance: 'high' | 'medium' | 'low'
  searchType: 'semantic' | 'keyword' | 'hybrid'
}

/**
 * Service RAG avec OpenAI
 */
class OpenAIRAGService {
  private embeddings: OpenAIEmbeddings
  private vectorStore: MemoryVectorStore | null = null
  private documents: ProductDocument[] = []
  private isInitialized = false

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-large', // ✅ Modèle plus performant
      apiKey: process.env.OPENAI_API_KEY,
      batchSize: 50, // ✅ Batch plus petit pour meilleure qualité
      dimensions: 1536 // ✅ Dimensions complètes pour précision maximale
    })
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('🚀 Initialisation RAG OpenAI...')
      
      // ✅ Chargement parallèle des données CSV et référentiels Excel
      await Promise.all([
        this.loadCSVData(),
        excelReferentialService.loadReferentials()
      ])
      
      await this.createVectorStore()
      this.isInitialized = true
      
      const referentialStats = excelReferentialService.getStats()
      console.log(`✅ RAG initialisé: ${this.documents.length} produits + ${referentialStats.total} référentiels`)
    } catch (error) {
      console.error('❌ Erreur initialisation:', error)
      throw error
    }
  }

  private async loadCSVData(): Promise<void> {
    this.documents = []
    const csvFiles = ['data/test_sample.csv', 'files/produits_final.csv']

    for (const csvPath of csvFiles) {
      try {
        if (fs.existsSync(csvPath)) {
          console.log(`📄 Chargement ${csvPath}...`)
          const csvContent = fs.readFileSync(csvPath, 'utf8')
          const documents = await this.parseCSV(csvContent, csvPath)
          this.documents.push(...documents)
          
          // Limiter pour éviter timeouts
          if (this.documents.length >= 2000) break
        }
      } catch (error) {
        console.error(`Erreur ${csvPath}:`, error)
      }
    }

    this.documents = this.deduplicateDocuments(this.documents)
  }

  private async parseCSV(csvContent: string, source: string): Promise<ProductDocument[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          try {
            const documents = results.data
              .map((row: any, index: number) => {
                const title = row.product_title || row.title
                if (!title || !row.price) return null

                const description = row.description || ''
                const price = parseFloat(row.price) || 0
                const category = row.type_produit_classifié || 'Non classifié'
                
                const colors = this.extractArray(row.couleur || row.couleur_younzee)
                const sizes = this.extractArray(row.taille || row.variant_title)

                const content = this.createRichContent({
                  title, description, category, colors, sizes, price
                })

                return {
                  id: `${source}_${index}`,
                  content,
                  metadata: {
                    title,
                    description,
                    price,
                    category,
                    colors,
                    sizes,
                    handle: row.handle || `product-${index}`,
                    status: row.status || 'ACTIVE',
                    availableForSale: row.availableForSale !== 'False',
                    source
                  }
                }
              })
              .filter(Boolean)
            
            resolve(documents)
          } catch (error) {
            reject(error)
          }
        },
        error: reject
      })
    })
  }

  private createRichContent(product: any): string {
    // ✅ Création de contenu enrichi pour embeddings optimaux
    const parts = []
    
    // Titre avec boost sémantique
    if (product.title) {
      parts.push(`Produit: ${product.title}`)
      parts.push(`Article: ${product.title}`) // Synonyme pour améliorer la recherche
    }
    
    // Description enrichie
    if (product.description) {
      parts.push(`Description: ${product.description}`)
      // Extraction de mots-clés de la description pour le contexte
      const keywords = this.extractKeywords(product.description)
      if (keywords.length > 0) {
        parts.push(`Caractéristiques: ${keywords.join(', ')}`)
      }
    }
    
    // Catégorie avec contexte
    if (product.category && product.category !== 'Non classifié') {
      parts.push(`Catégorie: ${product.category}`)
      parts.push(`Type: ${product.category}`) // Synonyme
    }
    
    // Couleurs avec enrichissement
    if (product.colors?.length > 0) {
      const cleanColors = product.colors.filter((c: string) => c && c !== 'Non spécifié')
      if (cleanColors.length > 0) {
        parts.push(`Couleurs disponibles: ${cleanColors.join(', ')}`)
        parts.push(`Coloris: ${cleanColors.join(', ')}`) // Synonyme
      }
    }
    
    // Tailles avec contexte
    if (product.sizes?.length > 0) {
      const cleanSizes = product.sizes.filter((s: string) => s && s !== 'Non spécifié')
      if (cleanSizes.length > 0) {
        parts.push(`Tailles: ${cleanSizes.join(', ')}`)
        parts.push(`Disponible en: ${cleanSizes.join(', ')}`)
      }
    }
    
    // Prix avec contexte de gamme
    if (product.price > 0) {
      parts.push(`Prix: ${product.price}€`)
      // Classification prix pour améliorer la recherche
      const priceCategory = this.getPriceCategory(product.price)
      parts.push(`Gamme: ${priceCategory}`)
    }
    
    // Contexte saisonnier/usage si détectable
    const usageContext = this.inferUsageContext(product.title, product.description, product.category)
    if (usageContext.length > 0) {
      parts.push(`Usage: ${usageContext.join(', ')}`)
    }
    
    return parts.filter(Boolean).join(' | ')
  }

  // ✅ Fonction d'extraction de mots-clés de la description
  private extractKeywords(description: string): string[] {
    if (!description) return []
    
    const keywords: string[] = []
    const desc = description.toLowerCase()
    
    // Matériaux
    const materials = ['coton', 'polyester', 'lin', 'soie', 'laine', 'cuir', 'denim', 'jean']
    materials.forEach(mat => {
      if (desc.includes(mat)) keywords.push(mat)
    })
    
    // Styles
    const styles = ['casual', 'élégant', 'sport', 'vintage', 'moderne', 'classique', 'décontracté']
    styles.forEach(style => {
      if (desc.includes(style)) keywords.push(style)
    })
    
    // Caractéristiques
    const features = ['manches longues', 'manches courtes', 'col rond', 'col v', 'capuche', 'poche']
    features.forEach(feature => {
      if (desc.includes(feature)) keywords.push(feature)
    })
    
    return [...new Set(keywords)] // Déduplique
  }

  // ✅ Classification des prix par gamme
  private getPriceCategory(price: number): string {
    if (price < 20) return 'petit prix'
    if (price < 50) return 'prix abordable'
    if (price < 100) return 'gamme moyenne'
    if (price < 200) return 'gamme élevée'
    return 'haut de gamme'
  }

  // ✅ Inférence du contexte d'usage
  private inferUsageContext(title: string, description: string, category: string): string[] {
    const context = []
    const text = `${title} ${description} ${category}`.toLowerCase()
    
    // Saisons
    if (text.includes('été') || text.includes('léger') || text.includes('short')) {
      context.push('été')
    }
    if (text.includes('hiver') || text.includes('chaud') || text.includes('épais')) {
      context.push('hiver')
    }
    
    // Occasions
    if (text.includes('sport') || text.includes('fitness') || text.includes('jogging')) {
      context.push('sport')
    }
    if (text.includes('travail') || text.includes('bureau') || text.includes('professionnel')) {
      context.push('professionnel')
    }
    if (text.includes('soirée') || text.includes('élégant') || text.includes('chic')) {
      context.push('soirée')
    }
    if (text.includes('décontracté') || text.includes('casual') || text.includes('quotidien')) {
      context.push('quotidien')
    }
    
    return [...new Set(context)]
  }

  private extractArray(value: any): string[] {
    if (!value) return []
    if (Array.isArray(value)) return value
    return String(value).split(/[,;]\s*/).filter(v => v.trim())
  }

  private deduplicateDocuments(docs: ProductDocument[]): ProductDocument[] {
    const seen = new Set()
    return docs.filter(doc => {
      const key = `${doc.metadata.title}_${doc.metadata.price}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private async createVectorStore(): Promise<void> {
    if (this.documents.length === 0) {
      throw new Error('Aucun document à vectoriser')
    }

    const langchainDocs = this.documents.map(doc => new Document({
      pageContent: doc.content,
      metadata: { ...doc.metadata, id: doc.id }
    }))

    console.log(`🔄 Création embeddings pour ${langchainDocs.length} documents...`)

    // Traitement par batches
    const batchSize = 50
    if (langchainDocs.length <= batchSize) {
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        langchainDocs,
        this.embeddings
      )
    } else {
      const firstBatch = langchainDocs.slice(0, batchSize)
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        firstBatch,
        this.embeddings
      )

      for (let i = batchSize; i < langchainDocs.length; i += batchSize) {
        const batch = langchainDocs.slice(i, i + batchSize)
        await this.vectorStore.addDocuments(batch)
        console.log(`📊 Batch ${Math.floor(i/batchSize) + 1}...`)
      }
    }

    console.log('✅ Vector store créé')
  }

  async search(query: string, options: any = {}): Promise<RAGSearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.vectorStore) {
      throw new Error('Vector store non initialisé')
    }

    // ✅ 1️⃣ CATÉGORISATION INTELLIGENTE du prompt
    const categoryAnalysis = await excelReferentialService.categorizeUserPrompt(query)
    console.log(`🏷️ Catégorie: "${categoryAnalysis.detectedCategory}" (${(categoryAnalysis.confidence * 100).toFixed(1)}%)`)

    // ✅ 2️⃣ FILTRAGE DES PRODUITS par catégorie détectée
    const filteredDocuments = this.filterDocumentsByCategory(categoryAnalysis)
    console.log(`🔽 Filtrage: ${filteredDocuments.length}/${this.documents.length} produits sélectionnés`)

    // ✅ 3️⃣ PREPROCESSING de la requête
    const processedQuery = this.preprocessQuery(query)
    console.log(`🔍 Query preprocessing: "${query}" -> "${processedQuery}"`)

    const k = Math.min(options.k || 5, 20)
    const searchType = options.searchType || 'semantic'

    try {
      let results: RAGSearchResult[] = []

      // ✅ 4️⃣ RECHERCHE sur les produits filtrés par catégorie
      if (searchType === 'semantic') {
        results = await this.categorizedSemanticSearch(processedQuery, k, filteredDocuments)
      } else if (searchType === 'keyword') {
        results = await this.categorizedKeywordSearch(processedQuery, k, filteredDocuments)
      } else {
        results = await this.categorizedHybridSearch(processedQuery, k, filteredDocuments)
      }

      // ✅ 5️⃣ POST-PROCESSING avec boost catégoriel
      results = this.postProcessResults(results, query, processedQuery)
      results = this.applyCategoryBoost(results, categoryAnalysis)

      // ✅ 6️⃣ ENRICHISSEMENT avec métadonnées catégorielles
      results = results.map(result => ({
        ...result,
        categoryAnalysis,
        metadata: {
          ...result.document.metadata,
          detectedCategory: categoryAnalysis.detectedCategory,
          categoryConfidence: categoryAnalysis.confidence,
          filteredByCategory: true
        }
      }))

      return results.sort((a, b) => b.score - a.score).slice(0, k)
    } catch (error) {
      console.error('Erreur recherche catégorisée:', error)
      throw error
    }
  }

  private async categorizedSemanticSearch(query: string, k: number, filteredDocuments: ProductDocument[]): Promise<RAGSearchResult[]> {
    const results = await this.vectorStore!.similaritySearchWithScore(query, k)
    
    return results.map(([doc, score]) => {
      const document = filteredDocuments.find(d => d.id === doc.metadata.id)!
      return {
        document,
        score: Math.max(0, Math.min(1, score)),
        relevance: score >= 0.8 ? 'high' : score >= 0.6 ? 'medium' : 'low',
        searchType: 'semantic' as const
      }
    })
  }

  private async categorizedKeywordSearch(query: string, k: number, filteredDocuments: ProductDocument[]): Promise<RAGSearchResult[]> {
    const queryLower = query.toLowerCase()
    const results: RAGSearchResult[] = []
    const words = queryLower.split(/\s+/).filter(w => w.length > 1)

    for (const doc of filteredDocuments) {
      const contentLower = doc.content.toLowerCase()
      const titleLower = doc.metadata.title.toLowerCase()
      const descriptionLower = (doc.metadata.description || '').toLowerCase()
      const categoryLower = doc.metadata.category.toLowerCase()
      
      let score = 0
      let matchCount = 0
      
      for (const word of words) {
        let wordScore = 0
        
        // ✅ Correspondance exacte dans le titre (score élevé)
        if (titleLower.includes(word)) {
          wordScore += 1.0
          matchCount++
        }
        
        // ✅ Correspondance dans la catégorie (score moyen-élevé)
        if (categoryLower.includes(word)) {
          wordScore += 0.8
          matchCount++
        }
        
        // ✅ Correspondance dans la description (score moyen)
        if (descriptionLower.includes(word)) {
          wordScore += 0.6
          matchCount++
        }
        
        // ✅ Correspondance dans le contenu complet (score faible)
        if (contentLower.includes(word)) {
          wordScore += 0.3
        }
        
        // ✅ Bonus pour correspondance de couleur
        if (doc.metadata.colors.some(color => color.toLowerCase().includes(word))) {
          wordScore += 0.7
          matchCount++
        }
        
        // ✅ Bonus pour correspondance de taille
        if (doc.metadata.sizes.some(size => size.toLowerCase().includes(word))) {
          wordScore += 0.5
          matchCount++
        }
        
        score += wordScore
      }

      // ✅ Calcul du score final avec pondération intelligente
      if (score > 0) {
        // Normalisation par le nombre de mots
        let normalizedScore = score / words.length
        
        // ✅ Bonus si plusieurs mots matchent (cohérence)
        if (matchCount > 1) {
          normalizedScore *= 1.2
        }
        
        // ✅ Bonus si correspondance exacte complète
        if (titleLower.includes(queryLower)) {
          normalizedScore *= 1.5
        }
        
        // ✅ Limitation du score maximum
        const finalScore = Math.min(normalizedScore, 1.0)
        
        if (finalScore > 0.1) { // Seuil minimum pour éviter les résultats non pertinents
          results.push({
            document: doc,
            score: finalScore,
            relevance: this.getRelevanceFromScore(finalScore),
            searchType: 'keyword'
          })
        }
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, k * 2) // Plus de résultats pour la recherche hybride
  }

  private async categorizedHybridSearch(query: string, k: number, filteredDocuments: ProductDocument[]): Promise<RAGSearchResult[]> {
    // Récupérer plus de résultats pour un meilleur mélange
    const searchK = Math.min(k * 2, 50)
    
    const [semantic, keyword] = await Promise.all([
      this.categorizedSemanticSearch(query, searchK, filteredDocuments),
      this.categorizedKeywordSearch(query, searchK, filteredDocuments)
    ])

    const combined = new Map<string, RAGSearchResult>()

    // Ajouter les résultats sémantiques (pondération 70%)
    for (const result of semantic) {
      const hybridScore = result.score * 0.7
      combined.set(result.document.id, {
        ...result,
        score: hybridScore,
        relevance: this.getRelevanceFromScore(hybridScore),
        searchType: 'hybrid'
      })
    }

    // Combiner avec les résultats par mots-clés (pondération 30%)
    for (const result of keyword) {
      const existing = combined.get(result.document.id)
      if (existing) {
        // Combiner les scores intelligemment
        const keywordContribution = result.score * 0.3
        const finalScore = Math.min(existing.score + keywordContribution, 1.0)
        existing.score = finalScore
        existing.relevance = this.getRelevanceFromScore(finalScore)
      } else {
        const hybridScore = result.score * 0.3
        combined.set(result.document.id, {
          ...result,
          score: hybridScore,
          relevance: this.getRelevanceFromScore(hybridScore),
          searchType: 'hybrid'
        })
      }
    }

    // TRI PAR SCORE DÉCROISSANT + LIMITATION
    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
  }

  // ✅ Preprocessing intelligent des requêtes
  private preprocessQuery(query: string): string {
    let processed = query.toLowerCase().trim()
    
    // Normalisation des synonymes courants
    const synonyms = {
      'tshirt': 't-shirt',
      'tee shirt': 't-shirt', 
      'tee-shirt': 't-shirt',
      'pull': 'sweat',
      'sweater': 'sweat',
      'jupe': 'robe courte',
      'pantalon': 'jean',
      'basket': 'chaussure',
      'sneaker': 'chaussure',
      'rouge': 'red rouge',
      'bleu': 'blue bleu',
      'vert': 'green vert',
      'noir': 'black noir',
      'blanc': 'white blanc'
    }
    
    // Application des synonymes
    Object.entries(synonyms).forEach(([original, replacement]) => {
      const regex = new RegExp(`\\b${original}\\b`, 'gi')
      processed = processed.replace(regex, replacement)
    })
    
    // Suppression des mots vides peu pertinents
    const stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'pour', 'avec', 'sans']
    const words = processed.split(' ')
    const filteredWords = words.filter(word => !stopWords.includes(word) && word.length > 1)
    
    return filteredWords.join(' ')
  }

  // ✅ Fonction utilitaire pour recalculer la relevance (seuils optimisés)
  private getRelevanceFromScore(score: number): 'high' | 'medium' | 'low' {
    return score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low' // ✅ Seuils plus réalistes
  }

  // ✅ Post-processing des résultats pour booster la pertinence
  private postProcessResults(results: RAGSearchResult[], originalQuery: string, processedQuery: string): RAGSearchResult[] {
    return results.map(result => {
      let boostedScore = result.score
      const title = result.document.metadata.title.toLowerCase()
      const originalLower = originalQuery.toLowerCase()
      
      // ✅ Boost si correspondance exacte dans le titre
      if (title.includes(originalLower)) {
        boostedScore = Math.min(boostedScore * 1.2, 1.0)
      }
      
      // ✅ Boost si le produit est disponible
      if (result.document.metadata.availableForSale) {
        boostedScore = Math.min(boostedScore * 1.1, 1.0)
      }
      
      // ✅ Boost selon la gamme de prix (préférence pour prix moyens)
      const price = result.document.metadata.price
      if (price >= 20 && price <= 100) {
        boostedScore = Math.min(boostedScore * 1.05, 1.0)
      }
      
      return {
        ...result,
        score: boostedScore,
        relevance: this.getRelevanceFromScore(boostedScore)
      }
    })
  }

  // ✅ Enrichissement des résultats avec contexte référentiel Excel
  private enrichResultsWithReferential(results: RAGSearchResult[], referentialContext: string, originalQuery: string): RAGSearchResult[] {
    // Recherche des correspondances dans les référentiels
    return results.map(result => {
      let enrichedScore = result.score
      const title = result.document.metadata.title.toLowerCase()
      const category = result.document.metadata.category.toLowerCase()
      
      // ✅ Boost si correspondance avec référentiel
      const contextLines = referentialContext.toLowerCase().split('\n')
      const hasReferentialMatch = contextLines.some(line => 
        line.includes(title.substring(0, 10)) || 
        line.includes(category) ||
        title.includes(line.substring(0, 10))
      )
      
      if (hasReferentialMatch) {
        enrichedScore = Math.min(enrichedScore * 1.15, 1.0) // Boost +15%
        console.log(`📊 Boost référentiel appliqué: ${result.document.metadata.title}`)
      }
      
      return {
        ...result,
        score: enrichedScore,
        relevance: this.getRelevanceFromScore(enrichedScore),
        metadata: {
          ...result.document.metadata,
          hasReferentialMatch,
          referentialContext: hasReferentialMatch ? referentialContext : undefined
        }
      }
    })
  }

  // ✅ Application du boost catégoriel
  private applyCategoryBoost(results: RAGSearchResult[], categoryAnalysis: any): RAGSearchResult[] {
    return results.map(result => {
      let boostedScore = result.score
      const category = result.document.metadata.category.toLowerCase()
      const detectedCategory = categoryAnalysis.detectedCategory.toLowerCase()
      
      // ✅ Boost si correspondance catégorielle
      if (category.includes(detectedCategory) || detectedCategory.includes(category)) {
        boostedScore = Math.min(boostedScore * 1.2, 1.0) // Boost +20%
        console.log(`📊 Boost catégoriel appliqué: ${result.document.metadata.title}`)
      }
      
      return {
        ...result,
        score: boostedScore,
        relevance: this.getRelevanceFromScore(boostedScore)
      }
    })
  }

  // ✅ Filtrage intelligent des documents par catégorie
  private filterDocumentsByCategory(categoryAnalysis: any): ProductDocument[] {
    const detectedCategory = categoryAnalysis.detectedCategory.toLowerCase()
    const suggestedFilters = categoryAnalysis.suggestedFilters || []
    
    // Si confiance faible, retourner tous les documents
    if (categoryAnalysis.confidence < 0.3) {
      console.log(`⚠️ Confiance faible (${(categoryAnalysis.confidence * 100).toFixed(1)}%), pas de filtrage`)
      return this.documents
    }
    
    const filtered = this.documents.filter(doc => {
      const docCategory = doc.metadata.category.toLowerCase()
      
      // ✅ Correspondance directe catégorie
      if (docCategory.includes(detectedCategory) || detectedCategory.includes(docCategory)) {
        return true
      }
      
      // ✅ Correspondance via filtres suggérés
      for (const filter of suggestedFilters) {
        if (filter.confidence > 0.5) {
          const filterValue = filter.value.toLowerCase()
          if (docCategory.includes(filterValue) || filterValue.includes(docCategory)) {
            return true
          }
        }
      }
      
      // ✅ Correspondance via sous-catégories
      for (const subCat of categoryAnalysis.subCategories || []) {
        const subCatLower = subCat.toLowerCase()
        if (docCategory.includes(subCatLower) || subCatLower.includes(docCategory)) {
          return true
        }
      }
      
      return false
    })
    
    // Si filtrage trop restrictif, relaxer les critères
    if (filtered.length < 10 && this.documents.length > 50) {
      console.log(`🔄 Filtrage trop restrictif (${filtered.length} résultats), relaxation des critères`)
      
      return this.documents.filter(doc => {
        const docCategory = doc.metadata.category.toLowerCase()
        const title = doc.metadata.title.toLowerCase()
        
        // Correspondance plus souple
        for (const word of detectedCategory.split(/\s+/)) {
          if (word.length > 3 && (docCategory.includes(word) || title.includes(word))) {
            return true
          }
        }
        return false
      })
    }
    
    return filtered.length > 0 ? filtered : this.documents
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      documentsLoaded: this.documents.length,
      hasVectorStore: !!this.vectorStore,
      embeddingmodel: 'text-embedding-3-large'
    }
  }
}

// Instance globale
let ragService: OpenAIRAGService | null = null

function getRAGService(): OpenAIRAGService {
  if (!ragService) {
    ragService = new OpenAIRAGService()
  }
  return ragService
}

/**
 * Handler API
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  // Vérification OpenAI
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Clé API OpenAI manquante. Ajoutez OPENAI_API_KEY dans .env.local'
    })
  }

  const startTime = Date.now()

  try {
    // Paramètres
    const query = req.method === 'GET' 
      ? (req.query.q as string) || 't-shirt'
      : req.body?.query || 't-shirt'

    const k = req.method === 'GET'
      ? Math.min(parseInt(req.query.k as string) || 5, 20)
      : Math.min(req.body?.k || 5, 20)

    const searchType = req.method === 'GET'
      ? (req.query.type as string) || 'hybrid'
      : req.body?.searchType || 'hybrid'

    console.log(`🔍 RAG OpenAI Query: "${query}", k: ${k}, type: ${searchType}`)

    // Service RAG
    const service = getRAGService()
    const results = await service.search(query, { k, searchType })
    const stats = service.getStats()

    const searchTime = Date.now() - startTime

    // Réponse
    return res.status(200).json({
      success: true,
      data: {
        query,
        results,
        totalFound: results.length,
        searchTime,
        searchType,
        embeddingmodel: 'text-embedding-3-large'
      },
      metadata: {
        documentsLoaded: stats.documentsLoaded,
        vectorStoreCreated: stats.hasVectorStore,
        openaiConfigured: true
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur RAG OpenAI:', error)

    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur interne',
      metadata: {
        documentsLoaded: 0,
        vectorStoreCreated: false,
        openaiConfigured: !!process.env.OPENAI_API_KEY
      }
    })
  }
} 


