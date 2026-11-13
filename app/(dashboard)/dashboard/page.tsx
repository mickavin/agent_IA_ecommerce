"use client"
/**
 * Dashboard Page - Données anonymisées
 * 
 * Toutes les informations client affichées sont anonymisées :
 * - Noms remplacés par des IDs anonymes [PREFIX]_[SHOP_ID]_[12_DIGITS_RANDOM]
 * - Emails remplacés par des adresses IP
 * - Aucune donnée personnelle identifiable
 */
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ShoppingCart, Headset, AlertTriangle, MessageCircle, Package, Percent, ShoppingBag, PackageSearch } from "lucide-react"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import { mockOrders, mockProducts, mockSupportTickets } from "@/lib/data"
import type { OrderStatus } from "@/lib/types"
import { QuickToastTest } from '@/components/quick-toast-test'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const weeklySalesData = {
  labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
  datasets: [
    {
      label: "Ventes (€)",
      data: [2200, 3100, 2500, 4200, 3800, 5300, 1800],
      backgroundColor: "hsl(0, 45%, 74.1%)", // Or rose from theme --primary
      borderColor: "hsl(0, 45%, 74.1%)",
      borderRadius: 4,
      barThickness: 20,
    },
  ],
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: "hsl(240, 0%, 7.1%)", // background
      titleColor: "hsl(0, 0%, 97.3%)", // foreground
      bodyColor: "hsl(0, 0%, 97.3%)",
      borderColor: "hsl(0, 45%, 74.1%)", // primary
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: (context: any) => {
          let label = context.dataset.label || ""
          if (label) {
            label += ": "
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(context.parsed.y)
          }
          return label
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "hsl(0, 0%, 62.7%)", // muted-foreground
        font: {
          size: 12,
        },
      },
      border: {
        display: false,
      },
    },
    y: {
      grid: {
        color: "hsl(210, 31%, 13%)", // border
        borderDash: [3, 3],
      },
      ticks: {
        color: "hsl(0, 0%, 62.7%)", // muted-foreground
        font: {
          size: 12,
        },
        callback: (value: any) => `${value / 1000}k`,
      },
      border: {
        display: false,
      },
    },
  },
}

const getOrderStatusBadgeVariant = (status: OrderStatus) => {
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

export default function DashboardPage() {
  const totalChats = 847 // Sessions anonymes actives
  const pendingOrders = mockOrders.filter((o) => o.status === "En préparation" || o.status === "Payée").length
  const totalOrders = mockOrders.length
  const openTickets = mockSupportTickets.filter((t) => t.status === "Ouvert" || t.status === "En cours").length
  const lowStockItems = mockProducts.filter((p) => p.stock && p.stock < 10 && p.stock > 0).length
  const conversionRate = 50
  const recentOrders = mockOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
  const totalProducts = mockProducts.length
      return (
      <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/products/new">
              <Package className="mr-2 h-4 w-4" /> Nouveau Produit
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions Anonymes Actives</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalChats}</div>
              <p className="text-xs text-muted-foreground">+2 depuis le mois dernier</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nombre Total de Commandes</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">+5 cette semaine</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground">+1 aujourd'hui</p>
            </CardContent>
          </Card>
          <Card className={lowStockItems > 0 ? "border-destructive/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nombre Total de Produits</CardTitle>
              <PackageSearch className={`h-4 w-4 ${lowStockItems > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Ventes de la Semaine</CardTitle>
              <CardDescription>Aperçu des ventes journalières de cette semaine.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <Bar data={weeklySalesData} options={chartOptions as any} />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Commandes Récentes</CardTitle>
                <CardDescription>Les 5 dernières commandes passées.</CardDescription>
              </div>
              <Button
                asChild
                size="sm"
                className="ml-auto gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                <Link href="/orders">
                  Voir Tout
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium font-mono text-sm">{order.customerName}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline font-mono">{order.customerEmail}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getOrderStatusBadgeVariant(order.status)}`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{order.totalAmount.toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
