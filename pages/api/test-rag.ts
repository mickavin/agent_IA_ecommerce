import { NextApiRequest, NextApiResponse } from 'next'

// Types pour le RAG de test
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

interface ProductMatch {
  document: ProductDocument
  score: number
  relevance: 'high' | 'medium' | 'low'
  searchType: 'semantic' | 'keyword' | 'hybrid'
}

// Service RAG simplifié pour test
class SimpleRAGService {
  private documents: ProductDocument[] = []
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('📋 Initialisation du service RAG de test...')
      await this.loadTestData()
      this.isInitialized = true
      console.log(`✅ RAG initialisé avec ${this.documents.length} produits`)
    } catch (error) {
      console.error('❌ Erreur initialisation RAG:', error)
      throw error
    }
  }

  private async loadTestData(): Promise<void> {
    // Données de test basées sur le CSV sample
    this.documents = [
      {
        id: 'tshirt-violet-1',
        content: 'T-shirt Violette - Citrouille | T-Shirt Violette. Dispo en plusieurs couleurs | T-shirts manches courtes | 70€',
        metadata: {
          title: 'T-shirt Violette - Citrouille',
          description: 'T-Shirt Violette. Dispo en plusieurs couleurs',
          price: 70,
          category: 'T-shirts manches courtes',
          colors: ['violet'],
          sizes: ['XXS', 'XS', 'S', 'M', 'L'],
          handle: 't-shirt-violette-citrouille',
          status: 'ACTIVE',
          availableForSale: true,
          type_produit_classifié: 'T-shirts manches courtes',
          couleur_younzee: 'violet'
        }
      },
      {
        id: 'tshirt-violet-2',
        content: 'T-shirt Violette - Rose | T-Shirt Violette. Dispo en plusieurs couleurs | T-shirts manches courtes | 70€',
        metadata: {
          title: 'T-shirt Violette - Rose',
          description: 'T-Shirt Violette. Dispo en plusieurs couleurs',
          price: 70,
          category: 'T-shirts manches courtes',
          colors: ['violet'],
          sizes: ['XXS', 'XS', 'S', 'M', 'L'],
          handle: 't-shirt-violette-rose',
          status: 'ACTIVE',
          availableForSale: true,
          type_produit_classifié: 'T-shirts manches courtes',
          couleur_younzee: 'violet'
        }
      },
      {
        id: 'sweat-navy-1',
        content: 'Sweat Elisabeth - Navy | Réalisé à partir de coton BIO filé et peigné | Sweatshirts | 139€',
        metadata: {
          title: 'Sweat Elisabeth - Navy',
          description: 'Réalisé à partir de coton BIO filé et peigné (85%) et de polyester recyclé (15%)',
          price: 139,
          category: 'Sweatshirts',
          colors: ['bleu', 'navy'],
          sizes: ['S', 'M', 'L', 'XL'],
          handle: 'sweat-elisabeth-navy',
          status: 'ACTIVE',
          availableForSale: true,
          type_produit_classifié: 'Sweatshirts',
          couleur_younzee: 'bleu'
        }
      }
    ]
  }

  async search(query: string, k = 5): Promise<ProductMatch[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const queryLower = query.toLowerCase()
    const matches: ProductMatch[] = []

    // Recherche simple par mots-clés
    for (const doc of this.documents) {
      const contentLower = doc.content.toLowerCase()
      const titleLower = doc.metadata.title.toLowerCase()
      
      let score = 0
      
      // Score basé sur les mots-clés dans le titre
      const queryWords = queryLower.split(/\s+/)
      for (const word of queryWords) {
        if (titleLower.includes(word)) {
          score += 0.8
        }
        if (contentLower.includes(word)) {
          score += 0.3
        }
      }
      
      // Bonus pour correspondance exacte de couleur
      if (doc.metadata.colors.some(color => queryLower.includes(color.toLowerCase()))) {
        score += 0.5
      }
      
      if (score > 0) {
        matches.push({
          document: doc,
          score: Math.min(score, 1.0),
          relevance: score >= 0.8 ? 'high' : score >= 0.6 ? 'medium' : 'low',
          searchType: 'keyword'
        })
      }
    }

    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
  }

  async test(): Promise<{ success: boolean; results?: ProductMatch[]; error?: string }> {
    try {
      console.log('🧪 Test du service RAG...')
      
      if (!this.isInitialized) {
        await this.initialize()
      }

      const results = await this.search('t-shirt violet', 3)
      
      console.log(`✅ Test réussi: ${results.length} résultats trouvés`)
      results.forEach(r => {
        console.log(`- ${r.document.metadata.title} (score: ${r.score.toFixed(3)})`)
      })

      return { success: true, results }
    } catch (error: any) {
      console.error('❌ Test échoué:', error)
      return { success: false, error: error.message }
    }
  }
}

const ragService = new SimpleRAGService()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const query = req.method === 'GET' ? 
      (req.query.q as string) || 't-shirt violet' : 
      req.body.query || 't-shirt violet'
    
    const k = req.method === 'GET' ? 
      parseInt(req.query.k as string) || 5 : 
      req.body.k || 5

    console.log(`🔍 Test RAG avec query: "${query}"`)

    // Test simple
    const testResult = await ragService.test()
    
    // Recherche avec la query
    const searchResults = await ragService.search(query, k)

    return res.status(200).json({
      success: true,
      test: testResult,
      search: {
        query,
        results: searchResults,
        count: searchResults.length
      },
      service: 'Simple RAG Service',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erreur API Test RAG:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message,
      service: 'Simple RAG Service',
      timestamp: new Date().toISOString()
    })
  }
} 