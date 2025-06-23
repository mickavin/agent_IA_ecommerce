"use client"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mockOrders, mockProducts } from "@/lib/data"
import type { OrderStatus } from "@/lib/types"
import { Edit, FileText, User, MapPin, DollarSign, CalendarDays, Info } from "lucide-react"

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const order = mockOrders.find((o) => o.id === orderId)
  // In a real app, you'd fetch order items separately or they'd be part of the order object
  const orderItems = mockProducts
    .slice(0, order?.itemsCount || 0)
    .map((p) => ({ ...p, quantityInOrder: Math.floor(Math.random() * 2) + 1 }))

  if (!order) {
    return <div className="text-center py-10">Commande non trouvée.</div>
  }

  const getOrderStatusBadgeVariant = (status: OrderStatus) => {
    // ... (same as in orders/page.tsx)
    switch (status) {
      case "Payée":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "En préparation":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Expédiée":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Livrée":
        return "bg-teal-500/20 text-teal-400 border-teal-500/30"
      case "Annulée":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
      default:
        return "secondary"
    }
  }

  return (
    <div>
      <PageHeader title={`Commande ${order.id}`} description={`Détails de la commande`} backHref="/orders">
        <Button variant="outline" asChild>
          <Link href={`/orders/${orderId}/edit-status`}>
            <Edit className="mr-2 h-4 w-4" /> Modifier Statut
          </Link>
        </Button>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" /> Générer Facture
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Produits Commandés</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Aperçu</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="text-right">Prix Unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Image
                          src={item.thumbnailUrl || "/placeholder.svg"}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="rounded-md aspect-square object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantityInOrder}</TableCell>
                      <TableCell className="text-right">{item.price.toFixed(2)} €</TableCell>
                      <TableCell className="text-right">{(item.price * item.quantityInOrder).toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="mr-2 h-5 w-5 text-primary" /> Notes sur la Commande
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" /> Informations Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold font-mono text-sm">{order.customerName}</p>
              <p className="text-sm text-muted-foreground font-mono">{order.customerEmail}</p>
              {/* Données anonymisées : ID anonyme + adresse IP uniquement */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" /> Adresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-1">Adresse de Livraison</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-line">
                  {order.shippingAddress || "Non spécifiée"}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Adresse de Facturation</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-line">
                  {order.billingAddress || "Identique à livraison"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-primary" /> Récapitulatif Financier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total:</span>
                <span>{order.totalAmount.toFixed(2)} €</span> {/* Assuming totalAmount is pre-tax for now */}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livraison:</span>
                <span>0.00 €</span> {/* Placeholder */}
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                <span>Total:</span>
                <span>{order.totalAmount.toFixed(2)} €</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarDays className="mr-2 h-5 w-5 text-primary" /> Statut & Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Statut:</span>
                <Badge variant="outline" className={`text-sm ${getOrderStatusBadgeVariant(order.status)}`}>
                  {order.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date Commande:</span>
                <span>
                  {new Date(order.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>
              {/* TODO: Add payment date, shipping date etc. */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
