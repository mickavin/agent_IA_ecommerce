"use client"

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Heart, Star, Euro } from "lucide-react"
import { Product } from "@/lib/types"

interface ProductCarouselProps {
  products: Product[]
  title?: string
  className?: string
  onProductClick?: (product: Product) => void
  primaryColor?: string
}

export function ProductCarousel({ 
  products, 
  title = "Produits recommandés",
  className = "",
  onProductClick,
  primaryColor = "#ff6f61"
}: ProductCarouselProps) {
  if (!products || products.length === 0) {
    return null
  }

  const handleProductClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product)
    }
  }

  const getProductImage = (product: Product) => {
    // Image par défaut si aucune image fournie
    if (product.images && product.images.length > 0 && product.images[0] !== '') {
      return product.images[0]
    }
    // Utiliser thumbnailUrl si disponible
    if (product.thumbnailUrl) {
      return product.thumbnailUrl
    }
    return '/no-image.jpg'
    // Placeholder basé sur la catégorie
    const placeholders: { [key: string]: string } = {
      'T-shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
      'Chemise': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop',
      'Jean': 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=300&h=300&fit=crop',
      'Robe': 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=300&h=300&fit=crop',
      'Chaussures': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop',
      'Pull': 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=300&fit=crop'
    }
    
    return placeholders[product.category || ''] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop'
  }

  const getProductTitle = (product: Product) => {
    return product.title || product.name || 'Produit sans nom'
  }
  return (
    <div className={`w-full ${className}`}>
      {/* Titre du carousel */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <ShoppingBag className="h-4 w-4" style={{ color: '#ffdd5b' }} />
        <h3 className="font-medium text-sm text-gray-200">{title}</h3>
        <Badge variant="secondary" className="text-xs">
          {products.length} article{products.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Carousel */}
      <Carousel
        opts={{
          align: "start",
          slidesToScroll: 1,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4" style={{ paddingLeft: '8rem', paddingRight: '8rem', alignItems: 'end' }}>
          {products.map((product, index) => (
            <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-3/3 md:basis-3/3 lg:basis-3/3 xl:basis-2/3 2xl:basis-1/3">
              <Card 
                className="overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] border border-gray-200"
                onClick={() => handleProductClick(product)}
                style={{ width: 180, maxHeight: 350 }}
              >
                <CardContent className="p-0">
                  {/* Image du produit */}
                  <div className="relative">
                    <img
                      src={getProductImage(product)}
                      alt={getProductTitle(product)}
                      className="w-full h-full object-cover"
                      style={{ maxWidth: 180, maxHeight: 180 }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement
                        img.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop'
                      }}
                    />
                    {/* Badge de disponibilité */}
                    {product.availableForSale === false && (
                      <Badge 
                        variant="destructive" 
                        className="absolute top-2 right-2 text-xs"
                      >
                        Rupture
                      </Badge>
                    )}
                    {/* Badge de prix */}
                    <Badge 
                      className="absolute bottom-2 left-2 text-xs font-semibold"
                      style={{ backgroundColor: '#ffdd5b' }}
                    >
                      {product.price}€
                    </Badge>
                  </div>

                  {/* Informations du produit */}
                  <div className="p-3 space-y-2">
                    {/* Titre tronqué */}
                    <h4 className="font-medium text-sm text-gray-200 line-clamp-2 leading-tight">
                      {getProductTitle(product)}
                    </h4>

                    {/* Couleurs disponibles */}
                    {product.colors && product.colors.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Couleurs:</span>
                        <div className="flex gap-1">
                          {product.colors.slice(0, 3).map((color, i) => (
                            <span key={i} className="text-xs text-gray-600 capitalize">
                              {color}{i < Math.min(product.colors!.length, 3) - 1 ? ',' : ''}
                            </span>
                          ))}
                          {product.colors.length > 3 && (
                            <span className="text-xs text-gray-500">+{product.colors.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tailles disponibles */}
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Tailles:</span>
                        <div className="flex gap-1 flex-wrap">
                          {product.sizes.slice(0, 4).map((size, i) => (
                            <Badge key={i} variant="outline" className="text-xs h-5 px-1">
                              {size}
                            </Badge>
                          ))}
                          {product.sizes.length > 4 && (
                            <span className="text-xs text-gray-500">+{product.sizes.length - 4}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bouton d'action */}
                    <Button 
                      size="sm" 
                      className="w-full text-xs h-7 mt-2"
                      style={{ backgroundColor: '#ffdd5b' }}
                      disabled={product.availableForSale === false}
                      onClick={() => window.open(product.url)}
                    >
                      {product.availableForSale === false ? 'Rupture' : 'Voir le produit'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Boutons de navigation */}
        {products.length > 1 && (
          <>
            <CarouselPrevious className="h-8 w-8 -left-2" />
            <CarouselNext className="h-8 w-8 -right-2" />
          </>
        )}
      </Carousel>
    </div>
  )
} 