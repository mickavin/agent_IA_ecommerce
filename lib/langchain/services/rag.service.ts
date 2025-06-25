/**
 * Service RAG Core pour LangChain - Système de recherche sémantique
 */

import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { Document } from '@langchain/core/documents'
import Papa from 'papaparse'

export interface ProductDocument {
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

export interface ProductMatch {
  document: ProductDocument
  score: number
  relevance: 'high' | 'medium' | 'low'
  searchType: 'semantic' | 'keyword' | 'hybrid'
}

export class RAGService {
  private embeddings: OpenAIEmbeddings
  private vectorStore: MemoryVectorStore | null = null
  private documents: ProductDocument[] = []
  private isInitialized = false

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-small',
      apiKey: process.env.OPENAI_API_KEY,
      batchSize: 50
    })
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('📋 Initialisation du service RAG...')
      await this.loadCSVData()
      await this.createVectorStore()
      this.isInitialized = true
      console.log(`✅ RAG initialisé avec ${this.documents.length} produits`)
    } catch (error) {
      console.error('❌ Erreur initialisation RAG:', error)
      throw error
    }
  }

  private async loadCSVData(): Promise<void> {
    this.documents = []
    const csvFiles = ['data/test_sample.csv'] // Commencer avec le petit fichier

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
              const category = row.type_produit_classifié || 'Non classifié'
              
              const content = `${title} | ${description} | ${category} | ${price}€ | ${row.couleur_younzee} | ${row.taille_extraite} | ${row.handle} | ${row.status} | ${row.availableForSale ? 'Disponible' : 'Non disponible'}`
              
              return {
                id: `product-${index}`,
                content,
                metadata: {
                  title,
                  description,
                  price,
                  category,
                  colors: [row.couleur_younzee || 'Non spécifié'],
                  sizes: [row.taille_extraite || 'Non spécifié'],
                  handle: row.handle || `product-${index}`,
                  status: row.status || 'ACTIVE',
                  availableForSale: row.availableForSale !== 'False'
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

  private async createVectorStore(): Promise<void> {
    if (this.documents.length === 0) {
      throw new Error('Aucun document à vectoriser')
    }

    const langchainDocs = this.documents.map((doc: ProductDocument) => new Document({
      pageContent: doc.content,
      metadata: { ...doc.metadata, id: doc.id }
    }))

    console.log(`🔄 Création des embeddings pour ${langchainDocs.length} documents...`)
    
    this.vectorStore = await MemoryVectorStore.fromDocuments(
      langchainDocs,
      this.embeddings
    )

    console.log('✅ Vector store créé avec succès')
  }

  async search(query: string, k = 5): Promise<ProductMatch[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.vectorStore) {
      throw new Error('Vector store non initialisé')
    }

    try {
      const results = await this.vectorStore.similaritySearchWithScore(query, k)
      
      return results.map(([doc, score]: [Document, number]) => ({
        document: this.documents.find((d: ProductDocument) => d.id === doc.metadata.id)!,
        score,
        relevance: score >= 0.8 ? 'high' : score >= 0.6 ? 'medium' : 'low',
        searchType: 'semantic' as const
      })).filter((r: ProductMatch) => r.document)
    } catch (error) {
      console.error('❌ Erreur recherche:', error)
      return []
    }
  }

  async test(): Promise<{ success: boolean; results?: ProductMatch[]; error?: string }> {
    try {
      console.log('🧪 Test du service RAG...')
      
      if (!this.isInitialized) {
        await this.initialize()
      }

      const results = await this.search('t-shirt en coton', 3)
      
      console.log(`✅ Test réussi: ${results.length} résultats trouvés`)
      results.forEach((r: ProductMatch) => {
        console.log(`- ${r.document.metadata.title} (score: ${r.score.toFixed(3)})`)
      })

      return { success: true, results }
    } catch (error: any) {
      console.error('❌ Test échoué:', error)
      return { success: false, error: error.message }
    }
  }
}

// Instance singleton
export const ragService = new RAGService() 
