"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Star,
  TrendingUp,
  HelpCircle,
  FileText,
} from "lucide-react"
import { FAQItem, FAQCategory, FAQStatus } from "@/lib/types"

// Données de test pour la FAQ
const mockFAQItems: FAQItem[] = [
  {
    id: "1",
    question: "Comment puis-je suivre ma commande ?",
    answer: "Vous pouvez suivre votre commande en vous connectant à votre compte et en consultant la section 'Mes commandes'. Vous recevrez également un email avec le numéro de suivi.",
    category: "Commandes",
    status: "Publié",
    tags: ["commande", "suivi", "livraison"],
    popularity: 156,
    lastUpdated: "2024-01-15",
    createdBy: "Admin",
    isHighlighted: true
  },
  {
    id: "2",
    question: "Quels sont les délais de livraison ?",
    answer: "Les délais de livraison sont de 2-3 jours ouvrés pour la France métropolitaine et 5-7 jours pour l'international.",
    category: "Livraison",
    status: "Publié",
    tags: ["livraison", "délais"],
    popularity: 89,
    lastUpdated: "2024-01-10",
    createdBy: "Support",
    isHighlighted: false
  },
  {
    id: "3",
    question: "Comment effectuer un retour ?",
    answer: "Pour effectuer un retour, connectez-vous à votre compte, allez dans 'Mes commandes' et cliquez sur 'Retourner un article'. Vous aurez 30 jours après réception.",
    category: "Retours",
    status: "Publié",
    tags: ["retour", "remboursement"],
    popularity: 67,
    lastUpdated: "2024-01-12",
    createdBy: "Admin",
    isHighlighted: false
  }
]

const categoryColors: Record<FAQCategory, string> = {
  "Commandes": "bg-blue-100 text-blue-800",
  "Livraison": "bg-green-100 text-green-800",
  "Retours": "bg-orange-100 text-orange-800",
  "Paiements": "bg-purple-100 text-purple-800",
  "Produits": "bg-pink-100 text-pink-800",
  "Compte": "bg-yellow-100 text-yellow-800",
  "Technique": "bg-red-100 text-red-800"
}

const statusColors: Record<FAQStatus, string> = {
  "Publié": "bg-green-100 text-green-800",
  "Brouillon": "bg-gray-100 text-gray-800",
  "Archivé": "bg-red-100 text-red-800"
}

export default function FAQPage() {
  const [faqItems] = useState<FAQItem[]>(mockFAQItems)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("toutes")
  const [statusFilter, setStatusFilter] = useState<string>("tous")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newFAQ, setNewFAQ] = useState({
    question: "",
    answer: "",
    category: "Commandes" as FAQCategory,
    tags: ""
  })

  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === "toutes" || item.category === categoryFilter
    const matchesStatus = statusFilter === "tous" || item.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalQuestions = faqItems.length
  const publishedQuestions = faqItems.filter(item => item.status === "Publié").length
  const totalViews = faqItems.reduce((sum, item) => sum + item.popularity, 0)
  const avgViews = totalViews / faqItems.length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="FAQ - Questions Fréquentes"
        description="Gérez les questions et réponses de votre centre d'aide"
      >
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle question FAQ</DialogTitle>
              <DialogDescription>
                Créez une nouvelle question fréquemment posée pour votre centre d'aide
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Question</Label>
                <Input
                  value={newFAQ.question}
                  onChange={(e) => setNewFAQ({...newFAQ, question: e.target.value})}
                  placeholder="Posez votre question..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Réponse</Label>
                <Textarea
                  value={newFAQ.answer}
                  onChange={(e) => setNewFAQ({...newFAQ, answer: e.target.value})}
                  placeholder="Rédigez la réponse détaillée..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Catégorie</Label>
                  <Select value={newFAQ.category} onValueChange={(value: FAQCategory) => setNewFAQ({...newFAQ, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Commandes">Commandes</SelectItem>
                      <SelectItem value="Livraison">Livraison</SelectItem>
                      <SelectItem value="Retours">Retours</SelectItem>
                      <SelectItem value="Paiements">Paiements</SelectItem>
                      <SelectItem value="Produits">Produits</SelectItem>
                      <SelectItem value="Compte">Compte</SelectItem>
                      <SelectItem value="Technique">Technique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags (séparés par des virgules)</Label>
                  <Input
                    value={newFAQ.tags}
                    onChange={(e) => setNewFAQ({...newFAQ, tags: e.target.value})}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsAddDialogOpen(false)}>
                  Publier la FAQ
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Sauvegarder en brouillon
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              +3 cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Publiées</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedQuestions}</div>
            <p className="text-xs text-muted-foreground">
              {((publishedQuestions / totalQuestions) * 100).toFixed(0)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vues Totales</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">
              +12% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vues Moyennes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgViews.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              par question
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher dans la FAQ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toutes">Toutes les catégories</SelectItem>
            <SelectItem value="Commandes">Commandes</SelectItem>
            <SelectItem value="Livraison">Livraison</SelectItem>
            <SelectItem value="Retours">Retours</SelectItem>
            <SelectItem value="Paiements">Paiements</SelectItem>
            <SelectItem value="Produits">Produits</SelectItem>
            <SelectItem value="Compte">Compte</SelectItem>
            <SelectItem value="Technique">Technique</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            <SelectItem value="Publié">Publié</SelectItem>
            <SelectItem value="Brouillon">Brouillon</SelectItem>
            <SelectItem value="Archivé">Archivé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Questions Fréquentes</CardTitle>
          <CardDescription>
            Gérez toutes les questions et réponses de votre centre d'aide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Popularité</TableHead>
                <TableHead>Mise à jour</TableHead>
                <TableHead>Créé par</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFAQs.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell className="max-w-md">
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        {faq.question}
                        {faq.isHighlighted && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {faq.answer}
                      </div>
                      <div className="flex gap-1">
                        {faq.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={categoryColors[faq.category]}>
                      {faq.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[faq.status]}>
                      {faq.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{faq.popularity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(faq.lastUpdated).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{faq.createdBy}</TableCell>
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
                          Prévisualiser
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="h-4 w-4 mr-2" />
                          {faq.isHighlighted ? "Retirer l'épingle" : "Épingler"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
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