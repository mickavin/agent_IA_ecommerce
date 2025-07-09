import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { Document } from '@langchain/core/documents'
import Papa from 'papaparse'
import fs from 'fs'
import path from 'path'
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
// Mapping de la demande utilisateur vers la nomenclature Younzee
const CATEGORIZATION_PROMPT_ITEM = (types_valides: string[], tailles_valides: string[], couleurs_valides: string[]) => `
Tu es un assistant e-commerce spécialisé dans la mode. Ta tâche est d'extraire trois attributs d'un texte :
                    - type_produit_classifié : le type exact du vêtement parmi les choix disponibles
                    - taille_extraite : la taille mentionnée
                    - couleur_younzee : la couleur exacte parmi les choix disponibles
                    Types valides : ${types_valides.join(', ')}
                    Tailles valides : ${tailles_valides.join(', ')}
                    Couleurs valides : ${couleurs_valides.join(', ')}
                    Instructions spéciales :
                    1. Pour les pulls : associe 'pull' à 'Pulls (cols ronds et V)' sauf si un col spécifique est mentionné
                    2. Pour les t-shirts : utilise 'T-shirts manches courtes' par défaut sauf si 'manches longues' est spécifié
                    3. Pour les pantalons : utilise 'Pantalons Chino & Classiques' sauf si un style spécifique est mentionné
                    4. Ignore la casse dans la recherche
                    5. Si un des attributs n'est pas valide, retourne null pour cet attribut
                    Réponds uniquement en JSON :
                    {"type_produit_classifié":"...","taille_extraite":"...","couleur_younzee":"..."}
`

