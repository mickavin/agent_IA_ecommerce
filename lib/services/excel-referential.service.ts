/**
 * Service de référentiel Excel pour enrichir le RAG
 * Charge et structure les données des fichiers XLSX de référence
 */

import * as XLSX from 'xlsx'
import * as fs from 'fs'

export interface ReferentialData {
  productHierarchy: ProductHierarchy[]
  productTypes: ProductType[]
  attributes: ProductAttribute[]
  listOfValues: ListOfValue[]
}

export interface ProductHierarchy {
  id: string
  name: string
  level: number
  parent?: string
  path: string[]
}

export interface ProductType {
  id: string
  name: string
  category: string
  group: string
  description?: string
  keywords: string[]
}

export interface ProductAttribute {
  id: string
  name: string
  type: 'text' | 'number' | 'boolean' | 'list'
  category: string
  values?: string[]
}

export interface ListOfValue {
  domain: string
  code: string
  label: string
  description?: string
}

// ✅ Interface pour la catégorisation intelligente
export interface CategoryAnalysis {
  detectedCategory: string
  confidence: number
  subCategories: string[]
  suggestedFilters: ProductFilter[]
  matchingTypes: ProductType[]
  hierarchyPath: string[]
}

export interface ProductFilter {
  field: 'category' | 'type' | 'group' | 'attributes'
  value: string
  confidence: number
}

export class ExcelReferentialService {
  private referentialData: ReferentialData | null = null
  private isLoaded = false

  async loadReferentials(): Promise<void> {
    if (this.isLoaded) return

    try {
      console.log('📊 Chargement des référentiels Excel...')

      const [hierarchy, types, attributes, lov] = await Promise.all([
        this.loadProductHierarchy(),
        this.loadProductTypes(), 
        this.loadProductAttributes(),
        this.loadListOfValues()
      ])

      this.referentialData = {
        productHierarchy: hierarchy,
        productTypes: types,
        attributes: attributes,
        listOfValues: lov
      }

      this.isLoaded = true
      const total = hierarchy.length + types.length + attributes.length + lov.length
      console.log(`✅ Référentiels chargés: ${total} éléments`)
    } catch (error) {
      console.error('❌ Erreur chargement référentiels:', error)
      throw error
    }
  }

  private async loadProductHierarchy(): Promise<ProductHierarchy[]> {
    const filePath = 'files/Younzee-Hierarchie produit-20250417.xlsx'
    return this.loadExcelFile(filePath, (row: any, index: number) => ({
      id: row.id || `hier_${index}`,
      name: row.name || row.libelle || row.label || '',
      level: parseInt(row.level || row.niveau || '1'),
      parent: row.parent || row.parent_id,
      path: this.buildPath(row)
    }))
  }

  private async loadProductTypes(): Promise<ProductType[]> {
    const filePath = 'files/Younzee-Regroupement Types de produits-20250402.xlsx'
    return this.loadExcelFile(filePath, (row: any, index: number) => ({
      id: row.id || `type_${index}`,
      name: row.type || row.name || row.libelle || '',
      category: row.category || row.categorie || row.groupe || 'Non classifié',
      group: row.group || row.regroupement || row.family || 'Autre',
      description: row.description || row.desc,
      keywords: this.extractKeywords(row)
    }))
  }

  private async loadProductAttributes(): Promise<ProductAttribute[]> {
    const filePath = 'files/Younzee-Attributs-202306.xlsx'
    return this.loadExcelFile(filePath, (row: any, index: number) => ({
      id: row.id || `attr_${index}`,
      name: row.attribute || row.attribut || row.name || '',
      type: this.inferType(row),
      category: row.category || row.categorie || 'Général',
      values: row.values ? row.values.split(',').map((v: string) => v.trim()) : undefined
    }))
  }

  private async loadListOfValues(): Promise<ListOfValue[]> {
    const filePath = 'files/Younzee-LOV-202408.xlsx'
    return this.loadExcelFile(filePath, (row: any, index: number) => ({
      domain: row.domain || row.domaine || row.category || 'Général',
      code: row.code || row.value || `lov_${index}`,
      label: row.label || row.libelle || row.name || '',
      description: row.description || row.desc
    }))
  }

