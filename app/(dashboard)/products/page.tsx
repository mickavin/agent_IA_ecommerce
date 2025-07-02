"use client"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { ProductStatus } from "@/lib/types"
import { Search, ListFilter, MoreHorizontal, Edit, Trash2, Eye, Upload, RefreshCw, Download, ExternalLink } from "lucide-react"
import Link from "next/link"
import { ProductService } from "@/lib/services/api.service"

import { toast } from "sonner"

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [showImporter, setShowImporter] = useState(false)
  
  // États pour les options de filtres dynamiques
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    marques: [] as string[],
    statuses: [] as string[],
    sizes: [] as string[],
    colors: [] as string[]
  })
  const [loadingFilters, setLoadingFilters] = useState(true)
  
  // États pour les informations CSV
  const [csvInfo, setCsvInfo] = useState<{
    generated: boolean
    filename: string
    downloadUrl?: string
    s3Url?: string
    stats: {
      productsCount: number
      variantsCount: number
      csvSize: number
    }
    error?: string
  } | null>(null)

  // États pour l'historique des CSV
  const [csvHistory, setCsvHistory] = useState<Array<{
    id: string
    filename: string
    doc_url: string
    created_at: string
    access_token: string
  }>>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // État pour les données brutes (avant filtres/pagination)
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [dataSource, setDataSource] = useState<'shopify'>('shopify')

  // Charger les produits depuis Shopify
  const loadProductsFromShopify = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🛍️ Récupération des produits Shopify...')
      const response = await fetch('/api/shopify')
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setAllProducts(result.data)
        setDataSource('shopify')
        
        // Extraire les options de filtres depuis les produits
        const categories = [...new Set(result.data.map((p: any) => p.category).filter(Boolean))] as string[]
        const statuses = [...new Set(result.data.map((p: any) => p.status).filter(Boolean))] as string[]
        const sizes = [...new Set(result.data.flatMap((p: any) => p.sizes || []))] as string[]
        const colors = [...new Set(result.data.flatMap((p: any) => p.colors || []))] as string[]
        const vendors = [...new Set(result.data.map((p: any) => p.vendor).filter(Boolean))] as string[]
        
        setFilterOptions({
          categories,
          marques: vendors, // Utiliser vendors comme genders pour l'instant
          statuses,
          sizes,
          colors
        })
        
        // Traiter les informations CSV si disponibles
        if (result.csv) {
          setCsvInfo({
            generated: result.csv.generated,
            filename: result.csv.filename,
            downloadUrl: result.csv.downloadUrl,
            s3Url: result.csv.s3Url,
            stats: result.csv.stats,
            error: result.csv.s3Upload?.error
          })
          
          if (result.csv.generated) {
            console.log(`📄 CSV généré: ${result.csv.filename}`)
            toast.success(`${result.data.length} produits synchronisés + CSV généré`, {
              description: `Fichier CSV disponible (${result.csv.stats.productsCount} produits)`
            })
            
            // Recharger l'historique CSV après génération
            loadCSVHistory()
          }
        }
        
        console.log(`✅ ${result.data.length} produits Shopify chargés`)
        if (!result.csv?.generated) {
          toast.success(`${result.data.length} produits synchronisés depuis Shopify`)
        }
        
        // Réinitialiser la pagination et appliquer les filtres
        setCurrentPage(1)
        
      } else {
        throw new Error(result.error || 'Erreur inconnue')
      }
    } catch (err: any) {
      console.error('❌ Erreur Shopify:', err)
      setError(`Erreur Shopify: ${err.message}`)
      setProducts([])
      setAllProducts([])
      setTotalPages(1)
      setTotalItems(0)
      toast.error('Erreur lors de la synchronisation Shopify')
    } finally {
      setLoading(false)
      setLoadingFilters(false)
    }
  }

  // Charger les options de filtres (fallback)
  const loadFilterOptions = async () => {
    try {
      setLoadingFilters(true)
      const options = await ProductService.getFilterOptions()
      setFilterOptions(options)
    } catch (err: any) {
      console.error('Erreur lors du chargement des filtres:', err)
      // Utiliser des valeurs par défaut en cas d'erreur
      setFilterOptions({
        categories: ['Tshirt', 'Sweatshirt', 'Robe', 'Pantalon'],
        marques: [],
        statuses: ['Actif', 'Archivé', 'Rupture de stock'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Noir', 'Blanc', 'Rouge', 'Bleu']
      })
    } finally {
      setLoadingFilters(false)
    }
  }

  // Effet pour mettre à jour les produits affichés quand les données Shopify ou les filtres changent
  useEffect(() => {
    if (dataSource === 'shopify' && allProducts.length > 0) {
      updateDisplayedProducts()
    }
  }, [allProducts, searchTerm, filters, currentPage, pageSize, dataSource])


  // Débounce pour la recherche
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (dataSource === 'shopify') {
        // Pour Shopify, on reset à la page 1 et on applique les filtres
        if (currentPage !== 1) {
          setCurrentPage(1)
        } else {
          updateDisplayedProducts()
        }
      } else {
        // Pour Supabase, comportement existant
        if (currentPage !== 1) {
          setCurrentPage(1)
        }
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const handleFilterChange = (type: keyof typeof filters, value: string) => {
    const currentFilters = { ...filters }
    const currentValues = currentFilters[type] || []
    
    const newValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value]
    
    setFilters({
      ...currentFilters,
      [type]: newValues
    })
  }

  const clearFilters = () => {
    setFilters({})
  }

  const getStatusBadgeVariant = (status: ProductStatus) => {
    switch (status) {
      case "Actif":
        return "default"
      case "Rupture de stock":
        return "destructive"
      case "Archivé":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return

    try {
      await ProductService.delete(productId)
      toast.success("Produit supprimé", {
        description: "Le produit a été supprimé avec succès."
      })
    } catch (error: any) {
      toast.error("Erreur", {
        description: `Impossible de supprimer le produit: ${error.message}`
      })
    }
  }

  const handleImportComplete = () => {
    loadFilterOptions() // Recharger les filtres après l'import
    setShowImporter(false)
  }

  const hasActiveFilters = Object.values(filters).some(filterArray => filterArray.length > 0)

  // Charger l'historique des CSV depuis Supabase
  const loadCSVHistory = async () => {
    try {
      setLoadingHistory(true)
      const response = await fetch('/api/csv-history')
      const result = await response.json()
      
      if (result.success) {
        setCsvHistory(result.data)
      } else {
        console.error('Erreur lors du chargement de l\'historique CSV:', result.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique CSV:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Charger l'historique au montage
  useEffect(() => {
    loadCSVHistory()
  }, [])

  // Fonction pour télécharger un CSV depuis l'historique
  const downloadCSVFromHistory = async (csvItem: any) => {
    try {
      toast.success('Génération du lien de téléchargement...', {
        description: 'Veuillez patienter'
      })

      // Appeler l'API pour générer une URL signée
      const response = await fetch('/api/csv-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: csvItem.filename
        })
      })

      const result = await response.json()

      if (result.success) {
        // Ouvrir l'URL signée pour télécharger
        window.open(result.downloadUrl, '_blank')
        
        toast.success('Téléchargement démarré', {
          description: `Fichier: ${csvItem.filename} (lien valable ${result.expiresIn})`
        })
      } else {
        throw new Error(result.error || 'Erreur lors de la génération du lien')
      }
    } catch (error: any) {
      console.error('Erreur téléchargement CSV:', error)
      toast.error('Erreur de téléchargement', {
        description: error.message || 'Impossible de télécharger le fichier CSV'
      })
    }
  }

  // Fonction pour appliquer les filtres côté client
  const applyClientFilters = (products: any[], searchTerm: string, filters: Record<string, string[]>) => {
    let filtered = [...products]

    // Filtre de recherche
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(search) ||
        product.product_title?.toLowerCase().includes(search) ||
        product.category?.toLowerCase().includes(search) ||
        product.vendor?.toLowerCase().includes(search) ||
        product.tags?.some((tag: string) => tag.toLowerCase().includes(search))
      )
    }

    // Filtres par catégorie
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(product => 
        filters.category!.includes(product.category)
      )
    }

    // Filtres par marque
    if (filters.marques && filters.marques.length > 0) {
      filtered = filtered.filter(product => 
        filters.marques!.includes(product.vendor)
      )
    }

    // Filtres par statut
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(product => 
        filters.status!.includes(product.status)
      )
    }

    // Filtres par tailles
    if (filters.sizes && filters.sizes.length > 0) {
      filtered = filtered.filter(product => 
        product.sizes?.some((size: string) => filters.sizes!.includes(size))
      )
    }

    // Filtres par couleurs
    if (filters.colors && filters.colors.length > 0) {
      filtered = filtered.filter(product => 
        product.colors?.some((color: string) => filters.colors!.includes(color))
      )
    }

    return filtered
  }

  // Fonction pour appliquer la pagination côté client
  const applyClientPagination = (products: any[], currentPage: number, pageSize: number) => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return products.slice(startIndex, endIndex)
  }

  // Fonction unifiée pour mettre à jour la liste des produits affichés
  const updateDisplayedProducts = () => {
    if (dataSource === 'shopify' && allProducts.length > 0) {
      // Appliquer filtres et pagination côté client pour les données Shopify
      const filtered = applyClientFilters(allProducts, searchTerm, filters)
      const paginated = applyClientPagination(filtered, currentPage, pageSize)
      
      setProducts(paginated)
      setTotalItems(filtered.length)
      setTotalPages(Math.ceil(filtered.length / pageSize))
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Gestion des Produits
          </h1>
          <p className="text-muted-foreground">
            Ajoutez, modifiez et organisez vos produits.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadProductsFromShopify}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Synchroniser Shopify
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImporter(!showImporter)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="h-4 w-4" />
            Importer CSV
          </Button>
        </div>
      </div>

      {/* Informations CSV généré */}
      {csvInfo && csvInfo.generated && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              CSV généré automatiquement
            </CardTitle>
            <CardDescription>
              Les données Shopify ont été exportées en CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Fichier:</strong> {csvInfo.filename}
              </div>
              <div>
                <strong>Produits:</strong> {csvInfo.stats.productsCount}
              </div>
              <div>
                <strong>Variants:</strong> {csvInfo.stats.variantsCount}
              </div>
              <div>
                <strong>Taille:</strong> {(csvInfo.stats.csvSize / 1024).toFixed(1)} KB
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              {csvInfo.downloadUrl && (
                <Button asChild variant="outline" size="sm">
                  <a 
                    href={csvInfo.downloadUrl} 
                    download={csvInfo.filename}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Télécharger CSV
                  </a>
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCsvInfo(null)}
                className="text-muted-foreground"
              >
                Masquer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique des CSV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Historique des exports CSV
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadCSVHistory}
                disabled={loadingHistory}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2"
              >
                {showHistory ? 'Masquer' : 'Afficher'}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {loadingHistory ? (
              "Chargement de l'historique..."
            ) : (
              `${csvHistory.length} fichier${csvHistory.length > 1 ? "s" : ""} CSV disponible${csvHistory.length > 1 ? "s" : ""}`
            )}
          </CardDescription>
        </CardHeader>
        
        {showHistory && (
          <CardContent>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2">Chargement...</span>
              </div>
            ) : csvHistory.length > 0 ? (
              <div className="space-y-3">
                {csvHistory.map((csvItem) => (
                  <div
                    key={csvItem.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {csvItem.filename}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(csvItem.created_at).toLocaleString('fr-FR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadCSVFromHistory(csvItem)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Télécharger
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(csvItem.doc_url, '_blank')}
                        className="flex items-center gap-2"
                      >
                     
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun fichier CSV trouvé</p>
                <p className="text-sm">Synchronisez Shopify pour générer votre premier export</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Liste des produits */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des produits</CardTitle>
          <CardDescription>
            {loading ? (
              "Chargement..."
            ) : error ? (
              `Erreur: ${error}`
            ) : (
              <>
                {`${totalItems} produit${totalItems > 1 ? "s" : ""} trouvé${totalItems > 1 ? "s" : ""}.`}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full bg-background focus:bg-muted"
              />
            </div>

          </div>

          {/* Indicateur de filtres actifs */}
          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(filters).map(([filterType, values]) =>
                values.map((value) => (
                  <Badge
                    key={`${filterType}-${value}`}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleFilterChange(filterType as keyof typeof filters, value)}
                  >
                    {value} ×
                  </Badge>
                ))
              )}
            </div>
          )}

          {/* Tableau des produits */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Aperçu</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden md:table-cell">Catégorie</TableHead>
                  <TableHead className="hidden md:table-cell">Statut</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Stock</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="w-[100px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Chargement...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      <div className="text-center">
                        <p className="text-red-500 mb-2">Erreur: {error}</p>
                        <Button 
                          onClick={loadProductsFromShopify} 
                          variant="outline" 
                          size="sm"
                        >
                          Réessayer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : products.length > 0 ? (
                  products.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Image
                          src={product.thumbnail_url || "/placeholder.svg"}
                          alt={product.name || ""}
                          width={48}
                          height={48}
                          className="rounded-md aspect-square object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{product.name}</div>
                          {product.product_title && product.product_title !== product.name && (
                            <div className="text-sm text-muted-foreground">
                              {product.product_title}
                            </div>
                          )}
                          {/* Afficher les tailles et couleurs */}
                          <div className="flex gap-1 mt-1">
                            {product.sizes && product.sizes.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Tailles: {product.size}
                                
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {product.colors && product.colors.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Couleurs: {product.colors.slice(0, 2).join(', ')}
                                {product.colors.length > 2 && '...'}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{product.category || "Non classé"}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={getStatusBadgeVariant(product.status || "Actif")}>
                          {product.status || "Actif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right">
                        <span className={product.stock <= 0 ? 'text-red-500' : product.stock < 10 ? 'text-yellow-500' : ''}>
                          {product.stock || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {typeof product.price === "number" ? product.price.toFixed(2) : product.price} €
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/products/${product.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> Voir Détails
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/products/${product.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" /> Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      <div className="text-center">
                        <p className="mb-2">
                          {hasActiveFilters ? 'Aucun produit ne correspond à vos filtres.' : 'Aucun produit trouvé.'}
                        </p>
                        {hasActiveFilters && (
                          <Button onClick={clearFilters} variant="outline" size="sm">
                            Effacer les filtres
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages} ({totalItems} éléments)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Précédent
                </Button>
                
                {/* Sélecteur de taille de page */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
