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
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Fichier non trouvé: ${filePath}`)
      return []
    }

    try {
      const workbook = XLSX.readFile(filePath)
      console.log(`📋 Fichier: ${filePath}`)
      console.log(`📊 Feuilles disponibles: ${workbook.SheetNames.join(', ')}`)
      
      // Chercher spécifiquement la feuille "Hierarchie produit"
      const targetSheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('hierarchie') || 
        name.toLowerCase().includes('hierarchy')
      )
      
      if (!targetSheetName) {
        console.error(`❌ Feuille "Hierarchie produit" non trouvée dans: ${workbook.SheetNames.join(', ')}`)
        return []
      }
      
      const worksheet = workbook.Sheets[targetSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      console.log(`📄 Feuille "${targetSheetName}": ${jsonData.length} lignes`)
      console.log(`🔍 Colonnes disponibles:`, Object.keys(jsonData[0] || {}))
      
      // Extraire UNIQUEMENT les colonnes spécifiées
      const hierarchyData: ProductHierarchy[] = []
      
      jsonData.forEach((row: any, index: number) => {
        // Chercher les colonnes avec différentes variantes de noms
        const idNiveau3 = row['ID Niveau 3'] || row['id_niveau_3'] || row['ID_NIVEAU_3'] || row['idNiveau3']
        const libelleNiveau3 = row['Libellé Niveau 3'] || 
                               row['libelle_niveau_3_type_produit'] || 
                               row['LIBELLE_NIVEAU_3_TYPE_PRODUIT'] || 
                               row['Libellé Niveau 3'] ||
                               row['libelle_niveau_3']
        
        // Afficher les données trouvées pour debug
        if (index < 3) {
          console.log(`📋 Ligne ${index + 1}:`)
          console.log(`   🆔 ID Niveau 3: "${idNiveau3}"`)
          console.log(`   🏷️ Libellé Niveau 3: "${libelleNiveau3}"`)
        }
        
        // Ajouter seulement si les deux colonnes principales sont présentes
        if (idNiveau3 && libelleNiveau3) {
          hierarchyData.push({
            id: String(idNiveau3),
            name: String(libelleNiveau3).trim(),
            level: 3, // Toujours niveau 3 selon la spécification
            parent: undefined, // Non utilisé dans cette version simplifiée
            path: [String(libelleNiveau3).trim()] // Chemin simple avec le libellé
          })
        }
      })
      
      console.log(`✅ Hiérarchie extraite: ${hierarchyData.length}/${jsonData.length} éléments valides`)
      
      // Afficher les 5 premiers éléments pour vérification
      hierarchyData.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ID: "${item.id}" | Nom: "${item.name}"`)
      })
      
      return hierarchyData
      
    } catch (error) {
      console.error(`❌ Erreur lecture ${filePath}:`, error)
      return []
    }
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
      const allData: T[] = []
      let totalRows = 0
      
      console.log(`📋 Fichier: ${filePath}`)
      console.log(`📊 Feuilles disponibles: ${workbook.SheetNames.join(', ')}`)
      
      // ✅ Lire TOUTES les feuilles au lieu de seulement la première
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        if (jsonData.length > 0) {
          console.log(`📄 Feuille "${sheetName}": ${jsonData.length} lignes`)
          
          const mappedData = jsonData
            .map((row, index) => mapper(row, totalRows + index))
            .filter((item: any) => item.name || item.label)
          
          allData.push(...mappedData)
          totalRows += jsonData.length
        } else {
          console.log(`⚠️ Feuille "${sheetName}": Vide`)
        }
      }
      
      console.log(`✅ Total extrait: ${allData.length}/${totalRows} éléments valides`)
      return allData
      
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

  // ✅ CATÉGORISATION SIMPLIFIÉE BASÉE UNIQUEMENT SUR LA HIÉRARCHIE PRODUIT
  async categorizeUserPrompt(query: string): Promise<CategoryAnalysis> {
    const data = await this.getReferentialData()
    const queryLower = query.toLowerCase()
    const words = queryLower.split(/\s+/).filter(w => w.length > 2)
    
    console.log(`🔍 Catégorisation basée sur hiérarchie uniquement: "${query}"`)
    console.log(`📋 Référentiel hiérarchie: ${data.productHierarchy.length} types de produits`)
    
    // Analyser UNIQUEMENT la hiérarchie produit (colonnes "ID Niveau 3" et "Libellé Niveau 3")
    const hierarchyMatches = this.analyzeHierarchySimplified(data.productHierarchy, words, queryLower)
    
    // Détermination basée uniquement sur la hiérarchie
    const categoryAnalysis = this.determineCategoryFromHierarchy(hierarchyMatches, query)
    
    console.log(`📊 Catégorie finale: "${categoryAnalysis.detectedCategory}" (confiance: ${(categoryAnalysis.confidence * 100).toFixed(1)}%)`)
    if (categoryAnalysis.subCategories.length > 0) {
      console.log(`📋 Sous-catégories alternatives: ${categoryAnalysis.subCategories.slice(0, 3).join(', ')}`)
    }
    
    return categoryAnalysis
  }

  // ✅ Analyse simplifiée de la hiérarchie (focus sur ID Niveau 3 et Libellé Niveau 3)
  private analyzeHierarchySimplified(hierarchy: ProductHierarchy[], words: string[], query: string) {
    const matches = []
    
    console.log(`🔍 Analyse de ${hierarchy.length} types de produits hiérarchiques...`)
    
    for (const hier of hierarchy) {
      let score = 0
      const details = []
      
      // 🥇 1. CORRESPONDANCE EXACTE DU LIBELLÉ - Priorité maximale (10.0 points)
      if (query.includes(hier.name.toLowerCase())) {
        score += 10.0
        details.push(`Libellé exact: +10.0`)
        console.log(`   🎯 Match exact trouvé: "${hier.name}" (ID: ${hier.id})`)
      }
      
      // 🥈 2. CORRESPONDANCE PARTIELLE FORTE - Priorité élevée (5.0 points par mot)
      for (const word of words) {
        if (word.length > 3 && hier.name.toLowerCase().includes(word)) {
          score += 5.0
          details.push(`Mot "${word}" dans libellé: +5.0`)
        }
      }
      
      // 🥉 3. CORRESPONDANCE PARTIELLE FAIBLE - Priorité moyenne (2.0 points par mot)
      for (const word of words) {
        if (word.length > 2 && word.length <= 3 && hier.name.toLowerCase().includes(word)) {
          score += 2.0
          details.push(`Mot court "${word}": +2.0`)
        }
      }
      
      // 🏅 4. CORRESPONDANCE ID NIVEAU 3 - Priorité spéciale (15.0 points si correspondance)
      if (hier.id && query.includes(hier.id.toLowerCase())) {
        score += 15.0
        details.push(`ID Niveau 3 exact: +15.0`)
        console.log(`   🆔 Match ID trouvé: "${hier.id}" -> "${hier.name}"`)
      }
      
      // 🏆 5. SYNONYMES ET VARIANTES - Priorité contextuelle (3.0 points)
      const synonyms = this.getProductSynonyms(hier.name)
      for (const synonym of synonyms) {
        if (query.includes(synonym.toLowerCase())) {
          score += 3.0
          details.push(`Synonyme "${synonym}": +3.0`)
        }
      }
      
      if (score > 0) {
        // Score final avec bonus de confiance pour les scores élevés
        const confidence = Math.min(score / 10.0, 1.0) // Normalisation sur base de score max (10.0)
        const bonusConfidence = score > 10.0 ? 0.2 : 0 // Bonus pour les très bons matches
        
        matches.push({
          hierarchy: hier,
          score,
          confidence: Math.min(confidence + bonusConfidence, 1.0),
          details: details.join(', '),
          idNiveau3: hier.id,
          libelleNiveau3: hier.name
        })
      }
    }
    
    const sortedMatches = matches.sort((a, b) => b.score - a.score)
    
    console.log(`✅ Trouvé ${sortedMatches.length} correspondances hiérarchiques`)
    sortedMatches.slice(0, 5).forEach((match, index) => {
      console.log(`   ${index + 1}. "${match.libelleNiveau3}" (ID: ${match.idNiveau3})`)
      console.log(`      📊 Score: ${match.score.toFixed(1)} | Confiance: ${(match.confidence * 100).toFixed(1)}%`)
      console.log(`      🔍 Détails: ${match.details}`)
    })
    
    return sortedMatches
  }

  // ✅ Génération de synonymes pour les types de produits
  private getProductSynonyms(productName: string): string[] {
    const synonymsMap: { [key: string]: string[] } = {
      'tshirt': ['t-shirt', 'tee-shirt', 'tee shirt', 'polo'],
      't-shirt': ['tshirt', 'tee-shirt', 'tee shirt'],
      'pull': ['pullover', 'sweat', 'sweater'],
      'pantalon': ['jean', 'trouser', 'pants'],
      'robe': ['dress', 'tunique'],
      'veste': ['jacket', 'blouson', 'manteau'],
      'chaussure': ['shoe', 'basket', 'sneaker', 'escarpin'],
      'sac': ['bag', 'handbag', 'pochette'],
      'jupe': ['skirt', 'jupette'],
      'short': ['bermuda', 'pantacourt']
    }
    
    const lowerName = productName.toLowerCase()
    const synonyms: string[] = []
    
    // Chercher des synonymes directs
    for (const [key, values] of Object.entries(synonymsMap)) {
      if (lowerName.includes(key)) {
        synonyms.push(...values)
      }
    }
    
    return [...new Set(synonyms)] // Dédoublonner
  }

  // ✅ Détermination de catégorie basée uniquement sur la hiérarchie
  private determineCategoryFromHierarchy(hierarchyMatches: any[], originalQuery: string): CategoryAnalysis {
    let detectedCategory = 'Non classifié'
    let confidence = 0.1
    let subCategories: string[] = []
    let suggestedFilters: ProductFilter[] = []
    let matchingTypes: ProductType[] = []
    let hierarchyPath: string[] = []
    
    console.log(`📊 DÉTERMINATION CATÉGORIE HIÉRARCHIQUE:`)
    
    if (hierarchyMatches.length > 0) {
      const bestMatch = hierarchyMatches[0]
      
      // Utiliser le libellé comme catégorie principale
      detectedCategory = bestMatch.libelleNiveau3
      confidence = bestMatch.confidence
      hierarchyPath = [bestMatch.libelleNiveau3]
      
      console.log(`🥇 Catégorie principale: "${detectedCategory}"`)
      console.log(`   🆔 ID Niveau 3: "${bestMatch.idNiveau3}"`)
      console.log(`   📊 Score: ${bestMatch.score.toFixed(1)} | Confiance: ${(confidence * 100).toFixed(1)}%`)
      console.log(`   🔍 Raison: ${bestMatch.details}`)
      
      // Sous-catégories des autres matches
      subCategories = hierarchyMatches
        .slice(1, 4) // Top 3 alternatives
        .map(m => m.libelleNiveau3)
        .filter(name => name !== detectedCategory)
      
      // Filtres suggérés basés sur l'ID et le libellé
      suggestedFilters.push({
        field: 'category',
        value: bestMatch.libelleNiveau3,
        confidence: confidence
      })
      
      // Ajouter filtre par ID si différent
      if (bestMatch.idNiveau3 !== bestMatch.libelleNiveau3) {
        suggestedFilters.push({
          field: 'type',
          value: bestMatch.idNiveau3,
          confidence: confidence * 0.9
        })
      }
      
      // Types de produits simulés à partir de la hiérarchie (pour compatibilité)
      matchingTypes = hierarchyMatches.slice(0, 3).map(match => ({
        id: match.idNiveau3,
        name: match.libelleNiveau3,
        category: match.libelleNiveau3,
        group: 'Hiérarchie Younzee',
        description: `Type de produit issu de la hiérarchie (ID: ${match.idNiveau3})`,
        keywords: match.libelleNiveau3.toLowerCase().split(/\s+/)
      }))
      
      console.log(`📋 Sous-catégories: ${subCategories.join(', ') || 'Aucune'}`)
    } else {
      console.log(`⚠️ Aucune correspondance trouvée dans la hiérarchie pour: "${originalQuery}"`)
      console.log(`💡 Suggestions: Vérifiez l'orthographe ou utilisez des termes plus génériques`)
    }
    
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