  private async loadExcelFile<T>(filePath: string, mapper: (row: any, index: number) => T): Promise<T[]> {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Fichier non trouvé: ${filePath}`)
      return []
    }

    try {
      const workbook = XLSX.readFile(filePath)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      return jsonData.map(mapper).filter((item: any) => 
        item.name || item.label
      )
    } catch (error) {
      console.error(`❌ Erreur lecture ${filePath}:`, error)
      return []
    }
  }

  private buildPath(row: any): string[] {
    const path = []
    if (row.level1) path.push(row.level1)
    if (row.level2) path.push(row.level2) 
    if (row.level3) path.push(row.level3)
    return path
  }

  private extractKeywords(row: any): string[] {
    const text = `${row.name || ''} ${row.description || ''}`.toLowerCase()
    return text.split(/\s+/).filter(word => word.length > 2)
  }

  private inferType(row: any): 'text' | 'number' | 'boolean' | 'list' {
    const type = (row.type || '').toLowerCase()
    if (type.includes('number') || type.includes('prix')) return 'number'
    if (type.includes('boolean') || type.includes('oui')) return 'boolean'
    if (type.includes('list') || row.values) return 'list'
    return 'text'
  }

  async getReferentialData(): Promise<ReferentialData> {
    if (!this.isLoaded) {
      await this.loadReferentials()
    }
    return this.referentialData!
  }

  async searchInReferentials(query: string): Promise<any[]> {
    const data = await this.getReferentialData()
    const results = []
    const queryLower = query.toLowerCase()

    // Recherche dans les types
    const matchingTypes = data.productTypes.filter(type => 
      type.name.toLowerCase().includes(queryLower) ||
      type.category.toLowerCase().includes(queryLower)
    )

    // Recherche dans les LOV
    const matchingLov = data.listOfValues.filter(lov =>
      lov.label.toLowerCase().includes(queryLower) ||
      lov.code.toLowerCase().includes(queryLower)
    )

    return [...matchingTypes, ...matchingLov]
  }

  async getEnrichedContext(query: string): Promise<string> {
    const matches = await this.searchInReferentials(query)
    
    if (matches.length === 0) return ''

    let context = 'Référentiel Younzee:\n'
    matches.slice(0, 3).forEach(match => {
      if (match.name && match.category) {
        context += `- ${match.name} (${match.category})\n`
      } else if (match.label) {
        context += `- ${match.label} (${match.domain})\n`
      }
    })

    return context
  }

  // ✅ CATÉGORISATION INTELLIGENTE DU PROMPT UTILISATEUR
  async categorizeUserPrompt(query: string): Promise<CategoryAnalysis> {
    const data = await this.getReferentialData()
    const queryLower = query.toLowerCase()
    const words = queryLower.split(/\s+/).filter(w => w.length > 2)
    
    console.log(`🔍 Analyse catégorielle: "${query}"`)
    
    // 1️⃣ Analyse par types de produits
    const typeMatches = this.analyzeProductTypes(data.productTypes, words, queryLower)
    
    // 2️⃣ Analyse par hiérarchie
    const hierarchyMatches = this.analyzeHierarchy(data.productHierarchy, words, queryLower)
    
    // 3️⃣ Analyse par LOV
    const lovMatches = this.analyzeLOV(data.listOfValues, words, queryLower)
    
    // 4️⃣ Détermination de la catégorie principale
    const categoryAnalysis = this.determinePrimaryCategory(typeMatches, hierarchyMatches, lovMatches)
    
    console.log(`📊 Catégorie détectée: "${categoryAnalysis.detectedCategory}" (confiance: ${categoryAnalysis.confidence.toFixed(2)})`)
    
    return categoryAnalysis
  }

  // ✅ Analyse des types de produits
  private analyzeProductTypes(types: ProductType[], words: string[], query: string) {
    const matches = []
    
    for (const type of types) {
      let score = 0
      let matches_count = 0
      
      // Correspondance exacte nom
      if (query.includes(type.name.toLowerCase())) {
        score += 1.0
        matches_count++
      }
      
      // Correspondance partielle nom
      for (const word of words) {
        if (type.name.toLowerCase().includes(word)) {
          score += 0.7
          matches_count++
        }
      }
      
      // Correspondance catégorie
      for (const word of words) {
        if (type.category.toLowerCase().includes(word)) {
          score += 0.8
          matches_count++
        }
      }
      
      // Correspondance mots-clés
      for (const keyword of type.keywords) {
        for (const word of words) {
          if (keyword.includes(word)) {
            score += 0.6
            matches_count++
          }
        }
      }
      
      if (score > 0) {
        matches.push({
          type,
          score: score / Math.max(words.length, 1),
          matches_count,
          confidence: Math.min(score / words.length, 1.0)
        })
      }
    }
    
    return matches.sort((a, b) => b.score - a.score)
  }

  // ✅ Analyse de la hiérarchie
  private analyzeHierarchy(hierarchy: ProductHierarchy[], words: string[], query: string) {
    const matches = []
    
    for (const hier of hierarchy) {
      let score = 0
      
      // Correspondance nom hiérarchie
      if (query.includes(hier.name.toLowerCase())) {
        score += 1.0
      }
      
      // Correspondance chemin hiérarchique
      for (const pathElement of hier.path) {
        for (const word of words) {
          if (pathElement.toLowerCase().includes(word)) {
            score += 0.8
          }
        }
      }
      
      if (score > 0) {
        matches.push({
          hierarchy: hier,
          score,
          confidence: Math.min(score / words.length, 1.0)
        })
      }
    }
    
    return matches.sort((a, b) => b.score - a.score)
  }

  // ✅ Analyse des LOV
  private analyzeLOV(lovList: ListOfValue[], words: string[], query: string) {
    const matches = []
    
    for (const lov of lovList) {
      let score = 0
      
      // Correspondance label
      if (query.includes(lov.label.toLowerCase())) {
        score += 1.0
      }
      
      // Correspondance code
      if (query.includes(lov.code.toLowerCase())) {
        score += 0.9
      }
      
      // Correspondance mots
      for (const word of words) {
        if (lov.label.toLowerCase().includes(word)) {
          score += 0.7
        }
      }
      
      if (score > 0) {
        matches.push({
          lov,
          score,
          confidence: Math.min(score / words.length, 1.0)
        })
      }
    }
    
    return matches.sort((a, b) => b.score - a.score)
  }

  // ✅ Détermination de la catégorie principale
  private determinePrimaryCategory(typeMatches: any[], hierarchyMatches: any[], lovMatches: any[]): CategoryAnalysis {
    let detectedCategory = 'Général'
    let confidence = 0.1
    let subCategories: string[] = []
    let suggestedFilters: ProductFilter[] = []
    let matchingTypes: ProductType[] = []
    let hierarchyPath: string[] = []
    
    // Prioriser les types de produits
    if (typeMatches.length > 0) {
      const bestTypeMatch = typeMatches[0]
      detectedCategory = bestTypeMatch.type.category
      confidence = bestTypeMatch.confidence
      matchingTypes = typeMatches.slice(0, 3).map(m => m.type)
      
      // Filtres suggérés
      suggestedFilters.push({
        field: 'category',
        value: bestTypeMatch.type.category,
        confidence: bestTypeMatch.confidence
      })
      
      if (bestTypeMatch.type.group !== 'Autre') {
        suggestedFilters.push({
          field: 'group', 
          value: bestTypeMatch.type.group,
          confidence: bestTypeMatch.confidence * 0.8
        })
      }
    }
    
    // Enrichir avec hiérarchie
    if (hierarchyMatches.length > 0) {
      const bestHierMatch = hierarchyMatches[0]
      hierarchyPath = bestHierMatch.hierarchy.path
      
      if (confidence < bestHierMatch.confidence) {
        detectedCategory = bestHierMatch.hierarchy.name
        confidence = bestHierMatch.confidence
      }
    }
    
    // Sous-catégories des autres correspondances
    subCategories = [
      ...typeMatches.slice(1, 4).map(m => m.type.name),
      ...hierarchyMatches.slice(0, 2).map(m => m.hierarchy.name)
    ].filter(Boolean)
    
    return {
      detectedCategory,
      confidence,
      subCategories,
      suggestedFilters,
      matchingTypes,
      hierarchyPath
    }
  }

  getStats() {
    if (!this.isLoaded || !this.referentialData) {
      return { loaded: false, total: 0 }
    }

    const data = this.referentialData
    return {
      loaded: true,
      productHierarchy: data.productHierarchy.length,
      productTypes: data.productTypes.length,
      attributes: data.attributes.length,
      listOfValues: data.listOfValues.length,
      total: data.productHierarchy.length + data.productTypes.length + 
             data.attributes.length + data.listOfValues.length
    }
  }
}

export const excelReferentialService = new ExcelReferentialService()
