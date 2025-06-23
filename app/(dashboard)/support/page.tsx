"use client"
/**
 * Support Technique IA - Back Office
 * 
 * Section dédiée à la gestion des tickets techniques
 * relatifs aux assistants IA et chatbots.
 * 
 * Types de tickets : Performance, Bugs, Intégrations, 
 * Configurations, Améliorations, Maintenance
 */
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
import { mockIATickets } from "@/lib/data"
import type { IATicketStatus, IATicketPriority, IATicket, IATicketCategory } from "@/lib/types"
import { Search, ListFilter, MoreHorizontal, Eye, CheckCircle2, XCircle, Bot, AlertTriangle, Settings } from "lucide-react"
import Link from "next/link"
import { Pagination } from "@/components/ui/pagination"
import { usePaginatedData } from "@/hooks/usePaginatedData"
import { PageHeader } from '@/components/page-header'

const statuses: IATicketStatus[] = ["Ouvert", "En cours", "En attente", "Résolu", "Fermé"]
const priorities: IATicketPriority[] = ["Basse", "Moyenne", "Haute", "Critique"]
const categories: IATicketCategory[] = ["Performance", "Erreur Réponse", "Bug Technique", "Intégration", "Configuration", "Amélioration", "Maintenance"]

export default function SupportPage() {
  // Utilisation du hook personnalisé pour la pagination
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
  } = usePaginatedData<IATicket>({
    tableName: 'ia_tickets',
    initialPageSize: 12,
    fallbackData: mockIATickets,
    searchFields: ['id', 'title', 'category', 'assignedTo']
  })

  const handleFilterChange = (type: "status" | "priority" | "category", value: string) => {
    const currentFilters = { ...filters }
    const currentValues = currentFilters[type] || []
    
    const newValues = Array.isArray(currentValues) && currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...(Array.isArray(currentValues) ? currentValues : []), value]
    
    setFilters({
      ...currentFilters,
      [type]: newValues
    })
  }

  const getStatusBadgeVariant = (status: IATicketStatus) => {
    if (status === "Ouvert") return "bg-red-500/20 text-red-400 border-red-500/30"
    if (status === "En cours") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    if (status === "En attente") return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    if (status === "Résolu") return "bg-green-500/20 text-green-400 border-green-500/30"
    if (status === "Fermé") return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    return "secondary"
  }

  const getPriorityBadgeVariant = (priority: IATicketPriority) => {
    if (priority === "Critique") return "destructive"
    if (priority === "Haute") return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    if (priority === "Moyenne") return "bg-sky-500/20 text-sky-400 border-sky-500/30"
    return "secondary" // Basse
  }

  const getCategoryBadgeVariant = (category: IATicketCategory) => {
    if (category === "Bug Technique") return "bg-red-500/20 text-red-400 border-red-500/30"
    if (category === "Performance") return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    if (category === "Erreur Réponse") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    if (category === "Intégration") return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    if (category === "Configuration") return "bg-purple-500/20 text-purple-400 border-purple-500/30"
    if (category === "Amélioration") return "bg-green-500/20 text-green-400 border-green-500/30"
    return "bg-slate-500/20 text-slate-400 border-slate-500/30" // Maintenance
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            <Bot className="inline-block mr-2 h-8 w-8" />
            Support Technique IA
          </h1>
          <p className="text-muted-foreground">Gérez les incidents et demandes techniques relatifs aux assistants IA.</p>
        </div>
        <Button asChild>
          <Link href="/support/new">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Nouveau Ticket
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Settings className="inline-block mr-2 h-5 w-5" />
            Tickets Techniques IA
          </CardTitle>
          <CardDescription>
            {loading ? (
              "Chargement..."
            ) : error ? (
              `Erreur: ${error}`
            ) : (
              `${paginatedData.total} ticket${paginatedData.total > 1 ? "s" : ""} technique${paginatedData.total > 1 ? "s" : ""} trouvé${paginatedData.total > 1 ? "s" : ""}.`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher (ID, titre, catégorie, assigné à)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full bg-background focus:bg-muted"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-shrink-0">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filtres
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filtrer par Statut</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statuses.map((stat) => (
                  <DropdownMenuCheckboxItem
                    key={stat}
                    checked={(filters.status || []).includes(stat)}
                    onCheckedChange={() => handleFilterChange("status", stat)}
                  >
                    {stat}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filtrer par Priorité</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {priorities.map((prio) => (
                  <DropdownMenuCheckboxItem
                    key={prio}
                    checked={(filters.priority || []).includes(prio)}
                    onCheckedChange={() => handleFilterChange("priority", prio)}
                  >
                    {prio}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filtrer par Catégorie</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((cat) => (
                  <DropdownMenuCheckboxItem
                    key={cat}
                    checked={(filters.category || []).includes(cat)}
                    onCheckedChange={() => handleFilterChange("category", cat)}
                  >
                    {cat}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID Ticket</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead className="hidden lg:table-cell">Catégorie</TableHead>
                  <TableHead className="hidden md:table-cell">Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden sm:table-cell">Assigné à</TableHead>
                  <TableHead className="hidden sm:table-cell">Dernière MàJ</TableHead>
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
                  paginatedData.data.map((ticket: IATicket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{ticket.title}</div>
                        {ticket.chatbotId && (
                          <div className="text-xs text-muted-foreground">Chatbot: {ticket.chatbotId}</div>
                        )}
                        {ticket.errorCode && (
                          <div className="text-xs text-red-500">Code: {ticket.errorCode}</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className={`text-xs ${getCategoryBadgeVariant(ticket.category)}`}>
                          {ticket.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={`text-xs ${getPriorityBadgeVariant(ticket.priority)}`}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getStatusBadgeVariant(ticket.status)}`}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm">{ticket.assignedTo || "Non assigné"}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {new Date(ticket.lastUpdate).toLocaleDateString()}
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
                              <Link href={`/support/${ticket.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> Voir Détails & Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-green-500 focus:text-green-600 focus:bg-green-500/10"
                              onClick={() => console.log("Mark resolved", ticket.id)}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Marquer comme Résolu
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                              onClick={() => console.log("Close ticket", ticket.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Clôturer Ticket
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      Aucun ticket technique ne correspond à vos critères.
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
                pageSizeOptions={[8, 12, 20, 30]}
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
