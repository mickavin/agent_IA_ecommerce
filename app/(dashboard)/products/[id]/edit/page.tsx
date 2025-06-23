"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Save, 
  ArrowLeft, 
  Package, 
  Image as ImageIcon, 
  Tag, 
  Euro, 
  Palette,
  Ruler,
  Upload,
  X,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle
} from "lucide-react"
import { ProductService } from "@/lib/services/api.service"
import type { ProductStatus } from "@/lib/types"
import { toast } from "sonner"

// Options prédéfinies
const categories = [
  "Tshirt",
  "Sweatshirt", 
  "Robe",
  "Pantalon",
  "Chemise",
  "Veste",
  "Chaussures",
  "Accessoires",
  "Sous-vêtements"
]

const colors = [
  { name: "Noir", value: "#000000" },
  { name: "Blanc", value: "#FFFFFF" },
  { name: "Rouge", value: "#DC2626" },
  { name: "Bleu", value: "#2563EB" },
  { name: "Vert", value: "#059669" },
  { name: "Jaune", value: "#D97706" },
  { name: "Rose", value: "#DB2777" },
  { name: "Violet", value: "#7C3AED" },
  { name: "Gris", value: "#6B7280" },
  { name: "Marine", value: "#1E3A8A" },
  { name: "Orange", value: "#EA580C" },
  { name: "Marron", value: "#A16207" }
]

const sizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"]

const genders = ["Homme", "Femme", "Unisexe"]

const statuses: ProductStatus[] = ["Actif", "Rupture de stock", "Archivé"]

