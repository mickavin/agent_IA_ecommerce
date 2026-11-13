'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Loader2, Search, RefreshCw, Info, TestTube } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  description: string
  url: string
  price: number
  category: string
  colors: string[]
  sizes: string[]
  handle: string
  availableForSale: boolean
  vendor: string
  tags: string[]
  stock: number
  thumbnailUrl: string
  score: number
  relevance: 'high' | 'medium' | 'low'
}

interface SearchResponse {
  success: boolean
  query: string
  results: SearchResult[]
  metadata: {
    totalResults: number
    searchTime: number
    searchType: string
    k: number
  }
  stats: any
}

export default function RAGS3Demo() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTime, setSearchTime] = useState<number>(0)

  // Charger les statistiques au montage
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/rag-s3?action=stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/rag-s3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          k: 20,
          searchType: 'semantic'
        })
      })

      const data: SearchResponse = await response.json()

      if (data.success) {
        setResults(data.results)
        setSearchTime(data.metadata.searchTime)
        setStats(data.stats)
      } else {
        setError(data.error || 'Erreur de recherche')
      }
    } catch (error) {
      setError('Erreur de connexion')
      console.error('Erreur recherche:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/rag-s3?action=refresh')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        alert(data.message)
      } else {
        setError(data.error || 'Erreur de rafraîchissement')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/rag-s3?action=test')
      const data = await response.json()
      
      if (data.success) {
        setResults(data.results || [])
        setStats(data.stats)
        alert('Test réussi !')
      } else {
        setError(data.error || 'Test échoué')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const getRelevanceBadgeColor = (relevance: string) => {
    switch (relevance) {
      case 'high': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Test RAG</h1>
        <p className="text-gray-600">Recherche sémantique de produits a partir de fichier CSV sur s3</p>
      </div>

      {/* Statistiques */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Statistiques du Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">État</Label>
                <p className="text-lg">
                  {stats.isInitialized ? (
                    <Badge className="bg-green-500">Initialisé</Badge>
                  ) : (
                    <Badge className="bg-red-500">Non initialisé</Badge>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Produits</Label>
                <p className="text-lg font-semibold">{stats.documentsLoaded}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Dernier fichier</Label>
                <p className="text-sm truncate">{stats.lastLoadedFile || 'Aucun'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Dernière MAJ</Label>
                <p className="text-sm">
                  {stats.lastModified ? new Date(stats.lastModified).toLocaleString('fr-FR') : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={handleRefresh} disabled={loading} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Rafraîchir S3
            </Button>
            <Button onClick={handleTest} disabled={loading} variant="outline">
              <TestTube className="h-4 w-4 mr-2" />
              Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Recherche de Produits</CardTitle>
          <CardDescription>
            Recherchez des produits en utilisant le langage naturel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: t-shirt bleu en coton, robe d'été..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {/* Suggestions de recherche */}
          <div className="mt-4">
            <Label className="text-sm font-medium mb-2 block">Suggestions :</Label>
            <div className="flex flex-wrap gap-2">
              {[
                't-shirt en coton',
                'robe d\'été',
                'jean délavé',
                'pull en laine',
                'chaussures de sport'
              ].map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-800"
                  onClick={() => setQuery(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Résultats */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Résultats de recherche ({results.length})
            </CardTitle>
            <CardDescription>
              Recherche effectuée en {searchTime}ms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-800">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{result.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{result.description}</p>
                      <p className="text-gray-600 text-sm mb-2">{result.handle}</p>
                      <p className="text-gray-600 text-sm mb-2">{result.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRelevanceBadgeColor(result.relevance)}>
                        {result.relevance}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {(result.score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Prix</Label>
                      <p className="text-lg font-semibold text-green-600">
                        {formatPrice(result.price)}
                      </p>
                    </div>
                    <div>
                      <Label className="font-medium">Catégorie</Label>
                      <p>{result.category}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Stock</Label>
                      <p className={result.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                        {result.stock > 0 ? `${result.stock} en stock` : 'Rupture'}
                      </p>
                    </div>
                    <div>
                      <Label className="font-medium">Disponible</Label>
                      <p className={result.availableForSale ? 'text-green-600' : 'text-red-600'}>
                        {result.availableForSale ? 'Oui' : 'Non'}
                      </p>
                    </div>
                  </div>

                  {/* Couleurs et tailles */}
                  <div className="mt-3 space-y-2">
                    {result.colors.length > 0 && (
                      <div>
                        <Label className="font-medium text-sm">Couleurs : </Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.colors.map((color, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.sizes.length > 0 && (
                      <div>
                        <Label className="font-medium text-sm">Tailles : </Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.sizes.map((size, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {size}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {result.tags.length > 0 && (
                    <div className="mt-3">
                      <Label className="font-medium text-sm">Tags : </Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {index < results.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 