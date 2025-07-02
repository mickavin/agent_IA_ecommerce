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
import type { Product, ProductStatus } from "@/lib/types"
import { PlusCircle, Search, ListFilter, MoreHorizontal, Edit, Trash2, Eye, Upload, RefreshCw, Download, ExternalLink } from "lucide-react"
import Link from "next/link"
import { ProductService } from "@/lib/services/api.service"
import { AdvancedCSVImporter } from "@/components/advanced-csv-importer"
import { toast } from "sonner"




export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
    genders: [] as string[],
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
  const [dataSource, setDataSource] = useState<'supabase'>('supabase')

 
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
        genders: ['Homme', 'Femme', 'Unisexe'],
        statuses: ['Actif', 'Archivé', 'Rupture de stock'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Noir', 'Blanc', 'Rouge', 'Bleu']
      })
    } finally {
      setLoadingFilters(false)
    }
  }

  // Charger les produits depuis Supabase
  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await ProductService.getAll(currentPage, pageSize, searchTerm, filters)
      
      setProducts(result.data)
      setTotalPages(result.totalPages)
      setTotalItems(result.total)
      setDataSource('supabase')
      
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des produits")
      setProducts([])
      setTotalPages(1)
      setTotalItems(0)
      setDataSource('supabase')
    } finally {
      setLoading(false)
    }
  }

  // Charger les options de filtres au montage
  useEffect(() => {
    loadProducts()
    loadFilterOptions()
  }, [])



  // Charger les produits depuis Supabase lors des changements (seulement si pas en mode Shopify)
  useEffect(() => {
    if (dataSource === 'supabase') {
      loadProducts()
    }
  }, [currentPage, pageSize, filters, dataSource])

  // Débounce pour la recherche
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
 
        // Pour Supabase, comportement existant
        if (currentPage !== 1) {
          setCurrentPage(1)
        } else {
          loadProducts()
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
      loadProducts()
    } catch (error: any) {
      toast.error("Erreur", {
        description: `Impossible de supprimer le produit: ${error.message}`
      })
    }
  }

  const handleImportComplete = () => {
    loadProducts()
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

    // Filtres par genre/vendor
    if (filters.gender && filters.gender.length > 0) {
      filtered = filtered.filter(product => 
        filters.gender!.includes(product.vendor)
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
      loadProducts() 
  }
  useEffect(() => {
      updateDisplayedProducts()
  }, [allProducts, searchTerm, filters, currentPage, pageSize, dataSource])
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
            onClick={loadProducts}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser Supabase
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

      {/* Importateur CSV */}
      {showImporter && (
        <AdvancedCSVImporter
          availableTypes={['products']}
          onImportComplete={handleImportComplete}
        />
      )}

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

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-shrink-0">
                    <ListFilter className="mr-2 h-4 w-4" />
                    Filtres
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                        {Object.values(filters).reduce((total, arr) => total + arr.length, 0)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px]">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Filtrer par
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-auto p-1 text-xs"
                      >
                        Effacer
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Catégories */}
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Catégorie
                  </DropdownMenuLabel>
                  {loadingFilters ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">Chargement...</div>
                  ) : (
                    <div className="max-h-32 overflow-y-auto">
                    {filterOptions.categories.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category}
                        checked={(filters.category || []).includes(category)}
                        onCheckedChange={() => handleFilterChange("category", category)}
                      >
                        {category}
                      </DropdownMenuCheckboxItem>
                    ))}
                    </div>
                  )}

                  {filterOptions.genders.length > 0 && (
                    <DropdownMenuSeparator />
                  )}

                  {/* Genres */}
                  {filterOptions.genders.length > 0 && (
                    <>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Genre
                  </DropdownMenuLabel>
                  {loadingFilters ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">Chargement...</div>
                  ) : (
                    <div className="max-h-32 overflow-y-auto">
                    {filterOptions.genders.map((gender) => (
                      <DropdownMenuCheckboxItem
                        key={gender}
                        checked={(filters.gender || []).includes(gender)}
                        onCheckedChange={() => handleFilterChange("gender", gender)}
                      >
                        {gender}
                      </DropdownMenuCheckboxItem>
                    ))}
                    </div>
                  )}
                  </>
                  )}

                  <DropdownMenuSeparator />

                  {/* Statuts */}
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Statut
                  </DropdownMenuLabel>
                  {loadingFilters ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">Chargement...</div>
                  ) : (
                    <div className="max-h-32 overflow-y-auto">
                    {filterOptions.statuses.map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={(filters.status || []).includes(status)}
                        onCheckedChange={() => handleFilterChange("status", status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                    </div>
                  )}

                  <DropdownMenuSeparator />

                  {/* Tailles */}
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Tailles
                  </DropdownMenuLabel>
                  {loadingFilters ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">Chargement...</div>
                  ) : (
                    <div className="max-h-32 overflow-y-auto">
                      {filterOptions.sizes.map((size) => (
                        <DropdownMenuCheckboxItem
                          key={size}
                          checked={(filters.sizes || []).includes(size)}
                          onCheckedChange={() => handleFilterChange("sizes", size)}
                        >
                          {size}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                  )}

                  <DropdownMenuSeparator />

                  {/* Couleurs */}
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Couleurs
                  </DropdownMenuLabel>
                  {loadingFilters ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">Chargement...</div>
                  ) : (
                    <div className="max-h-32 overflow-y-auto">
                      {filterOptions.colors.map((color) => (
                        <DropdownMenuCheckboxItem
                          key={color}
                          checked={(filters.colors || []).includes(color)}
                          onCheckedChange={() => handleFilterChange("colors", color)}
                        >
                          {color}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
                          onClick={loadProducts} 
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
                                Tailles: {product.sizes.slice(0, 3).join(', ')}
                                {product.sizes.length > 3 && '...'}
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
                        {hasActiveFilters ? (
                          <Button onClick={clearFilters} variant="outline" size="sm">
                            Effacer les filtres
                          </Button>
                        ) : (
                          <Button asChild variant="outline" size="sm">
                            <Link href="/products/new">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Ajouter le premier produit
                            </Link>
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
 