const CATEGORIZATION_PROMPT_ITEM2 = (types_valides: string[], tailles_valides: string[], couleurs_valides: string[]) => `
Tu es un assistant e-commerce spécialisé dans la mode. Ta tâche est d'extraire trois attributs d'un texte :
                    - types_produit_classifiés : les types exacts et similaires du vêtement parmi les choix disponibles
                    - tailles_extraites : les tailles exactes et similaires
                    - couleurs_younzee : les couleurs exactes et similaires parmi les choix disponibles
                    Types valides : ${types_valides.join(', ')}
                    Tailles valides : ${tailles_valides.join(', ')}
                    Couleurs valides : ${couleurs_valides.join(', ')}
                    Instructions spéciales :
                    1. Pour les pulls : associe 'pull' à 'Pulls (cols ronds et V)' sauf si un col spécifique est mentionné
                    2. Pour les t-shirts : utilise 'T-shirts manches courtes' par défaut sauf si 'manches longues' est spécifié
                    3. Pour les pantalons : utilise 'Pantalons Chino & Classiques' sauf si un style spécifique est mentionné
                    4. Ignore la casse dans la recherche
                    5. Si un des attributs n'est pas valide, retourne null pour cet attribut
                    Réponds uniquement en JSON :
                    {"types_produit_classifiés": ["type produits exacte","type produit similaire ou voisin 1", "type produit similaire ou voisin 2", ...],"tailles_extraites": ["taille exacte","taille similaire ou voisin 1", "taille similaire ou voisin 2", ...],"couleurs_younzee": ["couleur exacte","couleur similaire ou voisin 1", "couleur similaire ou voisin 2", ...]}
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
      batchSize: 500, // ✅ Batch plus petit pour meilleure qualité
    })
    this.openaiService = new OpenAIService()
  }

  private async getUniqueColors(objectsArray: ProductDocument[]): Promise<string[]> {
    const allColors = objectsArray.flatMap(obj => obj.metadata.colors);
    const uniqueColors = [...new Set(allColors)];
    return uniqueColors;
  }

  private async getUniqueSizes(objectsArray: ProductDocument[]): Promise<string[]> {
    const allSizes = objectsArray.flatMap(obj => obj.metadata.sizes);
    const uniqueSizes = [...new Set(allSizes)];
    return uniqueSizes;
  }

  private async getUniqueTypes(objectsArray: ProductDocument[]): Promise<string[]> {
    const allTypes = objectsArray.flatMap(obj => obj.metadata.type_produit_classifié);
    const uniqueTypes = [...new Set(allTypes)];
    return uniqueTypes;
  }

  private async loadCSVData(relevantCategories?: string[]): Promise<void> {
    // ✅ Réinitialisation pour éviter les doublons lors des rechargements
    this.documents = []
    
    const csvFileNames = [
      'produits_final.csv',
    ]

    // Utilisation de path.join pour construire les chemins de manière sécurisée
    const basePath = process.cwd()
    const dataFolders = ['files', 'data'] // Dossiers possibles

    for (const fileName of csvFileNames) {
      let fileLoaded = false
      
      // Essayer différents dossiers avec path.join
      for (const folder of dataFolders) {
        if (fileLoaded) break
        
        const csvPath = path.join(basePath, folder, fileName)
        
        try {
          console.log(`📄 Tentative de chargement ${csvPath}${relevantCategories ? ' avec filtrage catégories' : ''}...`)
          const csvContent = fs.readFileSync(csvPath, 'utf8')
          const documents = await this.parseCSV(csvContent, csvPath, relevantCategories)
          this.documents.push(...documents)
          console.log(`✅ ${csvPath}: ${documents.length} documents chargés`)
          fileLoaded = true          
        } catch (error: any) {
          // Si le fichier n'existe pas ou erreur de lecture
          if (error.code === 'ENOENT') {
            console.log(`📂 Fichier non trouvé: ${csvPath}`)
          } else {
            console.error(`❌ Erreur lecture ${csvPath}:`, error.message)
          }
        }
      }
      
      if (!fileLoaded) {
        console.warn(`⚠️ Aucun fichier trouvé pour: ${fileName} dans les dossiers [${dataFolders.join(', ')}]`)
      }
    }

    console.log(`📊 Total documents chargés: ${this.documents.length}`)
    console.log(`📊 Documents conservés: ${this.documents.length} (filtrage: ${relevantCategories ? `${relevantCategories.length} catégories` : 'désactivé'})`)
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
                const type_produit_classifié = row.type_produit_classifié || 'Non classifié'
                const images = row.image_urls.split(';') || []
                // ✅ FILTRAGE PAR CATÉGORIE DU RÉFÉRENTIEL
                if (relevantCategories && relevantCategories.length > 0) {
                  const hasMatchingCategory = relevantCategories.some(relevantCat => {
                    const catLower = type_produit_classifié.toLowerCase()
                    const refLower = relevantCat.toLowerCase()
                    
                    // Correspondance bidirectionnelle pour flexibilité
                    return catLower.includes(refLower) || refLower.includes(catLower)
                  })
                  
                  if (!hasMatchingCategory) {
                    console.log(`🚫 Produit filtré: "${title}" (catégorie: "${type_produit_classifié}")`)
                    return null // Exclure ce produit
                  }
                }
                
                const colors = this.extractArray(row.couleur || row.couleur_younzee)
                const sizes = this.extractArray(row.taille || row.variant_title)

                const content = this.createRichContent({
                  title, description, type_produit_classifié, colors, sizes, price
                })

                return {
                  id: `${source}_${index}`,
                  content,
                  metadata: {
                    title,
                    description,
                    price,
                    type_produit_classifié,
                    colors,
                    sizes,
                    handle: row.handle || `product-${index}`,
                    status: row.status || 'ACTIVE',
                    availableForSale: row.availableForSale !== 'False',
                    source,
                    filteredByReferential: !!relevantCategories?.length,
                    images
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
  private filterDocumentsByCategory(type_produit_classifié: string): ProductDocument[] {
    if (!type_produit_classifié) {
      return this.documents // Retourner tous si pas de catégorie détectée
    }
    const targetCategory = type_produit_classifié.toLowerCase()    
    return this.documents.filter(doc => {
      const docCategory = doc.metadata.type_produit_classifié.toLowerCase()
      
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

  private extractArray(value: any): string[] {
    if (!value) return []
    if (Array.isArray(value)) return value
    return String(value).split(/[,;]\s*/).filter(v => v.trim())
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
    const batchSize = 500
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

    // ✅ 5️⃣ CHARGEMENT DES PRODUITS
    await this.loadCSVData()
    console.log(`✅ Produits chargés: ${this.documents.length} documents`)

    // ✅ 6️⃣ CHARGEMENT DES COULEURS, TAILLES ET TYPES UNIQUES
    const uniqueColors = await this.getUniqueColors(this.documents)
    const uniqueSizes = await this.getUniqueSizes(this.documents)
    const uniqueTypes = await this.getUniqueTypes(this.documents)
    console.log(`✅ Couleurs uniques: ${uniqueColors.join(', ')}`)
    console.log(`✅ Tailles uniques: ${uniqueSizes.join(', ')}`)
    console.log(`✅ Types uniques: ${uniqueTypes.join(', ')}`)

    // ✅ 2️⃣ PRÉ-CATÉGORISATION ITEM/OUTFIT/FAQ avec logs détaillés
    const promptCategorization = await this.precategorizePrompt(query, uniqueColors, uniqueSizes, uniqueTypes)
    console.log(`🏷️ Pré-catégorisation: ${promptCategorization}`)

    const promptCategorizationParsed = JSON.parse(promptCategorization)
    console.log(`🏷️ Pré-catégorisation: ${promptCategorizationParsed}`)

    if (promptCategorizationParsed.type_produit_classifié === null || promptCategorizationParsed.taille_extraite === null || promptCategorizationParsed.couleur_younzee === null) {
      
      // Générer demande de clarification et retourner directement
      const clarificationRequest = await this.generateClarificationRequest(query, Object.entries(promptCategorizationParsed).find(value => value[1] === null)?.[0] || '')
      
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
            missingInfo: Object.entries(promptCategorizationParsed).find(value => value[1] === null)?.[0] || '',
            originalQuery: query,
            filteredByReferential: false
          }
        },
        score: 1.0,
        relevance: 'high',
        searchType: 'clarification'
      }
      
      console.log(`💬 Retour de la demande de clarification uniquement - pas de recherche de produits`)
      return [clarificationResult]
    }
    
    const referentialStats = excelReferentialService.getStats()
    console.log(`✅ RAG initialisé: ${this.documents.length} produits + ${referentialStats.total} référentiels`)


    // ✅ 3️⃣ FILTRAGE DES PRODUITS par catégorie, par taille ET couleur détectées
    let filteredDocuments = this.filterDocumentsByCategory(promptCategorizationParsed.type_produit_classifié)
    console.log(`🔄 Après filtrage catégorie: ${filteredDocuments.length} produits`)    
    filteredDocuments = this.filterDocumentsBySizes(filteredDocuments, promptCategorizationParsed.taille_extraite)
    console.log(`🔄 Après filtrage taille: ${filteredDocuments.length} produits`)    
    const colorFiltered = this.filterDocumentsByColors(filteredDocuments, promptCategorizationParsed.couleur_younzee)
    console.log(`🎨 Après filtrage couleur: ${colorFiltered.length} produits (couleur: ${promptCategorizationParsed.couleur_younzee})`)
    filteredDocuments = colorFiltered





    // ******************************FALLBACK A RAJOUTER****************************************
    
    
    
    
    
    // EXECUTION DE LA RECOMMANDATION
    try {
      this.documents = filteredDocuments
      await this.createVectorStore()
      this.isInitialized = true
      // ✅ 4️⃣ PREPROCESSING de la requête
      //const processedQuery = this.preprocessQuery(query
      const processedQuery = query
      console.log(`🔍 Query preprocessing: "${query}" -> "${processedQuery}"`)

      const k = Math.min(options.k || 5, 20)

    
      let results: RAGSearchResult[] = []

      // ✅ 5️⃣ RECHERCHE sur les produits filtrés par catégorie, taille ET couleur
      results = await this.categorizedSemanticSearch(processedQuery, k, filteredDocuments)

      // ✅ 6️⃣ ENRICHISSEMENT avec métadonnées catégorielles et couleurs
      results = results.map(result => ({
        ...result,
        categoryAnalysis: promptCategorizationParsed,
        metadata: {
          ...result.document.metadata,
          detectedCategory: promptCategorizationParsed.type_produit_classifié,
          categoryConfidence: 1,
          detectedColors: promptCategorizationParsed.couleur_younzee,
          filteredByCategory: true,
          filteredByColor: promptCategorizationParsed.couleur_younzee.length > 0
        }
      }))

      // ✅ 8️⃣ RETOUR DES RÉSULTATS FINAUX
      return results.sort((a, b) => b.score - a.score).slice(0, k)
    } catch (error) {
      console.error('Erreur recherche catégorisée:', error)
      return []
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
  
  // ✅ Translations basiques des requêtes
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

  // ✅ Filtrage strict par couleurs
  private filterDocumentsByColors(documents: ProductDocument[], detectedColors: string): ProductDocument[] {
    return documents.filter(doc => {
      const docColors = doc.metadata.colors || []
      console.log(`🔍 couleurs du produit: "${docColors}"`)
      // Vérifier si le produit a une des couleurs détectées
        for (const docColor of docColors) {
          const docColorLower = docColor.toLowerCase()
          const detectedColorsLower = detectedColors.toLowerCase()
          
          // Correspondance directe
          if (docColorLower.includes(detectedColorsLower) || detectedColorsLower.includes(docColorLower)) {
            return true
          }
          
          // Correspondance via synonymes
          const colorSynonyms = this.getColorSynonyms(detectedColors)
          for (const synonym of colorSynonyms) {
            if (docColorLower.includes(synonym) || synonym.includes(docColorLower)) {
              return true
            }
          }
        }
      
      return false
    })
  }

  // Translations basiques des couleurs
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

  // ✅ Filtrage strict par tailles
  private filterDocumentsBySizes(documents: ProductDocument[], detectedSizes: string): ProductDocument[] {
    return documents.filter(doc => {
      const docSizes = doc.metadata.sizes || []
      
      // Vérifier si le produit a une des tailles détectées
        for (const docSize of docSizes) {
          const docSizeLower = docSize.toLowerCase()
          const detectedSizeLower = detectedSizes.toLowerCase()
         
          // Correspondance directe
          if (docSizeLower.split(" ").includes(detectedSizeLower)) {
            console.log(`🔍 Filtrage par taille: "${docSizeLower}"`)
            console.log(`🔍 Filtrage par taille detected: "${detectedSizeLower}"`)
            return true
          }
        }      
      return false
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

  private async precategorizePrompt(query: string, uniqueColors: string[], uniqueSizes: string[], uniqueTypes: string[]) {
    const prompt = CATEGORIZATION_PROMPT_ITEM(uniqueColors, uniqueSizes, uniqueTypes)
    const response = await this.openaiService.generateResponse({
      systemPrompt: prompt,
      userMessage: query,
      maxTokens: 1000,
      temperature: 0.7
    })
   
    return response
  }


  private async generateClarificationRequest(
    originalQuery: string, 
    promptCategorizationParsed: string
  ): Promise<string> {
    try {
      const prompt = `
Tu es un assistant shopping pour Younzee, spécialisé en mode. Un client recherche un article mais il manque des informations importantes.

Requête originale: "${originalQuery}"
Informations manquantes: ${promptCategorizationParsed}

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
      return this.generateFallbackClarificationRequest(originalQuery, Object.entries(promptCategorizationParsed).find(value => value[1] === null)?.[0] || '')
    }
  }

  // ✅ Demande de clarification simple
  private generateFallbackClarificationRequest(originalQuery: string, missingInfo: string): string {
    const missingTexts: { [key: string]: string } = {
      'couleur': 'la couleur souhaitée',
      'taille': 'votre taille',
      'type de vêtement': 'le type d\'article exact'
    }
    
    const missing = missingTexts[missingInfo] || missingInfo
    
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


