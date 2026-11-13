"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProductService } from "@/lib/services/api.service"
import type { ProductStatus } from "@/lib/types"
import { 
  Edit, 
  Trash2, 
  Package, 
  DollarSign, 
  Layers, 
  PaletteIcon, 
  Tag, 
  ArrowLeft,
  Calendar,
  Barcode,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string | undefined

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirection si pas d'ID
  if (!productId) {
    //router.push("/products")
    return null
  }

  const loadProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ProductService.getById(productId)
      setProduct(data)
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du produit")
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProduct()
  }, [productId])

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

  const getStatusIcon = (status: ProductStatus) => {
    switch (status) {
      case "Actif":
        return <CheckCircle className="h-4 w-4" />
      case "Rupture de stock":
        return <AlertCircle className="h-4 w-4" />
      case "Archivé":
        return <Clock className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return

    try {
      await ProductService.delete(productId)
      toast.success("Produit supprimé avec succès")
      //router.push("/products")
    } catch (error: any) {
      toast.error(`Erreur lors de la suppression: ${error.message}`)
    }
  }

  const handleDuplicate = () => {
    if (product) {
      // Copier l'ID dans le presse-papiers pour faciliter la duplication
      navigator.clipboard.writeText(product.id)
      toast.success("ID du produit copié pour duplication")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chargement..." description="Chargement des détails du produit...">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </PageHeader>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="w-full h-64" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Erreur" description="Impossible de charger le produit" backHref="/products">
          <Button onClick={loadProduct} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </PageHeader>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <PageHeader title="Produit introuvable" description="Ce produit n'existe pas" backHref="/products" />
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Le produit avec l'ID "{productId}" n'a pas été trouvé.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={product.name || product.product_title || "Produit sans nom"} 
        description={`ID: ${product.id} • ${product.category || "Non classé"}`} 
        backHref="/products"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Dupliquer
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/products/${productId}/edit`}>
              <Edit className="h-4 w-4 mr-2" /> 
              Modifier
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" /> 
            Supprimer
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar gauche - Images et statut */}
        <div className="lg:col-span-1 space-y-6">
          {/* Images du produit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Images du Produit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Image principale */}
                <div className="aspect-square relative rounded-lg overflow-hidden border">
                  <Image
                    src={product.thumbnail_url || product.image_url || "/placeholder.svg"}
                    alt={product.name || "Produit"}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                
                {/* Images secondaires */}
                {product.images && product.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {product.images.slice(0, 6).map((image: string, index: number) => (
                      <div key={index} className="aspect-square relative rounded border overflow-hidden">
                        <Image
                          src={image}
                          alt={`${product.name} - ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statut et Stock */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                État du Produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Statut</span>
                <Badge variant={getStatusBadgeVariant(product.status || "Actif")} className="flex items-center gap-1">
                  {getStatusIcon(product.status || "Actif")}
                  {product.status || "Actif"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Stock</span>
                <span className={`font-semibold ${
                  (product.stock || 0) <= 0 ? 'text-red-500' : 
                  (product.stock || 0) < 10 ? 'text-yellow-500' : 
                  'text-green-500'
                }`}>
                  {product.stock || 0} unités
                </span>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créé le</span>
                  <span>{new Date(product.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modifié le</span>
                  <span>{new Date(product.updated_at || product.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations Détaillées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Grille d'informations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Prix */}
                <div className="flex items-start space-x-3">
                  <DollarSign className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Prix</p>
                    <p className="font-bold text-xl">
                      {typeof product.price === "number" ? product.price.toFixed(2) : product.price} €
                    </p>
                  </div>
                </div>

                {/* Catégorie */}
                <div className="flex items-start space-x-3">
                  <Package className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Catégorie</p>
                    <p className="font-semibold">{product.category || "Non classé"}</p>
                  </div>
                </div>

                {/* Genre */}
                {product.gender && (
                  <div className="flex items-start space-x-3">
                    <Tag className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Genre</p>
                      <p className="font-semibold">{product.gender}</p>
                    </div>
                  </div>
                )}

                {/* Handle/Slug */}
                {product.handle && (
                  <div className="flex items-start space-x-3">
                    <Barcode className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Handle</p>
                      <p className="font-mono text-sm">{product.handle}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Variantes */}
              <div className="space-y-4">
                {/* Tailles */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <Layers className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">Tailles Disponibles</p>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size: string) => (
                          <Badge key={size} variant="secondary" className="font-mono">
                            {size}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Couleurs */}
                {product.colors && product.colors.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <PaletteIcon className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">Couleurs Disponibles</p>
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((color: string) => (
                          <div key={color} className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded-full border border-gray-300 shadow-sm"
                              style={{
                                backgroundColor:
                                  color.toLowerCase().includes("blanc") ? "#F8F9FA" :
                                  color.toLowerCase().includes("noir") ? "#1F2937" :
                                  color.toLowerCase().includes("rouge") ? "#DC2626" :
                                  color.toLowerCase().includes("bleu") ? "#2563EB" :
                                  color.toLowerCase().includes("vert") ? "#059669" :
                                  color.toLowerCase().includes("jaune") ? "#D97706" :
                                  color.toLowerCase().includes("rose") ? "#DB2777" :
                                  color.toLowerCase().includes("violet") ? "#7C3AED" :
                                  color.toLowerCase().includes("gris") ? "#6B7280" :
                                  "#9CA3AF"
                              }}
                            />
                            <Badge variant="secondary">{color}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Informations additionnelles */}
              {(product.variant_title || product.product_title) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {product.product_title && product.product_title !== product.name && (
                      <div>
                        <p className="text-sm text-muted-foreground">Titre produit</p>
                        <p className="font-medium">{product.product_title}</p>
                      </div>
                    )}
                    {product.variant_title && (
                      <div>
                        <p className="text-sm text-muted-foreground">Variante</p>
                        <p className="font-medium">{product.variant_title}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/products/${productId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </Button>
                <Button variant="outline" size="sm" onClick={loadProduct}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
