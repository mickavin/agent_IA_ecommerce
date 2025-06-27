import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { Document } from '@langchain/core/documents'
import Papa from 'papaparse'
import fs from 'fs'
import { excelReferentialService } from '../../lib/services/excel-referential.service'
import { OpenAIService } from '../../lib/services/openai.service'

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
    filteredByReferential: boolean
    [key: string]: any
  }
}

interface RAGSearchResult {
  document: ProductDocument
  score: number
  relevance: 'high' | 'medium' | 'low'
  searchType: 'semantic' | 'keyword' | 'hybrid' | 'clarification'
}

interface PromptCategorization {
  primaryType: 'ITEM' | 'OUTFIT' | 'FAQ'
  confidence: number
  context?: string
  requiredInfo: {
    size?: string
    color?: string  
    categoryGroup?: string
  }
  missingInfo: string[]
  detectedElements: string[]
  reasoning: string
}

const CATEGORIZATION_PROMPT = `
Tu es un expert en catégorisation de requêtes e-commerce pour Younzee.

Analyse cette requête et détermine:

TYPES POSSIBLES:
- ITEM: Recherche d'un article spécifique (ex: "t-shirt rouge", "jean slim taille 38")  
- OUTFIT: Demande de tenue complète avec contexte (ex: "tenue pour aller au travail", "outfit soirée")
- FAQ: Question sur service/livraison/retour (ex: "comment retourner un article?", "délais de livraison")

INFORMATIONS À EXTRAIRE:
- Taille: XS, S, M, L, XL, XXL, 36, 38, 40, 42, 44, 46, 48, 50
- Couleur: rouge, bleu, vert, noir, blanc, etc.
- Contexte/Occasion: travail, soirée, sport, plage, mariage, etc.
- Style: casual, élégant, sport, vintage, moderne, etc.

RETOURNE UNIQUEMENT DU JSON VALIDE:
{
  "primaryType": "ITEM|OUTFIT|FAQ",
  "confidence": 0.9,
  "reasoning": "Explication claire du choix",
  "extractedInfo": {
    "size": "M",
    "color": "rouge", 
    "context": "travail",
    "style": "casual"
  },
  "missingInfo": ["taille", "couleur"],
  "suggestions": ["Précisez la taille souhaitée", "Ajoutez une couleur de préférence"]
}
`

const PRODUCT_CATEGORIZATION_PROMPT = `
Tu es un expert en classification produits selon le référentiel Younzee.

Utilise ces catégories du fichier XLSX pour classifier:

RÉFÉRENTIEL YOUNZEE (Niveau 3):
{referentialData}

Analyse cette requête produit et trouve la meilleure correspondance:

RETOURNE UNIQUEMENT DU JSON:
{
  "productCategory": {
    "id": "ID_NIVEAU_3",
    "typeProduct": "Libellé Niveau 3 TYPE PRODUIT", 
    "confidence": 0.85
  },
  "reasoning": "Pourquoi cette catégorie correspond"
}
`

export interface AICategorization {
  // Catégorisation principale
  primaryType: 'ITEM' | 'OUTFIT' | 'FAQ'
  confidence: number
  reasoning: string
  
  // Informations extraites
  extractedInfo: {
    size?: string
    color?: string
    categoryGroup?: string
    context?: string
    occasion?: string
    style?: string
  }
  
  // Informations manquantes
  missingInfo: string[]
  
  // Suggestions d'amélioration
  suggestions: string[]
  
  // Catégorisation produit (via référentiel XLSX)
  productCategory?: {
    id: string // ID Niveau 3
    typeProduct: string // Libellé Niveau 3 TYPE PRODUIT
    confidence: number
  }
}

/**
 * Service RAG avec OpenAI
 */
