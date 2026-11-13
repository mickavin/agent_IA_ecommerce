import { NextApiRequest, NextApiResponse } from 'next'
import { s3RagService } from '@/lib/langchain/services/rag-s3.service'

/**
 * API RAG avec support S3 - Endpoint principal
 * 
 * GET /api/rag-s3?q=recherche&k=5&filters={"category":"t-shirt"}
 * POST /api/rag-s3 { "query": "t-shirt bleu", "k": 3, "filters": {"availableForSale": true} }
 * 
 * Actions spéciales:
 * GET /api/rag-s3?action=refresh - Force le rafraîchissement depuis S3
 * GET /api/rag-s3?action=stats - Obtient les statistiques du service
 * GET /api/rag-s3?action=test - Test du service
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Actions spéciales
    if (req.method === 'GET' && req.query.action) {
      return await handleSpecialActions(req, res)
    }

    // Recherche normale
    if (req.method === 'GET' || req.method === 'POST') {
      return await handleSearch(req, res)
    }

    return res.status(405).json({ error: 'Méthode non autorisée' })

  } catch (error: any) {
    console.error('❌ Erreur API RAG S3:', error)
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    })
  }
}

/**
 * Gère les actions spéciales (refresh, stats, test)
 */
async function handleSpecialActions(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query

  switch (action) {
    case 'refresh':
      console.log('🔄 Demande de rafraîchissement S3...')
      const refreshed = await s3RagService.refreshFromS3()
      return res.status(200).json({
        success: true,
        action: 'refresh',
        refreshed,
        message: refreshed ? 'Données rafraîchies depuis S3' : 'Données déjà à jour',
        stats: s3RagService.getStats()
      })

    case 'stats':
      console.log('📊 Demande de statistiques...')
      return res.status(200).json({
        success: true,
        action: 'stats',
        stats: s3RagService.getStats()
      })

    case 'test':
      console.log('🧪 Test du service S3RAG...')
      const testResult = await s3RagService.test()
      return res.status(200).json({
        success: true,
        action: 'test',
        ...testResult
      })

    default:
      return res.status(400).json({
        success: false,
        error: 'Action non reconnue',
        availableActions: ['refresh', 'stats', 'test']
      })
  }
}

/**
 * Gère les requêtes de recherche
 */
async function handleSearch(req: NextApiRequest, res: NextApiResponse) {
  let query: string
  let k: number = 5
  let filters: any = {}
  let searchType: 'semantic' | 'hybrid' = 'semantic'

  // Extraire les paramètres selon la méthode
  if (req.method === 'GET') {
    query = req.query.q as string || req.query.query as string
    k = parseInt(req.query.k as string) || 5
    searchType = (req.query.type as 'semantic' | 'hybrid') || 'semantic'
    
    // Parsing des filtres depuis l'URL
    if (req.query.filters) {
      try {
        filters = JSON.parse(req.query.filters as string)
      } catch (error) {
        console.warn('⚠️ Filtres JSON invalides:', req.query.filters)
      }
    }
  } else if (req.method === 'POST') {
    const body = req.body
    query = body.query
    k = body.k || 5
    filters = body.filters || {}
    searchType = body.searchType || 'semantic'
  }

  // Validation
  if (!query || query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Paramètre "query" requis',
      usage: {
        GET: '/api/rag-s3?q=recherche&k=5',
        POST: '{ "query": "recherche", "k": 5 }'
      }
    })
  }

  if (k < 1 || k > 50) {
    return res.status(400).json({
      success: false,
      error: 'Le paramètre "k" doit être entre 1 et 50'
    })
  }

  console.log(`🔍 Recherche RAG S3: "${query}" (k=${k}, type=${searchType})`)
  
  const startTime = Date.now()
  
  try {
    // Effectuer la recherche
    const results = await s3RagService.search(query, {
      k,
      filters,
      searchType
    })

    const searchTime = Date.now() - startTime
    
    console.log(`✅ ${results.length} résultats trouvés en ${searchTime}ms`)

    // Préparer la réponse
    const response = {
      success: true,
      query,
      results: results.map(match => ({
        id: match.document.id,
        title: match.document.metadata.title,
        description: match.document.metadata.description,
        price: match.document.metadata.price,
        category: match.document.metadata.category,
        colors: match.document.metadata.colors,
        sizes: match.document.metadata.sizes,
        handle: match.document.metadata.handle,
        status: match.document.metadata.status,
        availableForSale: match.document.metadata.availableForSale,
        vendor: match.document.metadata.vendor,
        tags: match.document.metadata.tags,
        stock: match.document.metadata.stock,
        thumbnailUrl: match.document.metadata.thumbnailUrl,
        score: match.score,
        relevance: match.relevance,
        searchType: match.searchType
      })),
      metadata: {
        totalResults: results.length,
        searchTime,
        searchType,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        k
      },
      stats: s3RagService.getStats()
    }

    return res.status(200).json(response)

  } catch (error: any) {
    console.error('❌ Erreur recherche RAG S3:', error)
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche',
      details: error.message,
      query
    })
  }
}

/**
 * Exemples d'utilisation pour la documentation
 */
export const examples = {
  GET: {
    basic: '/api/rag-s3?q=t-shirt&k=5',
    withFilters: '/api/rag-s3?q=robe&k=3&filters={"availableForSale":true}',
    hybrid: '/api/rag-s3?q=jean&k=10&type=hybrid',
    actions: {
      refresh: '/api/rag-s3?action=refresh',
      stats: '/api/rag-s3?action=stats',
      test: '/api/rag-s3?action=test'
    }
  },
  POST: {
    basic: {
      query: 't-shirt en coton',
      k: 5
    },
    withFilters: {
      query: 'robe d\'été',
      k: 3,
      filters: {
        availableForSale: true,
        category: 'Robes'
      }
    },
    hybrid: {
      query: 'jean délavé',
      k: 10,
      searchType: 'hybrid',
      filters: {
        colors: ['Bleu', 'Noir']
      }
    }
  }
} 