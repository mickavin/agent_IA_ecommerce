"use client"
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
import { mockOrders } from "@/lib/data"
import type { OrderStatus, Order } from "@/lib/types"
import { Search, ListFilter, MoreHorizontal, Edit, Eye, FileText } from "lucide-react"
import Link from "next/link"
import { Pagination } from "@/components/ui/pagination"
import { usePaginatedData } from "@/hooks/usePaginatedData"

const statuses: OrderStatus[] = ["Payée", "En préparation", "Expédiée", "Livrée", "Annulée"]

export default function OrdersPage() {
  const {
    data: paginatedData,
    loading,
    error,
    setPage,
    setPageSize,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters
  } = usePaginatedData<Order>({
    tableName: 'orders',
    initialPageSize: 15,
    fallbackData: mockOrders,
    searchFields: ['id', 'customerName', 'customerEmail'] // customerName = ID anonyme, customerEmail = IP
  })

  const handleFilterChange = (value: OrderStatus) => {
    const currentFilters = { ...filters }
    const currentStatuses = currentFilters.status || []
    
    const newStatuses = Array.isArray(currentStatuses) && currentStatuses.includes(value)
      ? currentStatuses.filter((item) => item !== value)
      : [...(Array.isArray(currentStatuses) ? currentStatuses : []), value]
    
    setFilters({
      ...currentFilters,
      status: newStatuses
    })
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Gestion des Commandes</h1>
          <p className="text-muted-foreground">Suivez et gérez les commandes de vos clients.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Commandes</CardTitle>
          <CardDescription>
            {loading ? (
              "Chargement..."
            ) : error ? (
              `Erreur: ${error}`
            ) : (
              `${paginatedData.total} commande${paginatedData.total > 1 ? "s" : ""} trouvée${paginatedData.total > 1 ? "s" : ""}.`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher (ID, client, email)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full bg-background focus:bg-muted"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-shrink-0">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Statut
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statuses.map((stat) => (
                  <DropdownMenuCheckboxItem
                    key={stat}
                    checked={(filters.status || []).includes(stat)}
                    onCheckedChange={() => handleFilterChange(stat)}
                  >
                    {stat}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Articles</TableHead>
                  <TableHead className="text-right">Total</TableHead>
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
                    <TableCell colSpan={7} className="text-center h-24 text-red-500">
                      Erreur: {error}
                    </TableCell>
                  </TableRow>
                ) : paginatedData.data.length > 0 ? (
                  paginatedData.data.map((order: Order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                                        <TableCell>
                    <div className="font-mono text-xs">{order.customerName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{order.customerEmail}</div>
                  </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(order.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getOrderStatusBadgeVariant(order.status)}`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">{order.itemsCount}</TableCell>
                      <TableCell className="text-right">{order.totalAmount.toFixed(2)} €</TableCell>
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
                              <Link href={`/orders/${order.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> Voir Détails
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/orders/${order.id}/edit-status`}>
                                <Edit className="mr-2 h-4 w-4" /> Modifier Statut
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => console.log("View invoice for", order.id)}
                            >
                              <FileText className="mr-2 h-4 w-4" /> Voir Facture
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      Aucune commande ne correspond à vos critères.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Composant de pagination */}
          {paginatedData.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={paginatedData.page}
                totalPages={paginatedData.totalPages}
                totalItems={paginatedData.total}
                itemsPerPage={paginatedData.pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 15, 25, 50]}
                showInfo={true}
                showPageSizeSelector={true}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