class OpenAIRAGService {
  private embeddings: OpenAIEmbeddings
  private vectorStore: MemoryVectorStore | null = null
  private documents: ProductDocument[] = []
  private isInitialized = false
  private openaiService: OpenAIService

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-large', // ✅ Modèle plus performant
      apiKey: process.env.OPENAI_API_KEY,
      batchSize: 50, // ✅ Batch plus petit pour meilleure qualité
      dimensions: 1536 // ✅ Dimensions complètes pour précision maximale
    })
    this.openaiService = new OpenAIService()
  }

  async initialize(query: string): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('🚀 Initialisation RAG OpenAI...')
      const categoryAnalysis = await excelReferentialService.categorizeUserPrompt(query)
      console.log('🏷️ Catégorie: ', categoryAnalysis)
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

  private async loadCSVData(relevantCategories?: string[]): Promise<void> {
    // ✅ Réinitialisation pour éviter les doublons lors des rechargements
    this.documents = []
    
    const csvFiles = [
      'files/produits_final.csv',
    ]

    for (const csvPath of csvFiles) {
      try {
        if (fs.existsSync(csvPath)) {
          console.log(`📄 Chargement ${csvPath}${relevantCategories ? ' avec filtrage catégories' : ''}...`)
          const csvContent = fs.readFileSync(csvPath, 'utf8')
          const documents = await this.parseCSV(csvContent, csvPath, relevantCategories)
          this.documents.push(...documents)
          console.log(`✅ ${csvPath}: ${documents.length} documents chargés`)
          
          // ✅ SUPPRESSION de la limite de 2000 pour lire TOUS les documents
          // Anciennement: if (this.documents.length >= 2000) break
        }
      } catch (error) {
        console.error(`Erreur ${csvPath}:`, error)
      }
    }

    console.log(`📊 Total documents avant déduplication: ${this.documents.length}`)
    // ✅ SUPPRESSION DE LA DÉDUPLICATION - Garder tous les documents
    // this.documents = this.deduplicateDocuments(this.documents)  
    console.log(`📊 Total documents conservés: ${this.documents.length} (filtrage: ${relevantCategories ? `${relevantCategories.length} catégories` : 'désactivé'})`)
  }

  private async parseCSV(csvContent: string, source: string, relevantCategories?: string[]): Promise<ProductDocument[]> {
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
                
                // ✅ FILTRAGE PAR CATÉGORIE DU RÉFÉRENTIEL
                if (relevantCategories && relevantCategories.length > 0) {
                  const hasMatchingCategory = relevantCategories.some(relevantCat => {
                    const catLower = category.toLowerCase()
                    const refLower = relevantCat.toLowerCase()
                    
                    // Correspondance bidirectionnelle pour flexibilité
                    return catLower.includes(refLower) || refLower.includes(catLower)
                  })
                  
                  if (!hasMatchingCategory) {
                    console.log(`🚫 Produit filtré: "${title}" (catégorie: "${category}")`)
                    return null // Exclure ce produit
                  }
                }
                
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
                    source,
                    filteredByReferential: !!relevantCategories?.length
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
      // Note: keywords extraction sera fait de manière asynchrone ailleurs
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
    
    return parts.filter(Boolean).join(' | ')
  }

  // ✅ Classification des prix par gamme
  private getPriceCategory(price: number): string {
    if (price < 20) return 'petit prix'
    if (price < 50) return 'prix abordable'
    if (price < 100) return 'gamme moyenne'
    if (price < 200) return 'gamme élevée'
    return 'haut de gamme'
  }

  // ✅ Filtrage des documents par catégorie
  private filterDocumentsByCategory(categoryAnalysis: any): ProductDocument[] {
    if (!categoryAnalysis?.detectedCategory) {
      return this.documents // Retourner tous si pas de catégorie détectée
    }

    const targetCategory = categoryAnalysis.detectedCategory.toLowerCase()
    
    return this.documents.filter(doc => {
      const docCategory = doc.metadata.category.toLowerCase()
      
      // Correspondance directe
      if (docCategory.includes(targetCategory) || targetCategory.includes(docCategory)) {
        return true
      }
      
      // Correspondance dans le titre
      if (doc.metadata.title.toLowerCase().includes(targetCategory)) {
        return true
      }
      
      return false
    })
  }

  // ✅ NOUVELLE MÉTHODE: Extraction des catégories pertinentes du référentiel
  private async getRelevantCategoriesFromReferential(query: string, categoryAnalysis: any): Promise<string[]> {
    try {
      // Obtenir les données du référentiel hiérarchique
      const referentialData = await excelReferentialService.getReferentialData()
      
      if (!referentialData?.productHierarchy) {
        console.warn('⚠️ Données de hiérarchie produit non disponibles')
        return []
      }
      
      // Filtrer les catégories de niveau 3 (Libellé Niveau 3)
      const level3Categories = referentialData.productHierarchy
        .filter(item => item.level === 3)
        .map(item => item.name) // Libellé Niveau 3 TYPE PRODUIT
      
      console.log(`📊 Total catégories niveau 3 disponibles: ${level3Categories.length}`)
      
      // Recherche de correspondances avec la catégorie détectée
      const relevantCategories: string[] = []
      const queryLower = query.toLowerCase()
      const detectedCategory = categoryAnalysis.detectedCategory?.toLowerCase() || ''
      
      // 1️⃣ Correspondance directe avec la catégorie détectée
      if (detectedCategory && detectedCategory !== 'non spécifié') {
        for (const category of level3Categories) {
          const categoryLower = category.toLowerCase()
          
          // Correspondance directe
          if (categoryLower.includes(detectedCategory) || detectedCategory.includes(categoryLower)) {
            if (!relevantCategories.includes(category)) {
              relevantCategories.push(category)
              console.log(`🎯 Correspondance directe: "${detectedCategory}" -> "${category}"`)
            }
          }
        }
      }
      
      // 2️⃣ Recherche par mots-clés du prompt
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)
      for (const category of level3Categories) {
        const categoryLower = category.toLowerCase()
        
        for (const word of queryWords) {
          if (categoryLower.includes(word) || word.includes(categoryLower)) {
            if (!relevantCategories.includes(category)) {
              relevantCategories.push(category)
              console.log(`🔍 Correspondance par mot-clé: "${word}" -> "${category}"`)
            }
          }
        }
      }
      
      // 3️⃣ Si aucune correspondance trouvée, prendre les catégories les plus générales
      if (relevantCategories.length === 0) {
        console.log('⚠️ Aucune correspondance spécifique trouvée, utilisation de toutes les catégories')
        return level3Categories.slice(0, 50) // Limiter pour éviter la surcharge
      }
      
      console.log(`✅ ${relevantCategories.length} catégories pertinentes identifiées`)
      return relevantCategories
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction des catégories du référentiel:', error)
      return [] // Fallback: aucun filtrage
    }
  }

  // ✅ Extraction de mots-clés intelligente via IA
  private async extractKeywords(description: string): Promise<string[]> {
    if (!description || description.length < 10) return []
    
    try {
      // Prompt optimisé pour l'extraction de mots-clés
      const prompt = `
Analyse cette description de produit mode et extrait les mots-clés les plus pertinents.

Description: "${description}"

Extrait UNIQUEMENT les mots-clés dans ces catégories:
- Matériaux: coton, polyester, lin, soie, laine, cuir, denim, etc.
- Styles: casual, élégant, sport, vintage, moderne, classique, etc.
- Caractéristiques: manches longues/courtes, col rond/v, capuche, poches, etc.
- Finitions: brodé, imprimé, uni, rayé, à carreaux, etc.
- Coupes: slim, regular, loose, oversize, etc.

Retourne UNIQUEMENT un JSON avec array de mots-clés:
{"keywords": ["mot1", "mot2", "mot3"]}

Limite: 8 mots-clés maximum.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 150
        }),
      })

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)
      
      console.log(`🔍 Mots-clés IA extraits: [${result.keywords.join(', ')}]`)
      return result.keywords || []
      
    } catch (error) {
      console.warn('⚠️ Fallback keywords extraction:', error)
      return this.extractKeywordsFallback(description)
    }
  }

  // ✅ Fallback en cas d'erreur IA
  private extractKeywordsFallback(description: string): string[] {
    if (!description) return []
    
    const keywords: string[] = []
    const desc = description.toLowerCase()
    
    // Matériaux essentiels
    const materials = ['coton', 'polyester', 'lin', 'soie', 'laine', 'cuir', 'denim', 'jean']
    materials.forEach(mat => {
      if (desc.includes(mat)) keywords.push(mat)
    })
    
    // Styles de base
    const styles = ['casual', 'élégant', 'sport', 'vintage', 'moderne', 'classique']
    styles.forEach(style => {
      if (desc.includes(style)) keywords.push(style)
    })
    
    return [...new Set(keywords)]
  }

  // ✅ Inférence du contexte d'usage via IA
  private async inferUsageContext(title: string, description: string, category: string): Promise<string[]> {
    const text = `${title} ${description} ${category}`.trim()
    if (text.length < 15) return []
    
    try {
      // Prompt spécialisé pour l'inférence de contexte
      const prompt = `
Analyse ce produit mode et détermine dans quels contextes/occasions il peut être porté.

Produit: "${title}"
Description: "${description}"
Catégorie: "${category}"

Détermine le contexte d'usage parmi:

SAISONS:
- été, hiver, automne, printemps, mi-saison

OCCASIONS:
- travail, bureau, professionnel
- sport, fitness, running, gym
- soirée, fête, sortie, élégant
- quotidien, casual, décontracté
- plage, vacances, week-end
- mariage, cérémonie, formel

STYLES DE VIE:
- urbain, ville, métropolitain
- nature, outdoor, campagne
- voyage, business trip

Retourne UNIQUEMENT un JSON avec les contextes pertinents:
{"contexts": ["contexte1", "contexte2"]}

Limite: 4 contextes maximum, privilégie les plus évidents.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 120
        }),
      })

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)
      
      console.log(`🎭 Contextes IA inférés pour "${title}": [${result.contexts.join(', ')}]`)
      return result.contexts || []
      
    } catch (error) {
      console.warn('⚠️ Fallback context inference:', error)
      return this.inferUsageContextFallback(title, description, category)
    }
  }

  // ✅ Fallback en cas d'erreur IA  
  private inferUsageContextFallback(title: string, description: string, category: string): string[] {
    const context = []
    const text = `${title} ${description} ${category}`.toLowerCase()
    
    // Saisons
    if (text.includes('été') || text.includes('léger')) context.push('été')
    if (text.includes('hiver') || text.includes('chaud')) context.push('hiver')
    
    // Occasions principales
    if (text.includes('sport') || text.includes('fitness')) context.push('sport')
    if (text.includes('travail') || text.includes('bureau')) context.push('professionnel')
    if (text.includes('soirée') || text.includes('élégant')) context.push('soirée')
    if (text.includes('casual') || text.includes('quotidien')) context.push('quotidien')
    
    return [...new Set(context)]
  }

  // ✅ Nouvelle fonction : Analyse complète via IA
  private async analyzeProductWithAI(product: any): Promise<{
    keywords: string[],
    contexts: string[],
    style: string,
    materials: string[],
    occasions: string[]
  }> {
    const { title, description, category, price } = product
    
    try {
      const prompt = `
Analyse complète de ce produit mode:

Titre: "${title}"
Description: "${description}"
Catégorie: "${category}"
Prix: ${price}€

Effectue une analyse complète et retourne un JSON avec:

{
  "keywords": ["mot-clé1", "mot-clé2"], // 5 mots-clés max
  "contexts": ["contexte1", "contexte2"], // 3 contextes max 
  "style": "style principal", // 1 style dominant
  "materials": ["matériau1", "matériau2"], // Matériaux détectés
  "occasions": ["occasion1", "occasion2"] // 3 occasions max
}

Sois précis et concis. Base-toi sur les vraies informations du produit.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 200
        }),
      })

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)
      
      console.log(`🤖 Analyse IA complète pour "${title}":`, result)
      return result
      
    } catch (error) {
      console.warn('⚠️ Fallback analyse complète:', error)
      return {
        keywords: await this.extractKeywords(description),
        contexts: await this.inferUsageContext(title, description, category),
        style: 'casual',
        materials: [],
        occasions: []
      }
    }
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

    console.log('🚀 Initialisation RAG OpenAI...')

    // ✅ 1️⃣ CHARGEMENT DU RÉFÉRENTIEL EXCEL EN PREMIER
    await excelReferentialService.loadReferentials()
    console.log('✅ Référentiels Excel chargés')

    // ✅ 2️⃣ PRÉ-CATÉGORISATION ITEM/OUTFIT/FAQ avec logs détaillés
    const promptCategorization = this.precategorizePrompt(query)
    
    // ✅ 3️⃣ CATÉGORISATION INTELLIGENTE du prompt pour identifier les catégories
    const categoryAnalysis = await excelReferentialService.categorizeUserPrompt(query)
    console.log(`🏷️ Catégorie: "${categoryAnalysis.detectedCategory}" (${(categoryAnalysis.confidence * 100).toFixed(1)}%)`)
    
    // ✅ 4️⃣ EXTRACTION DES CATÉGORIES PERTINENTES DU RÉFÉRENTIEL
    const relevantCategories = await this.getRelevantCategoriesFromReferential(query, categoryAnalysis)
    console.log(`📋 Catégories pertinentes extraites: [${relevantCategories.join(', ')}]`)
    
    // ✅ 5️⃣ CHARGEMENT DU CSV AVEC FILTRAGE DIRECT PAR CATÉGORIES
    await this.loadCSVData(relevantCategories)
    console.log(`✅ Produits filtrés chargés: ${this.documents.length} documents`)

    // ✅ 2️⃣ DÉTECTION DES COULEURS pour filtrage pré-recherche
    const detectedColors = this.extractColorsFromQuery(query)
    console.log(`🎨 Couleurs détectées: [${detectedColors.join(', ') || 'Aucune'}]`)

    // ✅ 2.5️⃣ VÉRIFICATION DES INFORMATIONS MANQUANTES ET ARRÊT SI NÉCESSAIRE
    const missingInfo = this.detectMissingInformation(query, promptCategorization, detectedColors, categoryAnalysis)
    
    if (missingInfo.length > 0 && promptCategorization.primaryType === 'ITEM') {
      console.log(`⚠️ Informations manquantes détectées: [${missingInfo.join(', ')}] - ARRÊT DE LA RECHERCHE`)
      
      // Générer demande de clarification et retourner directement
      const clarificationRequest = await this.generateClarificationRequest(query, missingInfo, promptCategorization)
      
      const clarificationResult: RAGSearchResult = {
        document: {
          id: 'clarification_request',
          content: clarificationRequest,
          metadata: {
            title: 'Précisions nécessaires',
            description: clarificationRequest,
            price: 0,
            category: 'Clarification',
            colors: [],
            sizes: [],
            handle: 'clarification',
            status: 'CLARIFICATION_REQUEST',
            availableForSale: false,
            isClarificationRequest: true,
            missingInfo,
            originalQuery: query
          }
        },
        score: 1.0,
        relevance: 'high',
        searchType: 'clarification'
      }
      
      console.log(`💬 Retour de la demande de clarification uniquement - pas de recherche de produits`)
      return [clarificationResult]
    }

    await this.createVectorStore()
    this.isInitialized = true
    
    const referentialStats = excelReferentialService.getStats()
    console.log(`✅ RAG initialisé: ${this.documents.length} produits + ${referentialStats.total} référentiels`)


    if (!this.vectorStore) {
      throw new Error('Vector store non initialisé')
    }

    
    // ✅ 3️⃣ FILTRAGE DES PRODUITS par catégorie ET couleur détectées
    let filteredDocuments = this.filterDocumentsByCategory(categoryAnalysis)
    console.log(`📊 Après filtrage catégorie: ${filteredDocuments.length}/${this.documents.length} produits`)
    
    // Filtrage supplémentaire par couleur si détectées
    if (detectedColors.length > 0) {
      const colorFiltered = this.filterDocumentsByColors(filteredDocuments, detectedColors)
      console.log(`🎨 Après filtrage couleur: ${colorFiltered.length}/${filteredDocuments.length} produits`)
      
      // Si filtrage couleur trop restrictif, relaxer
      if (colorFiltered.length < 5 && filteredDocuments.length > 20) {
        console.log(`🔄 Filtrage couleur trop restrictif, critères relaxés`)
        filteredDocuments = this.filterDocumentsByColorsRelaxed(filteredDocuments, detectedColors)
        console.log(`🔄 Après relaxation: ${filteredDocuments.length} produits`)
      } else {
        filteredDocuments = colorFiltered
      }
    }

    // ✅ 4️⃣ PREPROCESSING de la requête
    const processedQuery = this.preprocessQuery(query)
    console.log(`🔍 Query preprocessing: "${query}" -> "${processedQuery}"`)

    const k = Math.min(options.k || 5, 20)
    const searchType = options.searchType || 'semantic'

    try {
      let results: RAGSearchResult[] = []

      // ✅ 5️⃣ RECHERCHE sur les produits filtrés par catégorie ET couleur
      if (searchType === 'semantic') {
        results = await this.categorizedSemanticSearch(processedQuery, k, filteredDocuments)
      } else if (searchType === 'keyword') {
        results = await this.categorizedKeywordSearch(processedQuery, k, filteredDocuments)
      } else {
        results = await this.categorizedHybridSearch(processedQuery, k, filteredDocuments)
      }

      // ✅ 6️⃣ POST-PROCESSING avec boost catégoriel ET couleur
      results = this.postProcessResults(results, query, processedQuery)
      results = this.applyCategoryBoost(results, categoryAnalysis)
      
      // Boost supplémentaire pour les couleurs correspondantes
      if (detectedColors.length > 0) {
        results = this.applyColorBoost(results, detectedColors)
      }

      // ✅ 7️⃣ ENRICHISSEMENT avec métadonnées catégorielles et couleurs
      results = results.map(result => ({
        ...result,
        categoryAnalysis,
        metadata: {
          ...result.document.metadata,
          detectedCategory: categoryAnalysis.detectedCategory,
          categoryConfidence: categoryAnalysis.confidence,
          detectedColors: detectedColors,
          filteredByCategory: true,
          filteredByColor: detectedColors.length > 0
        }
      }))

      // ✅ 8️⃣ RETOUR DES RÉSULTATS FINAUX
      return results.sort((a, b) => b.score - a.score).slice(0, k)
    } catch (error) {
      console.error('Erreur recherche catégorisée:', error)
      throw error
    }
  }

  private async categorizedSemanticSearch(query: string, k: number, filteredDocuments: ProductDocument[]): Promise<RAGSearchResult[]> {
    const results = await this.vectorStore!.similaritySearchWithScore(query, k)
    
    return results
      .map(([doc, score]) => {
        const document = filteredDocuments.find(d => d.id === doc.metadata.id)
        
        // Si le document n'est pas trouvé dans les documents filtrés, on l'ignore
        if (!document) {
          console.warn(`⚠️ Document non trouvé dans filteredDocuments: ${doc.metadata.id}`)
          return null
        }
        
        return {
          document,
          score: Math.max(0, Math.min(1, score)),
          relevance: (score >= 0.8 ? 'high' : score >= 0.6 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          searchType: 'semantic' as const
        }
      })
      .filter(result => result !== null) as RAGSearchResult[] // Filtrer les résultats null
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

  // ✅ NOUVELLE MÉTHODE: Extraction intelligente des couleurs
  private extractColorsFromQuery(query: string): string[] {
    const queryLower = query.toLowerCase()
    const detectedColors: string[] = []
    
    // Dictionnaire de couleurs avec synonymes et variantes
    const colorMap = {
      'rouge': ['rouge', 'red', 'burgundy', 'bordeaux', 'cerise', 'carmin'],
      'bleu': ['bleu', 'blue', 'navy', 'marine', 'cyan', 'azur', 'turquoise'],
      'vert': ['vert', 'green', 'kaki', 'olive', 'menthe', 'émeraude'],
      'noir': ['noir', 'black', 'anthracite', 'charbon'],
      'blanc': ['blanc', 'white', 'crème', 'ivoire', 'écru', 'beige'],
      'jaune': ['jaune', 'yellow', 'or', 'doré', 'moutarde', 'citron'],
      'rose': ['rose', 'pink', 'fuchsia', 'magenta', 'saumon'],
      'violet': ['violet', 'purple', 'mauve', 'lilas', 'aubergine'],
      'orange': ['orange', 'mandarine', 'abricot', 'pêche'],
      'marron': ['marron', 'brown', 'chocolat', 'café', 'camel', 'taupe'],
      'gris': ['gris', 'gray', 'grey', 'silver', 'argent', 'acier']
    }
    
    // Recherche de couleurs dans la requête
    for (const [mainColor, variants] of Object.entries(colorMap)) {
      for (const variant of variants) {
        if (queryLower.includes(variant)) {
          if (!detectedColors.includes(mainColor)) {
            detectedColors.push(mainColor)
            console.log(`🎨 Couleur détectée: "${variant}" -> "${mainColor}"`)
          }
        }
      }
    }
    
    return detectedColors
  }

  // ✅ NOUVELLE MÉTHODE: Filtrage strict par couleurs
  private filterDocumentsByColors(documents: ProductDocument[], detectedColors: string[]): ProductDocument[] {
    return documents.filter(doc => {
      const docColors = doc.metadata.colors || []
      
      // Vérifier si le produit a une des couleurs détectées
      for (const detectedColor of detectedColors) {
        for (const docColor of docColors) {
          const docColorLower = docColor.toLowerCase()
          
          // Correspondance directe
          if (docColorLower.includes(detectedColor) || detectedColor.includes(docColorLower)) {
            return true
          }
          
          // Correspondance via synonymes
          const colorSynonyms = this.getColorSynonyms(detectedColor)
          for (const synonym of colorSynonyms) {
            if (docColorLower.includes(synonym) || synonym.includes(docColorLower)) {
              return true
            }
          }
        }
      }
      
      return false
    })
  }

  // ✅ NOUVELLE MÉTHODE: Filtrage relaxé par couleurs (recherche dans titre/description)
  private filterDocumentsByColorsRelaxed(documents: ProductDocument[], detectedColors: string[]): ProductDocument[] {
    return documents.filter(doc => {
      const title = doc.metadata.title.toLowerCase()
      const description = (doc.metadata.description || '').toLowerCase()
      const docColors = doc.metadata.colors || []
      
      // 1. Vérifier couleurs métadonnées d'abord
      for (const detectedColor of detectedColors) {
        for (const docColor of docColors) {
          if (docColor.toLowerCase().includes(detectedColor)) {
            return true
          }
        }
        
        // 2. Recherche couleur dans titre et description
        if (title.includes(detectedColor) || description.includes(detectedColor)) {
          return true
        }
        
        // 3. Recherche via synonymes
        const synonyms = this.getColorSynonyms(detectedColor)
        for (const synonym of synonyms) {
          if (title.includes(synonym) || description.includes(synonym)) {
            return true
          }
        }
      }
      
      return false
    })
  }

  // ✅ NOUVELLE MÉTHODE: Obtenir les synonymes d'une couleur
  private getColorSynonyms(color: string): string[] {
    const synonymMap: { [key: string]: string[] } = {
      'rouge': ['red', 'burgundy', 'bordeaux'],
      'bleu': ['blue', 'navy', 'marine'],
      'vert': ['green', 'kaki', 'olive'],
      'noir': ['black', 'anthracite'],
      'blanc': ['white', 'crème', 'écru'],
      'jaune': ['yellow', 'or', 'doré'],
      'rose': ['pink', 'fuchsia'],
      'violet': ['purple', 'mauve'],
      'orange': ['mandarine', 'abricot'],
      'marron': ['brown', 'chocolat', 'camel'],
      'gris': ['gray', 'grey', 'silver']
    }
    
    return synonymMap[color] || []
  }

  // ✅ NOUVELLE MÉTHODE: Boost basé sur les couleurs
  private applyColorBoost(results: RAGSearchResult[], detectedColors: string[]): RAGSearchResult[] {
    if (detectedColors.length === 0) return results
    
    return results.map(result => {
      let boostedScore = result.score
      const docColors = result.document.metadata.colors || []
      const title = result.document.metadata.title.toLowerCase()
      
      // Vérifier correspondance couleur
      let hasColorMatch = false
      for (const detectedColor of detectedColors) {
        // Correspondance dans métadonnées couleurs
        for (const docColor of docColors) {
          if (docColor.toLowerCase().includes(detectedColor) || detectedColor.includes(docColor.toLowerCase())) {
            hasColorMatch = true
            break
          }
        }
        
        // Correspondance dans titre
        if (title.includes(detectedColor)) {
          hasColorMatch = true
        }
        
        if (hasColorMatch) break
      }
      
      // Boost si correspondance couleur
      if (hasColorMatch) {
        boostedScore = Math.min(boostedScore * 1.25, 1.0) // Boost +25%
        console.log(`🎨 Boost couleur appliqué: ${result.document.metadata.title}`)
      }
      
      return {
        ...result,
        score: boostedScore,
        relevance: this.getRelevanceFromScore(boostedScore)
      }
    })
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      documentsLoaded: this.documents.length,
      hasVectorStore: !!this.vectorStore,
      embeddingmodel: 'text-embedding-3-large'
    }
  }

  private precategorizePrompt(query: string): PromptCategorization {
    const queryLower = query.toLowerCase()
    const words = queryLower.split(/\s+/).filter(w => w.length > 1)
    
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🎯 PRÉ-CATÉGORISATION DU PROMPT`)
    console.log(`${'='.repeat(60)}`)
    console.log(`📝 Requête: "${query}"`)
    console.log(`🔤 Mots-clés: [${words.join(', ')}]`)
    
    let primaryType: 'ITEM' | 'OUTFIT' | 'FAQ' = 'ITEM'
    let confidence = 0
    let context = ''
    let reasoning = ''
    const detectedElements: string[] = []
    
    // ✅ 1. DÉTECTION FAQ
    const faqKeywords = ['comment', 'pourquoi', 'livraison', 'retour', 'service', 'aide', 'où', 'quand', 'combien']
    const faqScore = faqKeywords.filter(kw => queryLower.includes(kw)).length
    
    if (queryLower.includes('?') || faqScore > 0) {
      primaryType = 'FAQ'
      confidence = Math.min(0.8 + (faqScore * 0.1), 1.0)
      reasoning = `Question détectée (${faqScore} mots FAQ + ${queryLower.includes('?') ? 'point d\'interrogation' : 'pas de ?'})`
      detectedElements.push(...faqKeywords.filter(kw => queryLower.includes(kw)))
    }
    
    // ✅ 2. DÉTECTION OUTFIT  
    else {
      const outfitKeywords = ['pour aller', 'tenue', 'outfit', 'completer', 'propose moi', 'conseille', 'assortir']
      const contextKeywords = ['plage', 'soirée', 'travail', 'sport', 'mariage', 'sortie', 'bureau', 'vacances']
      
      const outfitScore = outfitKeywords.filter(kw => queryLower.includes(kw)).length
      const contextScore = contextKeywords.filter(kw => queryLower.includes(kw)).length
      
      if (outfitScore > 0 || contextScore > 0) {
        primaryType = 'OUTFIT'
        confidence = Math.min(0.6 + (outfitScore * 0.2) + (contextScore * 0.1), 1.0)
        context = contextKeywords.find(kw => queryLower.includes(kw)) || ''
        reasoning = `Contexte tenue détecté (${outfitScore} mots outfit + ${contextScore} mots contexte)`
        detectedElements.push(...outfitKeywords.filter(kw => queryLower.includes(kw)))
        if (context) detectedElements.push(context)
      }
      
      // ✅ 3. DÉTECTION ITEM (par défaut)
      else {
        const itemKeywords = ['t-shirt', 'jean', 'robe', 'chaussures', 'pull', 'veste', 'pantalon', 'jupe']
        const itemScore = itemKeywords.filter(kw => queryLower.includes(kw)).length
        
        primaryType = 'ITEM'
        confidence = itemScore > 0 ? Math.min(0.7 + (itemScore * 0.1), 1.0) : 0.5
        reasoning = `Article spécifique détecté (${itemScore} noms d'articles)`
        detectedElements.push(...itemKeywords.filter(kw => queryLower.includes(kw)))
      }
    }
    
    // ✅ 4. ANALYSE DES INFORMATIONS REQUISES
    const sizeWords = ['xs', 's', 'm', 'l', 'xl', 'xxl', '36', '38', '40', '42', '44', '46', '48', '50']
    const colorWords = ['rouge', 'red', 'bleu', 'blue', 'vert', 'green', 'noir', 'black', 'blanc', 'white']
    
    const detectedSize = words.find(w => sizeWords.includes(w))
    const detectedColor = words.find(w => colorWords.includes(w))
    
    const requiredInfo = {
      size: detectedSize,
      color: detectedColor,
      categoryGroup: undefined // À déterminer via référentiel
    }
    
    const missingInfo: string[] = []
    if (!detectedSize && primaryType !== 'FAQ') missingInfo.push('taille')
    if (!detectedColor && primaryType !== 'FAQ') missingInfo.push('couleur')
    if (primaryType === 'OUTFIT' && !context) missingInfo.push('contexte d\'usage')
    
    // ✅ 5. AFFICHAGE DES LOGS DÉTAILLÉS
    console.log(`\n📊 RÉSULTAT DE LA PRÉ-CATÉGORISATION:`)
    console.log(`─`.repeat(40))
    
    const typeIcon = primaryType === 'ITEM' ? '👕' : primaryType === 'OUTFIT' ? '👔' : '❓'
    console.log(`${typeIcon} Type: ${primaryType}`)
    console.log(`📈 Confiance: ${(confidence * 100).toFixed(1)}%`)
    console.log(`🧠 Raisonnement: ${reasoning}`)
    
    if (detectedElements.length > 0) {
      console.log(`🔍 Éléments détectés: [${detectedElements.join(', ')}]`)
    }
    
    if (context) {
      console.log(`🎭 Contexte: ${context}`)
    }
    
    console.log(`\n📋 INFORMATIONS EXTRAITES:`)
    console.log(`─`.repeat(40))
    if (requiredInfo.size) console.log(`📏 Taille détectée: ${requiredInfo.size}`)
    if (requiredInfo.color) console.log(`🎨 Couleur détectée: ${requiredInfo.color}`)
    
    if (missingInfo.length > 0) {
      console.log(`\n⚠️ INFORMATIONS MANQUANTES:`)
      console.log(`─`.repeat(40))
      missingInfo.forEach(info => console.log(`❌ ${info}`))
      
      if (primaryType === 'ITEM') {
        console.log(`\n💡 SUGGESTION: Pour un article spécifique, précisez la taille et la couleur`)
        console.log(`   Exemple: "${query} taille M couleur rouge"`)
      }
      
      if (primaryType === 'OUTFIT') {
        console.log(`\n💡 SUGGESTION: Pour une tenue, précisez le contexte d'usage`)
        console.log(`   Exemple: "${query} pour aller au travail"`)
      }
    } else {
      console.log(`✅ Toutes les informations nécessaires sont présentes`)
    }
    
    console.log(`${'='.repeat(60)}\n`)
    
    return {
      primaryType,
      confidence,
      context,
      requiredInfo,
      missingInfo,
      detectedElements,
      reasoning
    }
  }

  private detectMissingInformation(
    query: string, 
    promptCategorization: PromptCategorization, 
    detectedColors: string[], 
    categoryAnalysis: any
  ): string[] {
    const missingInfo: string[] = []
    const queryLower = query.toLowerCase()
    
    // Si c'est une recherche d'article (ITEM)
    if (promptCategorization.primaryType === 'ITEM') {
      
      // 1️⃣ Vérifier la couleur
      if (detectedColors.length === 0) {
        // Double vérification : chercher d'autres indicateurs de couleur
        const hasColorIndication = ['couleur', 'coloris', 'teinte'].some(word => queryLower.includes(word))
        if (!hasColorIndication) {
          missingInfo.push('couleur')
        }
      }
      
      // 2️⃣ Vérifier la taille
      const sizeKeywords = ['xs', 's', 'm', 'l', 'xl', 'xxl', '36', '38', '40', '42', '44', '46', '48', '50', 'taille']
      const hasSize = sizeKeywords.some(size => queryLower.includes(size))
      if (!hasSize) {
        missingInfo.push('taille')
      }
      
      // 3️⃣ Vérifier le type de vêtement
      const clothingTypes = [
        't-shirt', 'tshirt', 'chemise', 'pull', 'sweat', 'veste', 'manteau',
        'jean', 'pantalon', 'short', 'jupe', 'robe', 'legging',
        'chaussures', 'baskets', 'boots', 'sandales', 'escarpins',
        'sous-vêtements', 'soutien-gorge', 'culotte', 'boxer',
        'accessoire', 'sac', 'ceinture', 'écharpe', 'bonnet'
      ]
      
      const hasClothingType = clothingTypes.some(type => queryLower.includes(type))
      const hasGeneralCategory = categoryAnalysis.detectedCategory && 
                                categoryAnalysis.detectedCategory !== 'Non spécifié' &&
                                categoryAnalysis.confidence > 0.6
      
      if (!hasClothingType && !hasGeneralCategory) {
        missingInfo.push('type de vêtement')
      }
    }
    
    return missingInfo
  }

  private async generateClarificationRequest(
    originalQuery: string, 
    missingInfo: string[], 
    promptCategorization: PromptCategorization
  ): Promise<string> {
    try {
      const prompt = `
Tu es un assistant shopping pour Younzee, spécialisé en mode. Un client recherche un article mais il manque des informations importantes.

Requête originale: "${originalQuery}"
Informations manquantes: ${missingInfo.join(', ')}

Génère une réponse amicale et professionnelle qui:
1. Reconnaît la demande du client
2. Explique pourquoi tu as besoin de plus de détails  
3. Pose des questions précises pour chaque information manquante
4. Propose des exemples concrets
5. Reste encourageant et utile

Exemples de questions selon les informations manquantes:

COULEUR: "Quelle couleur préférez-vous ? (noir, blanc, bleu, rouge, etc.)"
TAILLE: "Quelle taille recherchez-vous ? (XS, S, M, L, XL pour les vêtements ou 36, 38, 40... pour les chaussures)"
TYPE DE VÊTEMENT: "Quel type d'article cherchez-vous exactement ? (t-shirt, jean, robe, chaussures, etc.)"

Ton: Amical, professionnel, pas trop long (3-4 phrases max).
Langue: Français
Format: Texte direct, pas de JSON.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 200
        }),
      })

      const data = await response.json()
      const clarificationText = data.choices[0].message.content.trim()
      
      console.log(`💬 Demande de clarification générée: "${clarificationText}"`)
      return clarificationText
      
    } catch (error: any) {
      console.warn('⚠️ Fallback clarification request:', error)
      return this.generateFallbackClarificationRequest(originalQuery, missingInfo)
    }
  }

  // ✅ FALLBACK: Demande de clarification simple
  private generateFallbackClarificationRequest(originalQuery: string, missingInfo: string[]): string {
    const missingTexts: { [key: string]: string } = {
      'couleur': 'la couleur souhaitée',
      'taille': 'votre taille',
      'type de vêtement': 'le type d\'article exact'
    }
    
    const missing = missingInfo.map(info => missingTexts[info] || info).join(', ')
    
    return `Je comprends que vous recherchez "${originalQuery}". Pour mieux vous aider, pourriez-vous préciser ${missing} ? Cela m'permettra de vous proposer les articles les plus adaptés à vos besoins ! 😊`
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
    console.log('🔍 Query: ', service.getStats())
    const results = await service.search(query, { k, searchType })
    console.log('🔍 Results: ', results)
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

export class AICategorizationService {
  private openaiService: OpenAIService
  
  constructor() {
    this.openaiService = new OpenAIService()
  }
  
  async categorizePrompt(query: string): Promise<AICategorization> {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🤖 CATÉGORISATION IA DU PROMPT`)
    console.log(`${'='.repeat(60)}`)
    console.log(`📝 Requête: "${query}"`)
    
    // 1️⃣ Catégorisation principale via IA
    const mainCategorization = await this.analyzeMainCategory(query)
    
    // 2️⃣ Si ITEM, analyser via référentiel XLSX
    let productCategory
    if (mainCategorization.primaryType === 'ITEM') {
      productCategory = await this.analyzeProductCategory(query)
    }
    
    // 3️⃣ Compilation des résultats
    const result: AICategorization = {
      ...mainCategorization,
      productCategory
    }
    
    // 4️⃣ Affichage des logs détaillés
    this.displayCategorizationLogs(result)
    
    return result
  }
  
  private async analyzeMainCategory(query: string) {
    try {
      const response = await this.openaiService.generateResponse({
        systemPrompt: CATEGORIZATION_PROMPT,
        userMessage: `Analyse cette requête: "${query}"`,
        temperature: 0.1, // Faible pour cohérence
        maxTokens: 500
      })
      
      return JSON.parse(response)
    } catch (error) {
      console.error('❌ Erreur catégorisation IA:', error)
      return this.fallbackCategorization(query)
    }
  }
  
  private async analyzeProductCategory(query: string) {
    try {
      // Charger référentiel XLSX
      const referentialData = await excelReferentialService.getReferentialData()
      const hierarchyLevel3 = referentialData.productHierarchy
        .filter(h => h.level === 3)
        .map(h => ({ id: h.id, typeProduct: h.name }))
      
      const response = await this.openaiService.generateResponse({
        systemPrompt: PRODUCT_CATEGORIZATION_PROMPT.replace(
          '{referentialData}', 
          JSON.stringify(hierarchyLevel3.slice(0, 50)) // Limiter pour prompt
        ),
        userMessage: `Classifie ce produit: "${query}"`,
        temperature: 0.1,
        maxTokens: 300
      })
      
      return JSON.parse(response).productCategory
    } catch (error) {
      console.error('❌ Erreur catégorisation produit:', error)
      return null
    }
  }
  
  private displayCategorizationLogs(result: AICategorization) {
    const typeIcon = result.primaryType === 'ITEM' ? '👕' : 
                    result.primaryType === 'OUTFIT' ? '👔' : '❓'
    
    console.log(`\n📊 RÉSULTAT DE L'ANALYSE IA:`)
    console.log(`─`.repeat(40))
    console.log(`${typeIcon} Type: ${result.primaryType}`)
    console.log(`📈 Confiance: ${(result.confidence * 100).toFixed(1)}%`)
    console.log(`🧠 Raisonnement: ${result.reasoning}`)
    
    if (result.extractedInfo) {
      console.log(`\n📋 INFORMATIONS EXTRAITES:`)
      console.log(`─`.repeat(40))
      Object.entries(result.extractedInfo).forEach(([key, value]) => {
        if (value) {
          const icon = key === 'size' ? '📏' : 
                      key === 'color' ? '🎨' : 
                      key === 'context' ? '🎭' : '📋'
          console.log(`${icon} ${key}: ${value}`)
        }
      })
    }
    
    if (result.productCategory) {
      console.log(`\n📦 CATÉGORIE PRODUIT (XLSX):`)
      console.log(`─`.repeat(40))
      console.log(`🆔 ID: ${result.productCategory.id}`)
      console.log(`📋 Type: ${result.productCategory.typeProduct}`)
      console.log(`📈 Confiance: ${(result.productCategory.confidence * 100).toFixed(1)}%`)
    }
    
    if (result.missingInfo.length > 0) {
      console.log(`\n⚠️ INFORMATIONS MANQUANTES:`)
      console.log(`─`.repeat(40))
      result.missingInfo.forEach(info => console.log(`❌ ${info}`))
    }
    
    if (result.suggestions.length > 0) {
      console.log(`\n💡 SUGGESTIONS D'AMÉLIORATION:`)
      console.log(`─`.repeat(40))
      result.suggestions.forEach(suggestion => console.log(`💡 ${suggestion}`))
    }
    
    console.log(`${'='.repeat(60)}\n`)
  }
  
  private fallbackCategorization(query: string): AICategorization {
    // Fallback simple si IA échoue
    const isQuestion = query.includes('?') || query.toLowerCase().includes('comment')
    const hasContext = query.toLowerCase().includes('pour') || query.toLowerCase().includes('tenue')
    
    return {
      primaryType: isQuestion ? 'FAQ' : hasContext ? 'OUTFIT' : 'ITEM',
      confidence: 0.6,
      reasoning: 'Analyse fallback (IA indisponible)',
      extractedInfo: {},
      missingInfo: ['informations détaillées'],
      suggestions: ['Reformulez votre demande pour plus de précision']
    }
  }
}

export const aiCategorizationService = new AICategorizationService() 


