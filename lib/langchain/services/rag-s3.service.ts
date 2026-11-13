/**
 * Service RAG avec support S3 - Version améliorée
 * Permet de charger les données depuis AWS S3 et de synchroniser automatiquement
 */

import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { Document } from '@langchain/core/documents'
import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import Papa from 'papaparse'
import { ProductDocument, ProductMatch } from './rag.service'

export interface S3RAGConfig {
  bucketName: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  csvPrefix?: string // Préfixe pour filtrer les fichiers CSV (ex: "shopify-products-")
  autoRefresh?: boolean // Rafraîchissement automatique
  refreshInterval?: number // Intervalle en minutes
}

export interface S3FileInfo {
  key: string
  lastModified: Date
  size: number
  etag: string
}

export class S3RAGService {
  private embeddings: OpenAIEmbeddings
  private vectorStore: MemoryVectorStore | null = null
  private documents: ProductDocument[] = []
  private isInitialized = false
  private s3Client: S3Client
  private config: S3RAGConfig
  private lastLoadedFile: string | null = null
  private lastModified: Date | null = null
  private refreshTimer: NodeJS.Timeout | null = null

  constructor(config: S3RAGConfig) {
    this.config = {
      csvPrefix: 'shopify-products-',
      autoRefresh: true,
      refreshInterval: 30, // 30 minutes par défaut
      ...config
    }

    this.embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-large',
      apiKey: process.env.OPENAI_API_KEY,
      batchSize: 500
    })

    this.s3Client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      forcePathStyle: false,
      maxAttempts: 3,
    })

    console.log('🚀 S3RAGService initialisé avec:', {
      bucket: this.config.bucketName,
      region: this.config.region,
      prefix: this.config.csvPrefix,
      autoRefresh: this.config.autoRefresh
    })
  }

  /**
   * Initialise le service avec le fichier le plus récent
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('📋 Initialisation du service S3RAG...')
      
      // Charger le fichier le plus récent
      const latestFile = await this.getLatestCSVFile()
      if (latestFile) {
        await this.loadFromS3(latestFile.key)
      } else {
        // Fallback vers les fichiers locaux si aucun fichier S3
        await this.loadLocalCSVData()
      }

      await this.createVectorStore()
      this.isInitialized = true
      
      // Démarrer le rafraîchissement automatique
      if (this.config.autoRefresh) {
        this.startAutoRefresh()
      }
      
      console.log(`✅ S3RAG initialisé avec ${this.documents.length} produits`)
    } catch (error) {
      console.error('❌ Erreur initialisation S3RAG:', error)
      throw error
    }
  }

  /**
   * Récupère le fichier CSV le plus récent depuis S3
   */
  private async getLatestCSVFile(): Promise<S3FileInfo | null> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        Prefix: this.config.csvPrefix,
        MaxKeys: 100
      })

      const response = await this.s3Client.send(command)
      
      if (!response.Contents || response.Contents.length === 0) {
        console.log('⚠️ Aucun fichier CSV trouvé sur S3')
        return null
      }

      // Trier par date de modification (plus récent en premier)
      const csvFiles = response.Contents
        .filter(obj => obj.Key?.endsWith('.csv'))
        .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0))

      if (csvFiles.length === 0) {
        console.log('⚠️ Aucun fichier CSV trouvé avec le préfixe:', this.config.csvPrefix)
        return null
      }

      const latest = csvFiles[0]
      console.log('📄 Fichier CSV le plus récent trouvé:', latest.Key)
      
      return {
        key: latest.Key!,
        lastModified: latest.LastModified!,
        size: latest.Size || 0,
        etag: latest.ETag || ''
      }
    } catch (error) {
      console.error('❌ Erreur récupération fichiers S3:', error)
      return null
    }
  }

  /**
   * Charge les données depuis un fichier S3 spécifique
   */
  async loadFromS3(fileKey: string): Promise<void> {
    try {
      console.log(`☁️ Chargement depuis S3: ${fileKey}`)
      
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileKey
      })

      const response = await this.s3Client.send(command)
      
      if (!response.Body) {
        throw new Error('Fichier S3 vide ou inaccessible')
      }

      // Convertir le stream en string
      const csvContent = await response.Body.transformToString()
      
      // Parser le CSV
      const documents = await this.parseCSV(csvContent)
      this.documents = documents
      this.lastLoadedFile = fileKey
      this.lastModified = new Date()
      
      console.log(`✅ ${documents.length} produits chargés depuis S3`)
    } catch (error) {
      console.error('❌ Erreur chargement S3:', error)
      throw error
    }
  }

  /**
   * Fallback vers les fichiers locaux
   */
  private async loadLocalCSVData(): Promise<void> {
    console.log('📁 Chargement des données locales (fallback)...')
    this.documents = []
    const csvFiles = ['data/test_sample.csv', 'files/produits_final.csv']

    for (const csvFile of csvFiles) {
      try {
        if (typeof window === 'undefined') {
          const fs = await import('fs')
          
          if (fs.existsSync(csvFile)) {
            const csvContent = fs.readFileSync(csvFile, 'utf8')
            const documents = await this.parseCSV(csvContent)
            this.documents.push(...documents)
            console.log(`📄 ${csvFile}: ${documents.length} produits chargés`)
          }
        }
      } catch (error) {
        console.error(`❌ Erreur chargement ${csvFile}:`, error)
      }
    }
  }

  /**
   * Parse un contenu CSV et retourne des documents
   */
  private async parseCSV(csvContent: string): Promise<ProductDocument[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          try {
            const documents = results.data.map((row: any, index: number) => {
              const title = row.product_title || row.title || 'Produit sans titre'
              const description = row.description || ''
              const price = parseFloat(row.price) || 0
              const category = row.category || row.type_produit_classifié || 'Non classifié'
              
              // Gestion des options/variants
              const option1 = row.option1 || ''
              const option2 = row.option2 || ''
              const option3 = row.option3 || ''
              
              // Gestion des couleurs et tailles
              const colors = [
                row.couleur_younzee, 
                row.others_options1, 
                option1
              ].filter(Boolean).join(';').split(';').filter(Boolean)
              
              const sizes = [
                row.taille_extraite,
                row.others_options2,
                option2
              ].filter(Boolean).join(';').split(';').filter(Boolean)
              
              const content = `${title} | ${description} | ${category} | ${price}€ | ${colors.join(', ')} | ${sizes.join(', ')} | ${row.handle} | ${row.status} | ${row.availableForSale ? 'Disponible' : 'Non disponible'}`
              
              return {
                id: row.id || `product-${index}`,
                content,
                metadata: {
                  title,
                  description,
                  price,
                  category,
                  colors: colors.length > 0 ? colors : ['Non spécifié'],
                  sizes: sizes.length > 0 ? sizes : ['Non spécifié'],
                  handle: row.handle || `product-${index}`,
                  status: row.status || 'ACTIVE',
                  availableForSale: row.availableForSale !== 'False' && row.availableForSale !== false,
                  vendor: row.vendor || '',
                  tags: row.tags ? row.tags.split(';').filter(Boolean) : [],
                  stock: parseInt(row.stock) || 0,
                  thumbnailUrl: row.thumbnail_url || '',
                  option1,
                  option2,
                  option3
                }
              }
            })
            resolve(documents.filter((doc: ProductDocument) => doc.metadata.title !== 'Produit sans titre'))
          } catch (error) {
            reject(error)
          }
        },
        error: reject
      })
    })
  }

  /**
   * Crée le vector store avec les documents
   */
  private async createVectorStore(): Promise<void> {
    if (this.documents.length === 0) {
      throw new Error('Aucun document à vectoriser')
    }

    const langchainDocs = this.documents.map((doc: ProductDocument) => new Document({
      pageContent: doc.content,
      metadata: { ...doc.metadata, id: doc.id }
    }))

    console.log(`🔄 Création des embeddings pour ${langchainDocs.length} documents...`)
    
    // Traitement par batch pour éviter les timeouts
    const batchSize = 500
    if (langchainDocs.length <= batchSize) {
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        langchainDocs,
        this.embeddings
      )
    } else {
      // Premier batch pour initialiser
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        langchainDocs.slice(0, batchSize),
        this.embeddings
      )
      
      // Ajouter les autres par batch
      for (let i = batchSize; i < langchainDocs.length; i += batchSize) {
        const batch = langchainDocs.slice(i, i + batchSize)
        console.log(`📊 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(langchainDocs.length/batchSize)}...`)
        await this.vectorStore.addDocuments(batch)
      }
    }

    console.log('✅ Vector store créé avec succès')
  }

  /**
   * Recherche sémantique avec support de filtres
   */
  async search(
    query: string, 
    options: {
      k?: number
      filters?: Partial<ProductDocument['metadata']>
      searchType?: 'semantic' | 'hybrid'
    } = {}
  ): Promise<ProductMatch[]> {
    const { k = 5, filters, searchType = 'semantic' } = options
    
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.vectorStore) {
      throw new Error('Vector store non initialisé')
    }

    try {
      const results = await this.vectorStore.similaritySearchWithScore(query, k * 2) // Récupérer plus pour le filtrage
      
      let filteredResults = results.map(([doc, score]: [Document, number]) => ({
        document: this.documents.find((d: ProductDocument) => d.id === doc.metadata.id)!,
        score,
        relevance: score >= 0.8 ? 'high' : score >= 0.6 ? 'medium' : 'low',
        searchType: searchType as const
      })).filter((r: ProductMatch) => r.document)

      // Appliquer les filtres si fournis
      if (filters) {
        filteredResults = filteredResults.filter(result => {
          const metadata = result.document.metadata
          return Object.entries(filters).every(([key, value]) => {
            if (value === undefined) return true
            if (Array.isArray(metadata[key])) {
              return Array.isArray(value) 
                ? value.some(v => metadata[key].includes(v))
                : metadata[key].includes(value)
            }
            return metadata[key] === value
          })
        })
      }

      return filteredResults.slice(0, k)
    } catch (error) {
      console.error('❌ Erreur recherche:', error)
      return []
    }
  }

  /**
   * Rafraîchit les données depuis S3
   */
  async refreshFromS3(): Promise<boolean> {
    try {
      console.log('🔄 Rafraîchissement depuis S3...')
      
      const latestFile = await this.getLatestCSVFile()
      if (!latestFile) {
        console.log('⚠️ Aucun fichier à rafraîchir')
        return false
      }

      // Vérifier si le fichier a changé
      if (this.lastLoadedFile === latestFile.key && 
          this.lastModified && 
          latestFile.lastModified <= this.lastModified) {
        console.log('✅ Données déjà à jour')
        return false
      }

      // Recharger les données
      await this.loadFromS3(latestFile.key)
      await this.createVectorStore()
      
      console.log('✅ Rafraîchissement terminé')
      return true
    } catch (error) {
      console.error('❌ Erreur rafraîchissement:', error)
      return false
    }
  }

  /**
   * Démarre le rafraîchissement automatique
   */
  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }

    const intervalMs = (this.config.refreshInterval || 30) * 60 * 1000
    this.refreshTimer = setInterval(async () => {
      console.log('⏰ Rafraîchissement automatique...')
      await this.refreshFromS3()
    }, intervalMs)

    console.log(`⏰ Rafraîchissement automatique activé (${this.config.refreshInterval} min)`)
  }

  /**
   * Arrête le rafraîchissement automatique
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
      console.log('⏹️ Rafraîchissement automatique arrêté')
    }
  }

  /**
   * Obtient les statistiques du service
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      documentsLoaded: this.documents.length,
      hasVectorStore: !!this.vectorStore,
      lastLoadedFile: this.lastLoadedFile,
      lastModified: this.lastModified,
      embeddingModel: 'text-embedding-3-large',
      s3Config: {
        bucket: this.config.bucketName,
        region: this.config.region,
        prefix: this.config.csvPrefix,
        autoRefresh: this.config.autoRefresh
      }
    }
  }

  /**
   * Test du service
   */
  async test(): Promise<{ success: boolean; results?: ProductMatch[]; error?: string; stats?: any }> {
    try {
      console.log('🧪 Test du service S3RAG...')
      
      if (!this.isInitialized) {
        await this.initialize()
      }

      const results = await this.search('t-shirt en coton', { k: 3 })
      
      console.log(`✅ Test réussi: ${results.length} résultats trouvés`)
      results.forEach((r: ProductMatch) => {
        console.log(`- ${r.document.metadata.title} (score: ${r.score.toFixed(3)})`)
      })

      return { 
        success: true, 
        results,
        stats: this.getStats()
      }
    } catch (error: any) {
      console.error('❌ Test échoué:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Nettoyage des ressources
   */
  destroy(): void {
    this.stopAutoRefresh()
    this.vectorStore = null
    this.documents = []
    this.isInitialized = false
    console.log('🧹 Service S3RAG nettoyé')
  }
}

// Factory pour créer une instance avec la config d'environnement
export function createS3RAGService(): S3RAGService {
  const config: S3RAGConfig = {
    bucketName: process.env.AWS_S3_BUCKET_NAME!,
    region: process.env.AWS_REGION || 'eu-west-3',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    csvPrefix: 'shopify-products-',
    autoRefresh: true,
    refreshInterval: 30
  }

  return new S3RAGService(config)
}

// Instance singleton
export const s3RagService = createS3RAGService() 