const statusConfig: Record<ProductStatus, { color: string, description: string }> = {
  "Actif": { color: "bg-green-100 text-green-800", description: "Produit visible et disponible à la vente" },
  "Active": { color: "bg-green-100 text-green-800", description: "Produit visible et disponible à la vente" },
  "En attente": { color: "bg-yellow-100 text-yellow-800", description: "Produit en attente de validation" },
  "Rupture de stock": { color: "bg-red-100 text-red-800", description: "Produit en rupture de stock" },
  "Archivé": { color: "bg-gray-100 text-gray-800", description: "Produit archivé, non visible" }
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params?.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("general")

  // Redirection si pas d'ID
  if (!productId) {
    //router.push("/products")
    return null
  }

  // État du produit
  const [product, setProduct] = useState<any>({
    name: "",
    product_title: "",
    description: "",
    price: 0,
    category: "",
    gender: "",
    status: "Actif" as ProductStatus,
    stock: 0,
    sizes: [] as string[],
    colors: [] as string[],
    images: [] as string[],
    thumbnail_url: "",
    image_url: "",
    handle: "",
    variant_title: ""
  })

  // États temporaires pour ajouts
  const [tempImageUrl, setTempImageUrl] = useState("")
  const [newSize, setNewSize] = useState("")
  const [newColor, setNewColor] = useState("")
  const [customColor, setCustomColor] = useState("")

  const loadProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ProductService.getById(productId)
      setProduct({
        ...data,
        sizes: data.sizes || [],
        colors: data.colors || [],
        images: data.images || []
      })
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

  const updateProduct = (field: string, value: any) => {
    setProduct((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Validation
      if (!product.name?.trim()) {
        toast.error("Le nom du produit est obligatoire")
        return
      }
      if (!product.price || product.price <= 0) {
        toast.error("Le prix doit être supérieur à 0")
        return
      }
      if (!product.category) {
        toast.error("La catégorie est obligatoire")
        return
      }

      // Préparation des données
      const updateData = {
        ...product,
        price: parseFloat(product.price),
        stock: parseInt(product.stock) || 0,
        updated_at: new Date().toISOString()
      }

      await ProductService.update(productId, updateData)
      toast.success("Produit mis à jour avec succès !")
      //router.push(`/products/${productId}`)
    } catch (error: any) {
      toast.error(`Erreur lors de la sauvegarde: ${error.message}`)
      console.error('Erreur:', error)
    } finally {
      setSaving(false)
    }
  }

  // Gestion des images
  const addImage = () => {
    if (tempImageUrl.trim()) {
      const currentImages = product.images || []
      updateProduct("images", [...currentImages, tempImageUrl.trim()])
      setTempImageUrl("")
      toast.success("Image ajoutée")
    }
  }

  const removeImage = (index: number) => {
    const currentImages = product.images || []
    const newImages = currentImages.filter((_: any, i: number) => i !== index)
    updateProduct("images", newImages)
    toast.success("Image supprimée")
  }

  const setAsMainImage = (imageUrl: string) => {
    updateProduct("thumbnail_url", imageUrl)
    updateProduct("image_url", imageUrl)
    toast.success("Image principale définie")
  }

  // Gestion des tailles
  const addSize = () => {
    if (newSize && !product.sizes?.includes(newSize)) {
      const currentSizes = product.sizes || []
      updateProduct("sizes", [...currentSizes, newSize])
      setNewSize("")
      toast.success(`Taille ${newSize} ajoutée`)
    }
  }

  const removeSize = (size: string) => {
    const currentSizes = product.sizes || []
    updateProduct("sizes", currentSizes.filter((s: string) => s !== size))
    toast.success(`Taille ${size} supprimée`)
  }

  // Gestion des couleurs
  const addColor = () => {
    const colorToAdd = newColor || customColor
    if (colorToAdd && !product.colors?.includes(colorToAdd)) {
      const currentColors = product.colors || []
      updateProduct("colors", [...currentColors, colorToAdd])
      setNewColor("")
      setCustomColor("")
      toast.success(`Couleur ${colorToAdd} ajoutée`)
    }
  }

  const removeColor = (color: string) => {
    const currentColors = product.colors || []
    updateProduct("colors", currentColors.filter((c: string) => c !== color))
    toast.success(`Couleur ${color} supprimée`)
  }

  const generateHandle = () => {
    if (product.name) {
      const handle = product.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .trim()
      updateProduct("handle", handle)
      toast.success("Handle généré automatiquement")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chargement..." description="Chargement du produit...">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </PageHeader>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
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

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Modifier ${product.name || "Produit"}`}
        description={`ID: ${product.id} • ${product.category || "Non classé"}`}
        backHref={`/products/${productId}`}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="variants">Variantes</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="advanced">Avancé</TabsTrigger>
            </TabsList>

            {/* Onglet Général */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Informations générales
                  </CardTitle>
                  <CardDescription>
                    Informations de base du produit
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du produit *</Label>
                      <Input
                        id="name"
                        value={product.name || ""}
                        onChange={(e) => updateProduct("name", e.target.value)}
                        placeholder="Nom du produit..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product_title">Titre produit</Label>
                      <Input
                        id="product_title"
                        value={product.product_title || ""}
                        onChange={(e) => updateProduct("product_title", e.target.value)}
                        placeholder="Titre affiché..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={product.description || ""}
                      onChange={(e) => updateProduct("description", e.target.value)}
                      placeholder="Description détaillée du produit..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie *</Label>
                      <Select 
                        value={product.category || ""} 
                        onValueChange={(value) => updateProduct("category", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Genre</Label>
                      <Select 
                        value={product.gender || ""} 
                        onValueChange={(value) => updateProduct("gender", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {genders.map(gender => (
                            <SelectItem key={gender} value={gender}>
                              {gender}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Statut</Label>
                      <Select 
                        value={product.status || ""} 
                        onValueChange={(value: ProductStatus) => updateProduct("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${statusConfig[status].color.split(' ')[0]}`}></div>
                                {status}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Prix (€) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={product.price || ""}
                        onChange={(e) => updateProduct("price", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={product.stock || ""}
                        onChange={(e) => updateProduct("stock", parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Variantes */}
            <TabsContent value="variants" className="space-y-6">
              {/* Tailles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="h-5 w-5" />
                    Tailles disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {product.sizes?.map((size: string) => (
                      <Badge key={size} variant="secondary" className="flex items-center gap-1">
                        {size}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeSize(size)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Select value={newSize} onValueChange={setNewSize}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Taille" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizes.map(size => (
                          <SelectItem 
                            key={size} 
                            value={size} 
                            disabled={product.sizes?.includes(size)}
                          >
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addSize} disabled={!newSize}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Couleurs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Couleurs disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {product.colors?.map((color: string) => (
                      <Badge key={color} variant="secondary" className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ 
                            backgroundColor: colors.find(c => c.name === color)?.value || "#9CA3AF" 
                          }}
                        />
                        {color}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeColor(color)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select value={newColor} onValueChange={setNewColor}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Couleur prédéfinie" />
                        </SelectTrigger>
                        <SelectContent>
                          {colors.map(color => (
                            <SelectItem 
                              key={color.name} 
                              value={color.name} 
                              disabled={product.colors?.includes(color.name)}
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: color.value }}
                                />
                                {color.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={addColor} disabled={!newColor}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        placeholder="Couleur personnalisée..."
                        className="flex-1"
                      />
                      <Button onClick={addColor} disabled={!customColor}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Images */}
            <TabsContent value="images" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Images du produit
                  </CardTitle>
                  <CardDescription>
                    Gérez les images de votre produit. La première image sera l'image principale.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Images actuelles */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {product.images?.map((image: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Produit ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setAsMainImage(image)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {index === 0 && (
                          <Badge className="absolute top-2 left-2 bg-blue-500">
                            Principal
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Ajouter une image */}
                  <div className="space-y-2">
                    <Label>Ajouter une image</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tempImageUrl}
                        onChange={(e) => setTempImageUrl(e.target.value)}
                        placeholder="URL de l'image..."
                        className="flex-1"
                      />
                      <Button onClick={addImage} disabled={!tempImageUrl.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>

                  {/* URLs images principales */}
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail_url">URL Image miniature</Label>
                      <Input
                        id="thumbnail_url"
                        value={product.thumbnail_url || ""}
                        onChange={(e) => updateProduct("thumbnail_url", e.target.value)}
                        placeholder="URL de la miniature..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image_url">URL Image principale</Label>
                      <Input
                        id="image_url"
                        value={product.image_url || ""}
                        onChange={(e) => updateProduct("image_url", e.target.value)}
                        placeholder="URL de l'image principale..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Avancé */}
            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Paramètres avancés
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="handle">Handle/Slug</Label>
                    <div className="flex gap-2">
                      <Input
                        id="handle"
                        value={product.handle || ""}
                        onChange={(e) => updateProduct("handle", e.target.value)}
                        placeholder="identifiant-produit"
                        className="flex-1"
                      />
                      <Button variant="outline" onClick={generateHandle}>
                        Générer
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Identifiant unique utilisé dans les URLs
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="variant_title">Titre de variante</Label>
                    <Input
                      id="variant_title"
                      value={product.variant_title || ""}
                      onChange={(e) => updateProduct("variant_title", e.target.value)}
                      placeholder="Variante spécifique..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar droite - Aperçu */}
        <div className="lg:col-span-1 space-y-6">
          {/* Aperçu du produit */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image */}
              <div className="aspect-square relative rounded-lg overflow-hidden border bg-gray-100">
                {product.thumbnail_url || product.image_url ? (
                  <img
                    src={product.thumbnail_url || product.image_url}
                    alt={product.name || "Aperçu"}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {product.name || "Nom du produit"}
                </h3>
                <p className="text-lg font-bold text-primary">
                  {product.price ? `${parseFloat(product.price).toFixed(2)} €` : "0.00 €"}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{product.category || "Catégorie"}</Badge>
                  {product.status && (
                    <Badge variant={
                      product.status === "Actif" ? "default" :
                      product.status === "Rupture de stock" ? "destructive" :
                      "secondary"
                    }>
                      {product.status}
                    </Badge>
                  )}
                </div>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {product.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono">{product.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tailles:</span>
                <span>{product.sizes?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Couleurs:</span>
                <span>{product.colors?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Images:</span>
                <span>{product.images?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock:</span>
                <span className={
                  (product.stock || 0) <= 0 ? 'text-red-500' : 
                  (product.stock || 0) < 10 ? 'text-yellow-500' : 
                  'text-green-500'
                }>
                  {product.stock || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
