"use client"
/**
 * Clients Page - Données entièrement anonymisées
 * 
 * POLITIQUE DE CONFIDENTIALITÉ:
 * - Remplacement de tous les noms/prénoms par des IDs anonymes [PREFIX]_[SHOP_ID]_[12_DIGITS_RANDOM]
 * - Remplacement de tous les emails par des adresses IP
 * - Suppression complète des numéros de téléphone et dates de naissance
 * - Aucune donnée personnelle identifiable conservée
 */

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  MessageCircle,
  Star,
  TrendingUp,
  ShoppingBag,
  Calendar,
  Euro,
} from "lucide-react"
import { Client, ClientSegment, ClientStatus } from "@/lib/types"

// Données de test anonymisées pour les clients
const mockClients: Client[] = [
  {
    id: "1",
    firstName: "EC_001_847293651084",
    lastName: "", // Données supprimées pour anonymisation
    email: "192.168.1.45",
    registrationDate: "2023-06-15",
    lastOrderDate: "2024-01-18",
    totalOrders: 12,
    totalSpent: 1450.50,
    averageOrderValue: 120.87,
    segment: "VIP",
    status: "Actif",
    preferences: {
      categories: ["Mode", "Accessoires"],
      brands: ["Nike", "Adidas"],
      size: "M",
      color: "Bleu"
    },
    loyaltyPoints: 2450,
    notes: "Session fidèle, très satisfaite du service",
    tags: ["Fidèle", "Mode"]
  },
  {
    id: "2",
    firstName: "SM_002_593847261739",
    lastName: "",
    email: "10.0.0.156",
    registrationDate: "2024-01-10",
    totalOrders: 2,
    totalSpent: 89.99,
    averageOrderValue: 44.99,
    segment: "Nouveau",
    status: "Actif",
    preferences: {
      categories: ["Électronique"],
      brands: ["Samsung"]
    },
    loyaltyPoints: 89,
    tags: ["Tech"]
  },
  {
    id: "3",
    firstName: "LG_003_847592638471",
    lastName: "",
    email: "172.16.0.89",
    registrationDate: "2023-08-22",
    lastOrderDate: "2023-11-15",
    totalOrders: 5,
    totalSpent: 320.75,
    averageOrderValue: 64.15,
    segment: "À risque",
    status: "Inactif",
    preferences: {
      categories: ["Maison", "Décoration"],
      brands: ["IKEA"]
    },
    loyaltyPoints: 320,
    notes: "N'a pas commandé depuis 2 mois",
    tags: ["Inactif", "Maison"]
  },
  {
    id: "4",
    firstName: "MP_004_639274851063",
    lastName: "",
    email: "203.0.113.42",
    registrationDate: "2023-12-05",
    lastOrderDate: "2024-01-25",
    totalOrders: 8,
    totalSpent: 890.30,
    averageOrderValue: 111.29,
    segment: "Régulier",
    status: "Actif",
    preferences: {
      categories: ["Sport", "Fitness"],
      brands: ["Decathlon", "Adidas"]
    },
    loyaltyPoints: 890,
    notes: "Session régulière avec bon potentiel",
    tags: ["Sport", "Régulier"]
  },
  {
    id: "5",
    firstName: "EC_005_582947361840",
    lastName: "",
    email: "198.51.100.73",
    registrationDate: "2023-09-18",
    totalOrders: 1,
    totalSpent: 45.99,
    averageOrderValue: 45.99,
    segment: "Nouveau",
    status: "Inactif",
    preferences: {
      categories: ["Livres"],
      brands: ["Amazon"]
    },
    loyaltyPoints: 45,
    notes: "Une seule commande effectuée",
    tags: ["Nouveau", "Inactif"]
  }
]

const segmentColors: Record<ClientSegment, string> = {
  "Nouveau": "bg-blue-100 text-blue-800",
  "Régulier": "bg-green-100 text-green-800",
  "VIP": "bg-purple-100 text-purple-800",
  "Inactif": "bg-gray-100 text-gray-800",
  "À risque": "bg-red-100 text-red-800"
}

const statusColors: Record<ClientStatus, string> = {
  "Actif": "bg-green-100 text-green-800",
  "Inactif": "bg-gray-100 text-gray-800",
  "Bloqué": "bg-red-100 text-red-800"
}

export default function ClientsPage() {
  const [clients] = useState<Client[]>(mockClients)
  const [searchTerm, setSearchTerm] = useState("")
  const [segmentFilter, setSegmentFilter] = useState<string>("tous")
  const [statusFilter, setStatusFilter] = useState<string>("tous")

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSegment = segmentFilter === "tous" || client.segment === segmentFilter
    const matchesStatus = statusFilter === "tous" || client.status === statusFilter
    return matchesSearch && matchesSegment && matchesStatus
  })

  const totalClients = clients.length
  const activeClients = clients.filter(client => client.status === "Actif").length
  const vipClients = clients.filter(client => client.segment === "VIP").length
  const totalRevenue = clients.reduce((sum, client) => sum + client.totalSpent, 0)
  
  // Note: Les variables "clients" sont conservées pour la logique, mais représentent maintenant des sessions anonymes

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Sessions Anonymes"
        description="Suivez et analysez vos sessions clients anonymisées (IDs + IPs uniquement)"
      />

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              +8% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Actives</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients}</div>
            <p className="text-xs text-muted-foreground">
              {((activeClients / totalClients) * 100).toFixed(0)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions VIP</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vipClients}</div>
            <p className="text-xs text-muted-foreground">
              Sessions premium
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()}€</div>
            <p className="text-xs text-muted-foreground">
              Chiffre d'affaires
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher par ID anonyme ou IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les segments</SelectItem>
            <SelectItem value="Nouveau">Nouveau</SelectItem>
            <SelectItem value="Régulier">Régulier</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
            <SelectItem value="Inactif">Inactif</SelectItem>
            <SelectItem value="À risque">À risque</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            <SelectItem value="Actif">Actif</SelectItem>
            <SelectItem value="Inactif">Inactif</SelectItem>
            <SelectItem value="Bloqué">Bloqué</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des clients */}
      <Card>
        <CardHeader>
          <CardTitle>Base Sessions Anonymes</CardTitle>
          <CardDescription>
            Toutes vos sessions avec données anonymisées (ID anonyme + adresse IP uniquement)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Anonyme</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Total Commandes</TableHead>
                <TableHead>CA Total</TableHead>
                <TableHead>Panier Moyen</TableHead>
                <TableHead>Points Fidélité</TableHead>
                <TableHead>Dernière Commande</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {client.firstName.split('_')[0].charAt(0)}{client.firstName.split('_')[0].charAt(1)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium font-mono text-sm">
                          {client.firstName}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {client.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Session anonyme
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={segmentColors[client.segment]}>
                      {client.segment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                      <span>{client.totalOrders}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">
                      {client.totalSpent.toLocaleString()}€
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.averageOrderValue.toFixed(2)}€
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>{client.loyaltyPoints}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.lastOrderDate ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(client.lastOrderDate).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Jamais</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[client.status]}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier segment
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Voir les commandes
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 